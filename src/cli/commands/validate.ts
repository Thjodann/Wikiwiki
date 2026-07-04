import { Command } from "commander";
import { printJson } from "../helpers";
import { findRepoRoot } from "../../core/paths";
import { validateWikiwiki } from "../../core/validator";

export function registerValidateCommand(program: Command): void {
  program
    .command("validate")
    .description("Validate Wikiwiki storage and generated wiki rendering.")
    .option("--json", "print machine-readable output")
    .action((options: { json?: boolean }) => {
      const root = findRepoRoot();
      const result = validateWikiwiki(root);

      if (options.json) {
        printJson(result);
      } else if (result.valid) {
        console.log("Wikiwiki validation passed.");
        if (result.warnings.length > 0) {
          console.log("\nWarnings:");
          for (const warning of result.warnings) {
            console.log(`- ${warning}`);
          }
        }
      } else {
        console.error("Wikiwiki validation failed.");
        for (const error of result.errors) {
          console.error(`- ${error}`);
        }
        if (result.warnings.length > 0) {
          console.error("\nWarnings:");
          for (const warning of result.warnings) {
            console.error(`- ${warning}`);
          }
        }
      }

      if (!result.valid) {
        process.exitCode = 1;
      }
    });
}
