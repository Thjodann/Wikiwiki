import fs from "fs";
import path from "path";
import { siteThemePath, type WikiwikiSiteTheme, type WikiwikiThemeFont, type WikiwikiThemePalette } from "./config";
import { relativeReportPath } from "./paths";

export const themeMoods = ["calm", "vivid", "editorial", "utility", "playful", "dark"] as const;

export type ThemeMood = (typeof themeMoods)[number];

export type ThemeOptions = {
  mood?: string;
  projectName?: string;
  description?: string;
};

export type ThemePreviewResult = {
  ok: true;
  mode: "preview";
  theme_path: string;
  exists: boolean;
  mood: ThemeMood;
  style_sources: string[];
  asset_sources: string[];
  identity: ThemeIdentity;
  theme: WikiwikiSiteTheme;
};

export type ThemeWriteResult = Omit<ThemePreviewResult, "mode"> & {
  mode: "init";
  written: true;
  overwritten: boolean;
};

export type ThemeIdentity = {
  project_name: string;
  project_description: string;
  project_name_source: IdentitySource;
  project_description_source: IdentitySource;
};

export type IdentitySource = "option" | "readme" | "package" | "repo" | "default";

type PackageJson = {
  name?: unknown;
  description?: unknown;
};

const defaultDescription = "A project wiki generated from durable repo knowledge.";

type MoodTheme = {
  light: WikiwikiThemePalette;
  dark: WikiwikiThemePalette;
};

type StyleSource = {
  file: string;
  score: number;
  content: string;
};

type StyleColor = {
  hex: string;
  rgb: Rgb;
  count: number;
  score: number;
  contexts: string[];
};

type StyleInference = {
  sources: StyleSource[];
  colors: StyleColor[];
  accents: string[];
  darkSurface?: string;
  darkPanel?: string;
  darkText?: string;
  lightSurface?: string;
  lightPanel?: string;
  lightText?: string;
  defaultColorScheme?: "light" | "dark";
  radius?: string;
  fontFamily?: string;
  gradientAngle: string;
  hasGlow: boolean;
  hasGlass: boolean;
  hasShadow: boolean;
};

type ThemeAssets = {
  logoPath?: string;
  wordmarkPath?: string;
  faviconPath?: string;
  fonts: WikiwikiThemeFont[];
  sources: string[];
};

type ImageAssetKind = "logo" | "wordmark" | "favicon";

type ImageAssetCandidate = {
  kind: ImageAssetKind;
  file: string;
  score: number;
  explicit: boolean;
};

type FontAssetCandidate = {
  file: string;
  score: number;
  font: WikiwikiThemeFont;
};

type Rgb = {
  r: number;
  g: number;
  b: number;
};

