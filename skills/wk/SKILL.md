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
3. If the repo is not initialized and the user wants Wikiwiki adopted, run `wk setup --profile mixed --audience all` unless the user clearly wants `user`, `developer`, or a narrower site audience.
4. If `.beads/` exists, run `bd prime` before wiki work when `bd` is available.
5. Run `wk status --json`.
6. Run `wk spin --profile mixed --json` unless the repo config or user request specifies another profile.
7. Read relevant existing records before adding new ones.

## During Work

- Use `authority: "user"` only for explicit user intent.
- Use `authority: "agent"` for agent-authored or inferred records.
- Use lower confidence for guesses, partial summaries, stale information, or uncertain file relationships.
- Prefer CLI commands over hand-editing JSONL records.
- Prefer existing project scripts such as `npm run wiki:site` when they exist.
- Avoid unnecessary LLM calls for deterministic work that `wk` or repo scripts can do directly.
- If `.beads/` exists, use Beads for task state, blockers, dependencies, ownership, and follow-ups.
- Use Wikiwiki for durable knowledge, decisions, generated Markdown, static wiki sites, and human-facing wiki drafts.
- Do not import Beads issues as Wikiwiki records unless they contain lasting knowledge worth recording separately.
- Use audience tags consistently: `audience:user`, `audience:developer`, or `audience:all`.
- For user-facing first-pass material, prefer tags such as `getting-started`, `instructions`, `faq`, `troubleshooting`, `privacy`, and `features`.
- For developer-facing material, prefer tags such as `architecture`, `data-model`, `generated-files`, `maintenance`, `tests`, and `symbol`.
- Do not manually edit generated files in `wiki/`, `wiki-site/`, or `wiki/human/` unless the user asks for a one-off repair.
- Keep record prose factual and compact; human-facing narrative belongs in compile drafts or generated site pages.

## Useful Commands

Inspect:

```sh
bd prime # only when .beads/ exists and bd is available
wk setup --profile mixed --audience all
wk status --json
wk spin --profile mixed --json
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
wk site --audience all
wk site --audience user
wk site --audience all --source-base-url https://github.com/OWNER/REPO/blob/main/
```

Agent setup:

```sh
wk install-agent codex
wk install-agent codex --yes
# Only after inspecting an existing non-empty destination:
wk install-agent codex --yes --force
```

Human wiki drafts:

```sh
wk compile draft --role all --json
wk compile apply <draft-id> --json
```

Objective closeout:

```sh
wk closeout --profile mixed --audience all --json
```

## Closeout

After meaningful repo changes:

1. Run `wk closeout --profile mixed --audience all --json` unless the repo config or user request specifies another profile/audience.
2. Review `.wikiwiki/drafts/closeout/<closeout-id>/summary.md` and `.wikiwiki/drafts/closeout/<closeout-id>/record-drafts/`. In Beads repos, the summary includes read-only Beads context.
3. Apply only the record drafts that are true, useful, and properly sourced.
4. If records changed, run `wk validate`, `wk render`, and `wk site --audience all`; also run `wk site --audience user` when checking the standard user experience.
5. Summarize any knowledge updates and closeout draft path in the final response.

Closeout drafts are deterministic prompts, not automatic truth. Do not treat a
draft JSON file as a record until a user or agent deliberately applies it with
the appropriate `wk <type> add --json ...` command.

## Install Guidance For Users

When a user asks how to set up Wikiwiki for an agentic IDE:

- Explain that Wikiwiki works without AI through the CLI and repo scripts.
- Recommend installing the `wk` CLI first.
- Recommend `wk setup --profile mixed --audience all` before adding agent-specific instructions.
- If the repo uses Beads, recommend keeping `bd init` / `bd setup codex` as Beads' own setup and then installing Wikiwiki's skill. Do not overwrite or duplicate Beads' agent instructions.
- Explain that `wk setup` creates `.wikiwiki/config.json`, adds safe package scripts when `package.json` exists, and refuses conflicting scripts unless `--force` is explicit.
- Recommend `wk spin --profile mixed --json` for first-pass dogfood, then audience tags on every durable user/developer record.
- Recommend `wk closeout --profile mixed --audience all --json` after meaningful work; clarify that it creates reviewable drafts and does not append records automatically.
- Recommend installing this skill into the agent's skill/custom-instructions system with `wk install-agent codex` when supported.
- Explain that `wk install-agent codex --yes` refuses unknown destination files; use `--force` only after the user or agent has inspected the destination.
- For Codex-compatible skills, copy this `SKILL.md` into `${CODEX_HOME:-$HOME/.codex}/skills/wk/SKILL.md`.
- For other agentic IDEs, copy the body of this file into the IDE's persistent agent instructions and keep the start/closeout loops intact.

Keep setup advice local-first, script-first, and provider-agnostic.

## Beads Coordination

When `.beads/` exists, treat Beads as the repo's task and work-memory layer:

- Run `bd prime` before wiki work when `bd` is available.
- Use Beads for task state, blockers, dependencies, ownership, and follow-ups.
- Use Wikiwiki for durable knowledge, decisions, generated Markdown, static site generation, and human wiki drafts.
- Let `wk closeout` include Beads-linked context, then update Wikiwiki records only for lasting knowledge.
- Do not mutate Beads through Wikiwiki. Use `bd` directly for Beads task changes.

The same skill is safe in non-Beads repos. If `.beads/` is absent, skip Beads
steps and use the normal Wikiwiki flow.

## Site Theme Guidance

When asked to make the human wiki match a project, edit `.wikiwiki/site-theme.json` rather than generated CSS. Keep changes restrained and semantic: project name, description, accent colors, neutral surfaces, border radius, code background, and font family. Then run `wk site`.
