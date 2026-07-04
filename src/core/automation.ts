import crypto from "crypto";
import fs from "fs";
import path from "path";
import { configPath, normalizeSourceBaseUrl, readWikiwikiConfig, writeWikiwikiConfig, type WikiwikiConfig } from "./config";
import { changedFiles } from "./git";
import { relativeReportPath, reportPath, sitePath, wikiPath, wikiwikiPath } from "./paths";
import { parseSiteAudience, parseWikiProfile, type SiteAudience, type WikiProfile } from "./profiles";
import { renderWiki, wikiPageFileNames } from "./renderer";
import { renderSite, siteStaticPageFileNames } from "./site";
import { createSpinResult, type SpinResult, type SuggestedUpdate } from "./spin";
import { ensureStore, isInitialized, recordCounts } from "./store";
import { validateWikiwiki, type ValidationResult } from "./validator";

export type SetupOptions = {
  profile?: string;
  audience?: string;
  sourceBaseUrl?: string;
  force?: boolean;
};

export type SetupResult = {
  ok: true;
  repo_root: string;
  store_path: string;
  config_path: string;
  config: WikiwikiConfig;
  package_json: PackageSetupResult;
};

export type PackageSetupResult = {
  present: boolean;
  path: string | null;
  updated: boolean;
  scripts_added: string[];
  scripts_overwritten: string[];
  scripts_skipped: string[];
  script_conflicts: ScriptConflict[];
  copy_commands: Record<string, string>;
  skipped_reason?: string;
};

export type ScriptConflict = {
  name: string;
  existing: string;
  desired: string;
};

export type CloseoutOptions = {
  profile?: string;
  audience?: string;
  sourceBaseUrl?: string;
};

export type CloseoutDraft = {
  type: SuggestedUpdate["type"];
  title: string;
  reason: string;
  audience: SiteAudience;
  tags: string[];
  draft_path: string;
  command_hint: string;
};

export type CloseoutManifest = {
  type: "closeout-draft";
  id: string;
  created_at: string;
  profile: WikiProfile;
  audience: SiteAudience;
  changed_files: string[];
  drafts: CloseoutDraft[];
  rendered_files: string[];
  site_files: string[];
};

export type CloseoutResult = {
  ok: true;
  id: string;
  draft_path: string;
  manifest_path: string;
  profile: WikiProfile;
  audience: SiteAudience;
  status: AutomationStatus;
  spin: SpinResult;
  validation: ValidationResult;
  changed_files: string[];
  drafts: CloseoutDraft[];
  rendered_files: string[];
  site_files: string[];
};

type AutomationStatus = {
  repo_root: string;
  initialized: boolean;
  records: ReturnType<typeof recordCounts>;
  generated_files: string[];
  generated_site_files: string[];
  git: {
    changed_files: string[];
  };
};

type PackageJson = {
  scripts?: Record<string, string>;
  [key: string]: unknown;
};

export function setupWikiwiki(root: string, options: SetupOptions = {}): SetupResult {
  const existingConfig = readWikiwikiConfig(root);
  const profile = parseWikiProfile(options.profile ?? existingConfig.wiki_profile, "mixed");
  const audience = parseSiteAudience(options.audience ?? existingConfig.site_audience, "all");
  const sourceBaseUrl = normalizeSourceBaseUrl(options.sourceBaseUrl ?? existingConfig.source_base_url);
  const desiredScripts = setupScripts(profile, audience);
  const packageJson = preparePackageScripts(root, desiredScripts, options.force === true);
  const nextConfig: WikiwikiConfig = {
    ...existingConfig,
    wiki_profile: profile,
    site_audience: audience
  };

  if (sourceBaseUrl) {
    nextConfig.source_base_url = sourceBaseUrl;
  } else {
    delete nextConfig.source_base_url;
  }

  ensureStore(root);
  writeWikiwikiConfig(root, nextConfig);
  writePackageScripts(root, packageJson);

  return {
    ok: true,
    repo_root: reportPath(root),
    store_path: reportPath(wikiwikiPath(root)),
    config_path: relativeReportPath(root, configPath(root)),
    config: nextConfig,
    package_json: packageJson.result
  };
}

