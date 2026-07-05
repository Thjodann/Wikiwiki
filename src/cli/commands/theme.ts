import { Command } from "commander";
import { printJson } from "../helpers";
import { findRepoRoot } from "../../core/paths";
import { previewTheme, themeMoods, writeTheme } from "../../core/theme";

type ThemeCliOptions = {
  mood?: string;
  projectName?: string;
  description?: string;
  force?: boolean;
  json?: boolean;
};

export function registerThemeCommand(program: Command): void {
  const command = program
    .command("theme")
    .description("Create or preview a project identity theme for the generated site.");

  addThemeOptions(
    command
      .command("preview")
      .description("Preview the inferred project theme without writing files.")
  )
    .option("--json", "print machine-readable output")
    .action((options: ThemeCliOptions) => {
      const root = findRepoRoot();
      const result = previewTheme(root, options);
      if (options.json) {
        printJson(result);
        return;
      }

      console.log("Previewed Wikiwiki theme.");
      console.log(`Mood: ${result.mood}`);
      console.log(`Project: ${result.theme.project_name}`);
      console.log(`Theme file: ${result.theme_path}${result.exists ? " (exists)" : ""}`);
      console.log(JSON.stringify(result.theme, null, 2));
    });

  addThemeOptions(
    command
      .command("init")
      .description("Write .wikiwiki/site-theme.json for this project.")
  )
    .option("--force", "overwrite an existing .wikiwiki/site-theme.json")
    .option("--json", "print machine-readable output")
    .action((options: ThemeCliOptions) => {
      const root = findRepoRoot();
      const result = writeTheme(root, options);
      if (options.json) {
        printJson(result);
        return;
      }

      console.log(result.overwritten ? "Overwrote Wikiwiki theme." : "Created Wikiwiki theme.");
      console.log(`Mood: ${result.mood}`);
      console.log(`Project: ${result.theme.project_name}`);
      console.log(`Theme file: ${result.theme_path}`);
    });
}

function addThemeOptions(command: Command): Command {
  return command
    .option("--mood <mood>", `theme mood: ${themeMoods.join(", ")}`)
    .option("--project-name <name>", "project name for the generated site")
    .option("--description <text>", "project description for the generated site");
}