const moodThemes: Record<ThemeMood, MoodTheme> = {
  calm: {
    light: {
      accent: "#2f7d6d",
      accent_strong: "#185143",
      secondary: "#7a6f42",
      bg: "#f4faf6",
      panel: "#fbfdf8",
      panel_soft: "#eaf5ef",
      text: "#1f2a24",
      muted: "#5d6d64",
      border: "#d1e5da",
      code_bg: "#eaf4ee",
      shadow: "0 18px 45px rgba(30, 55, 47, 0.08)",
      shadow_strong: "0 24px 70px rgba(30, 55, 47, 0.14)",
      radius: "8px",
      font_family: "Inter, ui-sans-serif, system-ui, sans-serif",
      sidebar_bg: "linear-gradient(180deg, rgba(251, 253, 248, 0.94), rgba(234, 245, 239, 0.88))",
      hero_gradient: "linear-gradient(135deg, #fbfdf8 0%, #e7f4ed 100%)",
      card_gradient: "linear-gradient(180deg, #fbfdf8 0%, #f2faf5 100%)",
      brand_gradient: "linear-gradient(135deg, #2f7d6d, #185143)",
      brand_mark_text: "#fffaf0",
      badge_bg: "#dff0e8",
      badge_text: "#185143",
      tag_bg: "#f1edd8",
      tag_text: "#605526",
      success_bg: "#e4f3df",
      success_text: "#2d5c1f",
      warning_bg: "#f6ead9",
      warning_text: "#754716",
      focus_ring: "rgba(47, 125, 109, 0.2)",
      gloss: "rgba(47, 125, 109, 0.13)"
    },
    dark: {
      accent: "#74d4bd",
      accent_strong: "#b5f0dd",
      secondary: "#d8c985",
      bg: "#101b18",
      panel: "#162620",
      panel_soft: "#20342c",
      text: "#f4f1e8",
      muted: "#c6d1cb",
      border: "#315044",
      code_bg: "#0c1512",
      shadow: "0 22px 60px rgba(5, 12, 10, 0.36)",
      shadow_strong: "0 30px 90px rgba(5, 12, 10, 0.5)",
      radius: "8px",
      font_family: "Inter, ui-sans-serif, system-ui, sans-serif",
      sidebar_bg: "linear-gradient(180deg, rgba(22, 38, 32, 0.95), rgba(13, 24, 20, 0.9))",
      hero_gradient: "linear-gradient(135deg, #1b3129 0%, #0d1714 100%)",
      card_gradient: "linear-gradient(180deg, #182a24 0%, #111d19 100%)",
      brand_gradient: "linear-gradient(135deg, #74d4bd, #2f7d6d)",
      brand_mark_text: "#0f1a17",
      badge_bg: "rgba(116, 212, 189, 0.17)",
      badge_text: "#d9fff3",
      tag_bg: "rgba(216, 201, 133, 0.18)",
      tag_text: "#f4e6a6",
      success_bg: "rgba(134, 239, 172, 0.16)",
      success_text: "#bbf7d0",
      warning_bg: "rgba(253, 186, 116, 0.16)",
      warning_text: "#fed7aa",
      focus_ring: "rgba(116, 212, 189, 0.28)",
      gloss: "rgba(116, 212, 189, 0.16)"
    }
  },
  vivid: {
    light: {
      accent: "#d9467d",
      accent_strong: "#8f1d4b",
      secondary: "#6d5dfc",
      bg: "#fff6fa",
      panel: "#fffafd",
      panel_soft: "#fde7f0",
      text: "#2b1f28",
      muted: "#76596a",
      border: "#f1bfd2",
      code_bg: "#fdebf3",
      shadow: "0 18px 45px rgba(78, 25, 54, 0.1)",
      shadow_strong: "0 28px 75px rgba(78, 25, 54, 0.17)",
      radius: "8px",
      font_family: "Inter, ui-sans-serif, system-ui, sans-serif",
      sidebar_bg: "linear-gradient(180deg, rgba(255, 250, 253, 0.94), rgba(253, 231, 240, 0.88))",
      hero_gradient: "linear-gradient(135deg, #fffafd 0%, #fde5ef 52%, #eee8ff 100%)",
      card_gradient: "linear-gradient(180deg, #fffafd 0%, #fff3f8 100%)",
      brand_gradient: "linear-gradient(135deg, #d9467d, #6d5dfc)",
      brand_mark_text: "#fffaf0",
      badge_bg: "#f9dce8",
      badge_text: "#8f1d4b",
      tag_bg: "#ece8ff",
      tag_text: "#4236a3",
      success_bg: "#e7f3df",
      success_text: "#2d5c1f",
      warning_bg: "#f8e2d2",
      warning_text: "#7d3414",
      focus_ring: "rgba(217, 70, 125, 0.22)",
      gloss: "rgba(217, 70, 125, 0.15)"
    },
    dark: {
      accent: "#fb7aad",
      accent_strong: "#f9a8d4",
      secondary: "#a99cff",
      bg: "#21111a",
      panel: "#2c1724",
      panel_soft: "#3a2030",
      text: "#fff0f7",
      muted: "#e8c8d8",
      border: "#593147",
      code_bg: "#170c12",
      shadow: "0 22px 60px rgba(13, 4, 9, 0.38)",
      shadow_strong: "0 30px 90px rgba(13, 4, 9, 0.52)",
      radius: "8px",
      font_family: "Inter, ui-sans-serif, system-ui, sans-serif",
      sidebar_bg: "linear-gradient(180deg, rgba(44, 23, 36, 0.95), rgba(28, 13, 22, 0.9))",
      hero_gradient: "linear-gradient(135deg, #3b1d30 0%, #20101a 55%, #191331 100%)",
      card_gradient: "linear-gradient(180deg, #2f1928 0%, #24131d 100%)",
      brand_gradient: "linear-gradient(135deg, #fb7aad, #8b5cf6)",
      brand_mark_text: "#201018",
      badge_bg: "rgba(251, 122, 173, 0.18)",
      badge_text: "#ffd7e8",
      tag_bg: "rgba(169, 156, 255, 0.2)",
      tag_text: "#ddd6fe",
      success_bg: "rgba(134, 239, 172, 0.16)",
      success_text: "#bbf7d0",
      warning_bg: "rgba(253, 186, 116, 0.16)",
      warning_text: "#fed7aa",
      focus_ring: "rgba(251, 122, 173, 0.3)",
      gloss: "rgba(251, 122, 173, 0.18)"
    }
  },
  editorial: {
    light: {
      accent: "#8a5a2b",
      accent_strong: "#5b3718",
      secondary: "#4f6f82",
      bg: "#faf7f0",
      panel: "#fdfaf4",
      panel_soft: "#f1eadf",
      text: "#292520",
      muted: "#6b6257",
      border: "#dfd4c6",
      code_bg: "#f2eadf",
      shadow: "0 16px 42px rgba(61, 45, 31, 0.09)",
      shadow_strong: "0 24px 70px rgba(61, 45, 31, 0.15)",
      radius: "6px",
      font_family: "Charter, Georgia, serif",
      sidebar_bg: "linear-gradient(180deg, rgba(253, 250, 244, 0.94), rgba(241, 234, 223, 0.88))",
      hero_gradient: "linear-gradient(135deg, #fdfaf4 0%, #efe3d2 100%)",
      card_gradient: "linear-gradient(180deg, #fdfaf4 0%, #f8f1e7 100%)",
      brand_gradient: "linear-gradient(135deg, #8a5a2b, #4f6f82)",
      brand_mark_text: "#fff7e8",
      badge_bg: "#efe1d0",
      badge_text: "#5b3718",
      tag_bg: "#e3edf1",
      tag_text: "#2d566a",
      success_bg: "#e7f0dc",
      success_text: "#2f5e1f",
      warning_bg: "#f4e3d2",
      warning_text: "#7a3c1d",
      focus_ring: "rgba(138, 90, 43, 0.22)",
      gloss: "rgba(138, 90, 43, 0.12)"
    },
    dark: {
      accent: "#d2a063",
      accent_strong: "#f0d4a8",
      secondary: "#9ac5d8",
      bg: "#1d1915",
      panel: "#292219",
      panel_soft: "#352c21",
      text: "#f4ecdf",
      muted: "#d3c5b4",
      border: "#554638",
      code_bg: "#15120f",
      shadow: "0 22px 60px rgba(11, 8, 5, 0.36)",
      shadow_strong: "0 30px 90px rgba(11, 8, 5, 0.5)",
      radius: "6px",
      font_family: "Charter, Georgia, serif",
      sidebar_bg: "linear-gradient(180deg, rgba(41, 34, 25, 0.95), rgba(26, 22, 18, 0.9))",
      hero_gradient: "linear-gradient(135deg, #352719 0%, #1b1713 100%)",
      card_gradient: "linear-gradient(180deg, #2b241b 0%, #211c16 100%)",
      brand_gradient: "linear-gradient(135deg, #d2a063, #7899aa)",
      brand_mark_text: "#20170d",
      badge_bg: "rgba(210, 160, 99, 0.18)",
      badge_text: "#ffe2b8",
      tag_bg: "rgba(154, 197, 216, 0.17)",
      tag_text: "#cae7f3",
      success_bg: "rgba(134, 239, 172, 0.16)",
      success_text: "#bbf7d0",
      warning_bg: "rgba(253, 186, 116, 0.16)",
      warning_text: "#fed7aa",
      focus_ring: "rgba(210, 160, 99, 0.28)",
      gloss: "rgba(210, 160, 99, 0.15)"
    }
  },
  utility: {
    light: {
      accent: "#2563eb",
      accent_strong: "#1e3a8a",
      secondary: "#0f766e",
      bg: "#f6f9fc",
      panel: "#fbfdff",
      panel_soft: "#eaf1f8",
      text: "#1f2937",
      muted: "#5f6b7a",
      border: "#d3dce8",
      code_bg: "#eaf1f8",
      shadow: "0 18px 45px rgba(30, 58, 138, 0.08)",
      shadow_strong: "0 24px 70px rgba(30, 58, 138, 0.14)",
      radius: "6px",
      font_family: "Inter, ui-sans-serif, system-ui, sans-serif",
      sidebar_bg: "linear-gradient(180deg, rgba(251, 253, 255, 0.94), rgba(234, 241, 248, 0.88))",
      hero_gradient: "linear-gradient(135deg, #fbfdff 0%, #e8f0ff 100%)",
      card_gradient: "linear-gradient(180deg, #fbfdff 0%, #f3f7fb 100%)",
      brand_gradient: "linear-gradient(135deg, #2563eb, #0f766e)",
      brand_mark_text: "#f8fbff",
      badge_bg: "#dfeafe",
      badge_text: "#1e3a8a",
      tag_bg: "#dff4f1",
      tag_text: "#0f5a53",
      success_bg: "#e4f3df",
      success_text: "#2d5c1f",
      warning_bg: "#f6ead9",
      warning_text: "#754716",
      focus_ring: "rgba(37, 99, 235, 0.2)",
      gloss: "rgba(37, 99, 235, 0.13)"
    },
    dark: {
      accent: "#7db1ff",
      accent_strong: "#bfdbfe",
      secondary: "#5eead4",
      bg: "#0f1724",
      panel: "#172131",
      panel_soft: "#202d42",
      text: "#eef5ff",
      muted: "#c4cfdd",
      border: "#33455f",
      code_bg: "#0a111d",
      shadow: "0 22px 60px rgba(4, 8, 16, 0.36)",
      shadow_strong: "0 30px 90px rgba(4, 8, 16, 0.5)",
      radius: "6px",
      font_family: "Inter, ui-sans-serif, system-ui, sans-serif",
      sidebar_bg: "linear-gradient(180deg, rgba(23, 33, 49, 0.95), rgba(12, 19, 31, 0.9))",
      hero_gradient: "linear-gradient(135deg, #1d2b45 0%, #0d1421 100%)",
      card_gradient: "linear-gradient(180deg, #192538 0%, #111a29 100%)",
      brand_gradient: "linear-gradient(135deg, #7db1ff, #2dd4bf)",
      brand_mark_text: "#0b1220",
      badge_bg: "rgba(125, 177, 255, 0.17)",
      badge_text: "#dbeafe",
      tag_bg: "rgba(94, 234, 212, 0.17)",
      tag_text: "#ccfbf1",
      success_bg: "rgba(134, 239, 172, 0.16)",
      success_text: "#bbf7d0",
      warning_bg: "rgba(253, 186, 116, 0.16)",
      warning_text: "#fed7aa",
      focus_ring: "rgba(125, 177, 255, 0.28)",
      gloss: "rgba(125, 177, 255, 0.16)"
    }
  },
  playful: {
    light: {
      accent: "#f97316",
      accent_strong: "#9a3412",
      secondary: "#0ea5e9",
      bg: "#fff8ec",
      panel: "#fffbf4",
      panel_soft: "#ffe9c7",
      text: "#2c241d",
      muted: "#735b47",
      border: "#f7c98f",
      code_bg: "#fff0da",
      shadow: "0 18px 45px rgba(120, 54, 12, 0.1)",
      shadow_strong: "0 28px 75px rgba(120, 54, 12, 0.17)",
      radius: "8px",
      font_family: "Nunito, Inter, ui-sans-serif, system-ui, sans-serif",
      sidebar_bg: "linear-gradient(180deg, rgba(255, 251, 244, 0.94), rgba(255, 233, 199, 0.88))",
      hero_gradient: "linear-gradient(135deg, #fffbf4 0%, #ffe6bc 58%, #e0f2fe 100%)",
      card_gradient: "linear-gradient(180deg, #fffbf4 0%, #fff3e2 100%)",
      brand_gradient: "linear-gradient(135deg, #f97316, #0ea5e9)",
      brand_mark_text: "#fffaf0",
      badge_bg: "#ffe2bd",
      badge_text: "#9a3412",
      tag_bg: "#dff2ff",
      tag_text: "#075985",
      success_bg: "#e7f3df",
      success_text: "#2d5c1f",
      warning_bg: "#fde2c8",
      warning_text: "#7d3414",
      focus_ring: "rgba(249, 115, 22, 0.22)",
      gloss: "rgba(249, 115, 22, 0.15)"
    },
    dark: {
      accent: "#ffb36b",
      accent_strong: "#fed7aa",
      secondary: "#7dd3fc",
      bg: "#24180f",
      panel: "#302116",
      panel_soft: "#402d1e",
      text: "#fff1e3",
      muted: "#e6cbb2",
      border: "#5a3f29",
      code_bg: "#170f09",
      shadow: "0 22px 60px rgba(13, 6, 2, 0.38)",
      shadow_strong: "0 30px 90px rgba(13, 6, 2, 0.52)",
      radius: "8px",
      font_family: "Nunito, Inter, ui-sans-serif, system-ui, sans-serif",
      sidebar_bg: "linear-gradient(180deg, rgba(48, 33, 22, 0.95), rgba(30, 19, 12, 0.9))",
      hero_gradient: "linear-gradient(135deg, #422a17 0%, #21150d 58%, #0d2536 100%)",
      card_gradient: "linear-gradient(180deg, #332318 0%, #26190f 100%)",
      brand_gradient: "linear-gradient(135deg, #ffb36b, #38bdf8)",
      brand_mark_text: "#1f1309",
      badge_bg: "rgba(255, 179, 107, 0.18)",
      badge_text: "#ffedd5",
      tag_bg: "rgba(125, 211, 252, 0.18)",
      tag_text: "#d8f3ff",
      success_bg: "rgba(134, 239, 172, 0.16)",
      success_text: "#bbf7d0",
      warning_bg: "rgba(253, 186, 116, 0.18)",
      warning_text: "#fed7aa",
      focus_ring: "rgba(255, 179, 107, 0.3)",
      gloss: "rgba(255, 179, 107, 0.18)"
    }
  },
  dark: {
    light: {
      accent: "#2563eb",
      accent_strong: "#172554",
      secondary: "#64748b",
      bg: "#f3f6fb",
      panel: "#fbfcff",
      panel_soft: "#e7edf7",
      text: "#172033",
      muted: "#5f6b7a",
      border: "#cfd9e8",
      code_bg: "#e7edf7",
      shadow: "0 18px 45px rgba(15, 23, 42, 0.1)",
      shadow_strong: "0 28px 75px rgba(15, 23, 42, 0.17)",
      radius: "8px",
      font_family: "Inter, ui-sans-serif, system-ui, sans-serif",
      sidebar_bg: "linear-gradient(180deg, rgba(251, 252, 255, 0.94), rgba(231, 237, 247, 0.88))",
      hero_gradient: "linear-gradient(135deg, #fbfcff 0%, #e2eaf8 100%)",
      card_gradient: "linear-gradient(180deg, #fbfcff 0%, #f0f4fa 100%)",
      brand_gradient: "linear-gradient(135deg, #2563eb, #172554)",
      brand_mark_text: "#f8fbff",
      badge_bg: "#dce7fa",
      badge_text: "#172554",
      tag_bg: "#e5eaf2",
      tag_text: "#334155",
      success_bg: "#e3f2df",
      success_text: "#2d5c1f",
      warning_bg: "#f5e4d6",
      warning_text: "#7a3c1d",
      focus_ring: "rgba(37, 99, 235, 0.22)",
      gloss: "rgba(37, 99, 235, 0.13)"
    },
    dark: {
      accent: "#38bdf8",
      accent_strong: "#bae6fd",
      secondary: "#a78bfa",
      bg: "#0f172a",
      panel: "#151f33",
      panel_soft: "#202b42",
      text: "#f8fafc",
      muted: "#cbd5e1",
      border: "#334155",
      code_bg: "#0b1220",
      shadow: "0 22px 60px rgba(4, 8, 16, 0.38)",
      shadow_strong: "0 30px 90px rgba(4, 8, 16, 0.54)",
      radius: "8px",
      font_family: "Inter, ui-sans-serif, system-ui, sans-serif",
      sidebar_bg: "linear-gradient(180deg, rgba(21, 31, 51, 0.95), rgba(12, 18, 32, 0.9))",
      hero_gradient: "linear-gradient(135deg, #1d2b48 0%, #0c1220 100%)",
      card_gradient: "linear-gradient(180deg, #172237 0%, #101827 100%)",
      brand_gradient: "linear-gradient(135deg, #38bdf8, #8b5cf6)",
      brand_mark_text: "#07111f",
      badge_bg: "rgba(56, 189, 248, 0.17)",
      badge_text: "#e0f2fe",
      tag_bg: "rgba(167, 139, 250, 0.18)",
      tag_text: "#ede9fe",
      success_bg: "rgba(134, 239, 172, 0.16)",
      success_text: "#bbf7d0",
      warning_bg: "rgba(253, 186, 116, 0.16)",
      warning_text: "#fed7aa",
      focus_ring: "rgba(56, 189, 248, 0.3)",
      gloss: "rgba(56, 189, 248, 0.18)"
    }
  }
};