export function runCloseout(root: string, options: CloseoutOptions = {}): CloseoutResult {
  const config = readWikiwikiConfig(root);
  const profile = parseWikiProfile(options.profile ?? config.wiki_profile, "mixed");
  const audience = parseSiteAudience(options.audience ?? config.site_audience, "all");
  const sourceBaseUrl = normalizeSourceBaseUrl(options.sourceBaseUrl ?? config.source_base_url);

  if (!isInitialized(root)) {
    throw new Error("Wikiwiki is not initialized. Run `wk setup` first.");
  }

  const status = automationStatus(root);
  const spin = createSpinResult(root, profile);
  const id = `closeout_${crypto.randomUUID()}`;
  const createdAt = new Date().toISOString();
  const draftRoot = path.join(wikiwikiPath(root), "drafts", "closeout", id);
  const recordDraftRoot = path.join(draftRoot, "record-drafts");
  fs.mkdirSync(recordDraftRoot, { recursive: true });

  const drafts = writeCloseoutRecordDrafts(root, recordDraftRoot, spin.suggested_updates);
  const validation = validateWikiwiki(root);
  if (!validation.valid) {
    const manifest: CloseoutManifest = {
      type: "closeout-draft",
      id,
      created_at: createdAt,
      profile,
      audience,
      changed_files: spin.changed_files,
      drafts,
      rendered_files: [],
      site_files: []
    };
    writeCloseoutCommands(draftRoot, profile, audience, drafts);
    writeCloseoutSummary(draftRoot, {
      id,
      profile,
      audience,
      changedFiles: spin.changed_files,
      drafts,
      renderedFiles: [],
      siteFiles: [],
      validation
    });
    writeJson(path.join(draftRoot, "manifest.json"), manifest);
    throw new Error(`Wikiwiki validation failed during closeout: ${validation.errors.join("; ")}`);
  }

  const renderedFiles = renderWiki(root).map((file) => relativeReportPath(root, file));
  const siteFiles = renderSite(root, { sourceBaseUrl, audience }).map((file) => relativeReportPath(root, file));
  const manifest: CloseoutManifest = {
    type: "closeout-draft",
    id,
    created_at: createdAt,
    profile,
    audience,
    changed_files: spin.changed_files,
    drafts,
    rendered_files: renderedFiles,
    site_files: siteFiles
  };

  writeCloseoutCommands(draftRoot, profile, audience, drafts);
  writeCloseoutSummary(draftRoot, {
    id,
    profile,
    audience,
    changedFiles: spin.changed_files,
    drafts,
    renderedFiles,
    siteFiles,
    validation
  });
  writeJson(path.join(draftRoot, "manifest.json"), manifest);

  return {
    ok: true,
    id,
    draft_path: relativeReportPath(root, draftRoot),
    manifest_path: relativeReportPath(root, path.join(draftRoot, "manifest.json")),
    profile,
    audience,
    status,
    spin,
    validation,
    changed_files: spin.changed_files,
    drafts,
    rendered_files: renderedFiles,
    site_files: siteFiles
  };
}

export function setupScripts(profile: WikiProfile, audience: SiteAudience): Record<string, string> {
  return {
    "wiki:status": "wk status --json",
    "wiki:spin": `wk spin --profile ${profile} --json`,
    "wiki:check": "wk validate",
    "wiki:render": "wk validate && wk render",
    "wiki:site": `wk validate && wk render && wk site --audience ${audience}`,
    "wiki:site:user": "wk validate && wk render && wk site --audience user",
    "wiki:closeout": `wk closeout --profile ${profile} --audience ${audience}`
  };
}

function preparePackageScripts(
  root: string,
  desiredScripts: Record<string, string>,
  force: boolean
): { result: PackageSetupResult; packageJson?: PackageJson } {
  const file = path.join(root, "package.json");
  if (!fs.existsSync(file)) {
    return {
      result: {
        present: false,
        path: null,
        updated: false,
        scripts_added: [],
        scripts_overwritten: [],
        scripts_skipped: Object.keys(desiredScripts),
        script_conflicts: [],
        copy_commands: desiredScripts,
        skipped_reason: "package.json not found"
      }
    };
  }

  const packageJson = JSON.parse(fs.readFileSync(file, "utf8")) as PackageJson;
  const scripts = isObject(packageJson.scripts) ? { ...packageJson.scripts } as Record<string, string> : {};
  const result: PackageSetupResult = {
    present: true,
    path: relativeReportPath(root, file),
    updated: false,
    scripts_added: [],
    scripts_overwritten: [],
    scripts_skipped: [],
    script_conflicts: [],
    copy_commands: desiredScripts
  };

  for (const [name, desired] of Object.entries(desiredScripts)) {
    const existing = scripts[name];
    if (existing === undefined) {
      scripts[name] = desired;
      result.scripts_added.push(name);
      continue;
    }

    if (existing === desired) {
      result.scripts_skipped.push(name);
      continue;
    }

    if (!force) {
      result.script_conflicts.push({ name, existing, desired });
      continue;
    }

    scripts[name] = desired;
    result.scripts_overwritten.push(name);
  }

  if (result.script_conflicts.length > 0) {
    const names = result.script_conflicts.map((conflict) => conflict.name).join(", ");
    throw new Error(`Refusing to overwrite existing package scripts: ${names}. Re-run with --force to replace Wikiwiki scripts.`);
  }

  result.updated = result.scripts_added.length > 0 || result.scripts_overwritten.length > 0;
  packageJson.scripts = scripts;
  return { result, packageJson };
}

