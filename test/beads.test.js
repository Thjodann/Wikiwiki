const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  readBeadsIntegration
} = require("../dist/core/beads.js");

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "wikiwiki-beads-"));
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

function gitStatus(root, pathspec = ".beads") {
  return execFileSync("git", ["status", "--short", "--untracked-files=all", "--", pathspec], {
    cwd: root,
    encoding: "utf8"
  }).trim();
}

function withPath(value, fn) {
  const previousPath = process.env.PATH;
  process.env.PATH = value;
  try {
    return fn();
  } finally {
    process.env.PATH = previousPath;
  }
}

function createFakeBd(root) {
  const bin = path.join(root, "bin");
  fs.mkdirSync(bin, { recursive: true });
  const script = path.join(bin, "fake-bd.js");
  fs.writeFileSync(script, `const path = require("node:path");
const args = process.argv.slice(2);
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
  return bin;
}

test("readBeadsIntegration is quiet when .beads is absent", () => {
  const root = tempRoot();

  const beads = readBeadsIntegration(root);

  assert.equal(beads.detected, false);
  assert.equal(beads.enabled, false);
  assert.equal(beads.available, false);
  assert.deepEqual(beads.issue_ids, []);
});

test("readBeadsIntegration detects .beads but handles missing bd", () => {
  const root = tempRoot();
  fs.mkdirSync(path.join(root, ".beads"));

  const beads = withPath("", () => readBeadsIntegration(root, { enabled: true }));

  assert.equal(beads.detected, true);
  assert.equal(beads.enabled, true);
  assert.equal(beads.available, false);
  assert.match(beads.error, /bd|ENOENT|spawn/i);
});

test("readBeadsIntegration skips detailed bd reads in auto mode", () => {
  const root = tempRoot();
  fs.mkdirSync(path.join(root, ".beads"));
  const bin = createFakeBd(root);

  const beads = withPath(`${bin}${path.delimiter}${process.env.PATH || ""}`, () => readBeadsIntegration(root));

  assert.equal(beads.detected, true);
  assert.equal(beads.enabled, true);
  assert.equal(beads.available, false);
  assert.equal(beads.error, "beads_auto_read_skipped");
  assert.deepEqual(beads.issue_ids, []);
});

test("readBeadsIntegration normalizes fake bd JSON summaries when enabled", () => {
  const root = tempRoot();
  fs.mkdirSync(path.join(root, ".beads"));
  const bin = createFakeBd(root);

  const beads = withPath(`${bin}${path.delimiter}${process.env.PATH || ""}`, () => readBeadsIntegration(root, { enabled: true }));

  assert.equal(beads.detected, true);
  assert.equal(beads.enabled, true);
  assert.equal(beads.available, true);
  assert.equal(beads.beads_path.includes("\\"), false);
  assert.equal(beads.counts.total, 7);
  assert.equal(beads.counts.ready, 2);
  assert.equal(beads.counts.in_progress, 1);
  assert.equal(beads.counts.recent_closed, 1);
  assert.deepEqual(beads.issue_ids, ["PRISM-a1", "PRISM-b2", "PRISM-c3"]);
  assert.equal(beads.ready[0].id, "PRISM-a1");
  assert.equal(beads.ready[0].priority, "P1");
  assert.equal(beads.in_progress[0].assignee, "codex");
});

test("readBeadsIntegration refuses Beads details when bd mutates .beads", () => {
  const root = tempRoot();
  execFileSync("git", ["init"], { cwd: root, stdio: "ignore" });
  fs.mkdirSync(path.join(root, ".beads"));
  const bin = createMutatingFakeBd(root);

  const beads = withPath(`${bin}${path.delimiter}${process.env.PATH || ""}`, () => readBeadsIntegration(root, { enabled: true }));

  assert.equal(beads.detected, true);
  assert.equal(beads.available, false);
  assert.equal(beads.error, "beads_read_mutated_worktree");
  assert.match(beads.warnings.join("\n"), /\.beads\/backup\/read\.log/);
  assert.match(beads.warnings.join("\n"), /Restored \.beads to its pre-read state/);
  assert.deepEqual(beads.issue_ids, []);
  assert.equal(gitStatus(root), "");
});

test("readBeadsIntegration does not restore when .beads was already dirty", () => {
  const root = tempRoot();
  execFileSync("git", ["init"], { cwd: root, stdio: "ignore" });
  fs.mkdirSync(path.join(root, ".beads"));
  fs.writeFileSync(path.join(root, ".beads", "existing.txt"), "before\n");
  commitAll(root, "seed beads");
  fs.writeFileSync(path.join(root, ".beads", "existing.txt"), "dirty before read\n");
  const bin = createMutatingFakeBd(root);

  const beads = withPath(`${bin}${path.delimiter}${process.env.PATH || ""}`, () => readBeadsIntegration(root, { enabled: true }));
  const status = gitStatus(root);

  assert.equal(beads.available, false);
  assert.equal(beads.error, "beads_read_mutated_worktree");
  assert.match(beads.warnings.join("\n"), /Pre-existing \.beads changes were present/);
  assert.match(status, /M .beads\/existing\.txt/);
  assert.match(status, /\?\? .beads\/backup\/read\.log/);
});

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
  return bin;
}
