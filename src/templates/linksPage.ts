import type { LinkRecord } from "../core/schemas";

export function linksPage(records: LinkRecord[]): string {
  const sorted = [...records].sort((a, b) =>
    a.from.localeCompare(b.from) ||
    a.relationship.localeCompare(b.relationship) ||
    a.to.localeCompare(b.to) ||
    a.id.localeCompare(b.id)
  );
  const body = sorted.length
    ? sorted.map(renderLink).join("\n\n")
    : "_No links captured yet._";

  return `# Links

${body}
`;
}

function renderLink(record: LinkRecord): string {
  return `## ${record.relationship}

From: \`${record.from}\`

To: \`${record.to}\`

Record: \`${record.id}\` | Authority: ${record.authority} | Confidence: ${record.confidence}`;
}
