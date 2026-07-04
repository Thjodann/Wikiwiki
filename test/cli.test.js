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

function commitAll(root, message) {
  execFileSync("git", ["add", "."], { cwd: root, stdio: "ignore" });
  execFileSync("git", [
    "-c",
    "user.name=Wikiwiki Test",
    "-c",
    "user.email=wikiwiki@example.test",
    "commit",
    "-m",
    message
  ], { cwd: root, stdio: "ignore" });
}

function run(root, args, options = {}) {
  return execFileSync(process.execPath, [cli, ...args], {
    cwd: root,
    env: { ...process.env, ...(options.env || {}) },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function runJson(root, args, options = {}) {
  return JSON.parse(run(root, args, options));
}

function runFailure(root, args) {
  try {
    run(root, args);
  } catch (error) {
    return `${error.stdout || ""}${error.stderr || ""}${error.message || ""}`;
  }

  assert.fail(`Expected command to fail: ${args.join(" ")}`);
}

function payload(value) {
  return JSON.stringify(value);
}

function assertPosixPaths(paths) {
  for (const item of paths) {
    assert.equal(item.includes("\\"), false, `${item} should use POSIX separators`);
  }
}

function gitStatus(root, pathspec = ".beads") {
  return execFileSync("git", ["status", "--short", "--untracked-files=all", "--", pathspec], {
    cwd: root,
    encoding: "utf8"
  }).trim();
}

function createFakeBd(root) {
  const bin = path.join(root, "bin");
  fs.mkdirSync(bin, { recursive: true });
  const script = path.join(bin, "fake-bd.js");
  fs.writeFileSync(script, `const fs = require("node:fs");
const path = require("node:path");
const args = process.argv.slice(2);
fs.appendFileSync(path.join(process.cwd(), "bd-calls.log"), args.join(" ") + "\\n");
const has = (value) => args.includes(value);
const flag = (name) => args[args.indexOf(name) + 1];
function out(value) {
  process.stdout.write(JSON.stringify(value, null, 2));
}
if (has("where")) {
  out({ beads_dir: path.join(process.cwd(), ".beads") });
} else if (has("status")) {
  out({ counts: { total: 7, open: 4, closed: 3, ready: 2, in_progress: 1 } });
} else if (has("ready")) {
  out({ issues: [
    { id: "PRISM-a1", title: "Ready task", status: "open", type: "task", priority: 1, labels: ["ui"] }
  ] });
} else if (has("list") && flag("--status") === "in_progress") {
  out({ issues: [
    { id: "PRISM-b2", title: "Active task", status: "in_progress", type: "feature", assignee: "codex", labels: ["agent"] }
  ] });
} else if (has("list") && flag("--status") === "closed") {
  out({ issues: [
    { id: "PRISM-c3", title: "Closed task", status: "closed", type: "task", closed_at: "2026-07-04T00:00:00.000Z" }
  ] });
} else {
  out({ issues: [] });
}
`, "utf8");
  fs.writeFileSync(
    path.join(bin, "bd"),
    `#!/bin/sh\nDIR=\${0%/*}\nexec ${JSON.stringify(process.execPath)} "$DIR/fake-bd.js" "$@"\n`,
    { mode: 0o755 }
  );
  fs.writeFileSync(
    path.join(bin, "bd.cmd"),
    `@echo off\r\n"${process.execPath}" "%~dp0\\fake-bd.js" %*\r\n`,
    "utf8"
  );
  return {
    env: { PATH: `${bin}${path.delimiter}${process.env.PATH || ""}` },
    log: path.join(root, "bd-calls.log")
  };
}

function createMutatingFakeBd(root) {
  const bin = path.join(root, "mutating-bin");
  fs.mkdirSync(bin, { recursive: true });
  const script = path.join(bin, "fake-bd.js");
  fs.writeFileSync(script, `const fs = require("node:fs");
const path = require("node:path");
const args = process.argv.slice(2);
fs.mkdirSync(path.join(process.cwd(), ".beads", "backup"), { recursive: true });
fs.appendFileSync(path.join(process.cwd(), ".beads", "backup", "read.log"), args.join(" ") + "\\n");
function out(value) {
  process.stdout.write(JSON.stringify(value, null, 2));
}
if (args.includes("where")) {
  out({ beads_dir: path.join(process.cwd(), ".beads") });
} else if (args.includes("status")) {
  out({ counts: { ready: 1, in_progress: 0 } });
} else {
  out({ issues: [] });
}
`, "utf8");
  fs.writeFileSync(
    path.join(bin, "bd"),
    `#!/bin/sh\nDIR=\${0%/*}\nexec ${JSON.stringify(process.execPath)} "$DIR/fake-bd.js" "$@"\n`,
    { mode: 0o755 }
  );
  return {
    env: { PATH: `${bin}${path.delimiter}${process.env.PATH || ""}` }
  };
}

test("package exposes wk primary binary and wikiwiki compatibility alias", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));

  assert.equal(pkg.name, "@thjodann/wk");
  assert.equal(pkg.bin.wk, "dist/index.js");
  assert.equal(pkg.bin.wikiwiki, "dist/index.js");
});

