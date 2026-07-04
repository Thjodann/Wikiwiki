import type { EventRecord } from "../core/schemas";

export function devlogPage(records: EventRecord[]): string {
  const sorted = [...records].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
  const body = sorted.length
    ? sorted.map(renderEvent).join("\n\n")
    : "_No events captured yet._";

  return `# Devlog

${body}
`;
}

function renderEvent(record: EventRecord): string {
  const files = record.files.length ? `\n\nFiles: ${record.files.map((file) => `\`${file}\``).join(", ")}` : "";

  return `## ${record.summary}

${record.details || "_No details recorded._"}${files}

Recorded: ${record.created_at} | Record: \`${record.id}\` | Confidence: ${record.confidence}`;
}
