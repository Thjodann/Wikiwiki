<!-- Wikiwiki compile draft. Agent-authored prose belongs here; apply with `wk compile apply compile_e537eba8-4ad4-4a5c-b62e-9070c6eefd0b`. -->

# UX Decisions

Summarize product and experience decisions that shape the user experience.

## Composition Prompt

```text
Write the UX Decisions page for the UX human wiki.
Summarize product and experience decisions that shape the user experience.
Use polished human-readable prose, but do not invent facts beyond the source records.
Keep the Sources section compact and visible.
Draft id: compile_e537eba8-4ad4-4a5c-b62e-9070c6eefd0b
Created: 2026-07-04T02:50:31.053Z
Source records:
- concept concept_4e17c000-edc9-4895-9da1-85cde9756eab: Role-oriented human wiki compiler
- decision decision_3b942fb5-f31d-4ffb-ae25-4c3d2dfab1bd: Use JSONL for MVP storage
- decision decision_5ad8c2cf-266c-4824-8833-1d40103933b9: Compile UX and DX human wikis through agent-mediated drafts
- note note_482c1563-27d5-48b3-a8f7-81075cc69b28: Generated wiki pages are owned by Wikiwiki; edit structured records instead.
- note note_e237de63-0391-4d81-8a69-f47666a6dfd7: User chose the supplied Wikiwiki banner image for the README and explicitly allo
- note note_db87ad39-e2dd-4cda-8da2-d11e7f1bbb92: User requested implementation of the Wikiwiki V1 creation plan: CLI-first, model
```

## Draft

Several product decisions define the current Wikiwiki experience.

First, records stay local to the repo. This keeps the product understandable and auditable. There is no hosted service or hidden database required for the V1 loop.

Second, Wikiwiki keeps a boundary between source records and generated pages. Humans can read the Markdown, but agents are guided to edit structured records first.

Third, the project now separates UX and DX human wikis. UX pages explain what the product is, who it helps, and how the experience should feel. DX pages explain how to build, maintain, and extend the tool.

Finally, `wk compile` stays agent-mediated. The CLI creates page plans and provenance bundles; the active IDE agent authors the prose; `wk compile apply` validates and publishes the result.

## Sources

Draft: `compile_e537eba8-4ad4-4a5c-b62e-9070c6eefd0b` | Compiled: `PENDING`

Records:
- `concept_4e17c000-edc9-4895-9da1-85cde9756eab`
- `decision_3b942fb5-f31d-4ffb-ae25-4c3d2dfab1bd`
- `decision_5ad8c2cf-266c-4824-8833-1d40103933b9`
- `note_482c1563-27d5-48b3-a8f7-81075cc69b28`
- `note_db87ad39-e2dd-4cda-8da2-d11e7f1bbb92`
- `note_e237de63-0391-4d81-8a69-f47666a6dfd7`

Files:
- `AGENTS.md`
- `README.md`
- `src/cli/commands/compile.ts`
- `src/core/compiler.ts`
- `src/core/schemas.ts`
- `src/core/store.ts`
