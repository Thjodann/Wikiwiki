---
name: wk
description: Use when working in a code repository that uses or should use Wikiwiki/wk for article-first project wikis, agent-maintained living docs, structured repo memory, generated Markdown, static wiki sites, UX/DX human wiki drafts, or agent closeout knowledge updates. Trigger when the user asks to keep docs current, capture or update articles/decisions/events/notes/symbols/links, dogfood Wikiwiki, inspect changes with wk spin, render wiki/, generate wiki-site/, set up agentic IDE instructions, or update wk.
---

# WK

## Overview

Use `wk` as the repo-local memory loop for agents. It keeps durable project knowledge in `.wikiwiki/records/*.jsonl`, treats `article` records as the public wiki pages, renders deterministic Markdown into `wiki/`, and generates the human-facing static site in `wiki-site/`.

Prefer JSON output, preserve user work, and treat structured records as the source of truth. Records are the ledger; articles are the wiki. Lean on deterministic CLI commands for status, validation, rendering, site generation, and search; use model judgment for deciding what knowledge matters, updating public article prose, attaching source records, and polishing drafts. The generated site should feel like the user's project wiki; keep Wikiwiki itself quiet unless credit or setup context is needed.

## Bare Invocation Default

When the user invokes only `wk`, `/wk`, `$wk`, or `[$wk](...)` with no
additional request, treat it as "show me the generated wiki site." Do not run
the normal status/spin workflow, do not modify files, and do not explain the
skill. Find the current repo root or workspace, prefer an existing
`wiki-site/index.html`, and return a single concise Markdown link using the
absolute local file path. If the site is already known to be served through a
local URL, a direct URL to that same generated site is also acceptable. Do not
start a server just for a bare invocation. If no generated site exists, say so
briefly and suggest `wk site --audience all` or the repo's `wiki:site` script.

## Start Of Work

1. Find the repo root before running `wk`.
2. If `wk` is unavailable, try the repo-local fallback in this order:
   - `node dist/index.js <command>` when working inside the Wikiwiki repo.
   - `npm run dev -- <command>` when the repo has Wikiwiki source installed.
   - `npx @thjodann/wk <command>` when the package is available.
3. If the repo is not initialized and the user wants Wikiwiki adopted in Codex, run `wk setup --profile mixed --audience all --agent codex` unless the user clearly wants `user`, `developer`, or a narrower local site audience.
4. If `.beads/` exists, run `bd prime` before wiki work when `bd` is available.
5. Run `wk status --json`.
6. Run `wk spin --profile mixed --json` unless the repo config or user request specifies another profile.
7. Read relevant existing articles first, then supporting records before adding new ones.

## During Work

- Use `authority: "user"` only for explicit user intent.
- Use `authority: "agent"` for agent-authored or inferred records.
- Use lower confidence for guesses, partial summaries, stale information, or uncertain file relationships.
- Prefer CLI commands over hand-editing JSONL records.
- Prefer existing project scripts such as `npm run wiki:site` when they exist.
- Avoid unnecessary LLM calls for deterministic work that `wk` or repo scripts can do directly.
- If `.beads/` exists, use Beads for task state, blockers, dependencies, ownership, and follow-ups.
- Use Wikiwiki for public articles, durable knowledge, decisions, generated Markdown, static wiki sites, and human-facing wiki drafts.
- Do not import Beads issues as Wikiwiki records unless they contain lasting knowledge worth recording separately.
- When public knowledge changes, add or update `article` records. Use `source_record_ids` to connect articles to concepts, decisions, notes, events, symbols, or links that support the article.
- Use concepts, decisions, notes, events, symbols, and links as evidence and maintainer context, not as the default public destination.
- Prefer titled notes for durable reminders. Untitled notes are acceptable for quick context and render as dated notes.
- Use audience tags consistently: `audience:user`, `audience:developer`, or `audience:all`.
- For user-facing first-pass material, prefer tags such as `getting-started`, `instructions`, `faq`, `troubleshooting`, `privacy`, and `features`.
- For developer-facing material, prefer tags such as `architecture`, `data-model`, `generated-files`, `maintenance`, `tests`, and `symbol`.
- Do not manually edit generated files in `wiki/`, `wiki-site/`, or `wiki/human/` unless the user asks for a one-off repair.
- Keep record prose factual and compact; human-facing narrative belongs in compile drafts or generated site pages.

