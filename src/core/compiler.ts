import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { readAllRecords } from "./store";
import { type AnyRecord, type RecordType, recordTypes } from "./schemas";
import { wikiPath, wikiwikiPath } from "./paths";

export const compileRoles = ["ux", "dx"] as const;
export type CompileRole = (typeof compileRoles)[number];
export type CompileRoleOption = CompileRole | "all";
export type CompilePageRole = CompileRole | "home";

export type CompilePageManifest = {
  role: CompilePageRole;
  id: string;
  title: string;
  description: string;
  draft_path: string;
  output_path: string;
  prompt: string;
  source_record_ids: string[];
  source_files: string[];
};

export type CompileDraftManifest = {
  type: "compile-draft";
  id: string;
  status: "draft";
  roles: CompileRole[];
  created_at: string;
  output_root: string;
  pages: CompilePageManifest[];
};

export type CompileDraftResult = {
  draft_id: string;
  draft_path: string;
  manifest_path: string;
  roles: CompileRole[];
  pages: CompilePageManifest[];
};

export type CompileApplyResult = {
  ok: true;
  draft_id: string;
  applied_at: string;
  rendered_files: string[];
};

type RecordsByType = Record<RecordType, AnyRecord[]>;

type PageBlueprint = {
  role: CompilePageRole;
  id: string;
  title: string;
  description: string;
};

const uxTags = new Set(["ux", "user", "product", "flow", "design", "support"]);
const dxTags = new Set(["dx", "developer", "architecture", "cli", "core", "workflow", "symbol", "testing", "package"]);

const rolePages: Record<CompileRole, PageBlueprint[]> = {
  ux: [
    {
      role: "ux",
      id: "index",
      title: "UX Wiki",
      description: "Orient product users, stakeholders, and design-minded readers."
    },
    {
      role: "ux",
      id: "product-overview",
      title: "Product Overview",
      description: "Explain what the product is, who it serves, and what problem it solves."
    },
    {
      role: "ux",
      id: "user-experience",
      title: "User Experience",
      description: "Describe the product loop, user-facing behavior, and experience principles."
    },
    {
      role: "ux",
      id: "decisions",
      title: "UX Decisions",
      description: "Summarize product and experience decisions that shape the user experience."
    }
  ],
  dx: [
    {
      role: "dx",
      id: "index",
      title: "DX Wiki",
      description: "Orient developers, coding agents, and maintainers."
    },
    {
      role: "dx",
      id: "developer-overview",
      title: "Developer Overview",
      description: "Explain the implementation model and the daily development loop."
    },
    {
      role: "dx",
      id: "architecture",
      title: "Architecture",
      description: "Describe storage, revision, validation, rendering, search, and compile architecture."
    },
    {
      role: "dx",
      id: "workflows",
      title: "Developer Workflows",
      description: "Document the commands and workflows developers and agents should use."
    },
    {
      role: "dx",
      id: "symbols",
      title: "Symbols",
      description: "Summarize important code symbols and where developers should look first."
    },
    {
      role: "dx",
      id: "decisions",
      title: "DX Decisions",
      description: "Summarize technical and workflow decisions that shape developer experience."
    }
  ]
};

export function createCompileDraft(root: string, roleOption: CompileRoleOption = "all"): CompileDraftResult {
  const roles = normalizeCompileRoles(roleOption);
  const records = readAllRecords(root) as RecordsByType;
  const draftId = `compile_${randomUUID()}`;
  const createdAt = new Date().toISOString();
  const draftRoot = compileDraftPath(root, draftId);
  fs.mkdirSync(draftRoot, { recursive: true });

  const pages = buildCompilePages(records, roles, draftId, createdAt);
  const manifest: CompileDraftManifest = {
    type: "compile-draft",
    id: draftId,
    status: "draft",
    roles,
    created_at: createdAt,
    output_root: "wiki/human",
    pages
  };

  for (const page of pages) {
    const draftFile = path.join(draftRoot, page.draft_path);
    fs.mkdirSync(path.dirname(draftFile), { recursive: true });
    fs.writeFileSync(draftFile, draftMarkdown(manifest, page), "utf8");
  }

  const manifestPath = path.join(draftRoot, "manifest.json");
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  return {
    draft_id: draftId,
    draft_path: draftRoot,
    manifest_path: manifestPath,
    roles,
    pages
  };
}

