import type { SymbolRecord } from "../core/schemas";

export function symbolsPage(records: SymbolRecord[]): string {
  const sorted = [...records].sort((a, b) =>
    a.name.localeCompare(b.name) || a.file.localeCompare(b.file) || a.id.localeCompare(b.id)
  );
  const body = sorted.length
    ? sorted.map(renderSymbol).join("\n\n")
    : "_No symbols captured yet._";

  return `# Symbols

${body}
`;
}

function renderSymbol(record: SymbolRecord): string {
  return `## ${record.name}

Kind: ${record.kind}

File: \`${record.file}\`

${record.summary || "_No summary recorded._"}

Record: \`${record.id}\` | Authority: ${record.authority} | Confidence: ${record.confidence}`;
}
