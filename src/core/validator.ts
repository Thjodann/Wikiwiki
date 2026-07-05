import fs from "fs";
import path from "path";
import { safeFileName } from "./articles";
import { validateHumanWiki } from "./compiler";
import { buildWikiPages } from "./renderer";
import { type AnyRecord, type RecordType, recordTypes } from "./schemas";
import {
  activeRecords,
  isDeletedRecord,
  isInitialized,
  readAllRecordsWithIssues,
  recordTimestamp
} from "./store";
import { reportPath, wikiwikiPath } from "./paths";

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
    errors.push(".wikiwiki folder does not exist. Run `wk init`.");
    return { valid: false, errors, warnings, counts };
  }

  if (!isInitialized(root)) {
    errors.push(".wikiwiki/records folder does not exist. Run `wk init`.");
    return { valid: false, errors, warnings, counts };
  }

  const { records, issues } = readAllRecordsWithIssues(root);
  for (const issue of issues) {
    const file = reportPath(issue.file);
    const location = issue.line ? `${file}:${issue.line}` : file;
    errors.push(`${location}: ${issue.message}`);
  }

  for (const type of recordTypes) {
    counts[type] = activeRecords(records[type]).length;
    validateRevisionGroups(type, records[type], errors);
  }

  validateLinks(root, records, warnings);
  validateArticles(records, errors);
  errors.push(...validateHumanWiki(root));

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

function validateArticles(
  records: Record<RecordType, AnyRecord[]>,
  errors: string[]
): void {
  const activeByType = Object.fromEntries(
    recordTypes.map((type) => [type, activeRecords(records[type])])
  ) as Record<RecordType, AnyRecord[]>;
  const activeIds = new Set(recordTypes.flatMap((type) => activeByType[type].map((record) => record.id)));
  const slugs = new Map<string, string>();
  const fileNames = new Map<string, string>();

  for (const article of activeByType.article) {
    if (!("slug" in article) || typeof article.slug !== "string") {
      continue;
    }

    const normalizedSlug = article.slug.trim().toLowerCase();
    const normalizedFileName = safeFileName(article.slug).toLowerCase();
    const existingSlug = slugs.get(normalizedSlug);
    const existingFileName = fileNames.get(normalizedFileName);

    if (existingSlug) {
      errors.push(`article ${article.id} duplicates slug "${article.slug}" from ${existingSlug}.`);
    } else {
      slugs.set(normalizedSlug, article.id);
    }

    if (existingFileName) {
      errors.push(`article ${article.id} duplicates generated filename "${safeFileName(article.slug)}" from ${existingFileName}.`);
    } else {
      fileNames.set(normalizedFileName, article.id);
    }

    const sourceIds = "source_record_ids" in article && Array.isArray(article.source_record_ids)
      ? article.source_record_ids
      : [];
    for (const sourceId of sourceIds) {
      if (!activeIds.has(sourceId)) {
        errors.push(`article ${article.id} references missing source record: ${sourceId}`);
      }
    }
  }
}

function validateRevisionGroups(
  type: RecordType,
  records: AnyRecord[],
  errors: string[]
): void {
  const byId = new Map<string, AnyRecord[]>();
  for (const record of records) {
    const revisions = byId.get(record.id) ?? [];
    revisions.push(record);
    byId.set(record.id, revisions);
  }

  for (const [id, revisions] of byId.entries()) {
    if (revisions.length === 1) {
      continue;
    }

    let previousTimestamp = "";
    let deleted = false;
    revisions.forEach((record, index) => {
      const revisionNumber = index + 1;
      const isDeletion = isDeletedRecord(record);
      const hasUpdatedAt = typeof record.updated_at === "string" && record.updated_at.length > 0;

      if (index === 0 && isDeletion) {
        errors.push(`${type} ${id} starts with a deletion tombstone.`);
      }

      if (index > 0 && !hasUpdatedAt && !isDeletion) {
        errors.push(`${type} ${id} revision ${revisionNumber} must include updated_at or deleted_at.`);
      }

      if (deleted) {
        errors.push(`${type} ${id} has revisions after a deletion tombstone.`);
      }

      const timestamp = recordTimestamp(record);
      if (previousTimestamp && timestamp < previousTimestamp) {
        errors.push(`${type} ${id} revision ${revisionNumber} timestamp predates the previous revision.`);
      }

      if (isDeletion) {
        deleted = true;
      }
      previousTimestamp = timestamp;
    });
  }
}

function validateLinks(
  root: string,
  records: Record<RecordType, AnyRecord[]>,
  warnings: string[]
): void {
  const activeByType = Object.fromEntries(
    recordTypes.map((type) => [type, activeRecords(records[type])])
  ) as Record<RecordType, AnyRecord[]>;
  const ids = new Set<string>();
  for (const type of recordTypes) {
    for (const record of activeByType[type]) {
      ids.add(record.id);
    }
  }

  for (const link of activeByType.link) {
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