test("package publishes runtime build files, package docs, and the wk skill", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));

  assert.deepEqual(pkg.files, ["dist", "README.md", "docs", "LICENSE", "skills/wk"]);
  assert.equal(pkg.files.includes("wiki"), false);
  assert.equal(pkg.files.includes("wiki-site"), false);
  assert.equal(pkg.files.includes("assets/wikiwiki-banner.png"), false);
});

test("README documents GitHub source install before npm publish", () => {
  const readme = fs.readFileSync(path.join(process.cwd(), "README.md"), "utf8");
  const setupDoc = fs.readFileSync(path.join(process.cwd(), "docs/setup.md"), "utf8");

  assert.match(readme, /test "\$\(npm prefix\)" = "\$PWD" \|\| npm init -y/);
  assert.match(setupDoc, /test "\$\(npm prefix\)" = "\$PWD" \|\| npm init -y/);
  assert.match(readme, /npm install --prefix "\$PWD" --save-dev --package-lock=false git\+https:\/\/github\.com\/Thjodann\/Wikiwiki\.git/);
  assert.match(setupDoc, /npm install --prefix "\$PWD" --save-dev --package-lock=false git\+https:\/\/github\.com\/Thjodann\/Wikiwiki\.git/);
  assert.match(setupDoc, /no local `package\.json`/);
  assert.match(setupDoc, /add `node_modules\/` to `\.gitignore`/);
  assert.match(readme, /git\+ssh/);
  assert.match(setupDoc, /git\+ssh/);
  assert.doesNotMatch(readme, /npm install --save-dev github:Thjodann\/Wikiwiki/);
  assert.doesNotMatch(setupDoc, /npm install --save-dev github:Thjodann\/Wikiwiki/);
  assert.match(readme, /\.\/node_modules\/\.bin\/wk --help/);
  assert.doesNotMatch(readme, /npx wk --help/);
  assert.match(readme, /publishing is still a manual\s+release step/);
});

test("package prepares dist for GitHub dependency installs", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));

  assert.equal(pkg.scripts.prepare, "npm run build");
});

test("bundled wk skill includes Beads coordination rules", () => {
  const skill = fs.readFileSync(path.join(process.cwd(), "skills/wk/SKILL.md"), "utf8");

  assert.match(skill, /bd prime/);
  assert.match(skill, /Use Beads for task state, blockers, dependencies, ownership, and follow-ups/);
  assert.match(skill, /Use Wikiwiki for durable knowledge, decisions, generated Markdown/);
});

