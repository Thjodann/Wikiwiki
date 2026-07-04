import { Command } from "commander";
import {
  addCommonRecordOptions,
  arrayValue,
  commonRecordFields,
  parseJsonInput,
  parseList,
  printAdded,
  stringValue,
  timestampPair,
  wantsJsonOutput
} from "../helpers";
import { createId } from "../../core/ids";
import { findRepoRoot } from "../../core/paths";
import { appendRecord } from "../../core/store";
import type { ConceptRecord } from "../../core/schemas";

export function registerConceptCommand(program: Command): void {
  const concept = program.command("concept").description("Manage concepts.");

  addCommonRecordOptions(
    concept
      .command("add")
      .description("Add a concept.")
      .option("--name <name>", "concept name")
      .option("--summary <summary>", "short concept summary")
      .option("--details <details>", "longer concept details")
      .option("--json [payload]", "read input as JSON and print machine-readable output")
  ).action((options) => {
    const root = findRepoRoot();
    const payload = parseJsonInput(options.json);
    const timestamps = timestampPair(payload);
    const record: ConceptRecord = {
      type: "concept",
      id: stringValue(payload, "id", createId("concept")),
      name: options.name ?? stringValue(payload, "name"),
      summary: options.summary ?? stringValue(payload, "summary"),
      details: options.details ?? stringValue(payload, "details"),
      files: parseList(options.files).length ? parseList(options.files) : arrayValue(payload, "files"),
      tags: parseList(options.tags).length ? parseList(options.tags) : arrayValue(payload, "tags"),
      ...commonRecordFields(options, payload),
      created_at: timestamps.created_at,
      updated_at: timestamps.updated_at
    };

    const added = appendRecord(root, "concept", record);
    printAdded("concept", added.id, wantsJsonOutput(options.json), added);
  });
}
