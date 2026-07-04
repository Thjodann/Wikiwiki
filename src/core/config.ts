import fs from "fs";
import path from "path";
import { wikiwikiPath } from "./paths";

export type WikiwikiConfig = {
  source_base_url?: string;
};

export type WikiwikiSiteTheme = {
  project_name?: string;
  project_description?: string;
  accent?: string;
  accent_strong?: string;
  bg?: string;
  panel?: string;
  panel_soft?: string;
  text?: string;
  muted?: string;
  border?: string;
  code_bg?: string;
  radius?: string;
  font_family?: string;
};

export function configPath(root: string): string {
  return path.join(wikiwikiPath(root), "config.json");
}

export function siteThemePath(root: string): string {
  return path.join(wikiwikiPath(root), "site-theme.json");
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

export function readWikiwikiSiteTheme(root: string): WikiwikiSiteTheme {
  const file = siteThemePath(root);
  if (!fs.existsSync(file)) {
    return {};
  }

  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(".wikiwiki/site-theme.json must contain a JSON object.");
  }

  const theme = parsed as Record<string, unknown>;
  const result: WikiwikiSiteTheme = {};
  for (const key of siteThemeKeys) {
    const value = theme[key];
    if (value !== undefined) {
      if (typeof value !== "string") {
        throw new Error(`.wikiwiki/site-theme.json ${key} must be a string.`);
      }
      result[key] = value;
    }
  }

  return result;
}

export function normalizeSourceBaseUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

const siteThemeKeys = [
  "project_name",
  "project_description",
  "accent",
  "accent_strong",
  "bg",
  "panel",
  "panel_soft",
  "text",
  "muted",
  "border",
  "code_bg",
  "radius",
  "font_family"
] as const;
