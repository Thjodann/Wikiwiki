const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const cli = path.join(process.cwd(), "dist/index.js");

function tempRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "wikiwiki-cli-"));
  execFileSync("git", ["init"], { cwd: root, stdio: "ignore" });
  return root;
}

function run(root, args) {
  return execFileSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function runJson(root, args) {
  return JSON.parse(run(root, args));
}

function payload(value) {
  return JSON.stringify(value);
}

test("package exposes wk primary binary and wikiwiki compatibility alias", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));

  assert.equal(pkg.name, "@thjodann/wk");
  assert.equal(pkg.bin.wk, "dist/index.js");
  assert.equal(pkg.bin.wikiwiki, "dist/index.js");
});

test("init creates record files and all generated wiki pages", () => {
  const root = tempRepo();

  const result = runJson(root, ["init", "--json"]);

  assert.equal(result.ok, true);
  assert.equal(result.record_files.length, 6);
  assert.ok(fs.existsSync(path.join(root, ".wikiwiki/records/concepts.jsonl")));
  assert.ok(fs.existsSync(path.join(root, "wiki/index.md")));
  assert.ok(fs.existsSync(path.join(root, "wiki/symbols.md")));
  assert.ok(fs.existsSync(path.join(root, "wiki/links.md")));
});

test("record lifecycle commands list, get, update, and delete active records", () => {
  const root = tempRepo();
  run(root, ["init", "--json"]);

  const concept = runJson(root, [
    "concept",
    "add",
    "--json",
    payload({
      name: "Structured records",
      summary: "JSONL is the source of truth.",
      details: "",
      files: ["README.md"],
      tags: ["docs"],
      source: "agent",
      authority: "agent",
      confidence: "high"
    })
  ]).record;
  runJson(root, [
    "record",
    "update",
    "concept",
    concept.id,
    "--json",
    payload({ summary: "JSONL records are the source of truth." })
  ]);
  const updated = runJson(root, ["record", "get", "concept", concept.id, "--json"]).record;
  assert.equal(updated.summary, "JSONL records are the source of truth.");

  const note = runJson(root, [
    "note",
    "add",
    "--json",
    payload({
      body: "Renderer owns generated wiki files.",
      tags: ["renderer"],
      source: "agent",
      authority: "agent",
      confidence: "high"
    })
  ]).record;
  runJson(root, [
    "record",
    "update",
    "note",
    note.id,
    "--json",
    payload({ body: "Renderer owns generated Markdown files." })
  ]);
  const noteResult = runJson(root, ["record", "get", "note", note.id, "--json"]).record;
  assert.equal(noteResult.body, "Renderer owns generated Markdown files.");

  const link = runJson(root, [
    "link",
    "add",
    "--json",
    payload({
      from: "README.md",
      to: "wiki/index.md",
      relationship: "documents",
      source: "agent",
      authority: "agent",
      confidence: "medium"
    })
  ]).record;
  assert.equal(runJson(root, ["record", "list", "link", "--json"]).records[0].id, link.id);

  runJson(root, ["record", "delete", "concept", concept.id, "--reason", "covered by a note", "--json"]);
  assert.equal(runJson(root, ["record", "list", "concept", "--json"]).records.length, 0);
  assert.throws(
    () => run(root, ["record", "get", "concept", concept.id, "--json"]),
    /Active concept record not found/
  );
});

test("spin returns heuristic draft templates and command hints", () => {
  const root = tempRepo();
  fs.mkdirSync(path.join(root, "src/core"), { recursive: true });
  fs.mkdirSync(path.join(root, "src/cli"), { recursive: true });
  fs.mkdirSync(path.join(root, "docs"), { recursive: true });
  fs.writeFileSync(path.join(root, "src/core/store.ts"), "export {}\n");
  fs.writeFileSync(path.join(root, "src/cli/commands.ts"), "export {}\n");
  fs.writeFileSync(path.join(root, "docs/usage.md"), "# Usage\n");
  fs.writeFileSync(path.join(root, "package.json"), "{}\n");

  const result = runJson(root, ["spin", "--json"]);

  assert.ok(result.suggested_updates.length >= 5);
  for (const update of result.suggested_updates) {
    assert.ok(update.draft);
    assert.ok(update.command_hint.startsWith(`wk ${update.type} add --json`));
    assert.equal(update.confidence, "medium");
  }
});

