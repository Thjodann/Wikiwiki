import path from "path";
import { Command } from "commander";
import { printJson } from "../helpers";
import { findRepoRoot, sitePath } from "../../core/paths";
import { renderSite } from "../../core/site";
import { isInitialized } from "../../core/store";

export function registerSiteCommand(program: Command): void {
  program
    .command("site")
    .description("Generate a static human-facing Wikiwiki site into wiki-site/.")
    .option("--json", "print machine-readable output")
    .action((options: { json?: boolean }) => {
      const root = findRepoRoot();
      if (!isInitialized(root)) {
        throw new Error("Wikiwiki is not initialized. Run `wk init` first.");
      }

      const files = renderSite(root);
      const result = {
        ok: true,
        site_path: sitePath(root),
        entrypoint: path.join(sitePath(root), "index.html"),
        rendered_files: files.map((file) => path.relative(root, file))
      };

      if (options.json) {
        printJson(result);
        return;
      }

      console.log("Rendered Wikiwiki site:");
      console.log(`- ${path.relative(root, result.entrypoint)}`);
      console.log(`- ${result.rendered_files.length} generated files`);
    });
}