export function applyCompileDraft(root: string, draftId: string): CompileApplyResult {
  const manifest = readCompileDraftManifest(root, draftId);
  const activeRecordIds = activeRecordIdSet(readAllRecords(root) as RecordsByType);
  const appliedAt = new Date().toISOString();
  const renderedFiles: string[] = [];

  for (const page of manifest.pages) {
    validatePageProvenance(root, page, activeRecordIds);
    const draftFile = path.join(compileDraftPath(root, draftId), page.draft_path);
    if (!fs.existsSync(draftFile)) {
      throw new Error(`Draft page is missing: ${page.draft_path}`);
    }

    const content = fs.readFileSync(draftFile, "utf8");
    const outputFile = path.join(root, page.output_path);
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, finalHumanPage(content, manifest, page, appliedAt), "utf8");
    renderedFiles.push(page.output_path);
  }

  return {
    ok: true,
    draft_id: draftId,
    applied_at: appliedAt,
    rendered_files: renderedFiles
  };
}

export function readCompileDraftManifest(root: string, draftId: string): CompileDraftManifest {
  if (!/^compile_[0-9a-f-]+$/i.test(draftId)) {
    throw new Error(`Invalid compile draft id: ${draftId}`);
  }

  const manifestPath = path.join(compileDraftPath(root, draftId), "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Compile draft manifest not found: ${draftId}`);
  }

  const parsed = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as CompileDraftManifest;
  if (parsed.type !== "compile-draft" || parsed.id !== draftId || !Array.isArray(parsed.pages)) {
    throw new Error(`Invalid compile draft manifest: ${draftId}`);
  }

  return parsed;
}

export function routeRecordsForRole(records: RecordsByType, role: CompileRole): AnyRecord[] {
  return flattenRecords(records).filter((record) => {
    const tags = recordTags(record);
    const taggedUx = tags.some((tag) => uxTags.has(tag));
    const taggedDx = tags.some((tag) => dxTags.has(tag));
    const inherentDx = record.type === "symbol";
    const inherentShared = record.type === "link";
    const shared = inherentShared || ((!taggedUx && !taggedDx && !inherentDx) && isSharedContext(record));

    if (role === "ux") {
      return taggedUx || shared;
    }

    return taggedDx || inherentDx || shared;
  });
}

export function validateHumanWiki(root: string): string[] {
  const errors: string[] = [];
  const humanRoot = path.join(wikiPath(root), "human");
  if (!fs.existsSync(humanRoot)) {
    return errors;
  }

  for (const file of listMarkdownFiles(humanRoot)) {
    const content = fs.readFileSync(file, "utf8");
    const relative = path.relative(root, file);
    if (!content.startsWith("<!-- Generated by Wikiwiki human compile")) {
      errors.push(`${relative} is missing the human compile generated notice.`);
    }
    if (!content.includes("## Sources")) {
      errors.push(`${relative} is missing compact provenance sources.`);
    }
    if (!content.includes("Draft: `compile_")) {
      errors.push(`${relative} is missing compile draft provenance.`);
    }
  }

  return errors;
}

function normalizeCompileRoles(roleOption: CompileRoleOption): CompileRole[] {
  if (roleOption === "all") {
    return ["ux", "dx"];
  }

  if ((compileRoles as readonly string[]).includes(roleOption)) {
    return [roleOption];
  }

  throw new Error("Unknown compile role. Expected one of: all, ux, dx.");
}

function buildCompilePages(
  records: RecordsByType,
  roles: CompileRole[],
  draftId: string,
  createdAt: string
): CompilePageManifest[] {
  const pages: CompilePageManifest[] = [];
  pages.push(buildPage(records, roles, homeBlueprint(roles), draftId, createdAt));

  for (const role of roles) {
    for (const blueprint of rolePages[role]) {
      pages.push(buildPage(records, [role], blueprint, draftId, createdAt));
    }
  }

  return pages;
}