## Useful Commands

Inspect:

```sh
bd prime # only when .beads/ exists and bd is available
wk setup --profile mixed --audience all --agent codex
wk status --json
wk spin --profile mixed --json
wk search <query> --json
```

Add knowledge:

```sh
wk article add --json '{...}'
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

## Practical Article Loop

For normal wiki maintenance during development:

1. Inspect: `wk status --json`, then `wk spin --profile mixed --json`.
2. Read relevant article records first, then supporting records and source files.
3. Update article records when public wiki knowledge changes.
4. Add concepts, decisions, notes, events, symbols, or links when they provide durable evidence or maintainer context.
5. Run `wk validate`, `wk render`, and `wk site --audience all`.
6. Run `wk closeout --profile mixed --audience all --json` for meaningful objectives and review the draft packet before applying any suggested records.

## First Install Style And Substance

When adopting Wikiwiki in a repo for the first time, do more than make a valid
wiki. Make the first generated site feel native to the host project:

1. Run `wk setup --profile mixed --audience all --agent codex` in Codex-compatible IDEs so repo setup also installs the companion `/wk` skill.
2. Inspect README/docs/package metadata for product identity and durable facts.
3. Inspect actual visual sources before writing a theme: app/global CSS, design
   tokens, theme files, landing page styles, app shell/layout styles, and any
   existing brand palette files.
4. Run `wk theme preview --json`. If the preview looks right, run
   `wk theme init`; otherwise pass explicit `--project-name`, `--description`,
   or `--mood`, then preview again.
5. Seed high-signal records for product promise, privacy/data boundary,
   architecture, distribution/support, important symbols, and a devlog event.
6. Run `wk validate`, `wk render`, and `wk site --audience all`.
7. Verify the generated site locally: Auto/Light/Dark controls, default theme,
   search, local links/source-file links, and contrast for body text, muted
   text, accents, badges, and tags.

Do not edit generated CSS in `wiki-site/`. The source of truth is
`.wikiwiki/site-theme.json` plus structured records.

## Update wk

When a user asks "Update wk", treat it as a request to update both the CLI and
the installed agent instructions when possible.

1. Inspect before changing anything:

```sh
command -v wk || true
wk --version || true
git status --short
```

2. If npm is available, update the repo-local CLI from the published npm
package:

```sh
test "$(npm prefix)" = "$PWD" || npm init -y
npm install --prefix "$PWD" --save-dev @thjodann/wk@latest
./node_modules/.bin/wk --version
./node_modules/.bin/wk install-agent codex --yes
```

If the project uses another JavaScript package manager, use the closest
equivalent and keep the install rooted in the target repo. Do not default to a
GitHub source install now that npm is the release channel.

3. If npm and equivalent package managers are not available, do not pretend the
CLI was updated. Refresh only the agent skill from GitHub raw files, preserving
unknown local files:

```sh
WK_SKILL_HOME="${CODEX_HOME:-$HOME/.codex}/skills/wk"
tmpdir="$(mktemp -d)"
mkdir -p "$tmpdir/agents" "$WK_SKILL_HOME/agents"
curl -fsSL https://raw.githubusercontent.com/Thjodann/Wikiwiki/main/skills/wk/SKILL.md \
  -o "$tmpdir/SKILL.md"
curl -fsSL https://raw.githubusercontent.com/Thjodann/Wikiwiki/main/skills/wk/agents/openai.yaml \
  -o "$tmpdir/agents/openai.yaml"
