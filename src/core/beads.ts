import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { type WikiwikiConfig } from "./config";
import { readGitStatus, runGit, type GitStatusEntry } from "./git";
import { reportPath, toPosixPath } from "./paths";

export type BeadsIntegrationConfig = {
  enabled?: boolean;
};

export type BeadsIssueSummary = {
  id: string;
  title: string;
  status?: string;
  type?: string;
  priority?: string;
  assignee?: string;
  updated_at?: string;
  closed_at?: string;
  labels: string[];
};

export type BeadsIntegrationSummary = {
  detected: boolean;
  enabled: boolean;
  available: boolean;
  configured: "auto" | "enabled" | "disabled";
  beads_path?: string;
  error?: string;
  warnings: string[];
  counts: {
    total?: number;
    open?: number;
    closed?: number;
    ready: number;
    in_progress: number;
    recent_closed: number;
  };
  issue_ids: string[];
  ready: BeadsIssueSummary[];
  in_progress: BeadsIssueSummary[];
  recent_closed: BeadsIssueSummary[];
};

export type IntegrationSummary = {
  beads?: BeadsIntegrationSummary;
};

type BdResult = {
  ok: boolean;
  value?: unknown;
  error?: string;
};

export function readIntegrations(root: string, config: WikiwikiConfig = {}): IntegrationSummary {
  const beads = readBeadsIntegration(root, config.integrations?.beads);
  return shouldReportBeadsIntegration(beads) ? { beads } : {};
}

export function readBeadsIntegration(
  root: string,
  config: BeadsIntegrationConfig | undefined = {}
): BeadsIntegrationSummary {
  const detected = fs.existsSync(path.join(root, ".beads"));
  const configured = config.enabled === false
    ? "disabled"
    : config.enabled === true
      ? "enabled"
      : "auto";
  const enabled = configured === "disabled" ? false : detected || configured === "enabled";
  const base = emptySummary({
    detected,
    enabled,
    configured,
    beadsPath: detected ? reportPath(path.join(root, ".beads")) : undefined
  });

  if (!enabled) {
    return base;
  }

  if (!detected) {
    return {
      ...base,
      error: "no_beads_directory"
    };
  }

  if (configured === "auto") {
    return {
      ...base,
      error: "beads_auto_read_skipped",
      warnings: [
        "Beads workspace detected; detailed bd reads are skipped in auto mode to avoid dirtying .beads. Set integrations.beads.enabled to true to opt in."
      ]
    };
  }

  const before = beadsGitStatusSnapshot(root);
  const where = runBdJson(root, ["where"]);
  if (!where.ok) {
    return {
      ...base,
      error: where.error ?? "bd_unavailable"
    };
  }

  const status = runBdJson(root, ["status", "--no-activity"]);
  const ready = runBdJson(root, ["ready", "--limit", "10"]);
  const inProgress = runBdJson(root, ["list", "--status", "in_progress", "--limit", "10"]);
  const recentClosed = runBdJson(root, ["list", "--status", "closed", "--limit", "10", "--sort", "updated", "--reverse"]);
  const mutation = resolveBeadsMutation(root, before, beadsGitStatusSnapshot(root));
  if (mutation) {
    return {
      ...base,
      error: "beads_read_mutated_worktree",
      warnings: [
        "bd read commands changed .beads; Wikiwiki ignored Beads details for this run.",
        ...mutation.warnings,
        `Changed .beads entries: ${summarizeEntries(mutation.changed_entries)}`
      ]
    };
  }

  const readyIssues = extractIssues(ready.value);
  const inProgressIssues = extractIssues(inProgress.value);
  const recentClosedIssues = extractIssues(recentClosed.value);
  const warnings = [status, ready, inProgress, recentClosed]
    .flatMap((result) => result.ok ? [] : [result.error ?? "bd command failed"]);
  const issueIds = unique([
    ...readyIssues.map((issue) => issue.id),
    ...inProgressIssues.map((issue) => issue.id),
    ...recentClosedIssues.map((issue) => issue.id)
  ]);

  return {
    detected,
    enabled,
    available: true,
    configured,
    beads_path: beadsPathFromWhere(where.value) ?? base.beads_path,
    warnings,
    counts: {
      total: numberAt(status.value, ["total", "total_issues", "counts.total"]),
      open: numberAt(status.value, ["open", "open_issues", "counts.open", "status.open", "statuses.open"]),
      closed: numberAt(status.value, ["closed", "closed_issues", "counts.closed", "status.closed", "statuses.closed"]),
      ready: numberAt(status.value, ["ready", "ready_issues", "counts.ready"]) ?? readyIssues.length,
      in_progress: numberAt(status.value, ["in_progress", "inProgress", "counts.in_progress", "status.in_progress", "statuses.in_progress"]) ?? inProgressIssues.length,
      recent_closed: recentClosedIssues.length
    },
    issue_ids: issueIds,
    ready: readyIssues,
    in_progress: inProgressIssues,
    recent_closed: recentClosedIssues
  };
}

