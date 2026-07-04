import type { DecisionRecord } from "../core/schemas";

export function decisionsPage(records: DecisionRecord[]): string {
  const sorted = [...records].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
  const body = sorted.length
    ? sorted.map(renderDecision).join("\n\n")
    : "_No decisions captured yet._";

  return `# Decisions

${body}
`;
}

function renderDecision(record: DecisionRecord): string {
  const files = record.files.length ? `\n\nFiles: ${record.files.map((file) => `\`${file}\``).join(", ")}` : "";
  const tags = record.tags.length ? `\n\nTags: ${record.tags.map((tag) => `\`${tag}\``).join(", ")}` : "";

  return `## ${record.title}

Context: ${record.context || "_Not recorded._"}

Decision: ${record.decision}

Consequences: ${record.consequences || "_Not recorded._"}${files}${tags}

Record: \`${record.id}\` | Authority: ${record.authority} | Confidence: ${record.confidence}`;
}