test("install-agent codex previews and installs the bundled wk skill", () => {
  const root = tempRepo();
  const destination = path.join(root, "codex-skills/wk");

  const preview = runJson(root, ["install-agent", "codex", "--dest", destination, "--json"]);
  assert.equal(preview.ok, false);
  assert.equal(preview.confirmation_required, true);
  assert.equal(fs.existsSync(path.join(destination, "SKILL.md")), false);

  const installed = runJson(root, ["install-agent", "codex", "--dest", destination, "--yes", "--json"]);
  assert.equal(installed.ok, true);
  assert.equal(installed.destination, destination);
  assert.ok(fs.existsSync(path.join(destination, "SKILL.md")));
  assert.ok(fs.existsSync(path.join(destination, "agents/openai.yaml")));
});

test("install-agent codex installs into an empty destination", () => {
  const root = tempRepo();
  const destination = path.join(root, "codex-skills/wk");
  fs.mkdirSync(destination, { recursive: true });

  const installed = runJson(root, ["install-agent", "codex", "--dest", destination, "--yes", "--json"]);

  assert.equal(installed.ok, true);
  assert.deepEqual(installed.unknown_files, []);
  assert.ok(fs.existsSync(path.join(destination, "SKILL.md")));
  assert.ok(fs.existsSync(path.join(destination, "agents/openai.yaml")));
});

