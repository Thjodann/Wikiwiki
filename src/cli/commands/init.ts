import fs from "fs";
import { Command } from "commander";
import { printJson } from "../helpers";
import { readWikiwikiConfig, writeWikiwikiConfig } from "../../core/config";
import { parseWikiProfile } from "../../core/profiles";
import { ensureStore, isInitialized } from "../../core/store";
import { findRepoRoot, recordPath, relativeReportPath, reportPath, wikiPath, wikiwikiPath } from "../../core/paths";
import { recordTypes } from "../../core/schemas";
import { renderWiki } from "../../core/renderer";

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Initialize Wikiwiki storage for this repo.")
    .option("--profile <profile>", "first-pass wiki profile: mixed, user, developer")
    .option("--json", "print machine-readable output")
    .action((options: { profile?: string; json?: boolean }) => {
      const root = findRepoRoot();
      const alreadyInitialized = isInitialized(root);
      const existingConfig = readWikiwikiConfig(root);
      const profile = parseWikiProfile(options.profile ?? existingConfig.wiki_profile, "mixed");
      ensureStore(root);
      writeWikiwikiConfig(root, {
        ...existingConfig,
        wiki_profile: profile
      });
      const renderedFiles = renderWiki(root);

      const result = {
        ok: true,
        already_initialized: alreadyInitialized,
        profile,
        repo_root: reportPath(root),
        store_path: reportPath(wikiwikiPath(root)),
        wiki_path: reportPath(wikiPath(root)),
        record_files: recordTypes.map((type) => relativeReportPath(root, recordPath(root, type))),
        rendered_files: renderedFiles.map((file) => relativeReportPath(root, file))
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
