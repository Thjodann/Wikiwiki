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
import type { EventRecord } from "../../core/schemas";

export function registerEventCommand(program: Command): void {
  const event = program.command("event").description("Manage development events.");

  addCommonRecordOptions(
    event
      .command("add")
      .description("Add an event.")
      .option("--summary <summary>", "event summary")
      .option("--details <details>", "event details")
      .option("--json [payload]", "read input as JSON and print machine-readable output")
  ).action((options) => {
    const root = findRepoRoot();
    const payload = parseJsonInput(options.json);
    const record: EventRecord = {
      type: "event",
      id: stringValue(payload, "id", createId("event")),
      summary: options.summary ?? stringValue(payload, "summary"),
      details: options.details ?? stringValue(payload, "details"),
      files: parseList(options.files).length ? parseList(options.files) : arrayValue(payload, "files"),
      tags: parseList(options.tags).length ? parseList(options.tags) : arrayValue(payload, "tags"),
      ...commonRecordFields(options, payload),
      created_at: stringValue(payload, "created_at", new Date().toISOString())
    };

    const added = appendRecord(root, "event", record);
    printAdded("event", added.id, wantsJsonOutput(options.json), added);
  });
}