test("install-agent codex overwrites known bundled files safely", () => {
  const root = tempRepo();
  const destination = path.join(root, "codex-skills/wk");
  fs.mkdirSync(path.join(destination, "agents"), { recursive: true });
  fs.writeFileSync(path.join(destination, "SKILL.md"), "old skill\n");
  fs.writeFileSync(path.join(destination, "agents/openai.yaml"), "old yaml\n");

  const installed = runJson(root, ["install-agent", "codex", "--dest", destination, "--yes", "--json"]);

  assert.equal(installed.ok, true);
  assert.deepEqual(installed.unknown_files, []);
  assert.match(fs.readFileSync(path.join(destination, "SKILL.md"), "utf8"), /# WK/);
  assert.match(fs.readFileSync(path.join(destination, "agents/openai.yaml"), "utf8"), /display_name: "WK"/);
});

test("install-agent codex refuses unknown destination files unless forced", () => {
  const root = tempRepo();
  const destination = path.join(root, "codex-skills/wk");
  fs.mkdirSync(destination, { recursive: true });
  fs.writeFileSync(path.join(destination, "custom.md"), "keep me\n");

  const failed = runFailure(root, ["install-agent", "codex", "--dest", destination, "--yes", "--json"]);
  assert.match(failed, /Refusing to install wk skill/);
  assert.match(failed, /custom\.md/);
  assert.equal(fs.existsSync(path.join(destination, "SKILL.md")), false);
  assert.equal(fs.readFileSync(path.join(destination, "custom.md"), "utf8"), "keep me\n");

  const installed = runJson(root, ["install-agent", "codex", "--dest", destination, "--yes", "--force", "--json"]);
  assert.equal(installed.ok, true);
  assert.deepEqual(installed.unknown_files, [path.join(destination, "custom.md")]);
  assert.ok(fs.existsSync(path.join(destination, "SKILL.md")));
  assert.equal(fs.readFileSync(path.join(destination, "custom.md"), "utf8"), "keep me\n");
});

test("init creates record files and all generated wiki pages", () => {
  const root = tempRepo();

  const result = runJson(root, ["init", "--profile", "user", "--json"]);

  assert.equal(result.ok, true);
  assert.equal(result.profile, "user");
  assert.equal(result.record_files.length, 6);
  assertPosixPaths(result.record_files);
  assertPosixPaths(result.rendered_files);
  assert.ok(result.record_files.includes(".wikiwiki/records/concepts.jsonl"));
  assert.ok(result.rendered_files.includes("wiki/index.md"));
  assert.match(fs.readFileSync(path.join(root, "wiki/index.md"), "utf8"), new RegExp(`# ${path.basename(root)} Wiki`));
  assert.doesNotMatch(fs.readFileSync(path.join(root, "wiki/index.md"), "utf8"), /^# Wikiwiki$/m);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, ".wikiwiki/config.json"), "utf8")).wiki_profile, "user");
  assert.ok(fs.existsSync(path.join(root, ".wikiwiki/records/concepts.jsonl")));
  assert.ok(fs.existsSync(path.join(root, "wiki/index.md")));
  assert.ok(fs.existsSync(path.join(root, "wiki/symbols.md")));
  assert.ok(fs.existsSync(path.join(root, "wiki/links.md")));
});

test("setup initializes config and reports copy-ready scripts without package.json", () => {
  const root = tempRepo();

  const result = runJson(root, ["setup", "--json"]);

  assert.equal(result.ok, true);
  assert.equal(result.config.wiki_profile, "mixed");
  assert.equal(result.config.site_audience, "all");
  assert.equal(result.package_json.present, false);
  assert.equal(result.package_json.updated, false);
  assert.equal(result.package_json.skipped_reason, "package.json not found");
  assert.equal(result.package_json.copy_commands["wiki:closeout"], "wk closeout --profile mixed --audience all");
  assert.ok(fs.existsSync(path.join(root, ".wikiwiki/config.json")));
  assert.ok(fs.existsSync(path.join(root, ".wikiwiki/records/concepts.jsonl")));
});

test("setup persists profile and audience defaults", () => {
  const root = tempRepo();

  const result = runJson(root, [
    "setup",
    "--profile",
    "user",
    "--audience",
    "user",
    "--source-base-url",
    "https://github.com/acme/project/blob/main",
    "--json"
  ]);
  const config = JSON.parse(fs.readFileSync(path.join(root, ".wikiwiki/config.json"), "utf8"));

  assert.equal(result.config.wiki_profile, "user");
  assert.equal(result.config.site_audience, "user");
  assert.equal(result.config.source_base_url, "https://github.com/acme/project/blob/main/");
  assert.equal(config.wiki_profile, "user");
  assert.equal(config.site_audience, "user");
  assert.equal(config.source_base_url, "https://github.com/acme/project/blob/main/");
});

test("setup adds package scripts without disturbing existing scripts", () => {
  const root = tempRepo();
  fs.writeFileSync(path.join(root, "package.json"), `${JSON.stringify({ scripts: { test: "node --test" } }, null, 2)}\n`);

  const result = runJson(root, ["setup", "--profile", "developer", "--audience", "developer", "--json"]);
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

  assert.equal(result.package_json.present, true);
  assert.equal(result.package_json.updated, true);
  assert.equal(pkg.scripts.test, "node --test");
  assert.equal(pkg.scripts["wiki:status"], "wk status --json");
  assert.equal(pkg.scripts["wiki:spin"], "wk spin --profile developer --json");
  assert.equal(pkg.scripts["wiki:site"], "wk validate && wk render && wk site --audience developer");
  assert.equal(pkg.scripts["wiki:site:user"], "wk validate && wk render && wk site --audience user");
  assert.equal(pkg.scripts["wiki:closeout"], "wk closeout --profile developer --audience developer");
});

test("setup refuses conflicting scripts unless forced", () => {
  const root = tempRepo();
  fs.writeFileSync(path.join(root, "package.json"), `${JSON.stringify({ scripts: { "wiki:site": "custom site" } }, null, 2)}\n`);

  const failed = runFailure(root, ["setup", "--json"]);
  assert.match(failed, /Refusing to overwrite existing package scripts: wiki:site/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).scripts["wiki:site"], "custom site");

  const result = runJson(root, ["setup", "--force", "--json"]);
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

  assert.equal(result.package_json.scripts_overwritten.includes("wiki:site"), true);
  assert.equal(pkg.scripts["wiki:site"], "wk validate && wk render && wk site --audience all");
});

test("setup, status, and spin skip detailed Beads reads in auto mode", () => {
  const root = tempRepo();
  fs.mkdirSync(path.join(root, ".beads"));
  const fakeBd = createFakeBd(root);

  const setup = runJson(root, ["setup", "--json"], { env: fakeBd.env });
  const config = JSON.parse(fs.readFileSync(path.join(root, ".wikiwiki/config.json"), "utf8"));
  assert.equal(setup.integrations.beads.detected, true);
  assert.equal(setup.integrations.beads.available, false);
  assert.equal(setup.integrations.beads.error, "beads_auto_read_skipped");
  assert.equal(config.integrations, undefined);

  const status = runJson(root, ["status", "--json"], { env: fakeBd.env });
  assert.equal(status.integrations.beads.available, false);
  assert.deepEqual(status.integrations.beads.issue_ids, []);

  const spin = runJson(root, ["spin", "--json"], { env: fakeBd.env });
  assert.equal(spin.integrations.beads.error, "beads_auto_read_skipped");
  assert.equal(fs.existsSync(fakeBd.log), false);
});

test("setup, status, spin, and closeout report Beads context when explicitly enabled", () => {
  const root = tempRepo();
  fs.mkdirSync(path.join(root, ".beads"));
  fs.mkdirSync(path.join(root, ".wikiwiki"), { recursive: true });
  fs.writeFileSync(
    path.join(root, ".wikiwiki/config.json"),
    `${JSON.stringify({ integrations: { beads: { enabled: true } } }, null, 2)}\n`
  );
  const fakeBd = createFakeBd(root);

  const setup = runJson(root, ["setup", "--json"], { env: fakeBd.env });
  const config = JSON.parse(fs.readFileSync(path.join(root, ".wikiwiki/config.json"), "utf8"));
  assert.equal(setup.integrations.beads.detected, true);
  assert.equal(setup.integrations.beads.available, true);
  assert.equal(config.integrations.beads.enabled, true);

  const status = runJson(root, ["status", "--json"], { env: fakeBd.env });
  assert.equal(status.integrations.beads.counts.ready, 2);
  assert.deepEqual(status.integrations.beads.issue_ids, ["PRISM-a1", "PRISM-b2", "PRISM-c3"]);

  const spin = runJson(root, ["spin", "--json"], { env: fakeBd.env });
  assert.equal(spin.integrations.beads.ready[0].id, "PRISM-a1");

  fs.mkdirSync(path.join(root, "src/core"), { recursive: true });
  fs.writeFileSync(path.join(root, "src/core/store.ts"), "export const store = true;\n");
  const before = runJson(root, ["status", "--json"], { env: fakeBd.env }).records;
  const closeout = runJson(root, ["closeout", "--json"], { env: fakeBd.env });
  const after = runJson(root, ["status", "--json"], { env: fakeBd.env }).records;
  const manifest = JSON.parse(fs.readFileSync(path.join(root, closeout.manifest_path), "utf8"));
  const summary = fs.readFileSync(path.join(root, closeout.draft_path, "summary.md"), "utf8");
  const calls = fs.readFileSync(fakeBd.log, "utf8");

  assert.equal(closeout.integrations.beads.in_progress[0].id, "PRISM-b2");
  assert.equal(manifest.integrations.beads.issue_ids.includes("PRISM-c3"), true);
  assert.match(summary, /Beads Work Context/);
  assert.deepEqual(after, before);
  assert.doesNotMatch(calls, /\b(create|update|close|claim|dep)\b/);
});

test("setup does not make Beads site output implicit", () => {
  const root = tempRepo();
  fs.mkdirSync(path.join(root, ".beads"));
  const fakeBd = createFakeBd(root);

  runJson(root, ["setup", "--profile", "mixed", "--audience", "all", "--json"], { env: fakeBd.env });
  const config = JSON.parse(fs.readFileSync(path.join(root, ".wikiwiki/config.json"), "utf8"));
  run(root, ["site", "--json"], { env: fakeBd.env });
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "wiki-site/site-manifest.json"), "utf8"));
  const searchIndex = fs.readFileSync(path.join(root, "wiki-site/assets/search-index.js"), "utf8");

  assert.equal(config.integrations, undefined);
  assert.equal(fs.existsSync(path.join(root, "wiki-site/work.html")), false);
  assert.equal(manifest.pages.includes("work.html"), false);
  assert.equal(manifest.integrations.beads.available, false);
  assert.equal(manifest.integrations.beads.error, "beads_auto_read_skipped");
  assert.equal(manifest.integrations.beads.counts.ready, 0);
  assert.deepEqual(manifest.integrations.beads.issue_ids, []);
  assert.deepEqual(manifest.integrations.beads.ready, []);
  assert.equal(fs.existsSync(fakeBd.log), false);
  assert.doesNotMatch(JSON.stringify(manifest), /Ready task|Active task|codex|PRISM-a1/);
  assert.doesNotMatch(searchIndex, /beads:|Ready task|Active task|codex|PRISM-a1/);
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
      files: ["README.md"],
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
  assert.deepEqual(noteResult.files, ["README.md"]);
  run(root, ["render", "--json"]);
  assert.match(fs.readFileSync(path.join(root, "wiki/notes.md"), "utf8"), /Files: `README\.md`/);

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