export function shouldReportIntegrations(integrations: IntegrationSummary): boolean {
  return Boolean(integrations.beads && shouldReportBeadsIntegration(integrations.beads));
}

export function shouldReportBeadsIntegration(beads: BeadsIntegrationSummary): boolean {
  return beads.detected || beads.configured !== "auto";
}

function emptySummary(options: {
  detected: boolean;
  enabled: boolean;
  configured: BeadsIntegrationSummary["configured"];
  beadsPath?: string;
}): BeadsIntegrationSummary {
  return {
    detected: options.detected,
    enabled: options.enabled,
    available: false,
    configured: options.configured,
    beads_path: options.beadsPath,
    warnings: [],
    counts: {
      ready: 0,
      in_progress: 0,
      recent_closed: 0
    },
    issue_ids: [],
    ready: [],
    in_progress: [],
    recent_closed: []
  };
}

function runBdJson(root: string, args: string[]): BdResult {
  try {
    const output = execFileSync("bd", ["--readonly", "--json", "--dolt-auto-commit", "off", ...args], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    }).trim();
    return {
      ok: true,
      value: output ? JSON.parse(output) as unknown : null
    };
  } catch (error) {
    return {
      ok: false,
      error: commandError(error)
    };
  }
}

function commandError(error: unknown): string {
  if (isObject(error)) {
    const stdout = error.stdout;
    if (typeof stdout === "string" && stdout.trim()) {
      try {
        const parsed = JSON.parse(stdout) as unknown;
        const message = stringAt(parsed, ["message", "error", "hint"]);
        if (message) {
          return message;
        }
      } catch {
        return stdout.trim();
      }
    }

    const stderr = error.stderr;
    if (typeof stderr === "string" && stderr.trim()) {
      return stderr.trim().split(/\r?\n/)[0];
    }

    const message = error.message;
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  }

  return String(error);
}

function beadsGitStatusSnapshot(root: string): GitStatusEntry[] {
  return readGitStatus(root, [".beads"]).sort((left, right) => entryKey(left).localeCompare(entryKey(right)));
}

function resolveBeadsMutation(
  root: string,
  before: GitStatusEntry[],
  after: GitStatusEntry[]
): { changed_entries: string[]; warnings: string[] } | undefined {
  const changedEntries = changedSnapshotEntries(before, after);
  if (changedEntries.length === 0) {
    return undefined;
  }

  if (before.length > 0) {
    return {
      changed_entries: changedEntries,
      warnings: ["Pre-existing .beads changes were present; automatic restore was skipped."]
    };
  }

  const restoreWarnings = restoreBeadsChanges(root, after);
  const restored = snapshotsEqual(before, beadsGitStatusSnapshot(root));
  return {
    changed_entries: changedEntries,
    warnings: restored
      ? ["Restored .beads to its pre-read state after rejecting Beads details.", ...restoreWarnings]
      : ["Automatic .beads restore was incomplete; inspect git status before continuing.", ...restoreWarnings]
  };
}

function restoreBeadsChanges(root: string, changed: GitStatusEntry[]): string[] {
  const warnings: string[] = [];
  const trackedPaths = changed
    .filter((entry) => entry.status !== "??")
    .map((entry) => entry.path)
    .filter((file) => isSafeBeadsPath(root, file));
  const untrackedPaths = changed
    .filter((entry) => entry.status === "??")
    .map((entry) => entry.path)
    .filter((file) => isSafeBeadsPath(root, file) && file !== ".beads");

  if (trackedPaths.length > 0) {
    try {
      runGit(root, ["restore", "--staged", "--worktree", "--", ...trackedPaths]);
    } catch (error) {
      warnings.push(`Could not restore tracked .beads paths: ${commandError(error)}`);
    }
  }

  for (const file of untrackedPaths) {
    try {
      fs.rmSync(path.join(root, file), { force: true, recursive: true });
    } catch (error) {
      warnings.push(`Could not remove untracked .beads path ${file}: ${commandError(error)}`);
    }
  }

  const skipped = changed
    .map((entry) => entry.path)
    .filter((file) => !isSafeBeadsPath(root, file) || file === ".beads");
  if (skipped.length > 0) {
    warnings.push(`Skipped unsafe .beads restore paths: ${summarizeEntries(skipped)}`);
  }

  return warnings;
}

