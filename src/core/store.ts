import fs from "fs";
import { z } from "zod";
import {
  type AnyRecord,
  type RecordByType,
  type RecordType,
  recordSchemas,
  recordTypes
} from "./schemas";
import { recordPath, recordsPath, relativeReportPath, wikiwikiPath } from "./paths";

export type JsonlIssue = {
  file: string;
  line?: number;
  message: string;
};

export type RecordsByType = {
  [Type in RecordType]: RecordByType[Type][];
};

export function isInitialized(root: string): boolean {
  return fs.existsSync(wikiwikiPath(root)) && fs.existsSync(recordsPath(root));
}

export function ensureStore(root: string): void {
  fs.mkdirSync(recordsPath(root), { recursive: true });
  for (const type of recordTypes) {
    const file = recordPath(root, type);
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, "", "utf8");
    }
  }
}

export function appendRecord<T extends RecordType>(
  root: string,
  type: T,
  record: RecordByType[T]
): RecordByType[T] {
  ensureStore(root);
  const schema = recordSchemas[type] as unknown as z.ZodType<RecordByType[T]>;
  const parsed = schema.parse(record);
  fs.appendFileSync(recordPath(root, type), `${JSON.stringify(parsed)}\n`, "utf8");
  return parsed;
}

export function readRecords<T extends RecordType>(
  root: string,
  type: T
): RecordByType[T][] {
  const { records, issues } = readRecordsWithIssues(root, type);
  if (issues.length > 0) {
    const issue = issues[0];
    const where = issue.line ? `${issue.file}:${issue.line}` : issue.file;
    throw new Error(`${where}: ${issue.message}`);
  }
  return activeRecords(records);
}

export function readRecordsWithIssues<T extends RecordType>(
  root: string,
  type: T
): { records: RecordByType[T][]; issues: JsonlIssue[] } {
  const file = recordPath(root, type);
  const schema = recordSchemas[type] as unknown as z.ZodType<RecordByType[T]>;
  const records: RecordByType[T][] = [];
  const issues: JsonlIssue[] = [];

  if (!fs.existsSync(file)) {
    issues.push({ file, message: "Record file does not exist." });
    return { records, issues };
  }

  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (line.trim().length === 0) {
      return;
    }

    try {
      const parsedJson = JSON.parse(line) as unknown;
      const parsedRecord = schema.parse(parsedJson);
      records.push(parsedRecord);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      issues.push({
        file,
        line: index + 1,
        message
      });
    }
  });

  return { records, issues };
}

export function readAllRecords(root: string): RecordsByType {
  return {
    concept: readRecords(root, "concept"),
    decision: readRecords(root, "decision"),
    event: readRecords(root, "event"),
    note: readRecords(root, "note"),
    symbol: readRecords(root, "symbol"),
    link: readRecords(root, "link")
  };
}

export function readActiveRecord<T extends RecordType>(
  root: string,
  type: T,
  id: string
): RecordByType[T] | undefined {
  return readRecords(root, type).find((record) => record.id === id);
}

export function readAllRecordsWithIssues(root: string): {
  records: Record<RecordType, AnyRecord[]>;
  issues: JsonlIssue[];
} {
  const records = {} as Record<RecordType, AnyRecord[]>;
  const issues: JsonlIssue[] = [];

  for (const type of recordTypes) {
    const result = readRecordsWithIssues(root, type);
    records[type] = result.records as AnyRecord[];
    issues.push(...result.issues);
  }

  return { records, issues };
}

export function recordCounts(root: string): Record<RecordType, number> {
  const counts = {} as Record<RecordType, number>;
  for (const type of recordTypes) {
    const file = recordPath(root, type);
    if (!fs.existsSync(file)) {
      counts[type] = 0;
      continue;
    }

    const { records } = readRecordsWithIssues(root, type);
    counts[type] = activeRecords(records).length;
  }
  return counts;
}

export function relativePath(root: string, absolutePath: string): string {
  return relativeReportPath(root, absolutePath);
}

export function activeRecords<T extends AnyRecord>(records: T[]): T[] {
  return latestRecords(records).filter((record) => !isDeletedRecord(record));
}

export function latestRecords<T extends AnyRecord>(records: T[]): T[] {
  const latest = new Map<string, T>();

  for (const record of records) {
    const current = latest.get(record.id);
    if (!current || recordTimestamp(record) >= recordTimestamp(current)) {
      latest.set(record.id, record);
    }
  }

  return [...latest.values()];
}

export function isDeletedRecord(record: AnyRecord): boolean {
  return typeof record.deleted_at === "string" && record.deleted_at.length > 0;
}

export function recordTimestamp(record: AnyRecord): string {
  if (typeof record.deleted_at === "string" && record.deleted_at.length > 0) {
    return record.deleted_at;
  }

  if (typeof record.updated_at === "string" && record.updated_at.length > 0) {
    return record.updated_at;
  }

  return record.created_at;
}
