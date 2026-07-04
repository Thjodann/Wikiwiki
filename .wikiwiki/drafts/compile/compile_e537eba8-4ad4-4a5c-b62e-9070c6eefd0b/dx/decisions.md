<!-- Wikiwiki compile draft. Agent-authored prose belongs here; apply with `wk compile apply compile_e537eba8-4ad4-4a5c-b62e-9070c6eefd0b`. -->

# DX Decisions

Summarize technical and workflow decisions that shape developer experience.

## Composition Prompt

```text
Write the DX Decisions page for the DX human wiki.
Summarize technical and workflow decisions that shape developer experience.
Use polished human-readable prose, but do not invent facts beyond the source records.
Keep the Sources section compact and visible.
Draft id: compile_e537eba8-4ad4-4a5c-b62e-9070c6eefd0b
Created: 2026-07-04T02:50:31.053Z
Source records:
- concept concept_650e0409-9414-4667-8b40-f36c406a1cb0: CLI-first knowledge store
- concept concept_26478291-0b15-4363-b661-436bab183226: Spin heuristics
- concept concept_17ca8065-a8d3-4373-9afe-b47b51a424d3: Append-only record revisions
- concept concept_4fde0906-d53a-4b9f-b977-3fe964a9d447: Daily agent loop
- concept concept_4e17c000-edc9-4895-9da1-85cde9756eab: Role-oriented human wiki compiler
- decision decision_3b942fb5-f31d-4ffb-ae25-4c3d2dfab1bd: Use JSONL for MVP storage
- decision decision_e5333a83-7321-4a65-b040-12c1487f60e7: Prepare scoped npm package without publishing
- decision decision_e28e5351-dd00-4ba1-841d-278b639ae1c8: Use wk as primary CLI identity
- decision decision_5ad8c2cf-266c-4824-8833-1d40103933b9: Compile UX and DX human wikis through agent-mediated drafts
- note note_482c1563-27d5-48b3-a8f7-81075cc69b28: Generated wiki pages are owned by Wikiwiki; edit structured records instead.
- note note_e237de63-0391-4d81-8a69-f47666a6dfd7: User chose the supplied Wikiwiki banner image for the README and explicitly allo
- note note_db87ad39-e2dd-4cda-8da2-d11e7f1bbb92: User requested implementation of the Wikiwiki V1 creation plan: CLI-first, model
```

## Draft

The strongest DX decisions are about trust and agent ergonomics.

Wikiwiki uses JSONL because agents can inspect, append, validate, and repair it with ordinary tools. Record updates append new revisions instead of mutating old lines, which keeps agent edits auditable.

The package is `@thjodann/wk`, and the primary binary is `wk`. That short command matters because agents will type it constantly. The longer `wikiwiki` binary remains as a compatibility alias.

The compiler is intentionally agent-mediated. Rather than adding a direct LLM dependency, Wikiwiki creates a structured draft packet that Codex, Cursor, Claude Code, or another IDE agent can consume. This keeps the core portable while still taking advantage of modern agentic IDE workflows.

The direction is clear: `wk` should become repo memory middleware for agentic development environments.

## Sources

Draft: `compile_e537eba8-4ad4-4a5c-b62e-9070c6eefd0b` | Compiled: `PENDING`

Records:
- `concept_17ca8065-a8d3-4373-9afe-b47b51a424d3`
- `concept_26478291-0b15-4363-b661-436bab183226`
- `concept_4e17c000-edc9-4895-9da1-85cde9756eab`
- `concept_4fde0906-d53a-4b9f-b977-3fe964a9d447`
- `concept_650e0409-9414-4667-8b40-f36c406a1cb0`
- `decision_3b942fb5-f31d-4ffb-ae25-4c3d2dfab1bd`
- `decision_5ad8c2cf-266c-4824-8833-1d40103933b9`
- `decision_e28e5351-dd00-4ba1-841d-278b639ae1c8`
- `decision_e5333a83-7321-4a65-b040-12c1487f60e7`
- `note_482c1563-27d5-48b3-a8f7-81075cc69b28`
- `note_db87ad39-e2dd-4cda-8da2-d11e7f1bbb92`
- `note_e237de63-0391-4d81-8a69-f47666a6dfd7`

Files:
- `.github/workflows/ci.yml`
- `AGENTS.md`
- `README.md`
- `package-lock.json`
- `package.json`
- `src/cli/commands/compile.ts`
- `src/cli/commands/record.ts`
- `src/cli/commands/search.ts`
- `src/cli/commands/spin.ts`
- `src/cli/commands/symbol.ts`
- `src/core/compiler.ts`
- `src/core/git.ts`
- `src/core/renderer.ts`
- `src/core/schemas.ts`
- `src/core/store.ts`
- `src/core/validator.ts`
- `src/index.ts`
- `test/cli.test.js`
