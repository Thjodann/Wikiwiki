import fs from "fs";
import path from "path";
import { Command } from "commander";
import { printJson, recordTitle } from "../helpers";
import { findRepoRoot, relativeReportPath, toPosixPath, wikiPath } from "../../core/paths";
import { readAllRecords } from "../../core/store";
import { type AnyRecord, recordTypes } from "../../core/schemas";

export function registerSearchCommand(program: Command): void {
  program
    .command("search <query...>")
    .description("Search active records and rendered wiki pages.")
    .option("--json", "print machine-readable output")
    .action((queryParts: string[], options: { json?: boolean }) => {
      const root = findRepoRoot();
      const query = queryParts.join(" ").trim();
      if (!query) {
        throw new Error("Search query is required.");
      }

      const result = {
        query,
        records: searchRecords(root, query),
        file_matches: searchRenderedFiles(root, query)
      };

      if (options.json) {
        printJson(result);
        return;
      }

      console.log(`Record matches: ${result.records.length}`);
      for (const match of result.records) {
        console.log(`- ${match.type} ${match.id}: ${match.title}`);
      }

      console.log(`File matches: ${result.file_matches.length}`);
      for (const match of result.file_matches) {
        console.log(`- ${match.file}`);
      }
    });
}

function searchRecords(root: string, query: string) {
  const normalized = query.toLowerCase();
  const records = readAllRecords(root);
  const matches = [];

  for (const type of recordTypes) {
    for (const record of records[type]) {
      const haystack = recordSearchText(record).toLowerCase();
      if (!haystack.includes(normalized)) {
        continue;
      }

      matches.push({
        type,
        id: record.id,
        title: recordTitle(record),
        snippet: snippet(recordSearchText(record), query),
        source: record.source,
        authority: record.authority,
        confidence: record.confidence,
        files: relatedFiles(record).map(toPosixPath)
      });
    }
  }

  return matches;
}

function searchRenderedFiles(root: string, query: string) {
  const outputPath = wikiPath(root);
  if (!fs.existsSync(outputPath)) {
    return [];
  }

  const normalized = query.toLowerCase();
  return fs
    .readdirSync(outputPath)
    .filter((fileName) => fileName.endsWith(".md"))
    .sort()
    .flatMap((fileName) => {
      const file = path.join(outputPath, fileName);
      const content = fs.readFileSync(file, "utf8");
      if (!content.toLowerCase().includes(normalized)) {
        return [];
      }

      return [{
        file: relativeReportPath(root, file),
        snippet: snippet(content, query)
      }];
    });
}

function recordSearchText(record: AnyRecord): string {
  return Object.values(record)
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .filter((value): value is string => typeof value === "string")
    .join(" ");
}

function relatedFiles(record: AnyRecord): string[] {
  if ("files" in record && Array.isArray(record.files)) {
    return record.files;
  }

  if ("file" in record && typeof record.file === "string") {
    return [record.file];
  }

  return [];
}

function snippet(text: string, query: string): string {
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  const index = normalizedText.indexOf(normalizedQuery);
  if (index < 0) {
    return text.slice(0, 160).trim();
  }

  const start = Math.max(0, index - 60);
  const end = Math.min(text.length, index + query.length + 100);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";
  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}
