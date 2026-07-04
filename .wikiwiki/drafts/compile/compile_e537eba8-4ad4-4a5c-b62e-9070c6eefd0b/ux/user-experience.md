<!-- Wikiwiki compile draft. Agent-authored prose belongs here; apply with `wk compile apply compile_e537eba8-4ad4-4a5c-b62e-9070c6eefd0b`. -->

# User Experience

Describe the product loop, user-facing behavior, and experience principles.

## Composition Prompt

```text
Write the User Experience page for the UX human wiki.
Describe the product loop, user-facing behavior, and experience principles.
Use polished human-readable prose, but do not invent facts beyond the source records.
Keep the Sources section compact and visible.
Draft id: compile_e537eba8-4ad4-4a5c-b62e-9070c6eefd0b
Created: 2026-07-04T02:50:31.053Z
Source records:
- concept concept_4e17c000-edc9-4895-9da1-85cde9756eab: Role-oriented human wiki compiler
- decision decision_3b942fb5-f31d-4ffb-ae25-4c3d2dfab1bd: Use JSONL for MVP storage
- decision decision_5ad8c2cf-266c-4824-8833-1d40103933b9: Compile UX and DX human wikis through agent-mediated drafts
- note note_e237de63-0391-4d81-8a69-f47666a6dfd7: User chose the supplied Wikiwiki banner image for the README and explicitly allo
```

## Draft

The Wikiwiki experience is built around a calm daily loop.

An agent starts by checking repo knowledge with `wk status --json`, then asks `wk spin --json` what changed. When useful context appears, the agent records it as a concept, decision, event, note, symbol, or link. Validation keeps those records honest. Rendering and compiling turn them into documentation.

For humans, the interaction should feel less like managing a wiki and more like receiving a maintained project briefing. The generated pages are marked as generated, and human-readable compile pages include visible source records and files.

That visible provenance is central to the UX. The reader should not have to wonder whether a paragraph came from nowhere. A Wikiwiki page should make it clear which records and files shaped it.

## Sources

Draft: `compile_e537eba8-4ad4-4a5c-b62e-9070c6eefd0b` | Compiled: `PENDING`

Records:
- `concept_4e17c000-edc9-4895-9da1-85cde9756eab`
- `decision_3b942fb5-f31d-4ffb-ae25-4c3d2dfab1bd`
- `decision_5ad8c2cf-266c-4824-8833-1d40103933b9`
- `note_e237de63-0391-4d81-8a69-f47666a6dfd7`

Files:
- `AGENTS.md`
- `README.md`
- `src/cli/commands/compile.ts`
- `src/core/compiler.ts`
- `src/core/schemas.ts`
- `src/core/store.ts`
