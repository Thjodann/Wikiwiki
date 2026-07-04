import { Command } from "commander";
import {
  parseJsonInput,
  parseRecordType,
  printJson,
  recordTitle
} from "../helpers";
import { findRepoRoot } from "../../core/paths";
import { appendRecord, readActiveRecord, readRecords } from "../../core/store";
import type { AnyRecord, RecordByType, RecordType } from "../../core/schemas";

export function registerRecordCommand(program: Command): void {
  const record = program.command("record").description("Inspect and revise records.");

  record
    .command("list <type>")
    .description("List active records by type.")
    .option("--json", "print machine-readable output")
    .action((typeArg: string, options: { json?: boolean }) => {
      const root = findRepoRoot();
      const type = parseRecordType(typeArg);
      const records = readRecords(root, type);
      const result = { type, records };

      if (options.json) {
        printJson(result);
        return;
      }

      for (const item of records) {
        console.log(`${item.id}\t${recordTitle(item)}`);
      }
    });

  record
    .command("get <type> <id>")
    .description("Get one active record.")
    .option("--json", "print machine-readable output")
    .action((typeArg: string, id: string, options: { json?: boolean }) => {
      const root = findRepoRoot();
      const type = parseRecordType(typeArg);
      const found = readActiveRecord(root, type, id);
      if (!found) {
        throw new Error(`Active ${type} record not found: ${id}`);
      }

      if (options.json) {
        printJson({ type, record: found });
        return;
      }

      console.log(`${found.id}\t${recordTitle(found)}`);
    });

  record
    .command("update <type> <id>")
    .description("Append a revised record with the same logical id.")
    .requiredOption("--json <payload>", "JSON fields to merge into the active record")
    .action((typeArg: string, id: string, options: { json: string }) => {
      const root = findRepoRoot();
      const type = parseRecordType(typeArg);
      const current = readActiveRecord(root, type, id);
      if (!current) {
        throw new Error(`Active ${type} record not found: ${id}`);
      }

      const payload = parseJsonInput(options.json);
      const updated = buildUpdatedRecord(type, current, payload);
      const added = appendRecord(root, type, updated as RecordByType[typeof type]);
      printJson({ ok: true, record: added });
    });

  record
    .command("delete <type> <id>")
    .description("Append a deletion tombstone for an active record.")
    .option("--reason <reason>", "reason for deletion")
    .option("--json", "print machine-readable output")
    .action((typeArg: string, id: string, options: { reason?: string; json?: boolean }) => {
      const root = findRepoRoot();
      const type = parseRecordType(typeArg);
      const current = readActiveRecord(root, type, id);
      if (!current) {
        throw new Error(`Active ${type} record not found: ${id}`);
      }

      const now = new Date().toISOString();
      const tombstone = {
        ...current,
        updated_at: now,
        deleted_at: now,
        delete_reason: options.reason ?? ""
      };
      const added = appendRecord(root, type, tombstone as RecordByType[typeof type]);
      const result = { ok: true, record: added };

      if (options.json) {
        printJson(result);
        return;
      }

      console.log(`Deleted ${type}: ${id}`);
    });
}

function buildUpdatedRecord<T extends RecordType>(
  type: T,
  current: RecordByType[T],
  payload: Record<string, unknown>
): RecordByType[T] {
  const now = new Date().toISOString();
  const next = {
    ...current,
    ...payload,
    type,
    id: current.id,
    created_at: current.created_at,
    updated_at: typeof payload.updated_at === "string" ? payload.updated_at : now
  } as AnyRecord;

  delete next.deleted_at;
  delete next.delete_reason;

  return next as RecordByType[T];
}
