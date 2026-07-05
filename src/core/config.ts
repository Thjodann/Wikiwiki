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

export const wikiwikiColorSchemes = ["auto", "light", "dark"] as const;

export type WikiwikiColorScheme = (typeof wikiwikiColorSchemes)[number];

export type WikiwikiThemePalette = {
  accent?: string;
  accent_strong?: string;
  secondary?: string;
  bg?: string;
  panel?: string;
  panel_soft?: string;
  text?: string;
  muted?: string;
  border?: string;
  code_bg?: string;
  shadow?: string;
  shadow_strong?: string;
  radius?: string;
  font_family?: string;
  sidebar_bg?: string;
  hero_gradient?: string;
  card_gradient?: string;
  brand_gradient?: string;
  brand_mark_text?: string;
  badge_bg?: string;
  badge_text?: string;
  tag_bg?: string;
  tag_text?: string;
  success_bg?: string;
  success_text?: string;
  warning_bg?: string;
  warning_text?: string;
  focus_ring?: string;
  gloss?: string;
};

export type WikiwikiThemeFont = {
  family: string;
  path: string;
  weight?: string;
  style?: string;
  display?: string;
};

export type WikiwikiSiteTheme = WikiwikiThemePalette & {
  project_name?: string;
  project_description?: string;
  logo_path?: string;
  wordmark_path?: string;
  favicon_path?: string;
  fonts?: WikiwikiThemeFont[];
  default_color_scheme?: WikiwikiColorScheme;
  modes?: {
    light?: WikiwikiThemePalette;
    dark?: WikiwikiThemePalette;
  };
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
  const result: WikiwikiSiteTheme = readThemePalette(theme, ".wikiwiki/site-theme.json");

  for (const key of siteThemeIdentityKeys) {
    const value = theme[key];
    if (value !== undefined) {
      if (typeof value !== "string") {
        throw new Error(`.wikiwiki/site-theme.json ${key} must be a string.`);
      }
      result[key] = value;
    }
  }

  for (const key of siteThemeAssetKeys) {
    const value = theme[key];
    if (value !== undefined) {
      if (typeof value !== "string") {
        throw new Error(`.wikiwiki/site-theme.json ${key} must be a string.`);
      }
      result[key] = value;
    }
  }

  if (theme.fonts !== undefined) {
    if (!Array.isArray(theme.fonts)) {
      throw new Error(".wikiwiki/site-theme.json fonts must be an array.");
    }
    const fonts: WikiwikiThemeFont[] = [];
    for (const [index, value] of theme.fonts.entries()) {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error(`.wikiwiki/site-theme.json fonts[${index}] must be an object.`);
      }
      const font = value as Record<string, unknown>;
      if (typeof font.family !== "string" || !font.family.trim()) {
        throw new Error(`.wikiwiki/site-theme.json fonts[${index}].family must be a non-empty string.`);
      }
      if (typeof font.path !== "string" || !font.path.trim()) {
        throw new Error(`.wikiwiki/site-theme.json fonts[${index}].path must be a non-empty string.`);
      }
      for (const key of ["weight", "style", "display"] as const) {
        if (font[key] !== undefined && typeof font[key] !== "string") {
          throw new Error(`.wikiwiki/site-theme.json fonts[${index}].${key} must be a string.`);
        }
      }
      fonts.push({
        family: font.family,
        path: font.path,
        ...(font.weight ? { weight: font.weight as string } : {}),
        ...(font.style ? { style: font.style as string } : {}),
        ...(font.display ? { display: font.display as string } : {})
      });
    }
    if (fonts.length > 0) {
      result.fonts = fonts;
    }
  }

  const defaultColorScheme = theme.default_color_scheme;
  if (defaultColorScheme !== undefined) {
    if (typeof defaultColorScheme !== "string" || !(wikiwikiColorSchemes as readonly string[]).includes(defaultColorScheme)) {
      throw new Error(`.wikiwiki/site-theme.json default_color_scheme must be one of: ${wikiwikiColorSchemes.join(", ")}.`);
    }
    result.default_color_scheme = defaultColorScheme as WikiwikiColorScheme;
  }

  if (theme.modes !== undefined) {
    if (!theme.modes || typeof theme.modes !== "object" || Array.isArray(theme.modes)) {
      throw new Error(".wikiwiki/site-theme.json modes must be an object.");
    }
    const modes = theme.modes as Record<string, unknown>;
    const resultModes: NonNullable<WikiwikiSiteTheme["modes"]> = {};
    for (const mode of ["light", "dark"] as const) {
      const value = modes[mode];
      if (value === undefined) {
        continue;
      }
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error(`.wikiwiki/site-theme.json modes.${mode} must be an object.`);
      }
      resultModes[mode] = readThemePalette(value as Record<string, unknown>, `.wikiwiki/site-theme.json modes.${mode}`);
    }
    if (Object.keys(resultModes).length > 0) {
      result.modes = resultModes;
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

const siteThemeIdentityKeys = [
  "project_name",
  "project_description"
] as const;

const siteThemeAssetKeys = [
  "logo_path",
  "wordmark_path",
  "favicon_path"
] as const;

export const siteThemePaletteKeys = [
  "accent",
  "accent_strong",
  "secondary",
  "bg",
  "panel",
  "panel_soft",
  "text",
  "muted",
  "border",
  "code_bg",
  "shadow",
  "shadow_strong",
  "radius",
  "font_family",
  "sidebar_bg",
  "hero_gradient",
  "card_gradient",
  "brand_gradient",
  "brand_mark_text",
  "badge_bg",
  "badge_text",
  "tag_bg",
  "tag_text",
  "success_bg",
  "success_text",
  "warning_bg",
  "warning_text",
  "focus_ring",
  "gloss"
] as const;

function readThemePalette(theme: Record<string, unknown>, context: string): WikiwikiThemePalette {
  const result: Record<string, string> = {};
  for (const key of siteThemePaletteKeys) {
    const value = theme[key];
    if (value !== undefined) {
      if (typeof value !== "string") {
        throw new Error(`${context} ${key} must be a string.`);
      }
      result[key] = value;
    }
  }

  return result as WikiwikiThemePalette;
}
