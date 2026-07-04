import fs from "fs";
import path from "path";
import { wikiwikiPath } from "./paths";

export type WikiwikiConfig = {
  source_base_url?: string;
};

export function configPath(root: string): string {
  return path.join(wikiwikiPath(root), "config.json");
}

export function readWikiwikiConfig(root: string): WikiwikiConfig {
  const file = configPath(root);
  if (!fs.existsSync(file)) {
    return {};
  }

  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(".wikiwiki/config.json must contain a JSON object.");
  }

  const config = parsed as Record<string, unknown>;
  const sourceBaseUrl = config.source_base_url;
  if (sourceBaseUrl !== undefined && typeof sourceBaseUrl !== "string") {
    throw new Error(".wikiwiki/config.json source_base_url must be a string.");
  }

  return {
    source_base_url: sourceBaseUrl
  };
}

export function normalizeSourceBaseUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}
