import { Command } from "commander";
import { printJson } from "../helpers";
import { setupWikiwiki } from "../../core/automation";
import { findRepoRoot } from "../../core/paths";

export function registerSetupCommand(program: Command): void {
  program
    .command("setup")
    .description("Set up portable Wikiwiki automation scripts and repo defaults.")
    .option("--profile <profile>", "wiki profile: mixed, user, developer")
    .option("--audience <audience>", "site audience: all, user, developer")
    .option("--source-base-url <url>", "base URL for source file links")
    .option("--force", "overwrite conflicting Wikiwiki package scripts")
    .option("--json", "print machine-readable output")
    .action((options: {
      profile?: string;
      audience?: string;
      sourceBaseUrl?: string;
      force?: boolean;
      json?: boolean;
    }) => {
      const root = findRepoRoot();
      const result = setupWikiwiki(root, options);

      if (options.json) {
        printJson(result);
        return;
      }

      console.log("Wikiwiki setup complete.");
      console.log(`Profile: ${result.config.wiki_profile}`);
      console.log(`Audience: ${result.config.site_audience}`);
      if (result.config.source_base_url) {
        console.log(`Source base URL: ${result.config.source_base_url}`);
      }
      if (result.integrations?.beads?.detected) {
        const state = result.integrations.beads.available
          ? "available"
          : result.integrations.beads.error === "beads_auto_read_skipped" ? "detected; detailed reads skipped"
          : result.integrations.beads.enabled ? "detected but unavailable" : "disabled";
        console.log(`Beads: ${state}`);
      }

      if (result.package_json.present) {
        const changed = [
          ...result.package_json.scripts_added.map((name) => `${name} added`),
          ...result.package_json.scripts_overwritten.map((name) => `${name} overwritten`)
        ];
        console.log(changed.length > 0 ? `Scripts: ${changed.join(", ")}` : "Scripts: already current");
      } else {
        console.log("No package.json found. Copy these commands into your project automation if useful:");
        for (const [name, command] of Object.entries(result.package_json.copy_commands)) {
          console.log(`- ${name}: ${command}`);
        }
      }
    });
}