export function previewTheme(root: string, options: ThemeOptions = {}): ThemePreviewResult {
  const style = inferProjectStyle(root);
  const assets = inferProjectAssets(root);
  const identity = inferThemeIdentity(root, options);
  const mood = resolveThemeMood(root, identity, options.mood, style);
  const theme = applyProjectFonts(applyProjectStyle(moodThemes[mood], style), assets.fonts);
  return {
    ok: true,
    mode: "preview",
    theme_path: relativeReportPath(root, siteThemePath(root)),
    exists: fs.existsSync(siteThemePath(root)),
    mood,
    style_sources: style.sources.map((source) => relativeReportPath(root, source.file)),
    asset_sources: assets.sources,
    identity,
    theme: {
      project_name: identity.project_name,
      project_description: identity.project_description,
      ...(assets.logoPath ? { logo_path: assets.logoPath } : {}),
      ...(assets.wordmarkPath ? { wordmark_path: assets.wordmarkPath } : {}),
      ...(assets.faviconPath ? { favicon_path: assets.faviconPath } : {}),
      ...(assets.fonts.length > 0 ? { fonts: assets.fonts } : {}),
      default_color_scheme: style.defaultColorScheme ?? "auto",
      ...theme.light,
      modes: {
        light: theme.light,
        dark: theme.dark
      }
    }
  };
}