test("compile draft and apply create role-oriented human wiki pages", () => {
  const root = tempRepo();
  run(root, ["init", "--json"]);
  fs.writeFileSync(path.join(root, "README.md"), "# Compile fixture\n");
  fs.mkdirSync(path.join(root, "src/core"), { recursive: true });
  fs.writeFileSync(path.join(root, "src/core/store.ts"), "export {}\n");

  runJson(root, [
    "concept",
    "add",
    "--json",
    payload({
      name: "Human wiki compiler",
      summary: "Compile turns structured records into role-oriented human wiki drafts.",
      details: "",
      files: ["README.md", "src/core/store.ts"],
      tags: ["ux", "dx", "architecture"],
      source: "agent",
      authority: "agent",
      confidence: "high"
    })
  ]);

  const draft = runJson(root, ["compile", "draft", "--role", "all", "--json"]);
  assert.deepEqual(draft.roles, ["ux", "dx"]);
  assert.ok(draft.pages.some((page) => page.output_path === "wiki/human/ux/product-overview.md"));
  assert.ok(draft.pages.some((page) => page.output_path === "wiki/human/dx/architecture.md"));

  const applied = runJson(root, ["compile", "apply", draft.draft_id, "--json"]);
  assert.equal(applied.ok, true);
  assert.ok(fs.existsSync(path.join(root, "wiki/human/index.md")));
  assert.ok(fs.existsSync(path.join(root, "wiki/human/ux/product-overview.md")));
  assert.ok(fs.existsSync(path.join(root, "wiki/human/dx/architecture.md")));
});

test("compile role selection and apply validation are enforced", () => {
  const root = tempRepo();
  run(root, ["init", "--json"]);
  fs.writeFileSync(path.join(root, "README.md"), "# Compile fixture\n");
  runJson(root, [
    "note",
    "add",
    "--json",
    payload({
      body: "User-facing wiki context.",
      tags: ["ux"],
      source: "agent",
      authority: "agent",
      confidence: "high"
    })
  ]);

  const draft = runJson(root, ["compile", "draft", "--role", "ux", "--json"]);
  assert.deepEqual(draft.roles, ["ux"]);
  assert.ok(draft.pages.every((page) => page.role === "home" || page.role === "ux"));
  assert.equal(draft.pages.some((page) => page.role === "dx"), false);

  fs.rmSync(path.join(draft.draft_path, "ux/product-overview.md"));
  assert.throws(
    () => run(root, ["compile", "apply", draft.draft_id, "--json"]),
    /Draft page is missing/
  );
});

test("search finds active records and rendered Markdown, excluding deleted records", () => {
  const root = tempRepo();
  run(root, ["init", "--json"]);
  const note = runJson(root, [
    "note",
    "add",
    "--json",
    payload({
      body: "Searchable renderer wisdom.",
      tags: ["search"],
      source: "agent",
      authority: "agent",
      confidence: "high"
    })
  ]).record;
  run(root, ["render", "--json"]);

  const first = runJson(root, ["search", "renderer", "--json"]);
  assert.equal(first.records.length, 1);
  assert.equal(first.records[0].id, note.id);
  assert.ok(first.file_matches.some((match) => match.file === "wiki/notes.md"));

  runJson(root, ["record", "delete", "note", note.id, "--reason", "test cleanup", "--json"]);
  run(root, ["render", "--json"]);

  const second = runJson(root, ["search", "renderer", "--json"]);
  assert.equal(second.records.length, 0);
  assert.equal(second.file_matches.some((match) => match.file === "wiki/notes.md"), false);
});