function buildPage(
  records: RecordsByType,
  roles: CompileRole[],
  blueprint: PageBlueprint,
  draftId: string,
  createdAt: string
): CompilePageManifest {
  const selectedRecords = recordsForPage(records, roles, blueprint);
  const sourceRecordIds = unique(selectedRecords.map((record) => record.id));
  const sourceFiles = unique(selectedRecords.flatMap(relatedFiles));
  const draftPath = blueprint.role === "home"
    ? "index.md"
    : path.posix.join(blueprint.role, `${blueprint.id}.md`);
  const outputPath = blueprint.role === "home"
    ? "wiki/human/index.md"
    : path.posix.join("wiki/human", blueprint.role, `${blueprint.id}.md`);

  return {
    ...blueprint,
    draft_path: draftPath,
    output_path: outputPath,
    prompt: pagePrompt(blueprint, roles, selectedRecords, draftId, createdAt),
    source_record_ids: sourceRecordIds,
    source_files: sourceFiles
  };
}

function recordsForPage(records: RecordsByType, roles: CompileRole[], blueprint: PageBlueprint): AnyRecord[] {
  const routed = uniqueRecords(roles.flatMap((role) => routeRecordsForRole(records, role)));
  const filtered = routed.filter((record) => pageMatchesRecord(blueprint, record));
  return filtered.length > 0 ? filtered : routed;
}

function pageMatchesRecord(blueprint: PageBlueprint, record: AnyRecord): boolean {
  if (blueprint.role === "home" || blueprint.id === "index") {
    return true;
  }

  if (blueprint.id === "decisions") {
    return record.type === "decision" || record.type === "concept" || record.type === "note";
  }

  if (blueprint.id === "symbols") {
    return record.type === "symbol" || recordTags(record).some((tag) => ["core", "cli", "architecture"].includes(tag));
  }

  if (blueprint.id === "architecture") {
    return record.type === "concept" || record.type === "decision" || record.type === "symbol";
  }

  if (blueprint.id === "workflows") {
    return recordTags(record).some((tag) => ["workflow", "cli", "testing", "package", "v1", "agent-workflow"].includes(tag)) || record.type === "event";
  }

  if (blueprint.id === "user-experience") {
    return recordTags(record).some((tag) => ["ux", "user", "product", "flow", "design", "readme", "product-direction"].includes(tag)) || record.type === "decision";
  }

  if (blueprint.id === "product-overview") {
    return recordTags(record).some((tag) => ["product", "readme", "product-direction", "v1"].includes(tag)) || record.type === "concept" || record.type === "note";
  }

  if (blueprint.id === "developer-overview") {
    return recordTags(record).some((tag) => ["dx", "developer", "cli", "core", "architecture", "v1"].includes(tag)) || record.type === "concept";
  }

  return true;
}

function pagePrompt(
  blueprint: PageBlueprint,
  roles: CompileRole[],
  records: AnyRecord[],
  draftId: string,
  createdAt: string
): string {
  const roleText = blueprint.role === "home" ? roles.join(" and ") : blueprint.role.toUpperCase();
  const recordsText = records.map((record) => `- ${record.type} ${record.id}: ${recordTitle(record)}`).join("\n");

  return [
    `Write the ${blueprint.title} page for the ${roleText} human wiki.`,
    blueprint.description,
    "Use polished human-readable prose, but do not invent facts beyond the source records.",
    "Keep the Sources section compact and visible.",
    `Draft id: ${draftId}`,
    `Created: ${createdAt}`,
    "Source records:",
    recordsText || "- No source records selected."
  ].join("\n");
}