export function writeTheme(root: string, options: ThemeOptions & { force?: boolean } = {}): ThemeWriteResult {
  const preview = previewTheme(root, options);
  const file = siteThemePath(root);
  const exists = fs.existsSync(file);
  if (exists && options.force !== true) {
    throw new Error(`Theme already exists at ${preview.theme_path}. Pass --force to overwrite it.`);
  }

  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(preview.theme, null, 2)}\n`, "utf8");

  return {
    ...preview,
    mode: "init",
    exists: true,
    written: true,
    overwritten: exists
  };
}

export function parseThemeMood(value: string | undefined): ThemeMood | undefined {
  if (!value) {
    return undefined;
  }

  if ((themeMoods as readonly string[]).includes(value)) {
    return value as ThemeMood;
  }

  throw new Error(`Unknown theme mood: ${value}. Expected one of: ${themeMoods.join(", ")}.`);
}

function inferThemeIdentity(root: string, options: ThemeOptions): ThemeIdentity {
  const packageJson = readPackageJson(root);
  const readme = readReadme(root);
  const readmeTitle = readme ? readmeH1(readme) : undefined;
  const readmeDescription = readme ? firstUsefulReadmeParagraph(readme) : undefined;
  const packageName = packageJson?.name && typeof packageJson.name === "string"
    ? prettyPackageName(packageJson.name)
    : undefined;
  const packageDescription = packageJson?.description && typeof packageJson.description === "string"
    ? plainText(packageJson.description)
    : undefined;
  const optionName = plainText(options.projectName);
  const optionDescription = plainText(options.description);
  const fallbackName = prettyPackageName(path.basename(root));

  return {
    project_name: optionName || readmeTitle || packageName || fallbackName,
    project_description: optionDescription || packageDescription || readmeDescription || defaultDescription,
    project_name_source: optionName ? "option" : readmeTitle ? "readme" : packageName ? "package" : "repo",
    project_description_source: optionDescription ? "option" : packageDescription ? "package" : readmeDescription ? "readme" : "default"
  };
}

function resolveThemeMood(root: string, identity: ThemeIdentity, moodOption: string | undefined, style: StyleInference): ThemeMood {
  const parsedMood = parseThemeMood(moodOption);
  if (parsedMood) {
    return parsedMood;
  }

  const readme = readReadme(root) ?? "";
  const packageJson = readPackageJson(root);
  const styleText = style.sources.map((source) => source.content.slice(0, 12000)).join(" ");
  const text = [
    identity.project_name,
    identity.project_description,
    readme,
    styleText,
    typeof packageJson?.description === "string" ? packageJson.description : "",
    typeof packageJson?.name === "string" ? packageJson.name : ""
  ].join(" ").toLowerCase();
  const scored = themeMoods.map((mood) => ({
    mood,
    score: moodKeywords[mood].reduce((score, keyword) => score + countKeyword(text, keyword), 0)
  }));
  scored.sort((a, b) => b.score - a.score || themeMoods.indexOf(a.mood) - themeMoods.indexOf(b.mood));
  if (scored[0].score > 0) {
    return scored[0].mood;
  }

  if (style.accents.length >= 3) {
    return "vivid";
  }

  if (style.defaultColorScheme === "dark") {
    return "dark";
  }

  return themeMoods[stableHash(identity.project_name) % themeMoods.length];
}

function inferProjectStyle(root: string): StyleInference {
  const sources = findStyleSources(root);
  const colors = extractStyleColors(sources);
  const accents = accentColors(colors);
  const darkSurface = surfaceColor(colors, "dark", ["bg", "background", "body", "shell", "app"]);
  const darkPanel = surfaceColor(colors, "dark", ["panel", "card", "surface", "glass"]);
  const lightSurface = surfaceColor(colors, "light", ["bg", "background", "body", "shell", "app"]);
  const lightPanel = surfaceColor(colors, "light", ["panel", "card", "surface", "glass"]);
  const darkText = textColor(colors, "dark");
  const lightText = textColor(colors, "light");
  const combined = sources.map((source) => source.content).join("\n").toLowerCase();
  const darkSignals = [
    /color-scheme\s*:\s*dark/.test(combined),
    /data-theme=["']dark/.test(combined),
    /prefers-color-scheme\s*:\s*dark/.test(combined),
    Boolean(darkSurface),
    colors.filter((color) => relativeLuminance(color.rgb) < 0.18).length > colors.filter((color) => relativeLuminance(color.rgb) > 0.82).length
  ].filter(Boolean).length;
  const lightSignals = [
    /color-scheme\s*:\s*light/.test(combined),
    /data-theme=["']light/.test(combined),
    Boolean(lightSurface)
  ].filter(Boolean).length;

  return {
    sources,
    colors,
    accents,
    darkSurface,
    darkPanel,
    darkText,
    lightSurface,
    lightPanel,
    lightText,
    defaultColorScheme: darkSignals > lightSignals ? "dark" : lightSignals > darkSignals ? "light" : undefined,
    radius: inferRadius(sources),
    fontFamily: inferFontFamily(sources),
    gradientAngle: inferGradientAngle(sources),
    hasGlow: /radial-gradient|glow|blur\(/i.test(combined),
    hasGlass: /backdrop-filter|glass|rgba\([^)]*,\s*0\.\d+\)/i.test(combined),
    hasShadow: /box-shadow|shadow/i.test(combined)
  };
}

function applyProjectStyle(base: MoodTheme, style: StyleInference): MoodTheme {
  if (style.sources.length === 0 || (style.accents.length === 0 && !style.darkSurface && !style.lightSurface)) {
    return {
      light: { ...base.light },
      dark: { ...base.dark }
    };
  }

  const accents = style.accents.length > 0
    ? style.accents
    : [base.light.accent ?? base.dark.accent ?? "#2563eb"];
  const primary = accents[0];
  const secondary = accents[1] ?? base.light.secondary ?? base.dark.secondary ?? primary;
  const tertiary = accents[2] ?? base.dark.secondary ?? secondary;
  const primaryRgb = parseHexColor(primary) ?? { r: 37, g: 99, b: 235 };
  const secondaryRgb = parseHexColor(secondary) ?? primaryRgb;
  const tertiaryRgb = parseHexColor(tertiary) ?? secondaryRgb;
  const lightBgRgb = parseHexColor(style.lightSurface) ?? mixRgb(primaryRgb, { r: 255, g: 250, b: 244 }, 0.06);
  const lightPanelRgb = parseHexColor(style.lightPanel) ?? mixRgb(primaryRgb, { r: 255, g: 253, b: 248 }, 0.04);
  const darkBgRgb = parseHexColor(style.darkSurface) ?? mixRgb(primaryRgb, { r: 15, g: 12, b: 14 }, 0.12);
  const darkPanelRgb = parseHexColor(style.darkPanel) ?? mixRgb(primaryRgb, { r: 25, g: 20, b: 24 }, 0.14);
  const darkAccent = colorToHex(readableAccentFor(primaryRgb, darkPanelRgb, "dark"));
  const lightAccent = colorToHex(readableAccentFor(primaryRgb, lightPanelRgb, "light"));
  const darkSecondary = colorToHex(readableAccentFor(secondaryRgb, darkPanelRgb, "dark"));
  const lightSecondary = colorToHex(readableAccentFor(secondaryRgb, lightPanelRgb, "light"));
  const lightAccentStrong = colorToHex(readableAccentFor(mixRgb(primaryRgb, { r: 17, g: 24, b: 39 }, 0.62), lightPanelRgb, "light"));
  const darkAccentStrong = colorToHex(readableAccentFor(mixRgb(primaryRgb, { r: 255, g: 255, b: 255 }, 0.5), darkPanelRgb, "dark"));
  const lightText = style.defaultColorScheme === "light" ? style.lightText : undefined;
  const darkText = style.defaultColorScheme === "dark" ? style.darkText : undefined;
  const radius = style.radius ?? base.light.radius ?? base.dark.radius ?? "8px";
  const fontFamily = style.fontFamily ?? base.light.font_family ?? base.dark.font_family;
  const angle = style.gradientAngle;
  const brandGradient = gradientFromAccents(angle, accents);
  const lightBadgeBg = colorToHex(mixRgb(primaryRgb, lightPanelRgb, 0.16));
  const darkBadgeBg = colorToHex(mixRgb(primaryRgb, darkPanelRgb, 0.28));
  const lightTagBg = colorToHex(mixRgb(secondaryRgb, lightPanelRgb, 0.15));
  const darkTagBg = colorToHex(mixRgb(secondaryRgb, darkPanelRgb, 0.26));

  return {
    light: {
      ...base.light,
      accent: lightAccent,
      accent_strong: lightAccentStrong,
      secondary: lightSecondary,
      bg: colorToHex(lightBgRgb),
      panel: colorToHex(lightPanelRgb),
      panel_soft: colorToHex(mixRgb(tertiaryRgb, lightPanelRgb, 0.1)),
      text: lightText ?? readableTextFor(lightPanelRgb),
      muted: colorToHex(mixRgb(parseHexColor(lightText) ?? { r: 31, g: 41, b: 55 }, lightPanelRgb, 0.65)),
      border: colorToHex(mixRgb(primaryRgb, lightPanelRgb, 0.22)),
      code_bg: colorToHex(mixRgb(tertiaryRgb, lightPanelRgb, 0.08)),
      shadow: style.hasShadow ? `0 24px 70px ${rgba(mixRgb(primaryRgb, { r: 17, g: 24, b: 39 }, 0.38), 0.14)}` : base.light.shadow,
      shadow_strong: style.hasShadow ? `0 32px 100px ${rgba(mixRgb(primaryRgb, { r: 17, g: 24, b: 39 }, 0.4), 0.22)}` : base.light.shadow_strong,
      radius,
      font_family: fontFamily,
      sidebar_bg: `linear-gradient(180deg, ${rgba(lightPanelRgb, 0.95)}, ${rgba(mixRgb(primaryRgb, lightBgRgb, 0.08), 0.9)})`,
      hero_gradient: style.hasGlow
        ? `radial-gradient(circle at top left, ${rgba(primaryRgb, 0.18)}, transparent 34%), linear-gradient(${angle}, ${colorToHex(lightPanelRgb)} 0%, ${colorToHex(mixRgb(secondaryRgb, lightBgRgb, 0.12))} 100%)`
        : `linear-gradient(${angle}, ${colorToHex(lightPanelRgb)} 0%, ${colorToHex(mixRgb(primaryRgb, lightBgRgb, 0.14))} 100%)`,
      card_gradient: style.hasGlass
        ? `linear-gradient(180deg, ${rgba(lightPanelRgb, 0.92)} 0%, ${rgba(mixRgb(primaryRgb, lightPanelRgb, 0.07), 0.82)} 100%)`
        : `linear-gradient(180deg, ${colorToHex(lightPanelRgb)} 0%, ${colorToHex(mixRgb(primaryRgb, lightPanelRgb, 0.05))} 100%)`,
      brand_gradient: brandGradient,
      brand_mark_text: readableTextFor(primaryRgb),
      badge_bg: lightBadgeBg,
      badge_text: readableTextForPair(lightBadgeBg, lightAccentStrong),
      tag_bg: lightTagBg,
      tag_text: readableTextForPair(lightTagBg, lightSecondary),
      focus_ring: rgba(primaryRgb, 0.22),
      gloss: rgba(primaryRgb, style.hasGlass ? 0.2 : 0.14)
    },
    dark: {
      ...base.dark,
      accent: darkAccent,
      accent_strong: darkAccentStrong,
      secondary: darkSecondary,
      bg: colorToHex(darkBgRgb),
      panel: colorToHex(darkPanelRgb),
      panel_soft: colorToHex(mixRgb(tertiaryRgb, darkPanelRgb, 0.12)),
      text: darkText ?? readableTextFor(darkPanelRgb),
      muted: colorToHex(mixRgb(parseHexColor(darkText) ?? { r: 248, g: 250, b: 252 }, darkPanelRgb, 0.7)),
      border: colorToHex(mixRgb(primaryRgb, darkPanelRgb, 0.26)),
      code_bg: colorToHex(mixRgb(darkBgRgb, { r: 0, g: 0, b: 0 }, 0.76)),
      shadow: `0 24px 80px ${rgba({ r: 0, g: 0, b: 0 }, style.hasShadow ? 0.38 : 0.3)}`,
      shadow_strong: `0 36px 120px ${rgba({ r: 0, g: 0, b: 0 }, style.hasShadow ? 0.55 : 0.45)}`,
      radius,
      font_family: fontFamily,
      sidebar_bg: `linear-gradient(180deg, ${rgba(darkPanelRgb, 0.95)}, ${rgba(darkBgRgb, 0.92)})`,
      hero_gradient: style.hasGlow
        ? `radial-gradient(circle at top left, ${rgba(primaryRgb, 0.3)}, transparent 34%), linear-gradient(${angle}, ${colorToHex(mixRgb(primaryRgb, darkPanelRgb, 0.16))} 0%, ${colorToHex(darkBgRgb)} 100%)`
        : `linear-gradient(${angle}, ${colorToHex(mixRgb(primaryRgb, darkPanelRgb, 0.14))} 0%, ${colorToHex(darkBgRgb)} 100%)`,
      card_gradient: style.hasGlass
        ? `linear-gradient(180deg, ${rgba(mixRgb(primaryRgb, darkPanelRgb, 0.08), 0.86)} 0%, ${rgba(darkPanelRgb, 0.72)} 100%)`
        : `linear-gradient(180deg, ${colorToHex(mixRgb(primaryRgb, darkPanelRgb, 0.08))} 0%, ${colorToHex(darkPanelRgb)} 100%)`,
      brand_gradient: brandGradient,
      brand_mark_text: readableTextFor(primaryRgb),
      badge_bg: darkBadgeBg,
      badge_text: readableTextForPair(darkBadgeBg, darkAccentStrong),
      tag_bg: darkTagBg,
      tag_text: readableTextForPair(darkTagBg, darkSecondary),
      focus_ring: rgba(primaryRgb, 0.32),
      gloss: rgba(primaryRgb, style.hasGlass ? 0.24 : 0.18)
    }
  };
}

function applyProjectFonts(theme: MoodTheme, fonts: WikiwikiThemeFont[]): MoodTheme {
  if (fonts.length === 0) {
    return theme;
  }

  const family = fonts[0].family.trim();
  if (!family) {
    return theme;
  }

  return {
    light: {
      ...theme.light,
      font_family: fontStack(family, theme.light.font_family)
    },
    dark: {
      ...theme.dark,
      font_family: fontStack(family, theme.dark.font_family)
    }
  };
}

function fontStack(family: string, fallback: string | undefined): string {
  const base = fallback?.trim() || "Inter, ui-sans-serif, system-ui, sans-serif";
  if (base.toLowerCase().includes(family.toLowerCase())) {
    return base;
  }

  return `"${family.replace(/"/g, "")}", ${base}`;
}