test("record add commands append repeated files and tags flags", () => {
  const root = tempRepo();
  run(root, ["init", "--json"]);

  const concept = runJson(root, [
    "concept",
    "add",
    "--name",
    "Repeatable flags",
    "--summary",
    "Agents can pass repeated provenance flags.",
    "--files",
    "README.md",
    "--files",
    "DESIGN.md,docs/setup.md",
    "--tags",
    "audience:all",
    "--tags",
    "overview,agent",
    "--json"
  ]).record;

  assert.deepEqual(concept.files, ["README.md", "DESIGN.md", "docs/setup.md"]);
  assert.deepEqual(concept.tags, ["audience:all", "overview", "agent"]);
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

  assert.equal(result.profile.name, "mixed");
  assert.equal(result.profile.target_counts.concept, 8);
  assert.ok(result.profile.page_emphasis.some((item) => item.includes("user orientation")));
  assert.ok(result.profile.recommended_tags.includes("audience:user"));
  assert.ok(result.profile.recommended_tags.includes("audience:developer"));
  assert.ok(result.profile.suggested_records.some((record) => record.title === "FAQ" && record.tags.includes("audience:user")));
  assert.ok(result.profile.suggested_records.some((record) => record.title === "Troubleshooting" && record.tags.includes("troubleshooting")));
  assert.ok(result.profile.suggested_records.some((record) => record.title === "Architecture overview" && record.tags.includes("audience:developer")));
  assert.ok(result.suggested_updates.length >= 5);
  for (const update of result.suggested_updates) {
    assert.ok(update.draft);
    assert.ok(update.command_hint.startsWith(`wk ${update.type} add --json`));
    assert.equal(update.confidence, "medium");
  }

  const userProfile = runJson(root, ["spin", "--profile", "user", "--json"]);
  assert.equal(userProfile.profile.name, "user");
  assert.equal(userProfile.profile.target_counts.symbol, 0);
  assert.equal(userProfile.profile.suggested_records.some((record) => record.type === "symbol"), false);
});

