---
name: wk
description: Use when working in a code repository that uses or should use Wikiwiki/wk for agent-maintained living docs, structured repo memory, generated Markdown, static wiki sites, UX/DX human wiki drafts, or agent closeout knowledge updates. Trigger when the user asks to keep docs current, capture repo decisions/events/notes/symbols/links, dogfood Wikiwiki, inspect changes with wk spin, render wiki/, generate wiki-site/, or set up agentic IDE instructions.
---

# WK

## Overview

Use `wk` as the repo-local memory loop for agents. It keeps durable project knowledge in `.wikiwiki/records/*.jsonl`, renders deterministic Markdown into `wiki/`, and generates the human-facing static site in `wiki-site/`.

Prefer JSON output, preserve user work, and treat structured records as the source of truth. Lean on deterministic CLI commands for status, validation, rendering, site generation, and search; use model judgment for deciding what knowledge matters, writing concise records, curating human-facing material, and polishing drafts. The generated site should feel like the user's project wiki; keep Wikiwiki itself quiet unless credit or setup context is needed.

## Start Of Work

1. Find the repo root before running `wk`.
2. If `wk` is unavailable, try the repo-local fallback in this order:
   - `node dist/index.js <command>` when working inside the Wikiwiki repo.
   - `npm run dev -- <command>` when the repo has Wikiwiki source installed.
   - `npx @thjodann/wk <command>` when the package is available.
3. If the repo is not initialized and the user wants Wikiwiki adopted, run `wk init`.
4. Run `wk status --json`.
5. Run `wk spin --json`.
6. Read relevant existing records before adding new ones.

## During Work

- Use `authority: "user"` only for explicit user intent.
- Use `authority: "agent"` for agent-authored or inferred records.
- Use lower confidence for guesses, partial summaries, stale information, or uncertain file relationships.
- Prefer CLI commands over hand-editing JSONL records.
- Prefer existing project scripts such as `npm run wiki:site` when they exist.
- Avoid unnecessary LLM calls for deterministic work that `wk` or repo scripts can do directly.
- Do not manually edit generated files in `wiki/`, `wiki-site/`, or `wiki/human/` unless the user asks for a one-off repair.
- Keep record prose factual and compact; human-facing narrative belongs in compile drafts or generated site pages.

## Useful Commands

Inspect:

```sh
wk status --json
wk spin --json
wk search <query> --json
```

Add knowledge:

```sh
wk concept add --json '{...}'
wk decision add --json '{...}'
wk event add --json '{...}'
wk note add --json '{...}'
wk symbol add --json '{...}'
wk link add --json '{...}'
```

Revise knowledge append-only:

```sh
wk record list <type> --json
wk record get <type> <id> --json
wk record update <type> <id> --json '{...}'
wk record delete <type> <id> --reason "..."
```

Generate:

```sh
wk validate
wk render
wk site
wk site --source-base-url https://github.com/OWNER/REPO/blob/main/
```

Agent setup:

```sh
wk install-agent codex
wk install-agent codex --yes
```

Human wiki drafts:

```sh
wk compile draft --role all --json
wk compile apply <draft-id> --json
```

## Closeout

After meaningful repo changes:

1. Run `wk spin --json`.
2. Add or update records for durable decisions, events, notes, concepts, symbols, or links.
3. Run `wk validate`.
4. Run `wk render`.
5. Run `wk site` when the human static wiki should stay current.
6. Summarize any knowledge updates in the final response.

## Install Guidance For Users

When a user asks how to set up Wikiwiki for an agentic IDE:

- Explain that Wikiwiki works without AI through the CLI and repo scripts.
- Recommend installing the `wk` CLI first.
- Recommend adding scriptable commands such as `wiki:check` or `wiki:site` before adding agent-specific instructions.
- Recommend installing this skill into the agent's skill/custom-instructions system with `wk install-agent codex` when supported.
- For Codex-compatible skills, copy this `SKILL.md` into `${CODEX_HOME:-$HOME/.codex}/skills/wk/SKILL.md`.
- For other agentic IDEs, copy the body of this file into the IDE's persistent agent instructions and keep the start/closeout loops intact.

Keep setup advice local-first, script-first, and provider-agnostic.

## Site Theme Guidance

When asked to make the human wiki match a project, edit `.wikiwiki/site-theme.json` rather than generated CSS. Keep changes restrained and semantic: project name, description, accent colors, neutral surfaces, border radius, code background, and font family. Then run `wk site`.
