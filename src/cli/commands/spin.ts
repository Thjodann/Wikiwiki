import { Command } from "commander";
import { printJson } from "../helpers";
import { readGitDiffStat, readGitStatus } from "../../core/git";
import { findRepoRoot } from "../../core/paths";

type SuggestedUpdate = {
  type: "concept" | "decision" | "event" | "note";
  reason: string;
  files: string[];
  tags: string[];
  confidence: "low" | "medium" | "high";
  draft: Record<string, unknown>;
  command_hint: string;
};

export function registerSpinCommand(program: Command): void {
  program
    .command("spin")
    .description("Inspect current repo changes and suggest knowledge updates.")
    .option("--json", "print machine-readable output")
    .action((options: { json?: boolean }) => {
      const root = findRepoRoot();
      const status = readGitStatus(root);
      const changedFiles = status.map((entry) => entry.path);
      const result = {
        changed_files: changedFiles,
        file_status: status,
        diff_stat: readGitDiffStat(root),
        suggested_updates: suggestUpdates(changedFiles)
      };

      if (options.json) {
        printJson(result);
        return;
      }

      console.log(`Changed files: ${changedFiles.length}`);
      for (const file of changedFiles) {
        console.log(`- ${file}`);
      }

      if (result.suggested_updates.length > 0) {
        console.log("\nSuggested updates:");
        for (const update of result.suggested_updates) {
          console.log(`- ${update.type}: ${update.reason}`);
          console.log(`  ${update.command_hint}`);
        }
      }
    });
}

function suggestUpdates(files: string[]): SuggestedUpdate[] {
  const suggestions: SuggestedUpdate[] = [];
  const coreFiles = files.filter((file) => file.startsWith("src/core/"));
  const cliFiles = files.filter((file) => file.startsWith("src/cli/"));
  const docsFiles = files.filter((file) => file.endsWith(".md") || file.startsWith("docs/") || file.startsWith("wiki/"));
  const configFiles = files.filter((file) => ["package.json", "tsconfig.json"].includes(file) || file.startsWith(".github/"));

  if (coreFiles.length > 0) {
    suggestions.push({
      type: "concept",
      reason: "Core system files changed.",
      files: coreFiles,
      ...draftFields("concept", coreFiles, ["core", "architecture"], "Core system changes")
    });
  }

  if (cliFiles.length > 0) {
    suggestions.push({
      type: "concept",
      reason: "CLI behavior changed.",
      files: cliFiles,
      ...draftFields("concept", cliFiles, ["cli"], "CLI behavior changes")
    });
  }

  if (configFiles.length > 0) {
    suggestions.push({
      type: "decision",
      reason: "Project configuration changed.",
      files: configFiles,
      ...draftFields("decision", configFiles, ["config"], "Project configuration changes")
    });
  }

  if (docsFiles.length > 0) {
    suggestions.push({
      type: "note",
      reason: "Documentation or generated wiki files changed.",
      files: docsFiles,
      ...draftFields("note", docsFiles, ["docs"], "Documentation changes")
    });
  }

  if (files.length > 0) {
    suggestions.push({
      type: "event",
      reason: "Repo has meaningful working tree changes.",
      files,
      ...draftFields("event", files, ["devlog"], "Working tree changes")
    });
  }

  return suggestions;
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
