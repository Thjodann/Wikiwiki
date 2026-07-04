<!-- Wikiwiki compile draft. Agent-authored prose belongs here; apply with `wk compile apply compile_e537eba8-4ad4-4a5c-b62e-9070c6eefd0b`. -->

# Symbols

Summarize important code symbols and where developers should look first.

## Composition Prompt

```text
Write the Symbols page for the DX human wiki.
Summarize important code symbols and where developers should look first.
Use polished human-readable prose, but do not invent facts beyond the source records.
Keep the Sources section compact and visible.
Draft id: compile_e537eba8-4ad4-4a5c-b62e-9070c6eefd0b
Created: 2026-07-04T02:50:31.053Z
Source records:
- concept concept_650e0409-9414-4667-8b40-f36c406a1cb0: CLI-first knowledge store
- concept concept_26478291-0b15-4363-b661-436bab183226: Spin heuristics
- concept concept_17ca8065-a8d3-4373-9afe-b47b51a424d3: Append-only record revisions
- concept concept_4fde0906-d53a-4b9f-b977-3fe964a9d447: Daily agent loop
- decision decision_e28e5351-dd00-4ba1-841d-278b639ae1c8: Use wk as primary CLI identity
- symbol symbol_9ee0c0cc-6687-47cd-8a48-b95d7e706652: activeRecords
- symbol symbol_3ff0b577-f648-4c44-a713-bd3c4bb57e98: registerRecordCommand
- symbol symbol_fa848524-5a78-4fc0-9781-cf7673acae13: registerSearchCommand
```

## Draft

The current symbol records highlight the active read and CLI lifecycle surfaces.

`activeRecords` selects the latest non-deleted revision for each logical id. It is central to keeping append-only storage usable while avoiding stale or deleted records in status, search, render, and compile output.

`registerRecordCommand` exposes the generic lifecycle commands: list, get, update, and delete. Those commands are the durable path for revising records without rewriting history.

`registerSearchCommand` gives agents a local query surface over active records and rendered Markdown. It is simple substring search today, but it establishes the shape for future retrieval-oriented context.

The compile pilot adds `createCompileDraft` and `applyCompileDraft` as the next important symbols to track. They are the bridge between agent-maintained records and human-readable role wikis.

## Sources

Draft: `compile_e537eba8-4ad4-4a5c-b62e-9070c6eefd0b` | Compiled: `PENDING`

Records:
- `concept_17ca8065-a8d3-4373-9afe-b47b51a424d3`
- `concept_26478291-0b15-4363-b661-436bab183226`
- `concept_4fde0906-d53a-4b9f-b977-3fe964a9d447`
- `concept_650e0409-9414-4667-8b40-f36c406a1cb0`
- `decision_e28e5351-dd00-4ba1-841d-278b639ae1c8`
- `symbol_3ff0b577-f648-4c44-a713-bd3c4bb57e98`
- `symbol_9ee0c0cc-6687-47cd-8a48-b95d7e706652`
- `symbol_fa848524-5a78-4fc0-9781-cf7673acae13`

Files:
- `README.md`
- `package-lock.json`
- `package.json`
- `src/cli/commands/record.ts`
- `src/cli/commands/search.ts`
- `src/cli/commands/spin.ts`
- `src/cli/commands/symbol.ts`
- `src/core/git.ts`
- `src/core/renderer.ts`
- `src/core/schemas.ts`
- `src/core/store.ts`
- `src/core/validator.ts`
- `src/index.ts`
- `test/cli.test.js`
