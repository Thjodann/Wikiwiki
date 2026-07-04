const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  buildSiteFiles,
  renderSite
} = require("../dist/core/site.js");
const { relativeReportPath } = require("../dist/core/paths.js");
const { appendRecord, ensureStore } = require("../dist/core/store.js");

function tempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "project-site-"));
  writeFile(root, "README.md", "# Site fixture\n");
  writeFile(root, "src/core/site.ts", "export {}\n");
  return root;
}

function writeFile(root, file, content) {
  const fullPath = path.join(root, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf8");
}

function seedRecords(root) {
  ensureStore(root);
  appendRecord(root, "concept", {
    type: "concept",
    id: "concept_static_site",
    source: "agent",
    authority: "agent",
    confidence: "high",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    name: "Static wiki site",
    summary: "Wikiwiki generates a static human-facing site. This implementation-oriented sentence includes enough extra detail about generated files, search data, source links, and publishable assets to exceed the card excerpt limit while remaining available on detail pages.",
    details: "Read the [Decisions](./decisions.md) page for rationale.",
    files: ["README.md", "src/core"],
    tags: ["audience:all", "site", "ux"]
  });
  appendRecord(root, "concept", {
    type: "concept",
    id: "concept_user_faq",
    source: "agent",
    authority: "agent",
    confidence: "high",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    name: "FAQ",
    summary: "Answers common user questions before they need to read maintainer notes.",
    details: "Use this page for user-facing questions.",
    files: ["README.md"],
    tags: ["audience:user", "faq", "getting-started"]
  });
  appendRecord(root, "concept", {
    type: "concept",
    id: "concept_developer_architecture",
    source: "agent",
    authority: "agent",
    confidence: "high",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    name: "Developer architecture",
    summary: "Developer-only architecture details.",
    details: "This should not lead a user-focused site.",
    files: ["src/core/site.ts"],
    tags: ["audience:developer", "architecture"]
  });
  appendRecord(root, "decision", {
    type: "decision",
    id: "decision_site_links",
    source: "agent",
    authority: "agent",
    confidence: "high",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    title: "Use plain HTML links",
    context: "Local Markdown previews expose front matter and break pretty routes.",
    decision: "Generate .html pages with deterministic relative links.",
    consequences: "The site works locally and on static hosts without Jekyll.",
    files: ["src/core/site.ts"],
    tags: ["audience:developer", "site", "links"]
  });
  appendRecord(root, "symbol", {
    type: "symbol",
    id: "symbol_site_renderer",
    source: "agent",
    authority: "agent",
    confidence: "high",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    name: "buildSiteFiles",
    kind: "function",
    file: "src/core/site.ts",
    summary: "Developer-only static site renderer anchor.",
    tags: ["audience:developer", "symbol"]
  });
  appendRecord(root, "link", {
    type: "link",
    id: "link_site_decision",
    source: "agent",
    authority: "agent",
    confidence: "high",
    created_at: "2026-01-01T00:00:00.000Z",
    from: "concept_static_site",
    to: "decision_site_links",
    relationship: "explained-by"
  });
  appendRecord(root, "link", {
    type: "link",
    id: "link_readme_site",
    source: "agent",
    authority: "agent",
    confidence: "high",
    created_at: "2026-01-01T00:00:00.000Z",
    from: "README.md",
    to: "concept_static_site",
    relationship: "introduces"
  });
}

function file(files, fileName) {
  const found = files.find((item) => item.fileName === fileName);
  assert.ok(found, `${fileName} should be generated`);
  return found.content;
}

function countMatches(value, pattern) {
  return [...value.matchAll(pattern)].length;
}

function parseSearchIndex(content) {
  const match = /^window\.WIKIWIKI_SEARCH_INDEX = ([\s\S]*);\n?$/.exec(
    content.replace(/^\/\*[\s\S]*?\*\/\n/, "")
  );
  assert.ok(match, "search index should be parseable");
  return JSON.parse(match[1]);
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

test("buildSiteFiles creates a navigable static wiki without front matter", () => {
  const root = tempRoot();
  seedRecords(root);

  const files = buildSiteFiles(root);
  const index = file(files, "index.html");
  const guides = file(files, "guides.html");
  const concepts = file(files, "concepts.html");
  const concept = file(files, "records/concept/concept_static_site.html");
  const link = file(files, "records/link/link_site_decision.html");
  const readmeLink = file(files, "records/link/link_readme_site.html");
  const searchJs = file(files, "assets/wikiwiki.js");
  const favicon = file(files, "favicon.svg");

  assert.match(index, /Generated by Wikiwiki from \.wikiwiki\/records/);
  assert.match(index, /<link rel="icon" href="favicon\.svg" type="image\/svg\+xml">/);
  assert.doesNotMatch(index, /^---/);
  assert.doesNotMatch(index, /Generated Wikiwiki site/);
  assert.doesNotMatch(index, /<title>[^<]* - Wikiwiki<\/title>/);
  assert.match(index, /<small>Project wiki<\/small>/);
  assert.match(index, /Created with <a href="https:\/\/github\.com\/Thjodann\/Wikiwiki">Wikiwiki<\/a>/);
  assert.match(index, /href="guides\.html"/);
  assert.match(index, /href="concepts\.html"/);
  assert.match(index, /href="search\.html"/);
  assert.match(index, />Symbols</);
  assert.doesNotMatch(index, /<code>concept_static_site<\/code>/);
  assert.doesNotMatch(index, /source links, and publishable assets/);
  assert.match(guides, /Project essentials/);
  assert.match(guides, /User guide/);
  assert.match(guides, /For users/);
  assert.equal(countMatches(guides, /href="records\/concept\/concept_static_site\.html"/g), 1);
  assert.doesNotMatch(guides, /source links, and publishable assets/);
  assert.match(concepts, /href="records\/concept\/concept_static_site\.html"/);
  assert.doesNotMatch(concepts, /<code>concept_static_site<\/code>/);
  assert.doesNotMatch(concepts, /source links, and publishable assets/);
  assert.match(concept, /href="..\/..\/decisions\.html"/);
  assert.match(concept, /href="..\/..\/..\/README\.md"/);
  assert.match(concept, /href="..\/..\/..\/src\/core"/);
  assert.match(concept, /<summary>Agent details<\/summary>/);
  assert.match(concept, /<h2>Related files<\/h2>/);
  assert.match(concept, /source links, and publishable assets/);
  assert.match(link, /href="..\/concept\/concept_static_site\.html"/);
  assert.match(link, /href="..\/decision\/decision_site_links\.html"/);
  assert.match(readmeLink, /href="..\/..\/..\/README\.md"/);
  assert.match(readmeLink, /href="..\/concept\/concept_static_site\.html"/);
  assert.match(searchJs, /return \[\];/);
  assert.match(searchJs, /Search is ready/);
  assert.doesNotMatch(searchJs, /<code>' \+ escapeHtml\(entry\.id\)/);
  assert.match(favicon, /<svg/);

  const searchIndex = parseSearchIndex(file(files, "assets/search-index.js"));
  const searchConcept = searchIndex.find((entry) => entry.id === "concept_static_site");
  assert.equal(searchConcept.summary, "Wikiwiki generates a static human-facing site.");
  assert.match(searchConcept.text, /source links, and publishable assets/);
});

test("buildSiteFiles filters records for a user-focused audience", () => {
  const root = tempRoot();
  seedRecords(root);

  const files = buildSiteFiles(root, { audience: "user" });
  const index = file(files, "index.html");
  const guides = file(files, "guides.html");
  const manifest = JSON.parse(file(files, "site-manifest.json"));
  const searchIndex = parseSearchIndex(file(files, "assets/search-index.js"));

  assert.equal(manifest.audience, "user");
  assert.match(index, /getting started, product orientation, privacy, FAQ, and troubleshooting/);
  assert.match(guides, /User guide/);
  assert.match(guides, /FAQ/);
  assert.doesNotMatch(index, />Symbols</);
  assert.equal(files.some((item) => item.fileName === "records/symbol/symbol_site_renderer.html"), false);
  assert.equal(files.some((item) => item.fileName === "records/concept/concept_developer_architecture.html"), false);
  assert.equal(searchIndex.some((entry) => entry.id === "concept_developer_architecture"), false);
  assert.ok(searchIndex.some((entry) => entry.id === "concept_user_faq" && entry.audienceLabel === "For users"));
});

test("buildSiteFiles preserves note file provenance", () => {
  const root = tempRoot();
  ensureStore(root);
  appendRecord(root, "note", {
    type: "note",
    id: "note_files",
    source: "agent",
    authority: "agent",
    confidence: "high",
    created_at: "2026-01-01T00:00:00.000Z",
    body: "Notes can point at source files.",
    files: ["README.md"],
    tags: ["audience:developer", "docs"]
  });

  const files = buildSiteFiles(root);
  const note = file(files, "records/note/note_files.html");
  const searchIndex = parseSearchIndex(file(files, "assets/search-index.js"));

  assert.match(note, /<h2>Related files<\/h2>/);
  assert.match(note, /href="..\/..\/..\/README\.md"/);
  assert.ok(searchIndex.some((entry) => entry.id === "note_files" && /README\.md/.test(entry.text)));
});

test("buildSiteFiles emits developer-only Beads work page when .beads exists", () => {
  const root = tempRoot();
  seedRecords(root);
  fs.mkdirSync(path.join(root, ".beads"));
  const bin = createFakeBd(root);

  const files = withPath(`${bin}${path.delimiter}${process.env.PATH || ""}`, () => buildSiteFiles(root, { audience: "all" }));
  const index = file(files, "index.html");
  const guides = file(files, "guides.html");
  const work = file(files, "work.html");
  const manifest = JSON.parse(file(files, "site-manifest.json"));
  const searchIndex = parseSearchIndex(file(files, "assets/search-index.js"));

  assert.match(index, /href="work\.html"/);
  assert.match(index, /Project Work/);
  assert.match(guides, /href="work\.html"/);
  assert.match(work, /Beads tracks what to do; Wikiwiki records what becomes true/);
  assert.match(work, /Ready task/);
  assert.match(work, /Active task/);
  assert.match(work, /Closed task/);
  assert.equal(manifest.pages.includes("work.html"), true);
  assert.equal(manifest.integrations.beads.available, true);
  assert.ok(searchIndex.some((entry) => entry.id === "beads:PRISM-a1" && entry.typeLabel === "Project Work"));
});

test("buildSiteFiles hides Beads work page for user audience", () => {
  const root = tempRoot();
  seedRecords(root);
  fs.mkdirSync(path.join(root, ".beads"));
  const bin = createFakeBd(root);

  const files = withPath(`${bin}${path.delimiter}${process.env.PATH || ""}`, () => buildSiteFiles(root, { audience: "user" }));
  const index = file(files, "index.html");
  const manifest = JSON.parse(file(files, "site-manifest.json"));
  const searchIndex = parseSearchIndex(file(files, "assets/search-index.js"));

  assert.equal(files.some((item) => item.fileName === "work.html"), false);
  assert.doesNotMatch(index, /Project Work/);
  assert.equal(manifest.pages.includes("work.html"), false);
  assert.equal(searchIndex.some((entry) => entry.id.startsWith("beads:")), false);
});

test("buildSiteFiles renders unavailable Beads state without failing", () => {
  const root = tempRoot();
  seedRecords(root);
  fs.mkdirSync(path.join(root, ".beads"));

  const files = withPath("", () => buildSiteFiles(root, { audience: "developer" }));
  const work = file(files, "work.html");
  const manifest = JSON.parse(file(files, "site-manifest.json"));

  assert.match(work, /Beads workspace detected/);
  assert.match(work, /could not read Beads/);
  assert.equal(manifest.integrations.beads.detected, true);
  assert.equal(manifest.integrations.beads.available, false);
});

test("buildSiteFiles uses source base URLs for publishable source links", () => {
  const root = tempRoot();
  seedRecords(root);

  const files = buildSiteFiles(root, {
    sourceBaseUrl: "https://github.com/acme/project/blob/main/"
  });
  const concept = file(files, "records/concept/concept_static_site.html");
  const manifest = JSON.parse(file(files, "site-manifest.json"));

  assert.match(concept, /href="https:\/\/github\.com\/acme\/project\/blob\/main\/README\.md"/);
  assert.match(concept, /href="https:\/\/github\.com\/acme\/project\/tree\/main\/src\/core"/);
  assert.doesNotMatch(concept, /href="..\/..\/..\/README\.md"/);
  assert.equal(manifest.source_base_url, "https://github.com/acme/project/blob/main/");
  assert.ok(manifest.records.every((record) => !record.url.includes("\\")));
});

test("buildSiteFiles supports project theme overrides", () => {
  const root = tempRoot();
  seedRecords(root);
  writeFile(root, ".wikiwiki/site-theme.json", `${JSON.stringify({
    project_name: "Acme Docs",
    project_description: "Human docs for Acme.",
    accent: "#123456",
    font_family: "Georgia, serif",
    radius: "4px"
  }, null, 2)}\n`);

  const files = buildSiteFiles(root);
  const index = file(files, "index.html");
  const theme = file(files, "assets/project-theme.css");
  const manifest = JSON.parse(file(files, "site-manifest.json"));

  assert.match(index, /<title>Acme Docs Wiki<\/title>/);
  assert.match(index, /Human docs for Acme\./);
  assert.match(index, /href="assets\/project-theme\.css"/);
  assert.match(theme, /--accent: #123456;/);
  assert.match(theme, /--font-family: Georgia, serif;/);
  assert.match(theme, /--radius: 4px;/);
  assert.equal(manifest.project_name, "Acme Docs");
  assert.equal(manifest.theme_file, ".wikiwiki/site-theme.json");
});

test("buildSiteFiles guards common low-contrast theme overrides", () => {
  const root = tempRoot();
  seedRecords(root);
  writeFile(root, ".wikiwiki/site-theme.json", `${JSON.stringify({
    project_name: "Dark Docs",
    bg: "#050505",
    panel: "#111111",
    text: "#181818",
    muted: "#222222"
  }, null, 2)}\n`);

  const files = buildSiteFiles(root);
  const theme = file(files, "assets/project-theme.css");

  assert.match(theme, /Adjusted --text for readable contrast/);
  assert.match(theme, /Adjusted --muted for readable contrast/);
  assert.match(theme, /--text: #f8fafc;/);
  assert.match(theme, /--muted: #cbd5e1;/);
});

test("renderSite writes a self-contained wiki-site folder", () => {
  const root = tempRoot();
  seedRecords(root);

  const renderedFiles = renderSite(root).map((item) => relativeReportPath(root, item));

  assert.ok(renderedFiles.includes("wiki-site/index.html"));
  assert.ok(renderedFiles.includes("wiki-site/favicon.svg"));
  assert.ok(renderedFiles.includes("wiki-site/assets/wikiwiki.css"));
  assert.ok(renderedFiles.includes("wiki-site/assets/project-theme.css"));
  assert.ok(renderedFiles.includes("wiki-site/assets/wikiwiki.js"));
  assert.ok(renderedFiles.includes("wiki-site/assets/search-index.js"));
  assert.ok(renderedFiles.includes("wiki-site/.nojekyll"));
  assert.ok(fs.existsSync(path.join(root, "wiki-site/records/concept/concept_static_site.html")));

  const searchIndex = fs.readFileSync(path.join(root, "wiki-site/assets/search-index.js"), "utf8");
  assert.match(searchIndex, /window\.WIKIWIKI_SEARCH_INDEX/);
  assert.match(searchIndex, /records\/concept\/concept_static_site\.html/);
});
