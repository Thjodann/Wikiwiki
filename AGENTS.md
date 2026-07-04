# Wikiwiki Agent Protocol

This repo uses Wikiwiki for agent-readable project knowledge.

## Before Starting Work

1. Run `wk status --json`.
2. Run `wk spin --profile mixed --json` to inspect current repo changes unless config or the user specifies another profile.
3. Review relevant records if available.

## During Work

- Treat user-authored records as higher authority than agent-authored records.
- Prefer adding structured records through the CLI instead of editing generated wiki files.
- Use `authority: "agent"` and an appropriate confidence level for inferred records.
- Use `authority: "user"` only when directly recording explicit user intent.
- Keep generated wiki files deterministic and plainly marked as generated.
- Use `wk setup --profile mixed --audience all` when adopting Wikiwiki in a repo.
- Use `wk compile draft` and `wk compile apply` for human-readable UX/DX wiki pages.

## After Making Changes

1. Run `wk closeout --profile mixed --audience all --json` unless config or the user specifies another profile/audience.
2. Review `.wikiwiki/drafts/closeout/<closeout-id>/record-drafts/`.
3. Add or update concepts, decisions, notes, events, symbols, or links only when drafts are true and useful.
4. Run `wk validate`, `wk render`, and `wk site` when records or human-facing wiki output changed.
5. Summarize knowledge updates and closeout draft path in the final response.

## Generated Files

Wikiwiki owns generated Markdown files in `wiki/` and generated static site files in `wiki-site/`.

Do not manually edit generated wiki files unless the user explicitly asks for a one-off repair. Prefer changing structured records in `.wikiwiki/records/`, then run `wk render`.

Human-readable role wikis live under `wiki/human/` and are published from compile drafts in `.wikiwiki/drafts/compile/`. Edit the draft packet, then run `wk compile apply <draft-id>`.

## Authority Rules

- `authority: "user"` means the record captures explicit user intent.
- `authority: "agent"` means the record is agent-authored or inferred.
- `authority: "system"` is reserved for tool or system-created records.

When uncertain, use lower confidence.