test("spin and closeout suppress setup-only Wikiwiki artifacts", () => {
  const root = tempRepo();
  fs.writeFileSync(
    path.join(root, "package.json"),
    `${JSON.stringify({ scripts: { test: "node --test" } }, null, 2)}\n`
  );
  commitAll(root, "seed package");

  run(root, ["setup", "--json"]);

  const spin = runJson(root, ["spin", "--json"]);
  assert.ok(spin.changed_files.includes("package.json"));
  assert.ok(spin.changed_files.some((file) => file.startsWith(".wikiwiki/")));
  assert.deepEqual(spin.suggested_updates, []);

  const closeout = runJson(root, ["closeout", "--json"]);
  assert.equal(closeout.drafts.length, 0);
  assert.deepEqual(closeout.spin.suggested_updates, []);
});

test("spin and closeout suppress dependency, generated, draft, and Beads internal noise", () => {
  const root = tempRepo();
  run(root, ["setup", "--json"]);
  commitAll(root, "seed wikiwiki");

  fs.mkdirSync(path.join(root, "src/core"), { recursive: true });
  fs.writeFileSync(path.join(root, "src/core/store.ts"), "export const store = true;\n");
  fs.mkdirSync(path.join(root, "node_modules/commander"), { recursive: true });
  fs.writeFileSync(path.join(root, "node_modules/commander/README.md"), "# Commander\n");
  fs.mkdirSync(path.join(root, ".wikiwiki/drafts/closeout/test"), { recursive: true });
  fs.writeFileSync(path.join(root, ".wikiwiki/drafts/closeout/test/summary.md"), "# Closeout\n");
  fs.mkdirSync(path.join(root, "wiki"), { recursive: true });
  fs.writeFileSync(path.join(root, "wiki/index.md"), "# Generated\n");
  fs.mkdirSync(path.join(root, "wiki-site"), { recursive: true });
  fs.writeFileSync(path.join(root, "wiki-site/index.html"), "<!doctype html>\n");
  fs.mkdirSync(path.join(root, ".beads/backup"), { recursive: true });
  fs.writeFileSync(path.join(root, ".beads/backup/backup.jsonl"), "{}\n");
  fs.mkdirSync(path.join(root, ".beads/embeddeddolt/data"), { recursive: true });
  fs.writeFileSync(path.join(root, ".beads/embeddeddolt/data/log"), "dolt\n");

  const spin = runJson(root, ["spin", "--json"]);

  assert.deepEqual(spin.changed_files, ["src/core/store.ts"]);
  assert.equal(spin.suppressed_changed_files.total, 6);
  assert.deepEqual(
    spin.suppressed_changed_files.groups.map((group) => group.name).sort(),
    ["beads_internals", "dependencies", "generated_site", "generated_wiki", "wikiwiki_drafts"]
  );
  assert.equal(spin.suggested_updates.some((update) => update.files.some((file) => file.startsWith("node_modules/"))), false);
  assert.equal(spin.suggested_updates.some((update) => update.files.some((file) => file.startsWith(".wikiwiki/drafts/"))), false);

  const closeout = runJson(root, ["closeout", "--json"]);
  assert.deepEqual(closeout.changed_files, ["src/core/store.ts"]);
  assert.deepEqual(closeout.spin.changed_files, ["src/core/store.ts"]);
  assert.equal(closeout.drafts.every((draft) => !draft.draft_path.includes("node_modules")), true);
});

