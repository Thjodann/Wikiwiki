import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { normalizeSourceBaseUrl, readWikiwikiConfig, writeWikiwikiConfig } from "./config";
import { relativeReportPath } from "./paths";
import type { SiteAudience } from "./profiles";
import { ensureStore } from "./store";

export const defaultPagesWorkflowPath = ".github/workflows/wikiwiki-pages.yml";
export const pagesAudience: SiteAudience = "user";

export type PagesInitOptions = {
  branch?: string;
  sourceBaseUrl?: string;
  workflow?: string;
  force?: boolean;
};

export type GitHubRemote = {
  owner: string;
  repo: string;
  html_url: string;
  pages_settings_url: string;
};

export type PagesInitResult = {
  ok: true;
  workflow_path: string;
  created: boolean;
  overwritten: boolean;
  already_current: boolean;
  branch: string;
  audience: SiteAudience;
  source_base_url: string;
  pages_settings_url?: string;
  next_steps: string[];
};

export function initPages(root: string, options: PagesInitOptions = {}): PagesInitResult {
  const existingConfig = readWikiwikiConfig(root);
  const branch = resolvePagesBranch(root, options.branch);
  const remote = readGitHubRemote(root);
  const sourceBaseUrl = resolvePagesSourceBaseUrl(options.sourceBaseUrl, existingConfig.source_base_url, remote, branch);
  const workflowFile = resolveWorkflowPath(root, options.workflow);
  const workflowContent = pagesWorkflow({ branch, sourceBaseUrl });

  const existingWorkflow = fs.existsSync(workflowFile) ? fs.readFileSync(workflowFile, "utf8") : undefined;
  const alreadyCurrent = existingWorkflow === workflowContent;
  if (existingWorkflow !== undefined && !alreadyCurrent && options.force !== true) {
    throw new Error(`Refusing to overwrite existing Pages workflow: ${relativeReportPath(root, workflowFile)}. Re-run with --force to replace it.`);
  }

  ensureStore(root);
  writeWikiwikiConfig(root, {
    ...existingConfig,
    site_audience: pagesAudience,
    source_base_url: sourceBaseUrl
  });

  if (!alreadyCurrent) {
    fs.mkdirSync(path.dirname(workflowFile), { recursive: true });
    fs.writeFileSync(workflowFile, workflowContent, "utf8");
  }

  const pagesSettingsUrl = remote?.pages_settings_url;
  return {
    ok: true,
    workflow_path: relativeReportPath(root, workflowFile),
    created: existingWorkflow === undefined,
    overwritten: existingWorkflow !== undefined && !alreadyCurrent,
    already_current: alreadyCurrent,
    branch,
    audience: pagesAudience,
    source_base_url: sourceBaseUrl,
    ...(pagesSettingsUrl ? { pages_settings_url: pagesSettingsUrl } : {}),
    next_steps: pagesNextSteps(pagesSettingsUrl)
  };
}

export function parseGitHubRemoteUrl(value: string | undefined): GitHubRemote | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  const sshMatch = /^git@github\.com:([^/\s]+)\/(.+?)$/i.exec(trimmed);
  if (sshMatch) {
    return gitHubRemote(sshMatch[1], sshMatch[2]);
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname.toLowerCase() !== "github.com") {
      return undefined;
    }
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) {
      return undefined;
    }
    return gitHubRemote(parts[0], parts[1]);
  } catch {
    return undefined;
  }
}

