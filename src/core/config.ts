import fs from "fs";
import path from "path";
import { type BeadsIntegrationConfig } from "./beads";
import { parseSiteAudience, parseWikiProfile, type SiteAudience, type WikiProfile } from "./profiles";
import { wikiwikiPath } from "./paths";

export type WikiwikiConfig = {
  source_base_url?: string;
  wiki_profile?: WikiProfile;
  site_audience?: SiteAudience;
  integrations?: {
    beads?: BeadsIntegrationConfig;
  };
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
  const wikiProfile = config.wiki_profile;
  if (wikiProfile !== undefined && typeof wikiProfile !== "string") {
    throw new Error(".wikiwiki/config.json wiki_profile must be a string.");
  }
  const siteAudience = config.site_audience;
  if (siteAudience !== undefined && typeof siteAudience !== "string") {
    throw new Error(".wikiwiki/config.json site_audience must be a string.");
  }
  const integrations = parseIntegrationsConfig(config.integrations);

  return {
    source_base_url: sourceBaseUrl,
    wiki_profile: parseWikiProfile(wikiProfile, "mixed"),
    site_audience: parseSiteAudience(siteAudience, "all"),
    ...(integrations ? { integrations } : {})
  };
}

export function writeWikiwikiConfig(root: string, config: WikiwikiConfig): void {
  const file = configPath(root);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`, "utf8");
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

function parseIntegrationsConfig(value: unknown): WikiwikiConfig["integrations"] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(".wikiwiki/config.json integrations must be an object.");
  }

  const integrations = value as Record<string, unknown>;
  const result: NonNullable<WikiwikiConfig["integrations"]> = {};
  const beads = integrations.beads;
  if (beads !== undefined) {
    if (!beads || typeof beads !== "object" || Array.isArray(beads)) {
      throw new Error(".wikiwiki/config.json integrations.beads must be an object.");
    }

    const beadsConfig = beads as Record<string, unknown>;
    if (beadsConfig.enabled !== undefined && typeof beadsConfig.enabled !== "boolean") {
      throw new Error(".wikiwiki/config.json integrations.beads.enabled must be a boolean.");
    }
    result.beads = {
      ...(beadsConfig.enabled !== undefined ? { enabled: beadsConfig.enabled } : {})
    };
  }

  return Object.keys(result).length > 0 ? result : undefined;
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