test("closeout creates reviewable drafts and does not append records automatically", () => {
  const root = tempRepo();
  run(root, ["setup", "--profile", "mixed", "--audience", "all", "--json"]);
  fs.mkdirSync(path.join(root, "src/core"), { recursive: true });
  fs.writeFileSync(path.join(root, "src/core/store.ts"), "export const store = true;\n");

  const before = runJson(root, ["status", "--json"]).records;
  const result = runJson(root, ["closeout", "--audience", "user", "--json"]);
  const after = runJson(root, ["status", "--json"]).records;
  const manifest = JSON.parse(fs.readFileSync(path.join(root, result.manifest_path), "utf8"));
  const siteManifest = JSON.parse(fs.readFileSync(path.join(root, "wiki-site/site-manifest.json"), "utf8"));

  assert.equal(result.ok, true);
  assert.equal(result.profile, "mixed");
  assert.equal(result.audience, "user");
  assert.equal(result.manifest_path.endsWith("/manifest.json"), true);
  assert.equal(manifest.type, "closeout-draft");
  assert.equal(manifest.id, result.id);
  assert.equal(manifest.audience, "user");
  assert.deepEqual(after, before);
  assert.ok(fs.existsSync(path.join(root, result.draft_path, "commands.md")));
  assert.ok(fs.existsSync(path.join(root, result.draft_path, "summary.md")));
  assert.ok(result.drafts.length > 0);
  assert.ok(result.drafts.every((draft) => draft.draft_path.includes("/record-drafts/")));
  assertPosixPaths([result.draft_path, result.manifest_path, ...result.rendered_files, ...result.site_files]);
  assertPosixPaths(result.drafts.map((draft) => draft.draft_path));
  assert.ok(result.rendered_files.includes("wiki/index.md"));
  assert.ok(result.site_files.includes("wiki-site/index.html"));
  assert.equal(siteManifest.audience, "user");
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
  assertPosixPaths(first.file_matches.map((match) => match.file));

  runJson(root, ["record", "delete", "note", note.id, "--reason", "test cleanup", "--json"]);
  run(root, ["render", "--json"]);

  const second = runJson(root, ["search", "renderer", "--json"]);
  assert.equal(second.records.length, 0);
  assert.equal(second.file_matches.some((match) => match.file === "wiki/notes.md"), false);
});

