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
import type { SymbolRecord } from "../../core/schemas";

export function registerSymbolCommand(program: Command): void {
  const symbol = program.command("symbol").description("Manage code symbols.");

  addCommonRecordOptions(
    symbol
      .command("add")
      .description("Add a symbol.")
      .option("--name <name>", "symbol name")
      .option("--kind <kind>", "symbol kind")
      .option("--file <file>", "source file")
      .option("--summary <summary>", "symbol summary")
      .option("--json [payload]", "read input as JSON and print machine-readable output")
  ).action((options) => {
    const root = findRepoRoot();
    const payload = parseJsonInput(options.json);
    const timestamps = timestampPair(payload);
    const record: SymbolRecord = {
      type: "symbol",
      id: stringValue(payload, "id", createId("symbol")),
      name: options.name ?? stringValue(payload, "name"),
      kind: options.kind ?? stringValue(payload, "kind"),
      file: options.file ?? stringValue(payload, "file"),
      summary: options.summary ?? stringValue(payload, "summary"),
      tags: parseList(options.tags).length ? parseList(options.tags) : arrayValue(payload, "tags"),
      ...commonRecordFields(options, payload),
      created_at: timestamps.created_at,
      updated_at: timestamps.updated_at
    };

    const added = appendRecord(root, "symbol", record);
    printAdded("symbol", added.id, wantsJsonOutput(options.json), added);
  });
}