function inferProjectAssets(root: string): ThemeAssets {
  const imageCandidates = findImageAssetCandidates(root);
  const favicon = bestImageCandidate(imageCandidates, "favicon");
  const explicitWordmark = bestImageCandidate(imageCandidates.filter((candidate) => candidate.explicit), "wordmark");
  const wordmark = explicitWordmark ?? bestImageCandidate(imageCandidates, "wordmark");
  const logo = bestImageCandidate(
    imageCandidates.filter((candidate) => candidate.file !== wordmark?.file || candidate.explicit),
    "logo"
  ) ?? bestImageCandidate(imageCandidates, "logo");
  const fonts = findFontAssetCandidates(root);
  const sources = [
    logo?.file,
    wordmark?.file,
    favicon?.file,
    ...fonts.map((font) => font.file)
  ]
    .filter((file): file is string => Boolean(file))
    .map((file) => relativeReportPath(root, file));

  return {
    ...(logo ? { logoPath: relativeReportPath(root, logo.file) } : {}),
    ...(wordmark ? { wordmarkPath: relativeReportPath(root, wordmark.file) } : {}),
    ...(favicon ? { faviconPath: relativeReportPath(root, favicon.file) } : {}),
    fonts: fonts.map((font) => font.font),
    sources: [...new Set(sources)]
  };
}

function findImageAssetCandidates(root: string): ImageAssetCandidate[] {
  const files = findAssetFiles(root, imageAssetFileScore);
  return files.flatMap((file) => imageAssetCandidatesFor(root, file));
}

function imageAssetCandidatesFor(root: string, file: string): ImageAssetCandidate[] {
  const relative = relativeReportPath(root, file);
  return (["favicon", "wordmark", "logo"] as const)
    .map((kind) => {
      const score = imageAssetScore(relative, kind);
      return score > 0
        ? { kind, file, score, explicit: explicitImageAsset(relative, kind) }
        : undefined;
    })
    .filter((candidate): candidate is ImageAssetCandidate => candidate !== undefined);
}

