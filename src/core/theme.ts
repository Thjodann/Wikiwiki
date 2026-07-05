import fs from "fs";
import path from "path";
import { siteThemePath, type WikiwikiSiteTheme, type WikiwikiThemePalette } from "./config";
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
  const identity = inferThemeIdentity(root, options);
  const mood = resolveThemeMood(root, identity, options.mood);
  const theme = moodThemes[mood];
  return {
    ok: true,
    mode: "preview",
    theme_path: relativeReportPath(root, siteThemePath(root)),
    exists: fs.existsSync(siteThemePath(root)),
    mood,
    identity,
    theme: {
      project_name: identity.project_name,
      project_description: identity.project_description,
      default_color_scheme: "auto",
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
    ? packageJson.description.trim()
    : undefined;
  const optionName = options.projectName?.trim();
  const optionDescription = options.description?.trim();
  const fallbackName = prettyPackageName(path.basename(root));

  return {
    project_name: optionName || readmeTitle || packageName || fallbackName,
    project_description: optionDescription || packageDescription || readmeDescription || defaultDescription,
    project_name_source: optionName ? "option" : readmeTitle ? "readme" : packageName ? "package" : "repo",
    project_description_source: optionDescription ? "option" : packageDescription ? "package" : readmeDescription ? "readme" : "default"
  };
}

function resolveThemeMood(root: string, identity: ThemeIdentity, moodOption: string | undefined): ThemeMood {
  const parsedMood = parseThemeMood(moodOption);
  if (parsedMood) {
    return parsedMood;
  }

  const readme = readReadme(root) ?? "";
  const packageJson = readPackageJson(root);
  const text = [
    identity.project_name,
    identity.project_description,
    readme,
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

  return themeMoods[stableHash(identity.project_name) % themeMoods.length];
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
  return line?.replace(/^#\s+/, "").trim() || undefined;
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
      .replace(/\s+/g, " ")
      .trim();
    if (normalized.length >= 24 && !/^(npm|wk|git|cd)\s/.test(normalized)) {
      return normalized;
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
