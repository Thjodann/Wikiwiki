import { Command } from "commander";
import { printJson } from "../helpers";
import { readWikiwikiConfig } from "../../core/config";
import { findRepoRoot } from "../../core/paths";
import { parseWikiProfile } from "../../core/profiles";
import { createSpinResult } from "../../core/spin";

export function registerSpinCommand(program: Command): void {
  program
    .command("spin")
    .description("Inspect current repo changes and suggest knowledge updates.")
    .option("--profile <profile>", "first-pass wiki profile: mixed, user, developer")
    .option("--json", "print machine-readable output")
    .action((options: { profile?: string; json?: boolean }) => {
      const root = findRepoRoot();
      const config = readWikiwikiConfig(root);
      const profile = parseWikiProfile(options.profile ?? config.wiki_profile, "mixed");
      const result = createSpinResult(root, profile);

      if (options.json) {
        printJson(result);
        return;
      }

      console.log(`Changed files: ${result.changed_files.length}`);
      for (const file of result.changed_files) {
        console.log(`- ${file}`);
      }

      if (result.suggested_updates.length > 0) {
        console.log("\nSuggested updates:");
        for (const update of result.suggested_updates) {
          console.log(`- ${update.type}: ${update.reason}`);
          console.log(`  ${update.command_hint}`);
        }
      }

      console.log(`\nFirst-pass profile: ${result.profile.name}`);
      console.log(result.profile.description);
      console.log("Target counts:");
      for (const [type, count] of Object.entries(result.profile.target_counts)) {
        console.log(`- ${type}: ${count}`);
      }
    });
}
