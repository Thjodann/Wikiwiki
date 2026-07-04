import fs from "fs";
import os from "os";
import path from "path";
import { Command } from "commander";
import { printJson } from "../helpers";

type InstallAgentOptions = {
  dest?: string;
  yes?: boolean;
  json?: boolean;
};

export function registerInstallAgentCommand(program: Command): void {
  program
    .command("install-agent")
    .description("Install Wikiwiki instructions for an agentic IDE.")
    .argument("<target>", "agent target, currently: codex")
    .option("--dest <path>", "destination skill directory")
    .option("--yes", "write files without an interactive confirmation prompt")
    .option("--json", "print machine-readable output")
    .action((target: string, options: InstallAgentOptions) => {
      if (target !== "codex") {
        throw new Error(`Unsupported agent target: ${target}. Expected: codex.`);
      }

      const source = bundledSkillPath();
      const destination = path.resolve(options.dest ?? defaultCodexSkillPath());
      const result = {
        ok: Boolean(options.yes),
        target,
        source,
        destination,
        files: [
          path.join(destination, "SKILL.md"),
          path.join(destination, "agents/openai.yaml")
        ]
      };

      if (!options.yes) {
        const command = `wk install-agent codex --dest ${JSON.stringify(destination)} --yes`;
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
        console.log(`Destination: ${destination}`);
        console.log(`Run this command to write files:\n${command}`);
        return;
      }

      fs.rmSync(destination, { recursive: true, force: true });
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.cpSync(source, destination, { recursive: true });

      if (options.json) {
        printJson(result);
        return;
      }

      console.log(`Installed wk agent skill to ${destination}`);
    });
}

function bundledSkillPath(): string {
  const candidates = [
    path.resolve(__dirname, "../../../skills/wk"),
    path.resolve(process.cwd(), "skills/wk")
  ];
  const found = candidates.find((candidate) => fs.existsSync(path.join(candidate, "SKILL.md")));
  if (!found) {
    throw new Error("Bundled wk skill not found.");
  }

  return found;
}

function defaultCodexSkillPath(): string {
  const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
  return path.join(codexHome, "skills/wk");
}
