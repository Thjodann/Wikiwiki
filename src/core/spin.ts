import fs from "fs";
import { readIntegrations, shouldReportIntegrations, type IntegrationSummary } from "./beads";
import {
  isSuppressedGitPath,
  readGitDiffStat,
  readGitStatus,
  runGit,
  summarizeSuppressedGitStatus,
  type GitStatusEntry,
  type SuppressedGitStatusSummary
} from "./git";
import { readWikiwikiConfig } from "./config";
import { profileRecipes, type ProfileSeed, type SiteAudience, type WikiProfile } from "./profiles";

export type SuggestedUpdate = {
  type: "concept" | "decision" | "event" | "note";
  reason: string;
  files: string[];
  tags: string[];
  confidence: "low" | "medium" | "high";
  draft: Record<string, unknown>;
  command_hint: string;
};

export type FirstPassSuggestion = {
  type: ProfileSeed["type"];
  title: string;
  purpose: string;
  audience: SiteAudience;
  tags: string[];
  draft: Record<string, unknown>;
  command_hint: string;
};

export type FirstPassRecipe = {
  name: WikiProfile;
  description: string;
  target_counts: Partial<Record<string, number>>;
  page_emphasis: string[];
  recommended_tags: string[];
  suggested_records: FirstPassSuggestion[];
};

export type SpinResult = {
  changed_files: string[];
  suppressed_changed_files: SuppressedGitStatusSummary;
  file_status: GitStatusEntry[];
  diff_stat: string;
  profile: FirstPassRecipe;
  suggested_updates: SuggestedUpdate[];
  integrations?: IntegrationSummary;
};

export function createSpinResult(root: string, profile: WikiProfile): SpinResult {
  const status = readGitStatus(root);
  const fileStatus = status.filter((entry) => !isSuppressedGitPath(entry.path));
  const changedFiles = fileStatus.map((entry) => entry.path);
  const suggestionFiles = filterSuggestionFiles(root, changedFiles);
  const integrations = readIntegrations(root, readWikiwikiConfig(root));

  const result: SpinResult = {
    changed_files: changedFiles,
    suppressed_changed_files: summarizeSuppressedGitStatus(status),
    file_status: fileStatus,
    diff_stat: readGitDiffStat(root),
    profile: firstPassRecipe(profile),
    suggested_updates: suggestUpdates(suggestionFiles)
  };
  if (shouldReportIntegrations(integrations)) {
    result.integrations = integrations;
  }

  return result;
}

export function filterSuggestionFiles(root: string, files: string[]): string[] {
  return files.filter((file) =>
    !isWikiwikiManagedPath(file) &&
    !isWikiwikiSetupOnlyPackageChange(root, file) &&
    !isWikiwikiSetupOnlyConfigChange(root, file)
  );
}

export function suggestUpdates(files: string[]): SuggestedUpdate[] {
  const suggestions: SuggestedUpdate[] = [];
  const coreFiles = files.filter((file) => file.startsWith("src/core/"));
  const cliFiles = files.filter((file) => file.startsWith("src/cli/"));
  const docsFiles = files.filter((file) => file.endsWith(".md") || file.startsWith("docs/") || file.startsWith("wiki/"));
  const configFiles = files.filter((file) => ["package.json", "tsconfig.json", ".wikiwiki/config.json", ".wikiwiki/site-theme.json"].includes(file) || file.startsWith(".github/"));

  if (coreFiles.length > 0) {
    suggestions.push({
      type: "concept",
      reason: "Core system files changed.",
      files: coreFiles,
      ...draftFields("concept", coreFiles, ["audience:developer", "core", "architecture"], "Core system changes")
    });
  }

  if (cliFiles.length > 0) {
    suggestions.push({
      type: "concept",
      reason: "CLI behavior changed.",
      files: cliFiles,
      ...draftFields("concept", cliFiles, ["audience:developer", "cli"], "CLI behavior changes")
    });
  }

  if (configFiles.length > 0) {
    suggestions.push({
      type: "decision",
      reason: "Project configuration changed.",
      files: configFiles,
      ...draftFields("decision", configFiles, ["audience:developer", "config"], "Project configuration changes")
    });
  }

  if (docsFiles.length > 0) {
    suggestions.push({
      type: "note",
      reason: "Documentation or generated wiki files changed.",
      files: docsFiles,
      ...draftFields("note", docsFiles, ["audience:all", "docs"], "Documentation changes")
    });
  }

  if (files.length > 0) {
    suggestions.push({
      type: "event",
      reason: "Repo has meaningful working tree changes.",
      files,
      ...draftFields("event", files, ["audience:developer", "devlog"], "Working tree changes")
    });
  }

  return suggestions;
}

