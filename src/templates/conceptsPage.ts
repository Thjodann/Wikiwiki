import type { ConceptRecord } from "../core/schemas";

export function conceptsPage(records: ConceptRecord[]): string {
  const sorted = [...records].sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  const body = sorted.length
    ? sorted.map(renderConcept).join("\n\n")
    : "_No concepts captured yet._";

  return `# Concepts

${body}
`;
}

function renderConcept(record: ConceptRecord): string {
  const details = record.details ? `\n\n${record.details}` : "";
  const files = record.files.length ? `\n\nFiles: ${record.files.map((file) => `\`${file}\``).join(", ")}` : "";
  const tags = record.tags.length ? `\n\nTags: ${record.tags.map((tag) => `\`${tag}\``).join(", ")}` : "";

  return `## ${record.name}

${record.summary}${details}${files}${tags}

Record: \`${record.id}\` | Authority: ${record.authority} | Confidence: ${record.confidence}`;
}
