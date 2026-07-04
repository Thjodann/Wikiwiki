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
import type { DecisionRecord } from "../../core/schemas";

export function registerDecisionCommand(program: Command): void {
  const decision = program.command("decision").description("Manage decisions.");

  addCommonRecordOptions(
    decision
      .command("add")
      .description("Add a decision.")
      .option("--title <title>", "decision title")
      .option("--context <context>", "decision context")
      .option("--decision <decision>", "the decision")
      .option("--consequences <consequences>", "known consequences")
      .option("--json [payload]", "read input as JSON and print machine-readable output")
  ).action((options) => {
    const root = findRepoRoot();
    const payload = parseJsonInput(options.json);
    const timestamps = timestampPair(payload);
    const record: DecisionRecord = {
      type: "decision",
      id: stringValue(payload, "id", createId("decision")),
      title: options.title ?? stringValue(payload, "title"),
      context: options.context ?? stringValue(payload, "context"),
      decision: options.decision ?? stringValue(payload, "decision"),
      consequences: options.consequences ?? stringValue(payload, "consequences"),
      files: parseList(options.files).length ? parseList(options.files) : arrayValue(payload, "files"),
      tags: parseList(options.tags).length ? parseList(options.tags) : arrayValue(payload, "tags"),
      ...commonRecordFields(options, payload),
      created_at: timestamps.created_at,
      updated_at: timestamps.updated_at
    };

    const added = appendRecord(root, "decision", record);
    printAdded("decision", added.id, wantsJsonOutput(options.json), added);
  });
}
