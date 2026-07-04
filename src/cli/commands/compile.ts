import { Command } from "commander";
import { printJson } from "../helpers";
import { findRepoRoot, reportPath } from "../../core/paths";
import {
  applyCompileDraft,
  createCompileDraft,
  type CompileRoleOption
} from "../../core/compiler";

export function registerCompileCommand(program: Command): void {
  const compile = program
    .command("compile")
    .description("Compile structured records into role-oriented human wiki drafts.");

  compile
    .command("draft")
    .description("Create UX/DX human wiki drafts for an IDE agent to compose.")
    .option("--role <role>", "compile role: all, ux, dx", "all")
    .option("--json", "print machine-readable output")
    .action((options: { role: string; json?: boolean }) => {
      const root = findRepoRoot();
      const result = createCompileDraft(root, options.role as CompileRoleOption);

      if (options.json) {
        printJson({
          ...result,
          draft_path: reportPath(result.draft_path),
          manifest_path: reportPath(result.manifest_path)
        });
        return;
      }

      console.log(`Created compile draft: ${result.draft_id}`);
      console.log(`Draft path: ${result.draft_path}`);
      for (const page of result.pages) {
        console.log(`- ${page.draft_path} -> ${page.output_path}`);
      }
    });

  compile
    .command("apply <draft-id>")
    .description("Validate and publish a human wiki compile draft.")
    .option("--json", "print machine-readable output")
    .action((draftId: string, options: { json?: boolean }) => {
      const root = findRepoRoot();
      const result = applyCompileDraft(root, draftId);

      if (options.json) {
        printJson(result);
        return;
      }

      console.log(`Applied compile draft: ${result.draft_id}`);
      for (const file of result.rendered_files) {
        console.log(`- ${file}`);
      }
    });
}