function writePackageScripts(root: string, prepared: { result: PackageSetupResult; packageJson?: PackageJson }): void {
  if (!prepared.packageJson || !prepared.result.updated) {
    return;
  }

  fs.writeFileSync(path.join(root, "package.json"), `${JSON.stringify(prepared.packageJson, null, 2)}\n`, "utf8");
}

function automationStatus(root: string): AutomationStatus {
  const generatedFiles = wikiPageFileNames
    .map((fileName) => path.join(wikiPath(root), fileName))
    .filter((file) => fs.existsSync(file));
  const generatedSiteFiles = siteStaticPageFileNames
    .map((fileName) => path.join(sitePath(root), fileName))
    .filter((file) => fs.existsSync(file));

  return {
    repo_root: reportPath(root),
    initialized: isInitialized(root),
    records: recordCounts(root),
    generated_files: generatedFiles.map((file) => relativeReportPath(root, file)),
    generated_site_files: generatedSiteFiles.map((file) => relativeReportPath(root, file)),
    git: {
      changed_files: changedFiles(root)
    }
  };
}

function writeCloseoutRecordDrafts(
  root: string,
  recordDraftRoot: string,
  suggestions: SuggestedUpdate[]
): CloseoutDraft[] {
  return suggestions.map((suggestion, index) => {
    const title = titleForDraft(suggestion);
    const file = path.join(recordDraftRoot, `${String(index + 1).padStart(3, "0")}-${suggestion.type}-${slug(title)}.json`);
    const audience = audienceForTags(suggestion.tags);
    const payload = {
      type: suggestion.type,
      title,
      reason: suggestion.reason,
      audience,
      tags: suggestion.tags,
      confidence: suggestion.confidence,
      files: suggestion.files,
      draft: suggestion.draft,
      command_hint: suggestion.command_hint
    };
    writeJson(file, payload);

    return {
      type: suggestion.type,
      title,
      reason: suggestion.reason,
      audience,
      tags: suggestion.tags,
      draft_path: relativeReportPath(root, file),
      command_hint: suggestion.command_hint
    };
  });
}

function writeCloseoutCommands(
  draftRoot: string,
  profile: WikiProfile,
  audience: SiteAudience,
  drafts: CloseoutDraft[]
): void {
  const lines = [
    "# Closeout Commands",
    "",
    "Generated by `wk closeout`. Review these drafts before appending records.",
    "",
    "## Review",
    "",
    `- Profile: \`${profile}\``,
    `- Audience: \`${audience}\``,
    "",
    "## Suggested Record Commands",
    ""
  ];

  if (drafts.length === 0) {
    lines.push("- No record drafts were suggested from the current working tree.");
  } else {
    drafts.forEach((draft) => {
      lines.push(`- ${draft.title}`);
      lines.push(`  - ${draft.command_hint}`);
    });
  }

  lines.push(
    "",
    "## Verification",
    "",
    "- `wk validate`",
    "- `wk render`",
    `- \`wk site --audience ${audience}\``,
    ""
  );

  fs.writeFileSync(path.join(draftRoot, "commands.md"), `${lines.join("\n")}`, "utf8");
}

function writeCloseoutSummary(
  draftRoot: string,
  summary: {
    id: string;
    profile: WikiProfile;
    audience: SiteAudience;
    changedFiles: string[];
    drafts: CloseoutDraft[];
    renderedFiles: string[];
    siteFiles: string[];
    validation: ValidationResult;
  }
): void {
  const lines = [
    "# Closeout Summary",
    "",
    `Closeout draft: \`${summary.id}\``,
    "",
    `- Profile: \`${summary.profile}\``,
    `- Audience: \`${summary.audience}\``,
    `- Validation: ${summary.validation.valid ? "passed" : "failed"}`,
    `- Changed files: ${summary.changedFiles.length}`,
    `- Record drafts: ${summary.drafts.length}`,
    `- Markdown files rendered: ${summary.renderedFiles.length}`,
    `- Site files rendered: ${summary.siteFiles.length}`,
    "",
    "## Changed Files",
    ""
  ];

  if (summary.changedFiles.length === 0) {
    lines.push("- None");
  } else {
    lines.push(...summary.changedFiles.map((file) => `- ${file}`));
  }

  lines.push("", "## Record Drafts", "");
  if (summary.drafts.length === 0) {
    lines.push("- None");
  } else {
    lines.push(...summary.drafts.map((draft) => `- ${draft.type}: ${draft.title} (${draft.draft_path})`));
  }

  lines.push("");
  fs.writeFileSync(path.join(draftRoot, "summary.md"), `${lines.join("\n")}`, "utf8");
}

function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function titleForDraft(update: SuggestedUpdate): string {
  const draft = update.draft;
  for (const key of ["name", "title", "summary", "body"]) {
    const value = draft[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return update.reason;
}

function audienceForTags(tags: string[]): SiteAudience {
  if (tags.includes("audience:user")) {
    return "user";
  }

  if (tags.includes("audience:developer")) {
    return "developer";
  }

  return "all";
}

function slug(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "draft";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