test("site command creates a browseable static wiki", () => {
  const root = tempRepo();
  run(root, ["init", "--json"]);
  fs.writeFileSync(path.join(root, "README.md"), "# Site fixture\n");

  runJson(root, [
    "concept",
    "add",
    "--json",
    payload({
      name: "Static site",
      summary: "Humans browse Wikiwiki through generated HTML.",
      details: "See [Decisions](./decisions.md).",
      files: ["README.md"],
      tags: ["site"],
      source: "agent",
      authority: "agent",
      confidence: "high"
    })
  ]);

  const result = runJson(root, [
    "site",
    "--source-base-url",
    "https://github.com/acme/project/blob/main/",
    "--audience",
    "user",
    "--json"
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.source_base_url, "https://github.com/acme/project/blob/main/");
  assert.equal(result.audience, "user");
  assert.equal(result.output_behavior, "replaces wiki-site/");
  assertPosixPaths(result.rendered_files);
  assert.deepEqual(result.site_files, result.rendered_files);
  assert.ok(result.rendered_files.includes("wiki-site/index.html"));
  assert.ok(result.rendered_files.includes("wiki-site/favicon.svg"));
  assert.ok(result.rendered_files.includes("wiki-site/assets/wikiwiki.css"));
  assert.ok(result.rendered_files.some((file) => file.startsWith("wiki-site/records/concept/")));
  assert.ok(fs.existsSync(path.join(root, "wiki-site/index.html")));
  assert.match(fs.readFileSync(path.join(root, "wiki-site/index.html"), "utf8"), /href="concepts\.html"/);
  assert.match(
    fs.readFileSync(path.join(root, "wiki-site/records/concept", `${result.rendered_files.find((file) => file.startsWith("wiki-site/records/concept/")).split("/").at(-1)}`), "utf8"),
    /https:\/\/github\.com\/acme\/project\/blob\/main\/README\.md/
  );
});

test("site restores .beads after explicit mutating Beads reads", () => {
  const root = tempRepo();
  run(root, ["init", "--json"]);
  fs.mkdirSync(path.join(root, ".beads"));
  fs.writeFileSync(
    path.join(root, ".wikiwiki/config.json"),
    `${JSON.stringify({ integrations: { beads: { enabled: true } } }, null, 2)}\n`
  );
  const fakeBd = createMutatingFakeBd(root);

  const result = runJson(root, ["site", "--audience", "all", "--json"], { env: fakeBd.env });
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "wiki-site/site-manifest.json"), "utf8"));

  assert.equal(result.ok, true);
  assert.deepEqual(result.site_files, result.rendered_files);
  assert.equal(manifest.integrations.beads.available, false);
  assert.equal(manifest.integrations.beads.error, "beads_read_mutated_worktree");
  assert.match(manifest.integrations.beads.warnings.join("\n"), /Restored \.beads to its pre-read state/);
  assert.equal(gitStatus(root), "");
});

test("status and render JSON report POSIX-style generated paths", () => {
  const root = tempRepo();
  run(root, ["init", "--json"]);
  run(root, ["site", "--json"]);

  const render = runJson(root, ["render", "--json"]);
  assertPosixPaths(render.rendered_files);
  assert.ok(render.rendered_files.includes("wiki/index.md"));

  const status = runJson(root, ["status", "--json"]);
  assertPosixPaths(status.generated_files);
  assertPosixPaths(status.generated_site_files);
  assert.ok(status.generated_files.includes("wiki/index.md"));
  assert.ok(status.generated_site_files.includes("wiki-site/index.html"));
});
