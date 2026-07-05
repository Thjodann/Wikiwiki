import fs from "fs";
import os from "os";
import path from "path";

export type AgentTarget = "codex";

export type AgentInstallOptions = {
  dest?: string;
  force?: boolean;
};

export type AgentInstallPlan = {
  target: AgentTarget;
  source: string;
  destination: string;
  files: string[];
};

export type AgentInstallResult = AgentInstallPlan & {
  ok: true;
  force: boolean;
  overwritten_files: string[];
  unknown_files: string[];
};

type DestinationStatus = {
  knownFiles: string[];
  unknownFiles: string[];
};

export function agentInstallPlan(target: string, options: AgentInstallOptions = {}): AgentInstallPlan {
  const parsedTarget = parseAgentTarget(target);
  const source = bundledSkillPath();
  const destination = path.resolve(options.dest ?? defaultCodexSkillPath());
  const sourceFiles = listRelativeFiles(source);

  return {
    target: parsedTarget,
    source,
    destination,
    files: sourceFiles.map((file) => path.join(destination, file))
  };
}

export function installAgentSkill(target: string, options: AgentInstallOptions = {}): AgentInstallResult {
  const plan = agentInstallPlan(target, options);
  const sourceFiles = listRelativeFiles(plan.source);
  const destinationStatus = inspectDestination(plan.destination, sourceFiles, Boolean(options.force));
  installKnownFiles(plan.source, plan.destination, sourceFiles, Boolean(options.force));

  return {
    ...plan,
    ok: true,
    force: Boolean(options.force),
    overwritten_files: destinationStatus.knownFiles.map((file) => path.join(plan.destination, file)),
    unknown_files: destinationStatus.unknownFiles.map((file) => path.join(plan.destination, file))
  };
}

export function agentInstallCommand(target: AgentTarget, destination: string): string {
  return `wk install-agent ${target} --dest ${JSON.stringify(destination)} --yes`;
}

function parseAgentTarget(value: string): AgentTarget {
  if (value === "codex") {
    return value;
  }

  throw new Error(`Unsupported agent target: ${value}. Expected: codex.`);
}

function bundledSkillPath(): string {
  const candidates = [
    path.resolve(__dirname, "../../skills/wk"),
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
