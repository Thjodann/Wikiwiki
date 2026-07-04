import fs from "fs";
import path from "path";
import { Command } from "commander";
import { printJson } from "../helpers";
import { readIntegrations, shouldReportIntegrations } from "../../core/beads";
import { readWikiwikiConfig } from "../../core/config";
import { changedFiles } from "../../core/git";
import { findRepoRoot, relativeReportPath, reportPath, sitePath, wikiPath, wikiwikiPath } from "../../core/paths";
import { siteStaticPageFileNames } from "../../core/site";
import { wikiPageFileNames } from "../../core/renderer";
import { recordTypes } from "../../core/schemas";
import { isInitialized, recordCounts } from "../../core/store";

export function registerStatusCommand(program: Command): void {
  program
    .command("status")
    .description("Show Wikiwiki repo status.")
    .option("--json", "print machine-readable output")
    .action((options: { json?: boolean }) => {
      const root = findRepoRoot();
      const initialized = isInitialized(root);
      const counts = initialized ? recordCounts(root) : emptyCounts();
      const generatedFiles = wikiPageFileNames
        .map((fileName) => path.join(wikiPath(root), fileName))
        .filter((file) => fs.existsSync(file));
      const generatedSiteFiles = siteStaticPageFileNames
        .map((fileName) => path.join(sitePath(root), fileName))
        .filter((file) => fs.existsSync(file));
      const integrations = readIntegrations(root, readWikiwikiConfig(root));

      const result = {
        repo_root: reportPath(root),
        initialized,
        store_path: reportPath(wikiwikiPath(root)),
        wiki_path: reportPath(wikiPath(root)),
        site_path: reportPath(sitePath(root)),
        records: counts,
        generated_files: generatedFiles.map((file) => relativeReportPath(root, file)),
        generated_site_files: generatedSiteFiles.map((file) => relativeReportPath(root, file)),
        git: {
          changed_files: changedFiles(root)
        },
        ...(shouldReportIntegrations(integrations) ? { integrations } : {})
      };

      if (options.json) {
        printJson(result);
        return;
      }

      console.log(`Repo: ${root}`);
      console.log(`Wikiwiki: ${initialized ? "initialized" : "not initialized"}`);
      console.log(`Records: ${recordTypes.map((type) => `${type}=${counts[type]}`).join(", ")}`);
      console.log(`Site: ${generatedSiteFiles.length ? "generated" : "not generated"}`);
      console.log(`Changed files: ${result.git.changed_files.length}`);
    });
}

function emptyCounts(): Record<(typeof recordTypes)[number], number> {
  return Object.fromEntries(recordTypes.map((type) => [type, 0])) as Record<(typeof recordTypes)[number], number>;
}
