import fs from "fs";
import os from "os";
import path from "path";
import { Command } from "commander";
import { printJson } from "../helpers";

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
      if (target !== "codex") {
        throw new Error(`Unsupported agent target: ${target}. Expected: codex.`);
      }

      const source = bundledSkillPath();
      const destination = path.resolve(options.dest ?? defaultCodexSkillPath());
      const sourceFiles = listRelativeFiles(source);
      const result = {
        ok: Boolean(options.yes),
        target,
        source,
        destination,
        files: sourceFiles.map((file) => path.join(destination, file))
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

      const destinationStatus = inspectDestination(destination, sourceFiles, Boolean(options.force));
      installKnownFiles(source, destination, sourceFiles, Boolean(options.force));

      if (options.json) {
        printJson({
          ...result,
          force: Boolean(options.force),
          overwritten_files: destinationStatus.knownFiles.map((file) => path.join(destination, file)),
          unknown_files: destinationStatus.unknownFiles.map((file) => path.join(destination, file))
        });
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

type DestinationStatus = {
  knownFiles: string[];
  unknownFiles: string[];
};

function inspectDestination(destination: string, sourceFiles: string[], force: boolean): DestinationStatus {
  if (!fs.existsSync(destination)) {
    return { knownFiles: [], unknownFiles: [] };
  }

  const stat = fs.lstatSync(destination);
  if (!stat.isDirectory()) {
    throw new Error(`Destination exists and is not a directory: ${destination}`);
  }

  const sourceFileSet = new Set(sourceFiles);
  const destinationFiles = listRelativeFiles(destination);
  const knownFiles = destinationFiles.filter((file) => sourceFileSet.has(file));
  const unknownFiles = destinationFiles.filter((file) => !sourceFileSet.has(file));

  if (unknownFiles.length > 0 && !force) {
    throw new Error(
      `Refusing to install wk skill because ${destination} contains unknown files: ${unknownFiles.join(", ")}. ` +
      "Re-run with --force to keep those files and overwrite only bundled wk skill files."
    );
  }

  return { knownFiles, unknownFiles };
}

function installKnownFiles(source: string, destination: string, sourceFiles: string[], force: boolean): void {
  fs.mkdirSync(destination, { recursive: true });

  for (const file of sourceFiles) {
    const sourceFile = path.join(source, file);
    const destinationFile = path.join(destination, file);
    fs.mkdirSync(path.dirname(destinationFile), { recursive: true });

    if (fs.existsSync(destinationFile) && fs.lstatSync(destinationFile).isSymbolicLink()) {
      if (!force) {
        throw new Error(`Refusing to overwrite symlink at known wk skill path: ${destinationFile}. Re-run with --force to replace it.`);
      }
      fs.unlinkSync(destinationFile);
    }

    fs.copyFileSync(sourceFile, destinationFile);
  }
}

function listRelativeFiles(root: string): string[] {
  const files: string[] = [];

  function walk(directory: string): void {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      files.push(toPosixPath(path.relative(root, fullPath)));
    }
  }

  walk(root);
  return files.sort();
}

function toPosixPath(file: string): string {
  return file.split(path.sep).join("/");
}
