import { Command } from "commander";
import {
  addCommonRecordOptions,
  arrayValue,
  commonRecordFields,
  parseJsonInput,
  parseList,
  printAdded,
  stringValue,
  wantsJsonOutput
} from "../helpers";
import { createId } from "../../core/ids";
import { findRepoRoot } from "../../core/paths";
import { appendRecord } from "../../core/store";
import type { NoteRecord } from "../../core/schemas";

export function registerNoteCommand(program: Command): void {
  const note = program.command("note").description("Manage lightweight notes.");

  addCommonRecordOptions(
    note
      .command("add [body...]")
      .description("Add a note.")
      .option("--title <title>", "note title")
      .option("--json [payload]", "read input as JSON and print machine-readable output")
  ).action((bodyParts: string[] | undefined, options) => {
    const root = findRepoRoot();
    const payload = parseJsonInput(options.json);
    const body = stringValue(payload, "body", bodyParts?.join(" ") ?? "");
    const title = options.title ?? stringValue(payload, "title");
    const createdAt = stringValue(payload, "created_at", new Date().toISOString());
    const record: NoteRecord = {
      type: "note",
      id: stringValue(payload, "id", createId("note")),
      title: title || undefined,
      body,
      files: parseList(options.files).length ? parseList(options.files) : arrayValue(payload, "files"),
      tags: parseList(options.tags).length ? parseList(options.tags) : arrayValue(payload, "tags"),
      ...commonRecordFields(options, payload),
      created_at: createdAt
    };

    const added = appendRecord(root, "note", record);
    printAdded("note", added.id, wantsJsonOutput(options.json), added);
  });
}
