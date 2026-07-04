import fs from "fs";
import path from "path";
import { buildWikiPages } from "./renderer";
import { type AnyRecord, type RecordType, recordTypes } from "./schemas";
import { isInitialized, readAllRecordsWithIssues } from "./store";
import { wikiwikiPath } from "./paths";

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  counts: Record<RecordType, number>;
};

export function validateWikiwiki(root: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const counts = Object.fromEntries(recordTypes.map((type) => [type, 0])) as Record<RecordType, number>;

  if (!fs.existsSync(wikiwikiPath(root))) {
    errors.push(".wikiwiki folder does not exist. Run `wikiwiki init`.");
    return { valid: false, errors, warnings, counts };
  }

  if (!isInitialized(root)) {
    errors.push(".wikiwiki/records folder does not exist. Run `wikiwiki init`.");
    return { valid: false, errors, warnings, counts };
  }

  const { records, issues } = readAllRecordsWithIssues(root);
  for (const issue of issues) {
    const location = issue.line ? `${issue.file}:${issue.line}` : issue.file;
    errors.push(`${location}: ${issue.message}`);
  }

  for (const type of recordTypes) {
    counts[type] = records[type].length;
    const seen = new Set<string>();
    for (const record of records[type]) {
      if (seen.has(record.id)) {
        errors.push(`Duplicate ${type} id: ${record.id}`);
      }
      seen.add(record.id);
    }
  }

  validateLinks(root, records, warnings);

  try {
    buildWikiPages(root);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`Render check failed: ${message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    counts
  };
}

function validateLinks(
  root: string,
  records: Record<RecordType, AnyRecord[]>,
  warnings: string[]
): void {
  const ids = new Set<string>();
  for (const type of recordTypes) {
    for (const record of records[type]) {
      ids.add(record.id);
    }
  }

  for (const link of records.link) {
    const from = "from" in link ? link.from : "";
    const to = "to" in link ? link.to : "";
    for (const endpoint of [from, to]) {
      if (ids.has(endpoint)) {
        continue;
      }

      if (looksLikeExistingFile(root, endpoint)) {
        continue;
      }

      warnings.push(`Link ${link.id} references unresolved target: ${endpoint}`);
    }
  }
}

function looksLikeExistingFile(root: string, endpoint: string): boolean {
  if (!endpoint || endpoint.includes("://")) {
    return false;
  }

  return fs.existsSync(path.resolve(root, endpoint));
}
