import { execFileSync } from "child_process";
import path from "path";
import type { RecordType } from "./schemas";

export const storeDirectoryName = ".wikiwiki";
export const recordsDirectoryName = "records";
export const wikiDirectoryName = "wiki";
export const siteDirectoryName = "wiki-site";

export const recordFileNames: Record<RecordType, string> = {
  article: "articles.jsonl",
  concept: "concepts.jsonl",
  decision: "decisions.jsonl",
  event: "events.jsonl",
  note: "notes.jsonl",
  symbol: "symbols.jsonl",
  link: "links.jsonl"
};

export function findRepoRoot(cwd = process.cwd()): string {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return cwd;
  }
}

export function wikiwikiPath(root: string): string {
  return path.join(root, storeDirectoryName);
}

export function recordsPath(root: string): string {
  return path.join(wikiwikiPath(root), recordsDirectoryName);
}

export function recordPath(root: string, type: RecordType): string {
  return path.join(recordsPath(root), recordFileNames[type]);
}

export function wikiPath(root: string): string {
  return path.join(root, wikiDirectoryName);
}

export function sitePath(root: string): string {
  return path.join(root, siteDirectoryName);
}

export function toPosixPath(value: string): string {
  return value.replace(/\\/g, "/");
}

export function reportPath(value: string): string {
  return toPosixPath(value);
}

export function relativeReportPath(root: string, value: string): string {
  return toPosixPath(path.relative(root, value));
}
