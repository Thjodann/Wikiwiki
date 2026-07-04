import type { AnyRecord, RecordType } from "../core/schemas";
import { recordTypes } from "../core/schemas";

export function indexPage(records: Record<RecordType, AnyRecord[]>): string {
  const counts = recordTypes
    .map((type) => `- ${label(type)}: ${records[type].length}`)
    .join("\n");

  return `# Wikiwiki

Wikiwiki is the generated human-readable view of this repo's structured project knowledge.

## Pages

- [Concepts](./concepts.md)
- [Decisions](./decisions.md)
- [Devlog](./devlog.md)
- [Notes](./notes.md)

## Record Counts

${counts}
`;
}

function label(type: string): string {
  return type[0].toUpperCase() + type.slice(1);
}
