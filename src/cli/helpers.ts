import { Command } from "commander";
import type { Authority, Confidence, Source } from "../core/schemas";

export type CommonRecordOptions = {
  source?: Source;
  authority?: Authority;
  confidence?: Confidence;
  files?: string;
  tags?: string;
  json?: boolean | string;
};

export function addCommonRecordOptions(command: Command): Command {
  return command
    .option("--source <source>", "record source: manual, agent, git-diff, imported")
    .option("--authority <authority>", "record authority: user, agent, system")
    .option("--confidence <confidence>", "record confidence: low, medium, high")
    .option("--files <files>", "comma-separated related files")
    .option("--tags <tags>", "comma-separated tags");
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
    return value.map((item) => item.trim()).filter(Boolean);
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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
