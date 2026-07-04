import { Command } from "commander";
import {
  commonRecordFields,
  parseJsonInput,
  printAdded,
  stringValue,
  wantsJsonOutput
} from "../helpers";
import { createId } from "../../core/ids";
import { findRepoRoot } from "../../core/paths";
import { appendRecord } from "../../core/store";
import type { LinkRecord } from "../../core/schemas";

export function registerLinkCommand(program: Command): void {
  const link = program.command("link").description("Manage links between records or files.");

  link
    .command("add")
    .description("Add a link.")
    .option("--from <from>", "source record id or file")
    .option("--to <to>", "target record id or file")
    .option("--relationship <relationship>", "relationship name")
    .option("--source <source>", "record source: manual, agent, git-diff, imported")
    .option("--authority <authority>", "record authority: user, agent, system")
    .option("--confidence <confidence>", "record confidence: low, medium, high")
    .option("--json [payload]", "read input as JSON and print machine-readable output")
    .action((options) => {
      const root = findRepoRoot();
      const payload = parseJsonInput(options.json);
      const record: LinkRecord = {
        type: "link",
        id: stringValue(payload, "id", createId("link")),
        from: options.from ?? stringValue(payload, "from"),
        to: options.to ?? stringValue(payload, "to"),
        relationship: options.relationship ?? stringValue(payload, "relationship"),
        ...commonRecordFields(options, payload),
        created_at: stringValue(payload, "created_at", new Date().toISOString())
      };

      const added = appendRecord(root, "link", record);
      printAdded("link", added.id, wantsJsonOutput(options.json), added);
    });
}
