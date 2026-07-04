import type { AnyRecord, RecordType } from "../core/schemas";
import { recordTypes } from "../core/schemas";

export type IndexPageOptions = {
  repoName: string;
  description: string;
};

export function indexPage(records: Record<RecordType, AnyRecord[]>, options: IndexPageOptions): string {
  const counts = recordTypes
    .map((type) => `- ${label(type)}: ${records[type].length}`)
    .join("\n");

  return `# ${options.repoName} Wiki

${options.description}

This is the generated human-readable view of ${options.repoName}'s structured project knowledge.

## Pages

- [Concepts](./concepts.md)
- [Decisions](./decisions.md)
- [Devlog](./devlog.md)
- [Notes](./notes.md)
- [Symbols](./symbols.md)
- [Links](./links.md)

## Record Counts

${counts}
`;
}

function label(type: string): string {
  return type[0].toUpperCase() + type.slice(1);
}
