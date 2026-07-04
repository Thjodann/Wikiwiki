import path from "path";
import { Command } from "commander";
import { printJson } from "../helpers";
import { findRepoRoot, relativeReportPath, reportPath, sitePath } from "../../core/paths";
import { renderSite, resolveSiteOptions } from "../../core/site";
import { isInitialized } from "../../core/store";

export function registerSiteCommand(program: Command): void {
  program
    .command("site")
    .description("Generate a static human-facing Wikiwiki site into wiki-site/.")
    .option("--source-base-url <url>", "base URL for source file links, for example https://github.com/OWNER/REPO/blob/main/")
    .option("--json", "print machine-readable output")
    .action((options: { sourceBaseUrl?: string; json?: boolean }) => {
      const root = findRepoRoot();
      if (!isInitialized(root)) {
        throw new Error("Wikiwiki is not initialized. Run `wk init` first.");
      }

      const siteOptions = resolveSiteOptions(root, { sourceBaseUrl: options.sourceBaseUrl });
      const files = renderSite(root, siteOptions);
      const result = {
        ok: true,
        site_path: reportPath(sitePath(root)),
        entrypoint: reportPath(path.join(sitePath(root), "index.html")),
        source_base_url: siteOptions.sourceBaseUrl ?? null,
        rendered_files: files.map((file) => relativeReportPath(root, file))
      };

      if (options.json) {
        printJson(result);
        return;
      }

      console.log("Rendered Wikiwiki site:");
      console.log(`- ${relativeReportPath(root, path.join(sitePath(root), "index.html"))}`);
      console.log(`- ${result.rendered_files.length} generated files`);
    });
}