function changedSnapshotEntries(before: GitStatusEntry[], after: GitStatusEntry[]): string[] {
  const beforeSet = new Set(before.map(entryKey));
  const afterSet = new Set(after.map(entryKey));
  return [
    ...after.map(entryKey).filter((entry) => !beforeSet.has(entry)),
    ...before.map(entryKey).filter((entry) => !afterSet.has(entry))
  ].sort();
}

function snapshotsEqual(left: GitStatusEntry[], right: GitStatusEntry[]): boolean {
  const leftKeys = left.map(entryKey);
  const rightKeys = right.map(entryKey);
  return leftKeys.length === rightKeys.length && leftKeys.every((entry, index) => entry === rightKeys[index]);
}

function entryKey(entry: GitStatusEntry): string {
  return `${entry.status} ${entry.path}`;
}

function summarizeEntries(entries: string[]): string {
  return `${entries.slice(0, 5).join(", ")}${entries.length > 5 ? `, and ${entries.length - 5} more` : ""}`;
}

function isSafeBeadsPath(root: string, file: string): boolean {
  const beadsRoot = path.resolve(root, ".beads");
  const fullPath = path.resolve(root, file);
  const relative = path.relative(beadsRoot, fullPath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function beadsPathFromWhere(value: unknown): string | undefined {
  const found = stringAt(value, ["beads_dir", "beads_path", "path", "workspace", "workspace_path"]);
  return found ? toPosixPath(found) : undefined;
}

function extractIssues(value: unknown): BeadsIssueSummary[] {
  return issueArray(value)
    .map(normalizeIssue)
    .filter((issue): issue is BeadsIssueSummary => Boolean(issue));
}

function issueArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isObject(value)) {
    return [];
  }

  for (const key of ["issues", "items", "results", "data", "ready", "work"]) {
    const nested = value[key];
    if (Array.isArray(nested)) {
      return nested;
    }
  }

  return [];
}

function normalizeIssue(value: unknown): BeadsIssueSummary | undefined {
  if (!isObject(value)) {
    return undefined;
  }

  const id = stringAt(value, ["id", "issue_id", "key"]);
  if (!id) {
    return undefined;
  }

  return {
    id,
    title: stringAt(value, ["title", "summary", "name"]) ?? id,
    status: stringAt(value, ["status", "state"]),
    type: stringAt(value, ["type", "issue_type"]),
    priority: priorityString(value["priority"] ?? value["priority_label"]),
    assignee: stringAt(value, ["assignee", "owner", "claimed_by"]),
    updated_at: stringAt(value, ["updated_at", "updated", "modified_at"]),
    closed_at: stringAt(value, ["closed_at", "closed"]),
    labels: stringArray(value["labels"] ?? value["tags"])
  };
}

function numberAt(value: unknown, paths: string[]): number | undefined {
  for (const itemPath of paths) {
    const found = valueAtPath(value, itemPath);
    if (typeof found === "number" && Number.isFinite(found)) {
      return found;
    }
    if (typeof found === "string" && found.trim() && Number.isFinite(Number(found))) {
      return Number(found);
    }
  }

  return undefined;
}

function stringAt(value: unknown, paths: string[]): string | undefined {
  for (const itemPath of paths) {
    const found = valueAtPath(value, itemPath);
    if (typeof found === "string" && found.trim()) {
      return toPosixPath(found.trim());
    }
    if (typeof found === "number" && Number.isFinite(found)) {
      return String(found);
    }
  }

  return undefined;
}

function valueAtPath(value: unknown, itemPath: string): unknown {
  return itemPath.split(".").reduce<unknown>((current, key) => {
    if (!isObject(current)) {
      return undefined;
    }
    return current[key];
  }, value);
}

function priorityString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return `P${value}`;
  }
  return undefined;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
