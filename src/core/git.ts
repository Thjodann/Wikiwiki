import { execFileSync } from "child_process";
import { toPosixPath } from "./paths";

export type GitStatusEntry = {
  status: string;
  path: string;
};

export type SuppressedGitStatusGroup = {
  name: "dependencies" | "wikiwiki_drafts" | "generated_wiki" | "generated_site" | "beads_internals";
  pattern: string;
  count: number;
};

export type SuppressedGitStatusSummary = {
  total: number;
  groups: SuppressedGitStatusGroup[];
};

export function runGit(root: string, args: string[]): string {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"]
  }).trimEnd();
}

export function readGitStatus(root: string, pathspecs: string[] = []): GitStatusEntry[] {
  try {
    const args = ["status", "--short", "--untracked-files=all"];
    if (pathspecs.length > 0) {
      args.push("--", ...pathspecs);
    }
    const output = runGit(root, args);
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
  return meaningfulGitStatus(root).map((entry) => entry.path);
}

export function meaningfulGitStatus(root: string): GitStatusEntry[] {
  return readGitStatus(root).filter((entry) => !suppressedPathGroup(entry.path));
}

export function suppressedGitStatusSummary(root: string): SuppressedGitStatusSummary {
  return summarizeSuppressedGitStatus(readGitStatus(root));
}

export function summarizeSuppressedGitStatus(entries: GitStatusEntry[]): SuppressedGitStatusSummary {
  const groups = suppressionGroups
    .map((group) => ({
      name: group.name,
      pattern: group.pattern,
      count: entries.filter((entry) => group.matches(entry.path)).length
    }))
    .filter((group) => group.count > 0);

  return {
    total: groups.reduce((sum, group) => sum + group.count, 0),
    groups
  };
}

export function isSuppressedGitPath(file: string): boolean {
  return Boolean(suppressedPathGroup(file));
}

const suppressionGroups: Array<{
  name: SuppressedGitStatusGroup["name"];
  pattern: string;
  matches: (file: string) => boolean;
}> = [
  {
    name: "dependencies",
    pattern: "node_modules/**",
    matches: (file) => file === "node_modules" || file.startsWith("node_modules/")
  },
  {
    name: "wikiwiki_drafts",
    pattern: ".wikiwiki/drafts/**",
    matches: (file) => file === ".wikiwiki/drafts" || file.startsWith(".wikiwiki/drafts/")
  },
  {
    name: "generated_wiki",
    pattern: "wiki/**",
    matches: (file) => file === "wiki" || file.startsWith("wiki/")
  },
  {
    name: "generated_site",
    pattern: "wiki-site/**",
    matches: (file) => file === "wiki-site" || file.startsWith("wiki-site/")
  },
  {
    name: "beads_internals",
    pattern: ".beads/backup/**, .beads/embeddeddolt/**",
    matches: (file) => file.startsWith(".beads/backup/") || file.startsWith(".beads/embeddeddolt/")
  }
];

function suppressedPathGroup(file: string): SuppressedGitStatusGroup["name"] | undefined {
  return suppressionGroups.find((group) => group.matches(file))?.name;
}