export function pagesWorkflow(options: {
  branch: string;
  sourceBaseUrl: string;
}): string {
  const branch = yamlSingleQuote(options.branch);
  const sourceBaseUrl = shellSingleQuote(options.sourceBaseUrl);
  return [
    "name: Publish Wikiwiki Site",
    "",
    "on:",
    "  push:",
    "    branches:",
    `      - ${branch}`,
    "  workflow_dispatch:",
    "",
    "permissions:",
    "  contents: read",
    "  pages: write",
    "  id-token: write",
    "  actions: read",
    "",
    "concurrency:",
    "  group: pages",
    "  cancel-in-progress: false",
    "",
    "jobs:",
    "  build:",
    "    runs-on: ubuntu-latest",
    "    steps:",
    "      - name: Checkout",
    "        uses: actions/checkout@v4",
    "",
    "      - name: Set up Node",
    "        uses: actions/setup-node@v4",
    "        with:",
    "          node-version: 22",
    "",
    "      - name: Install dependencies",
    "        shell: bash",
    "        run: |",
    "          if [ -f package-lock.json ]; then",
    "            npm ci",
    "          elif [ -f package.json ]; then",
    "            npm install",
    "          else",
    "            npm init -y",
    "          fi",
    "          if [ ! -x ./node_modules/.bin/wk ]; then",
    "            npm install --save-dev --package-lock=false git+https://github.com/Thjodann/Wikiwiki.git",
    "          fi",
    "",
    "      - name: Build project",
    "        run: npm run build --if-present",
    "",
    "      - name: Generate Wikiwiki site",
    "        run: |",
    "          ./node_modules/.bin/wk validate",
    "          ./node_modules/.bin/wk render",
    `          ./node_modules/.bin/wk site --audience ${pagesAudience} --source-base-url ${sourceBaseUrl}`,
    "",
    "      - name: Configure GitHub Pages",
    "        uses: actions/configure-pages@v6",
    "",
    "      - name: Upload Wikiwiki site",
    "        uses: actions/upload-pages-artifact@v5",
    "        with:",
    "          path: wiki-site",
    "",
    "  deploy:",
    "    needs: build",
    "    runs-on: ubuntu-latest",
    "    environment:",
    "      name: github-pages",
    "      url: ${{ steps.deployment.outputs.page_url }}",
    "    steps:",
    "      - name: Deploy GitHub Pages",
    "        id: deployment",
    "        uses: actions/deploy-pages@v4",
    ""
  ].join("\n");
}

function resolvePagesBranch(root: string, value: string | undefined): string {
  const explicit = value?.trim();
  if (explicit) {
    return explicit;
  }

  const originHead = readGitOutput(root, ["symbolic-ref", "--short", "refs/remotes/origin/HEAD"]);
  if (originHead) {
    return originHead.replace(/^origin\//, "");
  }

  return "main";
}

function resolvePagesSourceBaseUrl(
  optionValue: string | undefined,
  configValue: string | undefined,
  remote: GitHubRemote | undefined,
  branch: string
): string {
  const configured = normalizeSourceBaseUrl(optionValue ?? configValue);
  if (configured) {
    return configured;
  }

  if (remote) {
    return `${remote.html_url}/blob/${branch}/`;
  }

  throw new Error("Could not infer a GitHub source URL from remote.origin.url. Pass --source-base-url, for example https://github.com/OWNER/REPO/blob/main/.");
}

function readGitHubRemote(root: string): GitHubRemote | undefined {
  return parseGitHubRemoteUrl(readGitOutput(root, ["config", "--get", "remote.origin.url"]));
}

function readGitOutput(root: string, args: string[]): string | undefined {
  try {
    const output = execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    return output || undefined;
  } catch {
    return undefined;
  }
}

function resolveWorkflowPath(root: string, value: string | undefined): string {
  const workflowPath = value?.trim() || defaultPagesWorkflowPath;
  const fullPath = path.isAbsolute(workflowPath) ? workflowPath : path.join(root, workflowPath);
  const relative = path.relative(root, fullPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Pages workflow path must be inside the repository.");
  }
  return fullPath;
}

function gitHubRemote(owner: string, repo: string): GitHubRemote | undefined {
  const cleanOwner = owner.trim();
  const cleanRepo = repo.trim().replace(/\.git$/i, "").replace(/\/+$/, "");
  if (!cleanOwner || !cleanRepo || cleanRepo.includes("/")) {
    return undefined;
  }

  const htmlUrl = `https://github.com/${cleanOwner}/${cleanRepo}`;
  return {
    owner: cleanOwner,
    repo: cleanRepo,
    html_url: htmlUrl,
    pages_settings_url: `${htmlUrl}/settings/pages`
  };
}

function pagesNextSteps(pagesSettingsUrl: string | undefined): string[] {
  const settingsStep = pagesSettingsUrl
    ? `Open ${pagesSettingsUrl} and set Build and deployment Source to GitHub Actions if it is not already selected.`
    : "Open the repository Settings > Pages screen and set Build and deployment Source to GitHub Actions if it is not already selected.";
  return [
    settingsStep,
    "Commit the generated workflow and .wikiwiki/config.json changes.",
    "Push to the configured branch or run the workflow manually from the Actions tab."
  ];
}

function yamlSingleQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}
