import { Command } from "commander";
import { printJson } from "../helpers";
import { readGitDiffStat, readGitStatus } from "../../core/git";
import { findRepoRoot } from "../../core/paths";

type SuggestedUpdate = {
  type: "concept" | "decision" | "event" | "note";
  reason: string;
  files: string[];
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
      files: coreFiles
    });
  }

  if (cliFiles.length > 0) {
    suggestions.push({
      type: "concept",
      reason: "CLI behavior changed.",
      files: cliFiles
    });
  }

  if (configFiles.length > 0) {
    suggestions.push({
      type: "decision",
      reason: "Project configuration changed.",
      files: configFiles
    });
  }

  if (docsFiles.length > 0) {
    suggestions.push({
      type: "note",
      reason: "Documentation or generated wiki files changed.",
      files: docsFiles
    });
  }

  if (files.length > 0) {
    suggestions.push({
      type: "event",
      reason: "Repo has meaningful working tree changes.",
      files
    });
  }

  return suggestions;
}
