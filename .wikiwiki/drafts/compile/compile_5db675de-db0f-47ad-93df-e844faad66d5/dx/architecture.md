<!-- Wikiwiki compile draft. Agent-authored prose belongs here; apply with `wk compile apply compile_5db675de-db0f-47ad-93df-e844faad66d5`. -->

# Architecture

Describe storage, revision, validation, rendering, search, and compile architecture.

## Composition Prompt

```text
Write the Architecture page for the DX human wiki.
Describe storage, revision, validation, rendering, search, and compile architecture.
Use polished human-readable prose, but do not invent facts beyond the source records.
Keep the Sources section compact and visible.
Draft id: compile_5db675de-db0f-47ad-93df-e844faad66d5
Created: 2026-07-04T03:06:17.231Z
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
- symbol symbol_9ee0c0cc-6687-47cd-8a48-b95d7e706652: activeRecords
- symbol symbol_3ff0b577-f648-4c44-a713-bd3c4bb57e98: registerRecordCommand
- symbol symbol_fa848524-5a78-4fc0-9781-cf7673acae13: registerSearchCommand
```

## Draft

TODO: Replace this section with polished, role-specific prose for the dx wiki.

## Sources

Draft: `compile_5db675de-db0f-47ad-93df-e844faad66d5` | Compiled: `PENDING`

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
- `symbol_3ff0b577-f648-4c44-a713-bd3c4bb57e98`
- `symbol_9ee0c0cc-6687-47cd-8a48-b95d7e706652`
- `symbol_fa848524-5a78-4fc0-9781-cf7673acae13`

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
