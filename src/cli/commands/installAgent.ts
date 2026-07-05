import { Command } from "commander";
import { printJson } from "../helpers";
import { agentInstallCommand, agentInstallPlan, installAgentSkill } from "../../core/agents";

type InstallAgentOptions = {
  dest?: string;
  yes?: boolean;
  force?: boolean;
  json?: boolean;
};

export function registerInstallAgentCommand(program: Command): void {
  program
    .command("install-agent")
    .description("Install Wikiwiki instructions for an agentic IDE.")
    .argument("<target>", "agent target, currently: codex")
    .option("--dest <path>", "destination skill directory")
    .option("--yes", "write files without an interactive confirmation prompt")
    .option("--force", "install even when the destination contains unknown files")
    .option("--json", "print machine-readable output")
    .action((target: string, options: InstallAgentOptions) => {
      const plan = agentInstallPlan(target, { dest: options.dest });
      const result = {
        ok: Boolean(options.yes),
        ...plan
      };

      if (!options.yes) {
        const command = agentInstallCommand(plan.target, plan.destination);
        if (options.json) {
          printJson({
            ...result,
            ok: false,
            confirmation_required: true,
            command
          });
          return;
        }

        console.log("Wikiwiki can install the wk skill for Codex.");
        console.log(`Destination: ${plan.destination}`);
        console.log(`Run this command to write files:\n${command}`);
        return;
      }

      const installed = installAgentSkill(target, { dest: options.dest, force: options.force });

      if (options.json) {
        printJson(installed);
        return;
      }

      console.log(`Installed wk agent skill to ${installed.destination}`);
    });
}