function draftMarkdown(manifest: CompileDraftManifest, page: CompilePageManifest): string {
  const fileLines = page.source_files.map((file) => `- \`${file}\``).join("\n") || "- None";
  const recordLines = page.source_record_ids.map((id) => `- \`${id}\``).join("\n") || "- None";

  return `<!-- Wikiwiki compile draft. Agent-authored prose belongs here; apply with \`wk compile apply ${manifest.id}\`. -->

# ${page.title}

${page.description}

## Composition Prompt

\`\`\`text
${page.prompt}
\`\`\`

## Draft

TODO: Replace this section with polished, role-specific prose for the ${page.role} wiki.

## Sources

Draft: \`${manifest.id}\` | Compiled: \`PENDING\`

Records:
${recordLines}

Files:
${fileLines}
`;
}

function finalHumanPage(
  content: string,
  manifest: CompileDraftManifest,
  page: CompilePageManifest,
  appliedAt: string
): string {
  const withoutDraftNotice = content.replace(/^<!-- Wikiwiki compile draft\..*?-->\n\n/s, "");
  const withoutPrompt = withoutDraftNotice
    .replace(/\n## Composition Prompt\n\n```text\n[\s\S]*?\n```\n\n/, "\n")
    .replace(/\n## Draft\n\n/, "\n");
  const withTimestamp = withoutPrompt.replace("Compiled: `PENDING`", `Compiled: \`${appliedAt}\``);
  const notice = `<!-- Generated by Wikiwiki human compile from .wikiwiki/drafts/compile/${manifest.id}. Edit the draft or source records, then run \`wk compile apply ${manifest.id}\`. -->`;
  return `${notice}\n\n${withTimestamp.trimEnd()}\n`;
}

function validatePageProvenance(root: string, page: CompilePageManifest, activeRecordIds: Set<string>): void {
  for (const id of page.source_record_ids) {
    if (!activeRecordIds.has(id)) {
      throw new Error(`Page ${page.output_path} references inactive record: ${id}`);
    }
  }

  for (const file of page.source_files) {
    if (!fs.existsSync(path.resolve(root, file))) {
      throw new Error(`Page ${page.output_path} references missing source file: ${file}`);
    }
  }
}

function activeRecordIdSet(records: RecordsByType): Set<string> {
  return new Set(flattenRecords(records).map((record) => record.id));
}

function flattenRecords(records: RecordsByType): AnyRecord[] {
  return recordTypes.flatMap((type) => records[type]);
}

function recordTags(record: AnyRecord): string[] {
  if ("tags" in record && Array.isArray(record.tags)) {
    return record.tags.map((tag) => tag.toLowerCase());
  }

  return [];
}

function relatedFiles(record: AnyRecord): string[] {
  if ("files" in record && Array.isArray(record.files)) {
    return record.files;
  }

  if ("file" in record && typeof record.file === "string") {
    return [record.file];
  }

  return [];
}

function isSharedContext(record: AnyRecord): boolean {
  return record.authority === "user" || record.confidence === "high";
}

function recordTitle(record: AnyRecord): string {
  if ("name" in record && typeof record.name === "string") {
    return record.name;
  }
  if ("title" in record && typeof record.title === "string") {
    return record.title;
  }
  if ("summary" in record && typeof record.summary === "string") {
    return record.summary;
  }
  if ("body" in record && typeof record.body === "string") {
    return record.body.slice(0, 80);
  }
  if ("relationship" in record && typeof record.relationship === "string") {
    return `${record.from} ${record.relationship} ${record.to}`;
  }
  return record.id;
}

function homeBlueprint(roles: CompileRole[]): PageBlueprint {
  return {
    role: "home",
    id: "index",
    title: "Human Wiki",
    description: `Choose a role-oriented wiki: ${roles.map((role) => role.toUpperCase()).join(" or ")}.`
  };
}

function compileDraftPath(root: string, draftId: string): string {
  return path.join(wikiwikiPath(root), "drafts", "compile", draftId);
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

function uniqueRecords(records: AnyRecord[]): AnyRecord[] {
  const byId = new Map<string, AnyRecord>();
  for (const record of records) {
    byId.set(record.id, record);
  }
  return [...byId.values()];
}

function listMarkdownFiles(root: string): string[] {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      return listMarkdownFiles(fullPath);
    }
    return entry.isFile() && entry.name.endsWith(".md") ? [fullPath] : [];
  });
}
