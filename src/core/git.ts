import { execFileSync } from "child_process";
import { toPosixPath } from "./paths";

export type GitStatusEntry = {
  status: string;
  path: string;
};

export function runGit(root: string, args: string[]): string {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"]
  }).trimEnd();
}

export function readGitStatus(root: string): GitStatusEntry[] {
  try {
    const output = runGit(root, ["status", "--short", "--untracked-files=all"]);
    if (!output.trim()) {
      return [];
    }

    return output.split(/\r?\n/).map((line) => {
      const status = line.slice(0, 2).trim() || line.slice(0, 2);
      const rawPath = line.slice(3).trim();
      const renameTarget = rawPath.includes(" -> ")
        ? rawPath.split(" -> ").at(-1) ?? rawPath
        : rawPath;

      return {
        status,
        path: toPosixPath(renameTarget)
      };
    });
  } catch {
    return [];
  }
}

export function readGitDiffStat(root: string): string {
  try {
    return runGit(root, ["diff", "--stat"]);
  } catch {
    return "";
  }
}

export function changedFiles(root: string): string[] {
  return readGitStatus(root).map((entry) => entry.path);
}
