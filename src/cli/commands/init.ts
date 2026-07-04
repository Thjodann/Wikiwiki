import fs from "fs";
import { Command } from "commander";
import { printJson } from "../helpers";
import { ensureStore, isInitialized } from "../../core/store";
import { findRepoRoot, recordPath, wikiPath, wikiwikiPath } from "../../core/paths";
import { recordTypes } from "../../core/schemas";
import { renderWiki } from "../../core/renderer";

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Initialize Wikiwiki storage for this repo.")
    .option("--json", "print machine-readable output")
    .action((options: { json?: boolean }) => {
      const root = findRepoRoot();
      const alreadyInitialized = isInitialized(root);
      ensureStore(root);
      const renderedFiles = renderWiki(root);

      const result = {
        ok: true,
        already_initialized: alreadyInitialized,
        repo_root: root,
        store_path: wikiwikiPath(root),
        wiki_path: wikiPath(root),
        record_files: recordTypes.map((type) => recordPath(root, type)),
        rendered_files: renderedFiles
      };

      if (options.json) {
        printJson(result);
        return;
      }

      const state = alreadyInitialized ? "already initialized" : "initialized";
      console.log(`Wikiwiki ${state} at ${fs.realpathSync(root)}`);
      console.log(`Store: ${result.store_path}`);
      console.log(`Wiki: ${result.wiki_path}`);
    });
}
