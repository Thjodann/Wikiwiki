import { Command } from "commander";
import { printJson } from "../helpers";
import { findRepoRoot } from "../../core/paths";
import { initPages } from "../../core/pages";

type PagesInitCliOptions = {
  branch?: string;
  sourceBaseUrl?: string;
  workflow?: string;
  force?: boolean;
  json?: boolean;
};

export function registerPagesCommand(program: Command): void {
  const command = program
    .command("pages")
    .description("Scaffold GitHub Pages publishing for the user-facing Wikiwiki site.");

  command
    .command("init")
    .description("Write a GitHub Actions workflow that publishes the user-facing wiki-site/.")
    .option("--branch <branch>", "branch that should publish the Pages site")
    .option("--source-base-url <url>", "base URL for source file links")
    .option("--workflow <path>", "workflow path", ".github/workflows/wikiwiki-pages.yml")
    .option("--force", "overwrite an existing different Pages workflow")
    .option("--json", "print machine-readable output")
    .action((options: PagesInitCliOptions) => {
      const root = findRepoRoot();
      const result = initPages(root, options);

      if (options.json) {
        printJson(result);
        return;
      }

      if (result.already_current) {
        console.log("Wikiwiki Pages workflow is already current.");
      } else if (result.overwritten) {
        console.log("Overwrote Wikiwiki Pages workflow.");
      } else {
        console.log("Created Wikiwiki Pages workflow.");
      }
      console.log(`Workflow: ${result.workflow_path}`);
      console.log(`Branch: ${result.branch}`);
      console.log("Audience: user");
      console.log(`Source base URL: ${result.source_base_url}`);
      console.log("Next steps:");
      for (const step of result.next_steps) {
        console.log(`- ${step}`);
      }
    });
}
