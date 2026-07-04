import { Command } from "commander";
import { recordTypes } from "../core/schemas";
import type { AnyRecord, Authority, Confidence, RecordType, Source } from "../core/schemas";

export type CommonRecordOptions = {
  source?: Source;
  authority?: Authority;
  confidence?: Confidence;
  files?: string | string[];
  tags?: string | string[];
  json?: boolean | string;
};

export function addCommonRecordOptions(command: Command): Command {
  return command
    .option("--source <source>", "record source: manual, agent, git-diff, imported")
    .option("--authority <authority>", "record authority: user, agent, system")
    .option("--confidence <confidence>", "record confidence: low, medium, high")
    .option("--files <files>", "comma-separated related files; repeatable", collectList, [])
    .option("--tags <tags>", "comma-separated tags; repeatable", collectList, []);
}

export function wantsJsonOutput(value: unknown): boolean {
  return value !== undefined && value !== false;
}

export function parseJsonInput(value: unknown): Record<string, unknown> {
  if (typeof value !== "string") {
    return {};
  }

  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("--json input must be a JSON object.");
  }

  return parsed as Record<string, unknown>;
}

export function stringValue(
  payload: Record<string, unknown>,
  key: string,
  fallback = ""
): string {
  const value = payload[key];
  return typeof value === "string" ? value : fallback;
}

export function arrayValue(
  payload: Record<string, unknown>,
  key: string,
  fallback: string[] = []
): string[] {
  const value = payload[key];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    return parseList(value);
  }

  return fallback;
}

export function parseList(value: string | string[] | undefined): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => parseList(item));
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function collectList(value: string, previous: string[] = []): string[] {
  return [...previous, ...parseList(value)];
}

export function commonRecordFields(
  options: CommonRecordOptions,
  payload: Record<string, unknown>
): {
  source: Source;
  authority: Authority;
  confidence: Confidence;
} {
  return {
    source: (options.source ?? stringValue(payload, "source", "manual")) as Source,
    authority: (options.authority ?? stringValue(payload, "authority", "agent")) as Authority,
    confidence: (options.confidence ?? stringValue(payload, "confidence", "medium")) as Confidence
  };
}

export function timestampPair(payload: Record<string, unknown>): {
  created_at: string;
  updated_at: string;
} {
  const now = new Date().toISOString();
  return {
    created_at: stringValue(payload, "created_at", now),
    updated_at: stringValue(payload, "updated_at", now)
  };
}

export function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

export function printAdded(
  type: string,
  id: string,
  json: boolean,
  record: unknown
): void {
  if (json) {
    printJson({ ok: true, record });
    return;
  }

  console.log(`Added ${type}: ${id}`);
}

export function parseRecordType(value: string): RecordType {
  if ((recordTypes as readonly string[]).includes(value)) {
    return value as RecordType;
  }

  throw new Error(`Unknown record type: ${value}. Expected one of: ${recordTypes.join(", ")}.`);
}

export function recordTitle(record: AnyRecord): string {
  if ("name" in record && typeof record.name === "string") {
    return record.name;
  }

  if ("title" in record && typeof record.title === "string") {
    return record.title;
  }

  if ("summary" in record && typeof record.summary === "string") {
    return record.summary;
  }

  if ("body" in record && typeof record.body === "string") {
    return record.body.slice(0, 80);
  }

  if ("relationship" in record && typeof record.relationship === "string") {
    return `${record.from} ${record.relationship} ${record.to}`;
  }

  return record.id;
}