function bestImageCandidate(candidates: ImageAssetCandidate[], kind: ImageAssetKind): ImageAssetCandidate | undefined {
  return candidates
    .filter((candidate) => candidate.kind === kind)
    .sort((a, b) => b.score - a.score || a.file.localeCompare(b.file))[0];
}

function findFontAssetCandidates(root: string): FontAssetCandidate[] {
  const seen = new Set<string>();
  return findAssetFiles(root, fontAssetFileScore)
    .map((file) => fontAssetCandidate(root, file))
    .filter((candidate): candidate is FontAssetCandidate => candidate !== undefined)
    .filter((candidate) => {
      const key = `${candidate.font.family}:${candidate.font.weight ?? ""}:${candidate.font.style ?? ""}:${candidate.font.path}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.score - a.score || a.font.family.localeCompare(b.font.family) || a.file.localeCompare(b.file))
    .slice(0, 8);
}

function fontAssetCandidate(root: string, file: string): FontAssetCandidate | undefined {
  const relative = relativeReportPath(root, file);
  const score = fontAssetFileScore(relative);
  if (score <= 0) {
    return undefined;
  }

  const family = fontFamilyFromFile(file);
  if (!family) {
    return undefined;
  }

  return {
    file,
    score,
    font: {
      family,
      path: relative,
      weight: fontWeightFromFile(file),
      style: /(?:^|[-_\s])(?:italic|oblique|ital)(?:[-_\s]|$)/i.test(path.basename(file)) ? "italic" : "normal",
      display: "swap"
    }
  };
}

function findAssetFiles(root: string, scorer: (relativeFile: string) => number): string[] {
  const files: string[] = [];
  collectAssetFiles(root, root, files, 0, scorer);
  return files
    .filter((file) => scorer(relativeReportPath(root, file)) > 0)
    .sort((a, b) => scorer(relativeReportPath(root, b)) - scorer(relativeReportPath(root, a)) || a.localeCompare(b))
    .slice(0, 80);
}

function collectAssetFiles(
  root: string,
  directory: string,
  files: string[],
  depth: number,
  scorer: (relativeFile: string) => number
): void {
  if (files.length >= 320 || depth > 7) {
    return;
  }

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".storybook") {
      continue;
    }

    const file = path.join(directory, entry.name);
    const relative = relativeReportPath(root, file);
    if (entry.isDirectory()) {
      if (!ignoredStyleDirectory(entry.name)) {
        collectAssetFiles(root, file, files, depth + 1, scorer);
      }
      continue;
    }

    if (entry.isFile() && scorer(relative) > 0) {
      files.push(file);
    }
  }
}

function imageAssetFileScore(file: string): number {
  const lower = file.toLowerCase();
  if (!/\.(svg|png|jpe?g|webp|ico)$/.test(lower)) {
    return 0;
  }
  if (/(screenshot|mockup|preview|cover|social|og-image|twitter-card|wallpaper|background)/.test(lower)) {
    return 0;
  }

  return Math.max(imageAssetScore(file, "favicon"), imageAssetScore(file, "wordmark"), imageAssetScore(file, "logo"));
}

function imageAssetScore(file: string, kind: ImageAssetKind): number {
  const lower = file.toLowerCase();
  const name = path.basename(lower);
  let score = 0;

  if (kind === "favicon") {
    if (/(^|[-_.])favicon[-_.]/.test(name) || name === "favicon.svg" || name === "favicon.png" || name === "favicon.ico") {
      score += 110;
    }
    if (/(site-icon|browser-icon|wiki-icon|apple-touch-icon|app-icon|appicon)/.test(name)) {
      score += 70;
    }
    if (/(^|[-_.])icon[-_.]/.test(name) || name.startsWith("icon.")) {
      score += 18;
    }
  }

  if (kind === "wordmark") {
    if (/(wordmark|logotype|logo-type|lockup|logo-lockup|brand-lockup|horizontal-logo|logo-horizontal)/.test(name)) {
      score += 110;
    }
    if (/(brand|masthead)/.test(name)) {
      score += 45;
    }
    if (/logo/.test(name) && !/(icon|mark-only|symbol)/.test(name)) {
      score += 35;
    }
  }

  if (kind === "logo") {
    if (/(^|[-_.])logo[-_.]/.test(name) || name.startsWith("logo.")) {
      score += 92;
    }
    if (/(brand-mark|logomark|logo-mark|app-icon|appicon|mark)/.test(name)) {
      score += 76;
    }
    if (/(^|[-_.])icon[-_.]/.test(name) || name.startsWith("icon.")) {
      score += 32;
    }
    if (/favicon/.test(name)) {
      score += 20;
    }
  }

  if (score === 0) {
    return 0;
  }

  if (/(^|\/)(assets?|public|static|images?|img|brand|branding|logo|logos|icons?)\//.test(lower)) {
    score += 20;
  }
  if (/\/(test|tests|fixtures?|mocks?|snapshots?)\//.test(lower)) {
    score -= 28;
  }
  if (lower.endsWith(".svg")) {
    score += 12;
  }
  if (lower.endsWith(".png")) {
    score += 8;
  }
  if (kind === "favicon" && lower.endsWith(".ico")) {
    score += 10;
  }

  return Math.max(0, score);
}

function explicitImageAsset(file: string, kind: ImageAssetKind): boolean {
  const name = path.basename(file.toLowerCase());
  if (kind === "favicon") {
    return /favicon|site-icon|browser-icon|wiki-icon|apple-touch-icon/.test(name);
  }
  if (kind === "wordmark") {
    return /wordmark|logotype|lockup|horizontal-logo|logo-horizontal|brand-lockup/.test(name);
  }
  return /logo|brand-mark|logomark|logo-mark|app-icon|appicon/.test(name);
}

function fontAssetFileScore(file: string): number {
  const lower = file.toLowerCase();
  if (!/\.(woff2?|otf|ttf)$/.test(lower)) {
    return 0;
  }
  if (/(fontawesome|font-awesome|materialicons|material-icons|bootstrap-icons|glyphicons|iconfont|icons?[-_]?font)/.test(lower)) {
    return 0;
  }

  let score = 20;
  if (/(^|\/)(assets?|public|static|fonts?|typefaces?|typography|brand|branding)\//.test(lower)) {
    score += 40;
  }
  if (/(^|\/)(src|app|styles?)\//.test(lower)) {
    score += 10;
  }
  if (/variable|vf|wght/.test(lower)) {
    score += 16;
  }
  if (lower.endsWith(".woff2")) {
    score += 14;
  } else if (lower.endsWith(".woff")) {
    score += 10;
  }
  if (/\/(test|tests|fixtures?|mocks?|snapshots?)\//.test(lower)) {
    score -= 28;
  }

  return Math.max(0, score);
}

function fontFamilyFromFile(file: string): string | undefined {
  const base = path.basename(file).replace(/\.(woff2?|otf|ttf)$/i, "");
  const normalized = base
    .replace(/variablefont.*$/i, "")
    .replace(/[-_ ]?(thin|extra[-_ ]?light|extralight|light|regular|book|medium|semi[-_ ]?bold|semibold|demi[-_ ]?bold|demibold|bold|extra[-_ ]?bold|extrabold|black|heavy|roman|italic|oblique|ital|vf|wght|slnt|opsz|normal)$/gi, "")
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) {
    return undefined;
  }

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

function fontWeightFromFile(file: string): string {
  const name = path.basename(file).toLowerCase();
  if (/variable|vf|wght/.test(name)) {
    return "100 900";
  }
  if (/thin/.test(name)) {
    return "100";
  }
  if (/extra[-_ ]?light|extralight/.test(name)) {
    return "200";
  }
  if (/light/.test(name)) {
    return "300";
  }
  if (/medium/.test(name)) {
    return "500";
  }
  if (/semi[-_ ]?bold|semibold|demi[-_ ]?bold|demibold/.test(name)) {
    return "600";
  }
  if (/extra[-_ ]?bold|extrabold/.test(name)) {
    return "800";
  }
  if (/black|heavy/.test(name)) {
    return "900";
  }
  if (/bold/.test(name)) {
    return "700";
  }

  return "400";
}

function findStyleSources(root: string): StyleSource[] {
  const files: string[] = [];
  collectStyleFiles(root, root, files, 0);
  return files
    .map((file) => ({
      file,
      score: styleFileScore(relativeReportPath(root, file)),
      content: readStyleFile(file)
    }))
    .filter((source) => source.score > 0 && source.content.trim().length > 0)
    .sort((a, b) => b.score - a.score || a.file.localeCompare(b.file))
    .slice(0, 16);
}

function collectStyleFiles(root: string, directory: string, files: string[], depth: number): void {
  if (files.length >= 180 || depth > 6) {
    return;
  }

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".storybook") {
      continue;
    }

    const file = path.join(directory, entry.name);
    const relative = relativeReportPath(root, file);
    if (entry.isDirectory()) {
      if (!ignoredStyleDirectory(entry.name)) {
        collectStyleFiles(root, file, files, depth + 1);
      }
      continue;
    }

    if (entry.isFile() && styleFileScore(relative) > 0) {
      files.push(file);
    }
  }
}

function ignoredStyleDirectory(name: string): boolean {
  return [
    ".git",
    ".wikiwiki",
    "node_modules",
    "dist",
    "build",
    "coverage",
    ".next",
    ".nuxt",
    ".svelte-kit",
    "wiki",
    "wiki-site"
  ].includes(name);
}

function styleFileScore(file: string): number {
  const lower = file.toLowerCase();
  const ext = path.extname(lower);
  if (lower.endsWith(".min.css")) {
    return 0;
  }

  let score = 0;
  if ([".css", ".scss", ".sass", ".less", ".pcss", ".postcss"].includes(ext)) {
    score += 24;
  } else if ([".ts", ".tsx", ".js", ".jsx", ".json"].includes(ext)) {
    if (!/(^|\/)(tailwind\.config|theme\.config|[^/]*(theme|tokens?|design|palette|brand)[^/]*)\./.test(lower)) {
      return 0;
    }
    score += 2;
  } else {
    return 0;
  }

  if (/(^|\/)(global|globals|app|layout|landing|home|shell|theme|themes|tokens?|design|palette|brand)[^/]*\./.test(lower)) {
    score += 18;
  }
  if (/(^|\/)(src|app|pages|styles?|css|theme|tokens?|design-system|components)\//.test(lower)) {
    score += 8;
  }
  if (/tailwind\.config|theme\.config|tokens?\.json|design-tokens/.test(lower)) {
    score += 12;
  }
  if (/(test|spec|fixture|mock|snapshot|storybook-static)/.test(lower)) {
    score -= 12;
  }

  return Math.max(0, score);
}

function readStyleFile(file: string): string {
  try {
    const stat = fs.statSync(file);
    if (stat.size > 240000) {
      return fs.readFileSync(file, "utf8").slice(0, 240000);
    }
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function extractStyleColors(sources: StyleSource[]): StyleColor[] {
  const colors = new Map<string, StyleColor>();
  for (const source of sources) {
    const pattern = /#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})\b/gi;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source.content)) !== null) {
      const hex = normalizeHexColor(match[0]);
      const rgb = parseHexColor(hex);
      if (!rgb) {
        continue;
      }

      const context = source.content.slice(Math.max(0, match.index - 90), Math.min(source.content.length, match.index + 120)).toLowerCase();
      const existing = colors.get(hex) ?? {
        hex,
        rgb,
        count: 0,
        score: 0,
        contexts: []
      };
      existing.count += 1;
      existing.score += source.score + colorContextScore(context) + colorfulness(rgb) * 10;
      if (existing.contexts.length < 8) {
        existing.contexts.push(context);
      }
      colors.set(hex, existing);
    }
  }

  return [...colors.values()].sort((a, b) => b.score - a.score || b.count - a.count || a.hex.localeCompare(b.hex));
}

function colorContextScore(context: string): number {
  let score = 0;
  if (/(accent|brand|primary|spectrum|rainbow|highlight|active|selected|focus)/.test(context)) {
    score += 24;
  }
  if (/(rose|pink|red|orange|yellow|green|cyan|blue|violet|purple)/.test(context)) {
    score += 10;
  }
  if (/(bg|background|body|shell|surface|panel|card|glass)/.test(context)) {
    score += 8;
  }
  if (/(text|foreground|color)/.test(context)) {
    score += 4;
  }
  if (/(border|shadow|overlay)/.test(context)) {
    score += 2;
  }

  return score;
}

function accentColors(colors: StyleColor[]): string[] {
  return colors
    .filter((color) => {
      const luminance = relativeLuminance(color.rgb);
      const context = color.contexts.join(" ");
      const explicitAccent = /(accent|brand|primary|spectrum|rainbow|highlight|active|selected|focus)/.test(context);
      const textLike = /(muted|text|foreground|fg)/.test(context);
      return colorfulness(color.rgb) >= 0.25 && luminance > 0.08 && luminance < 0.9 && (explicitAccent || !textLike);
    })
    .sort((a, b) => {
      const aAccent = accentContextScore(a);
      const bAccent = accentContextScore(b);
      return bAccent - aAccent || b.score - a.score || a.hex.localeCompare(b.hex);
    })
    .slice(0, 5)
    .map((color) => color.hex);
}

function accentContextScore(color: StyleColor): number {
  const context = color.contexts.join(" ");
  return color.score
    + colorfulness(color.rgb) * 30
    + (/(accent|brand|primary|spectrum|rainbow|highlight|active|selected|focus)/.test(context) ? 60 : 0);
}

function surfaceColor(colors: StyleColor[], mode: "dark" | "light", keywords: string[]): string | undefined {
  const candidates = colors.filter((color) => {
    const luminance = relativeLuminance(color.rgb);
    const context = color.contexts.join(" ");
    const hasKeyword = keywords.some((keyword) => context.includes(keyword));
    return hasKeyword && (mode === "dark" ? luminance < 0.24 : luminance > 0.72);
  });
  candidates.sort((a, b) => surfaceKeywordScore(b, keywords) - surfaceKeywordScore(a, keywords) || b.score - a.score || (mode === "dark" ? relativeLuminance(a.rgb) - relativeLuminance(b.rgb) : relativeLuminance(b.rgb) - relativeLuminance(a.rgb)));
  return candidates[0]?.hex;
}

function surfaceKeywordScore(color: StyleColor, keywords: string[]): number {
  const escapedHex = color.hex.replace("#", "\\#");
  return color.contexts.reduce((score, context) => {
    const declarationMatch = keywords.some((keyword) => new RegExp(`${keyword}[a-z0-9_-]*\\s*:\\s*${escapedHex}|[a-z0-9_-]*${keyword}[a-z0-9_-]*\\s*:\\s*${escapedHex}`, "i").test(context));
    if (declarationMatch) {
      return score + 100;
    }

    const keywordMatch = keywords.some((keyword) => context.includes(keyword));
    return keywordMatch ? score + 10 : score;
  }, 0);
}

function textColor(colors: StyleColor[], mode: "dark" | "light"): string | undefined {
  const candidates = colors.filter((color) => {
    const luminance = relativeLuminance(color.rgb);
    const context = color.contexts.join(" ");
    const declarationScore = textDeclarationScore(color);
    return (declarationScore > 0 || (/(text|foreground|color)/.test(context) && !/(bg|background|border|shadow)/.test(context)))
      && (mode === "dark" ? luminance > 0.74 : luminance < 0.28);
  });
  candidates.sort((a, b) => textDeclarationScore(b) - textDeclarationScore(a) || b.score - a.score || a.hex.localeCompare(b.hex));
  return candidates[0]?.hex;
}

function textDeclarationScore(color: StyleColor): number {
  const escapedHex = color.hex.replace("#", "\\#");
  return color.contexts.reduce((score, context) => {
    const direct = new RegExp(`(?:text|foreground|fg|color)[a-z0-9_-]*\\s*:\\s*${escapedHex}|[a-z0-9_-]*(?:text|foreground|fg)[a-z0-9_-]*\\s*:\\s*${escapedHex}`, "i").test(context);
    return direct ? score + 100 : score;
  }, 0);
}

function inferRadius(sources: StyleSource[]): string | undefined {
  const candidates: { value: string; pixels: number; score: number }[] = [];
  for (const source of sources) {
    const pattern = /(?:border-radius|--[a-z0-9-]*radius[a-z0-9-]*)\s*:\s*([^;{}\n]+)/gi;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source.content)) !== null) {
      const value = match[1].trim().split(/\s+/)[0].replace(/,$/, "");
      const pixels = radiusPixels(value);
      if (pixels >= 2 && pixels <= 40) {
        candidates.push({ value, pixels, score: source.score + pixels });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score || b.pixels - a.pixels);
  return candidates[0]?.value;
}

function radiusPixels(value: string): number {
  const match = /^([0-9]+(?:\.[0-9]+)?)(px|rem|em)$/i.exec(value);
  if (!match) {
    return 0;
  }

  const amount = Number.parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  return unit === "px" ? amount : amount * 16;
}

function inferFontFamily(sources: StyleSource[]): string | undefined {
  for (const source of sources) {
    const match = /font-family\s*:\s*([^;{}\n]+)/i.exec(source.content);
    const value = match?.[1]?.trim();
    if (value && !/^var\(/i.test(value) && !/inherit|initial|unset/i.test(value)) {
      return value.replace(/\s+/g, " ");
    }
  }

  return undefined;
}

function inferGradientAngle(sources: StyleSource[]): string {
  for (const source of sources) {
    const match = /linear-gradient\(\s*([^,\)]+)/i.exec(source.content);
    const value = match?.[1]?.trim();
    if (value && (/^-?\d+(?:\.\d+)?deg$/.test(value) || /^to\s+/.test(value))) {
      return value;
    }
  }

  return "135deg";
}

function plainText(value: string | undefined): string | undefined {
  const cleaned = value
    ?.replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<img\b[^>]*alt=["']([^"']*)["'][^>]*>/gi, " $1 ")
    .replace(/<img\b[^>]*>/gi, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/g, "'")
    .replace(/[`*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || undefined;
}

function gradientFromAccents(angle: string, accents: string[]): string {
  const stops = [...new Set(accents)].slice(0, 5);
  return `linear-gradient(${angle}, ${stops.join(", ")})`;
}

function normalizeHexColor(value: string): string {
  const hex = value.replace(/^#/, "");
  if (hex.length === 3) {
    return `#${hex.split("").map((char) => `${char}${char}`).join("")}`.toLowerCase();
  }
  return `#${hex.slice(0, 6)}`.toLowerCase();
}

function parseHexColor(value: string | undefined): Rgb | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  const match = /^#([0-9a-f]{6})$/i.exec(normalizeHexColor(trimmed));
  if (!match) {
    return undefined;
  }

  return {
    r: Number.parseInt(match[1].slice(0, 2), 16),
    g: Number.parseInt(match[1].slice(2, 4), 16),
    b: Number.parseInt(match[1].slice(4, 6), 16)
  };
}

function colorToHex(color: Rgb): string {
  return `#${[color.r, color.g, color.b]
    .map((channel) => Math.round(Math.max(0, Math.min(255, channel))).toString(16).padStart(2, "0"))
    .join("")}`;
}

function mixRgb(a: Rgb, b: Rgb, aWeight: number): Rgb {
  const clamped = Math.max(0, Math.min(1, aWeight));
  const bWeight = 1 - clamped;
  return {
    r: a.r * clamped + b.r * bWeight,
    g: a.g * clamped + b.g * bWeight,
    b: a.b * clamped + b.b * bWeight
  };
}

function rgba(color: Rgb, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${Number(clamped.toFixed(3))})`;
}

function relativeLuminance(color: Rgb): number {
  const [r, g, b] = [color.r, color.g, color.b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: Rgb, b: Rgb): number {
  const lighter = Math.max(relativeLuminance(a), relativeLuminance(b));
  const darker = Math.min(relativeLuminance(a), relativeLuminance(b));
  return (lighter + 0.05) / (darker + 0.05);
}

function readableTextFor(background: Rgb): string {
  return relativeLuminance(background) > 0.5 ? "#111827" : "#f8fafc";
}

function readableTextForPair(background: string, preferred: string): string {
  const bg = parseHexColor(background);
  const text = parseHexColor(preferred);
  if (bg && text && contrastRatio(bg, text) >= 4.5) {
    return preferred;
  }

  return bg ? readableTextFor(bg) : preferred;
}

function readableAccentFor(color: Rgb, surface: Rgb, mode: "light" | "dark"): Rgb {
  if (contrastRatio(color, surface) >= 3) {
    return color;
  }

  const target = mode === "dark" ? { r: 255, g: 255, b: 255 } : { r: 17, g: 24, b: 39 };
  for (const weight of [0.75, 0.6, 0.45, 0.3]) {
    const candidate = mixRgb(color, target, weight);
    if (contrastRatio(candidate, surface) >= 3) {
      return candidate;
    }
  }

  return target;
}

function colorfulness(color: Rgb): number {
  const max = Math.max(color.r, color.g, color.b);
  const min = Math.min(color.r, color.g, color.b);
  return max === 0 ? 0 : (max - min) / max;
}

function readPackageJson(root: string): PackageJson | undefined {
  const file = path.join(root, "package.json");
  if (!fs.existsSync(file)) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as PackageJson
      : undefined;
  } catch {
    return undefined;
  }
}

function readReadme(root: string): string | undefined {
  for (const fileName of ["README.md", "readme.md", "Readme.md"]) {
    const file = path.join(root, fileName);
    if (fs.existsSync(file)) {
      return fs.readFileSync(file, "utf8");
    }
  }

  return undefined;
}

function readmeH1(readme: string): string | undefined {
  const line = readme.split(/\r?\n/).find((item) => /^#\s+/.test(item.trim()));
  return plainText(line?.replace(/^#\s+/, "")) || undefined;
}

function firstUsefulReadmeParagraph(readme: string): string | undefined {
  const withoutCode = readme.replace(/```[\s\S]*?```/g, "\n");
  const paragraphs = withoutCode.split(/\n{2,}/);
  for (const paragraph of paragraphs) {
    const normalized = paragraph
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && !line.startsWith("!") && !line.startsWith("|"))
      .join(" ")
      .replace(/\s+/g, " ");
    const plain = plainText(normalized);
    if (plain && plain.length >= 24 && !/^(npm|wk|git|cd)\s/.test(plain)) {
      return plain;
    }
  }

  return undefined;
}

function prettyPackageName(value: string): string {
  const unscoped = value.replace(/^@[^/]+\//, "");
  return unscoped
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase()) || value;
}

function countKeyword(text: string, keyword: string): number {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (text.match(new RegExp(`\\b${escaped}\\b`, "g")) ?? []).length;
}

function stableHash(value: string): number {
  let hash = 0;
  for (const char of value) {
    hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  }

  return Math.abs(hash);
}

const moodKeywords: Record<ThemeMood, string[]> = {
  calm: ["local", "private", "privacy", "wellness", "calm", "care", "notes", "knowledge"],
  vivid: ["brand", "visual", "design", "product", "creative", "marketing", "launch"],
  editorial: ["wiki", "docs", "documentation", "writing", "publishing", "knowledge", "reader"],
  utility: ["cli", "api", "tool", "automation", "developer", "system", "script", "test"],
  playful: ["game", "play", "playful", "toy", "fun", "music", "art", "sprite"],
  dark: ["terminal", "security", "ops", "infra", "backend", "night", "dark", "monitor"]
};
