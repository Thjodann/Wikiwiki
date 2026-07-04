import { Command } from "commander";
import { printJson } from "../helpers";
import { runCloseout } from "../../core/automation";
import { findRepoRoot } from "../../core/paths";

export function registerCloseoutCommand(program: Command): void {
  program
    .command("closeout")
    .description("Create deterministic closeout drafts, then validate and render the wiki.")
    .option("--profile <profile>", "wiki profile: mixed, user, developer")
    .option("--audience <audience>", "site audience: all, user, developer")
    .option("--source-base-url <url>", "base URL for source file links")
    .option("--json", "print machine-readable output")
    .action((options: {
      profile?: string;
      audience?: string;
      sourceBaseUrl?: string;
      json?: boolean;
    }) => {
      const root = findRepoRoot();
      const result = runCloseout(root, options);

      if (options.json) {
        printJson(result);
        return;
      }

      console.log(`Closeout draft: ${result.draft_path}`);
      console.log(`Profile: ${result.profile}`);
      console.log(`Audience: ${result.audience}`);
      console.log(`Record drafts: ${result.drafts.length}`);
      console.log(`Rendered Markdown files: ${result.rendered_files.length}`);
      console.log(`Rendered site files: ${result.site_files.length}`);
    });
}