cp "$tmpdir/SKILL.md" "$WK_SKILL_HOME/SKILL.md"
cp "$tmpdir/agents/openai.yaml" "$WK_SKILL_HOME/agents/openai.yaml"
rm -rf "$tmpdir"
```

Then tell the user plainly: the wk agent instructions were refreshed, but the
`wk` CLI still needs npm, another JavaScript package manager, or a release
artifact to update.

4. Verify the result that is actually available:

```sh
wk --version || true
wk status --json || true
```

Never delete lockfiles, overwrite unknown agent files, or force a skill install
unless the user explicitly approves that risk.

## Closeout

After meaningful repo changes:

1. Run `wk closeout --profile mixed --audience all --json` unless the repo config or user request specifies another profile/audience.
2. Review `.wikiwiki/drafts/closeout/<closeout-id>/summary.md` and `.wikiwiki/drafts/closeout/<closeout-id>/record-drafts/`. In Beads repos, the summary reports detected Beads state; detailed Beads context appears only when the repo explicitly enables it and `bd` reads cleanly.
3. Apply only the record drafts that are true, useful, and properly sourced.
4. If articles or records changed, run `wk validate`, `wk render`, and `wk site --audience all`; also run `wk site --audience user` when checking the standard user experience.
5. Summarize any knowledge updates and closeout draft path in the final response.

Closeout drafts are deterministic prompts, not automatic truth. Do not treat a
draft JSON file as a record until a user or agent deliberately applies it with
the appropriate `wk <type> add --json ...` command.

## Install Guidance For Users

When a user asks how to set up Wikiwiki for an agentic IDE:

- Explain that Wikiwiki works without AI through the CLI and repo scripts.
- Recommend installing the `wk` CLI first.
- Recommend `wk setup --profile mixed --audience all --agent codex` for Codex-compatible IDEs so repo setup also installs the companion `/wk` skill.
- If the repo uses Beads, recommend keeping `bd init` / `bd setup codex` as Beads' own setup, then run Wikiwiki setup with `--agent codex`. Do not overwrite or duplicate Beads' agent instructions.
- Explain that `wk setup` creates `.wikiwiki/config.json`, adds safe package scripts when `package.json` exists, and refuses conflicting scripts unless `--force` is explicit.
- Recommend `wk spin --profile mixed --json` for first-pass dogfood, then article records for public pages and audience tags on every durable user/developer record.
- Recommend `wk closeout --profile mixed --audience all --json` after meaningful work; clarify that it creates reviewable drafts and does not append records automatically.
- Explain that `wk install-agent codex` remains available for previewing or refreshing only the companion skill.
- Explain that `wk install-agent codex --yes` refuses unknown destination files; use `--force` only after the user or agent has inspected the destination.
- For Codex-compatible skills, `--agent codex` installs this skill into `${CODEX_HOME:-$HOME/.codex}/skills/wk/`; use `--agent-dest` only for custom destinations.
- For other agentic IDEs, copy the body of this file into the IDE's persistent agent instructions and keep the start/closeout loops intact.

Keep setup advice local-first, script-first, and provider-agnostic.

## Beads Coordination

When `.beads/` exists, treat Beads as the repo's task and work-memory layer:

- Run `bd prime` before wiki work when `bd` is available.
- Use Beads for task state, blockers, dependencies, ownership, and follow-ups.
- Use Wikiwiki for public articles, durable knowledge, decisions, generated Markdown, static site generation, and human wiki drafts.
- Let `wk closeout` report Beads detection, and include detailed Beads-linked context only when `.wikiwiki/config.json` explicitly sets `integrations.beads.enabled` to `true` and the read does not dirty `.beads/`.
- Do not mutate Beads through Wikiwiki. Use `bd` directly for Beads task changes.

The same skill is safe in non-Beads repos. If `.beads/` is absent, skip Beads
steps and use the normal Wikiwiki flow.

## Site Theme Guidance

When asked to make the human wiki match a project, edit `.wikiwiki/site-theme.json` rather than generated CSS. Prefer `wk theme preview --json` and `wk theme init` first because they inspect CSS/design sources when present. If you hand-edit, use the host project's real visual language literally: default color mode, paired light/dark palettes, accent spectrum, neutral surfaces, sidebar/hero/card gradients, brand gradient, badge/tag colors, focus ring, gloss, shadows, border radius, code background, and font family. Then run `wk validate`, `wk render`, and `wk site`.
