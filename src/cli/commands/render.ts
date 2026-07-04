import path from "path";
import { Command } from "commander";
import { printJson } from "../helpers";
import { findRepoRoot } from "../../core/paths";
import { renderWiki } from "../../core/renderer";
import { isInitialized } from "../../core/store";

export function registerRenderCommand(program: Command): void {
  program
    .command("render")
    .description("Render structured records into Markdown wiki pages.")
    .option("--json", "print machine-readable output")
    .action((options: { json?: boolean }) => {
      const root = findRepoRoot();
      if (!isInitialized(root)) {
        throw new Error("Wikiwiki is not initialized. Run `wk init` first.");
      }

      const files = renderWiki(root);
      const result = {
        ok: true,
        rendered_files: files.map((file) => path.relative(root, file))
      };

      if (options.json) {
        printJson(result);
        return;
      }

      console.log("Rendered wiki files:");
      for (const file of result.rendered_files) {
        console.log(`- ${file}`);
      }
    });
}