export function firstPassRecipe(profile: WikiProfile): FirstPassRecipe {
  const recipe = profileRecipes[profile];
  return {
    name: recipe.name,
    description: recipe.description,
    target_counts: recipe.target_counts,
    page_emphasis: recipe.page_emphasis,
    recommended_tags: recipe.recommended_tags,
    suggested_records: recipe.seeds.map((seed) => firstPassSuggestion(seed))
  };
}

function draftFields(
  type: SuggestedUpdate["type"],
  files: string[],
  tags: string[],
  title: string
): Pick<SuggestedUpdate, "tags" | "confidence" | "draft" | "command_hint"> {
  const confidence = "medium" as const;
  const base = {
    source: "git-diff",
    authority: "agent",
    confidence,
    files,
    tags
  };
  const draft = draftPayload(type, title, base);

  return {
    tags,
    confidence,
    draft,
    command_hint: `wk ${type} add --json '${JSON.stringify(draft)}'`
  };
}

function draftPayload(
  type: SuggestedUpdate["type"],
  title: string,
  base: {
    source: string;
    authority: string;
    confidence: string;
    files: string[];
    tags: string[];
  }
): Record<string, unknown> {
  switch (type) {
    case "concept":
      return {
        ...base,
        name: title,
        summary: "TODO: summarize the durable concept behind these changes.",
        details: ""
      };
    case "decision":
      return {
        ...base,
        title,
        context: "TODO: capture the context behind this configuration change.",
        decision: "TODO: capture the decision.",
        consequences: ""
      };
    case "note":
      return {
        ...base,
        body: "TODO: capture the useful documentation context from these changes."
      };
    case "event":
      return {
        ...base,
        summary: title,
        details: "TODO: capture what changed and why it matters."
      };
  }
}

function firstPassSuggestion(seed: ProfileSeed): FirstPassSuggestion {
  const draft = seedDraftPayload(seed);
  return {
    type: seed.type,
    title: seed.title,
    purpose: seed.purpose,
    audience: seed.audience,
    tags: seed.tags,
    draft,
    command_hint: `wk ${seed.type} add --json '${JSON.stringify(draft)}'`
  };
}

function isWikiwikiManagedPath(file: string): boolean {
  return file.startsWith(".wikiwiki/drafts/") ||
    file.startsWith(".wikiwiki/records/") ||
    file.startsWith("wiki/") ||
    file.startsWith("wiki-site/");
}

function isWikiwikiSetupOnlyPackageChange(root: string, file: string): boolean {
  if (file !== "package.json") {
    return false;
  }

  let previous: unknown;
  let current: unknown;
  try {
    previous = JSON.parse(runGit(root, ["show", "HEAD:package.json"]));
    current = JSON.parse(fs.readFileSync(`${root}/package.json`, "utf8"));
  } catch {
    return false;
  }

  return JSON.stringify(withoutWikiwikiScripts(previous)) === JSON.stringify(withoutWikiwikiScripts(current));
}

function isWikiwikiSetupOnlyConfigChange(root: string, file: string): boolean {
  if (file !== ".wikiwiki/config.json") {
    return false;
  }

  try {
    runGit(root, ["show", "HEAD:.wikiwiki/config.json"]);
    return false;
  } catch {
    return true;
  }
}

function withoutWikiwikiScripts(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const copy = { ...(value as Record<string, unknown>) };
  const scripts = copy.scripts;
  if (scripts && typeof scripts === "object" && !Array.isArray(scripts)) {
    const nextScripts = Object.fromEntries(
      Object.entries(scripts as Record<string, unknown>).filter(([name]) => !name.startsWith("wiki:"))
    );
    if (Object.keys(nextScripts).length > 0) {
      copy.scripts = nextScripts;
    } else {
      delete copy.scripts;
    }
  }

  return copy;
}

function seedDraftPayload(seed: ProfileSeed): Record<string, unknown> {
  const base = {
    source: "agent",
    authority: "agent",
    confidence: "medium",
    tags: seed.tags
  };

  switch (seed.type) {
    case "concept":
      return {
        ...base,
        name: seed.title,
        summary: `TODO: ${seed.purpose}`,
        details: "",
        files: []
      };
    case "decision":
      return {
        ...base,
        title: seed.title,
        context: `TODO: capture the context. ${seed.purpose}`,
        decision: "TODO: capture the decision.",
        consequences: "",
        files: []
      };
    case "event":
      return {
        ...base,
        summary: seed.title,
        details: `TODO: ${seed.purpose}`,
        files: []
      };
    case "note":
      return {
        ...base,
        body: `TODO: ${seed.purpose}`
      };
    case "symbol":
      return {
        ...base,
        name: seed.title,
        kind: "TODO",
        file: seed.file ?? "TODO",
        summary: `TODO: ${seed.purpose}`
      };
  }
}
