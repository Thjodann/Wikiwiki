import { Command } from "commander";
import {
  addCommonRecordOptions,
  arrayValue,
  collectList,
  commonRecordFields,
  parseJsonInput,
  parseList,
  printAdded,
  stringValue,
  timestampPair,
  wantsJsonOutput
} from "../helpers";
import { slugFromTitle } from "../../core/articles";
import { createId } from "../../core/ids";
import { findRepoRoot } from "../../core/paths";
import { appendRecord } from "../../core/store";
import type { ArticleRecord } from "../../core/schemas";

export function registerArticleCommand(program: Command): void {
  const article = program.command("article").description("Manage public wiki articles.");

  addCommonRecordOptions(
    article
      .command("add")
      .description("Add a public wiki article.")
      .option("--title <title>", "article title")
      .option("--slug <slug>", "stable article slug")
      .option("--summary <summary>", "short article summary")
      .option("--body <body>", "article body")
      .option("--categories <categories>", "comma-separated categories; repeatable", collectList, [])
      .option("--aliases <aliases>", "comma-separated aliases; repeatable", collectList, [])
      .option("--source-records <ids>", "comma-separated source record ids; repeatable", collectList, [])
      .option("--json [payload]", "read input as JSON and print machine-readable output")
  ).action((options) => {
    const root = findRepoRoot();
    const payload = parseJsonInput(options.json);
    const timestamps = timestampPair(payload);
    const title = options.title ?? stringValue(payload, "title");
    const slug = options.slug ?? stringValue(payload, "slug", slugFromTitle(title));
    const record: ArticleRecord = {
      type: "article",
      id: stringValue(payload, "id", createId("article")),
      title,
      slug,
      summary: options.summary ?? stringValue(payload, "summary"),
      body: options.body ?? stringValue(payload, "body"),
      categories: parseList(options.categories).length ? parseList(options.categories) : arrayValue(payload, "categories"),
      aliases: parseList(options.aliases).length ? parseList(options.aliases) : arrayValue(payload, "aliases"),
      source_record_ids: parseList(options.sourceRecords).length ? parseList(options.sourceRecords) : arrayValue(payload, "source_record_ids"),
      files: parseList(options.files).length ? parseList(options.files) : arrayValue(payload, "files"),
      tags: parseList(options.tags).length ? parseList(options.tags) : arrayValue(payload, "tags"),
      ...commonRecordFields(options, payload),
      created_at: timestamps.created_at,
      updated_at: timestamps.updated_at
    };

    const added = appendRecord(root, "article", record);
    printAdded("article", added.id, wantsJsonOutput(options.json), added);
  });
}
