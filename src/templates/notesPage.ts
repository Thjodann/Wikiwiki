import type { NoteRecord } from "../core/schemas";

export function notesPage(records: NoteRecord[]): string {
  const sorted = [...records].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
  const body = sorted.length
    ? sorted.map(renderNote).join("\n\n")
    : "_No notes captured yet._";

  return `# Notes

${body}
`;
}

function renderNote(record: NoteRecord): string {
  const tags = record.tags.length ? `\n\nTags: ${record.tags.map((tag) => `\`${tag}\``).join(", ")}` : "";
  const files = record.files.length ? `\n\nFiles: ${record.files.map((file) => `\`${file}\``).join(", ")}` : "";

  return `## ${record.created_at}

${record.body}${files}${tags}

Record: \`${record.id}\` | Authority: ${record.authority} | Confidence: ${record.confidence}`;
}
