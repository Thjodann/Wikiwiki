# Wikiwiki Agent Protocol

This repo uses Wikiwiki for agent-readable project knowledge.

## Before Starting Work

1. Run `wk status --json`.
2. Run `wk spin --json` to inspect current repo changes.
3. Review relevant records if available.

## During Work

- Treat user-authored records as higher authority than agent-authored records.
- Prefer adding structured records through the CLI instead of editing generated wiki files.
- Use `authority: "agent"` and an appropriate confidence level for inferred records.
- Use `authority: "user"` only when directly recording explicit user intent.
- Keep generated wiki files deterministic and plainly marked as generated.
- Use `wk compile draft` and `wk compile apply` for human-readable UX/DX wiki pages.

## After Making Changes

1. Run `wk spin --json`.
2. Add or update concepts, decisions, notes, events, or links as needed.
3. Run `wk validate`.
4. Run `wk render`.
5. Summarize knowledge updates in the final response.

## Generated Files

Wikiwiki owns generated Markdown files in `wiki/`.

Do not manually edit generated wiki files unless the user explicitly asks for a one-off repair. Prefer changing structured records in `.wikiwiki/records/`, then run `wk render`.

Human-readable role wikis live under `wiki/human/` and are published from compile drafts in `.wikiwiki/drafts/compile/`. Edit the draft packet, then run `wk compile apply <draft-id>`.

## Authority Rules

- `authority: "user"` means the record captures explicit user intent.
- `authority: "agent"` means the record is agent-authored or inferred.
- `authority: "system"` is reserved for tool or system-created records.

When uncertain, use lower confidence.
