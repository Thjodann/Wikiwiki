const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  appendRecord,
  ensureStore,
  readRecords,
  readRecordsWithIssues
} = require("../dist/core/store.js");
const { recordPath } = require("../dist/core/paths.js");

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "wikiwiki-store-"));
}

function concept(id, summary, updatedAt, extra = {}) {
  return {
    type: "concept",
    id,
    source: "agent",
    authority: "agent",
    confidence: "high",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: updatedAt,
    name: "Renderer",
    summary,
    details: "",
    files: ["src/core/renderer.ts"],
    tags: ["renderer"],
    ...extra
  };
}

test("readRecordsWithIssues reports invalid JSONL lines", () => {
  const root = tempRoot();
  ensureStore(root);
  fs.appendFileSync(recordPath(root, "concept"), "{not json}\n", "utf8");

  const result = readRecordsWithIssues(root, "concept");

  assert.equal(result.records.length, 0);
  assert.equal(result.issues.length, 1);
  assert.match(result.issues[0].message, /Expected property name|JSON/);
});

test("readRecords returns latest active revision and excludes tombstones", () => {
  const root = tempRoot();
  const id = "concept_revision-test";

  appendRecord(root, "concept", concept(id, "Initial summary", "2026-01-01T00:00:00.000Z"));
  appendRecord(root, "concept", concept(id, "Updated summary", "2026-01-02T00:00:00.000Z"));

  const active = readRecords(root, "concept");
  assert.equal(active.length, 1);
  assert.equal(active[0].summary, "Updated summary");

  appendRecord(
    root,
    "concept",
    concept(id, "Updated summary", "2026-01-03T00:00:00.000Z", {
      deleted_at: "2026-01-03T00:00:00.000Z",
      delete_reason: "covered elsewhere"
    })
  );

  assert.deepEqual(readRecords(root, "concept"), []);
});
