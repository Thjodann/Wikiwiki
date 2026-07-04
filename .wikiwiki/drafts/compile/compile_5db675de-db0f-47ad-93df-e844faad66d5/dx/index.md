<!-- Wikiwiki compile draft. Agent-authored prose belongs here; apply with `wk compile apply compile_5db675de-db0f-47ad-93df-e844faad66d5`. -->

# DX Wiki

Orient developers, coding agents, and maintainers.

## Composition Prompt

```text
Write the DX Wiki page for the DX human wiki.
Orient developers, coding agents, and maintainers.
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
- event event_6c360d34-0e2b-414e-9445-af1fe597103a: Initialized Wikiwiki CLI MVP
- event event_d67ebd8e-e9f4-4c08-a011-72295a6e7210: Refreshed README with hero banner
- event event_410942e4-5e5f-445a-88be-db5aa7cfa176: Drafted aspirational README
- event event_bc62fab0-ba40-4a0e-8d3a-b816ea356345: Implemented Wikiwiki V1 CLI loop
- event event_1222a170-521f-476b-bd83-7359a4ba66c2: Renamed CLI identity to wk
- event event_da489cef-22d6-46db-989d-25eb52891c37: Aligned agent protocol with wk command
- event event_90e00cd6-ec7a-4890-9430-95fbd4ce85c8: Implemented UX/DX human wiki compile pilot
- note note_482c1563-27d5-48b3-a8f7-81075cc69b28: Generated wiki pages are owned by Wikiwiki; edit structured records instead.
- note note_e237de63-0391-4d81-8a69-f47666a6dfd7: User chose the supplied Wikiwiki banner image for the README and explicitly allo
- note note_db87ad39-e2dd-4cda-8da2-d11e7f1bbb92: User requested implementation of the Wikiwiki V1 creation plan: CLI-first, model
- symbol symbol_9ee0c0cc-6687-47cd-8a48-b95d7e706652: activeRecords
- symbol symbol_3ff0b577-f648-4c44-a713-bd3c4bb57e98: registerRecordCommand
- symbol symbol_fa848524-5a78-4fc0-9781-cf7673acae13: registerSearchCommand
- link link_f1dadf17-2e61-4024-bb02-d237e43ea911: decision_3b942fb5-f31d-4ffb-ae25-4c3d2dfab1bd chooses-storage src/core/store.ts
- link link_09cfb3d6-d044-48f2-832b-6d6f4e20faf0: README.md embeds assets/wikiwiki-banner.png
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
- `event_1222a170-521f-476b-bd83-7359a4ba66c2`
- `event_410942e4-5e5f-445a-88be-db5aa7cfa176`
- `event_6c360d34-0e2b-414e-9445-af1fe597103a`
- `event_90e00cd6-ec7a-4890-9430-95fbd4ce85c8`
- `event_bc62fab0-ba40-4a0e-8d3a-b816ea356345`
- `event_d67ebd8e-e9f4-4c08-a011-72295a6e7210`
- `event_da489cef-22d6-46db-989d-25eb52891c37`
- `link_09cfb3d6-d044-48f2-832b-6d6f4e20faf0`
- `link_f1dadf17-2e61-4024-bb02-d237e43ea911`
- `note_482c1563-27d5-48b3-a8f7-81075cc69b28`
- `note_db87ad39-e2dd-4cda-8da2-d11e7f1bbb92`
- `note_e237de63-0391-4d81-8a69-f47666a6dfd7`
- `symbol_3ff0b577-f648-4c44-a713-bd3c4bb57e98`
- `symbol_9ee0c0cc-6687-47cd-8a48-b95d7e706652`
- `symbol_fa848524-5a78-4fc0-9781-cf7673acae13`

Files:
- `.github/workflows/ci.yml`
- `AGENTS.md`
- `README.md`
- `assets/wikiwiki-banner.png`
- `package-lock.json`
- `package.json`
- `src/cli/commands`
- `src/cli/commands/compile.ts`
- `src/cli/commands/record.ts`
- `src/cli/commands/render.ts`
- `src/cli/commands/search.ts`
- `src/cli/commands/spin.ts`
- `src/cli/commands/symbol.ts`
- `src/core`
- `src/core/compiler.ts`
- `src/core/git.ts`
- `src/core/renderer.ts`
- `src/core/schemas.ts`
- `src/core/store.ts`
- `src/core/validator.ts`
- `src/index.ts`
- `src/templates`
- `test/cli.test.js`
- `test/compiler.test.js`
- `test/store.test.js`
- `wiki/devlog.md`
