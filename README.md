<p align="center">
  <img src="https://raw.githubusercontent.com/Thjodann/Wikiwiki/main/assets/wikiwiki-banner.png" alt="Wikiwiki banner: Spin the docs. Ship the code." width="100%">
</p>

# Wikiwiki

> Spin the docs. Ship the code.

Wikiwiki is quiet infrastructure for a project's own wiki. It works as a plain
CLI for teams that do not use AI tools, and it becomes more capable when an
agentic IDE uses the same commands while code changes.

The goal is simple: keep a baseline project wiki scriptable, local, and
deterministic without requiring LLM calls; then let agents add judgment,
curation, and narrative when they are available. No hosted service, database,
vector store, or hidden memory layer is required.

## Why Wikiwiki

Software teams lose context in the spaces between code:

- why a system exists
- what a module is responsible for
- which decisions shaped the current design
- what changed during a messy implementation session
- which generated docs should never be edited by hand

Wikiwiki turns that context into repo-local knowledge. Scripts can validate and
render it with boring terminal commands. Agents can enrich it when they are part
of the workflow. Humans browse a wiki that leads with the project, not the
generator. Future tools can query the same structured data.

Docs that keep up, in other words.

## The Loop

Wikiwiki is built around a small, repeatable workflow:

```sh
wk setup --profile mixed --audience all
wk status --json
wk spin --profile mixed --json
wk note add "Renderer owns generated wiki files." --tags renderer,docs
wk validate
wk render
wk site --audience all
wk closeout --profile mixed --audience all
```

That loop can run from a terminal, package script, Git hook, CI job, or agentic
IDE. It lets a project:

1. Inspect the current knowledge store.
2. Read working tree changes.
3. Add concepts, decisions, notes, events, symbols, and links.
4. Validate the records.
5. Render Markdown into `wiki/`.
6. Render a browseable static site into `wiki-site/`.
7. Create a closeout draft packet when a meaningful objective is done.

The structured records are the source of truth. Markdown stays simple and
deterministic for agents. The static site is the first-class human wiki.

## Automation Model

Wikiwiki has two layers.

**Deterministic baseline:** install the CLI, keep `.wikiwiki/records/` in the
repo, and run scripts that validate, render Markdown, and build the static site.
This path works without AI tools and should stay useful for any project.

Use `wk setup` to create `.wikiwiki/config.json` and add package scripts when a
`package.json` exists:

```sh
wk setup --profile mixed --audience all
```

```json
{
  "scripts": {
    "wiki:status": "wk status --json",
    "wiki:spin": "wk spin --profile mixed --json",
    "wiki:check": "wk validate",
    "wiki:render": "wk validate && wk render",
    "wiki:site": "wk validate && wk render && wk site --audience all",
    "wiki:site:user": "wk validate && wk render && wk site --audience user",
    "wiki:closeout": "wk closeout --profile mixed --audience all"
  }
}
```

`wk setup` will not create a `package.json`. In repos without one, it reports
copy-ready commands. It also refuses to overwrite existing conflicting scripts
unless `--force` is explicit.

**Agent-enhanced layer:** install the optional agent instructions so Codex,
Cursor, Claude Code, or another coding agent knows when to run `wk spin`, when
to add records, how to set honest `authority` and `confidence`, and how to
refresh the generated wiki before closeout.

Use scripts for repeatable work. Use agents for judgment: deciding what changed,
capturing why it mattered, curating homepage-worthy knowledge, writing UX/DX
draft prose, and adjusting the project theme. That keeps unnecessary LLM calls
out of the loop while preserving the upside of agentic development.

`wk closeout` is the portable "I finished Objective B" command:

```sh
wk closeout --profile mixed --audience all --json
```

It runs status, spin, validation, Markdown rendering, and site generation. It
also writes a review packet under `.wikiwiki/drafts/closeout/` containing
record draft JSON files, command hints, a summary, and a manifest. Closeout
drafts are deterministic prompts, not automatic truth: Wikiwiki never appends
records from closeout unless a user or agent deliberately applies them. The
default `.gitignore` treats closeout packets as local review artifacts.

## Wiki Profiles

First-pass wikis should be consistent across machines and agents. `wk spin`
therefore emits a deterministic seeding recipe with target counts, page
emphasis, audience tags, and copy-ready draft commands.

```sh
wk init --profile mixed
wk spin --profile mixed --json
```

Available profiles:

| Profile | Use it when | Default emphasis |
| --- | --- | --- |
| `mixed` | The wiki should serve users and maintainers | product promise, getting started, FAQ, troubleshooting, architecture, data model |
| `user` | The first wiki should read like product/user help | getting started, modes/features, privacy, FAQ, troubleshooting |
| `developer` | The first wiki is mainly for maintainers and agents | architecture, data model, workflow, decisions, symbols |

`mixed` is the default. You can store the default in `.wikiwiki/config.json`:

```json
{
  "wiki_profile": "mixed"
}
```

The profile is guidance, not a generic content generator. It tells humans and
agents what shape to create so separate runs against the same repo converge on
similar record counts and page emphasis.

## Audience Tags

Use audience tags on records so Wikiwiki can render the same knowledge base for
different readers:

- `audience:user`
- `audience:developer`
- `audience:all`

Use these conventional topic tags for user-facing material:

- `getting-started`
- `instructions`
- `faq`
- `troubleshooting`

Example:

```sh
wk concept add \
  --name "Getting started" \
  --summary "How a new user gets from install to first useful session." \
  --tags audience:user,getting-started,instructions
```

For developer records, prefer tags such as `audience:developer`,
`architecture`, `data-model`, `generated-files`, `maintenance`, and `symbol`.

## What It Stores

Wikiwiki stores records as append-friendly JSONL files under `.wikiwiki/records/`.

| Record | Use it for |
| --- | --- |
| `concept` | Domain terms, systems, patterns, and durable explanations |
| `decision` | Architecture, product, implementation, or workflow decisions |
| `event` | Development milestones and meaningful project changes |
| `note` | Lightweight facts, reminders, and working context |
| `symbol` | Important code symbols and their purpose |
| `link` | Relationships between records, files, and generated pages |

Each record carries `source`, `authority`, and `confidence` so agents can be
honest about what they know.

## What It Renders

Wikiwiki renders generated Markdown pages into `wiki/` for agents and plain-text
review:

```text
wiki/
  index.md
  concepts.md
  decisions.md
  devlog.md
  notes.md
  symbols.md
  links.md
```

Generated wiki files are plainly marked:

```html
<!-- Generated by Wikiwiki. Edit structured records instead. -->
```

That boundary matters. Agents should update structured records first, then run
`wk render`.

Wikiwiki also renders a static human-facing site into `wiki-site/`:

```text
wiki-site/
  index.html
  guides.html
  concepts.html
  decisions.html
  devlog.html
  notes.html
  symbols.html
  links.html
  search.html
  assets/
    wikiwiki.css
    project-theme.css
    search-index.js
    wikiwiki.js
```

The site uses normal `.html` links, curated guide pages, responsive navigation,
local browser search, subtle agent metadata, and a small footer credit. It does
not rely on Jekyll routes or raw front matter, so you can open
`wiki-site/index.html` directly or serve the folder as static files.

There are four surfaces:

| Surface | Audience | Role |
| --- | --- | --- |
| `.wikiwiki/records/*.jsonl` | Agents and maintainers | Source of truth |
| `wiki/*.md` | Agents and code review | Deterministic Markdown |
| `wiki-site/*.html` | Humans | Browseable project wiki |
| `wiki/human/` | Humans and editors | Compiled UX/DX narrative drafts |

By default, source file links point back to files beside `wiki-site/` in a local
checkout. For published sites, pass a source base URL so links point to GitHub:

```sh
wk site --audience all --source-base-url https://github.com/OWNER/REPO/blob/main/
```

You can also save that default in `.wikiwiki/config.json`:

```json
{
  "source_base_url": "https://github.com/OWNER/REPO/blob/main/"
}
```

CLI options win over config. Directory links use GitHub `/tree/` URLs when the
base URL uses `/blob/`.

Render a reader-specific site when needed:

```sh
wk site --audience user
wk site --audience developer
wk site --audience all
```

`--audience user` keeps shared records and user-facing records while hiding
developer-only symbols/links and records tagged `audience:developer`.
`--audience developer` keeps shared and developer records while hiding
user-only records. `all` is the default.

You can also save a default:

```json
{
  "site_audience": "user"
}
```

## Project Theme

Agents can make the generated site feel like the project without changing the
layout. Add `.wikiwiki/site-theme.json`, then run `wk site`:

```json
{
  "project_name": "PRISM",
  "project_description": "A project wiki for PRISM.",
  "accent": "#7c3aed",
  "accent_strong": "#4c1d95",
  "bg": "#faf9ff",
  "panel": "#ffffff",
  "panel_soft": "#f3f0ff",
  "text": "#1f1b2e",
  "muted": "#655f75",
  "border": "#ded7f2",
  "code_bg": "#f1edf8",
  "radius": "8px",
  "font_family": "Inter, ui-sans-serif, system-ui, sans-serif"
}
```

Wikiwiki writes those values into `wiki-site/assets/project-theme.css`. Keep
this file generated; edit `.wikiwiki/site-theme.json` instead.

Wikiwiki applies basic contrast guardrails for common hex-color themes. For
example, if a dark `bg` or `panel` would leave text unreadable, generated theme
CSS adjusts dependent text/surface variables and comments why. For safest
results, set `bg`, `panel`, `panel_soft`, `text`, `muted`, `border`, and
`code_bg` together.

## What It Compiles

Wikiwiki can also compile role-oriented human wiki drafts from the same source
records:

```sh
wk compile draft --role all --json
wk compile apply compile_123 --json
```

`compile draft` creates an agent-mediated work packet under
`.wikiwiki/drafts/compile/`. Codex, Cursor, Claude Code, or another IDE agent
can use that packet to write polished UX and DX wiki prose. `compile apply`
then validates provenance and publishes the human-readable pages into
`wiki/human/`.

The UX wiki explains the product experience for users and stakeholders. The DX
wiki explains the developer experience for maintainers and coding agents.

## Install From Source

Wikiwiki is package-ready as `@thjodann/wk`; publishing is still a manual
release step. For now, install from source:

```sh
npm install
npm run build
```

Run it without linking:

```sh
npm run dev -- status --json
node dist/index.js status --json
```

Link it locally as `wk`:

```sh
npm link
wk status --json
```

The package installs `wk`; `wikiwiki` remains as a compatibility alias.

## Non-AI Setup

Wikiwiki does not require an AI tool. The smallest useful setup is a CLI install
plus scripts that keep generated docs current:

```sh
wk setup --profile mixed --audience all
npm run wiki:check
npm run wiki:site
```

If the repo does not have `package.json`, `wk setup` still creates
`.wikiwiki/config.json` and prints copy-ready commands. You can also add only
the scripts your team wants to run manually, in CI, or before publishing docs:

```json
{
  "scripts": {
    "wiki:check": "wk validate",
    "wiki:site": "wk validate && wk render && wk site --audience all"
  }
}
```

This gives users a browseable local wiki in `wiki-site/` and deterministic
Markdown in `wiki/` without asking a model to summarize anything.

## Agentic IDE Setup

Agentic IDE setup is optional. It is for teams that want their coding agent to
maintain the wiki while development is happening. Install the CLI first, run
the repo setup, then install the bundled `wk` skill into your agentic IDE.

```sh
wk setup --profile mixed --audience all
```

For Codex-compatible skills, preview the destination:

```sh
wk install-agent codex
```

Then install after confirming the path:

```sh
wk install-agent codex --yes
```

`wk install-agent codex --yes` creates a missing destination and safely
overwrites only bundled Wikiwiki skill files. If the destination contains
unknown files, the command refuses to install. Use `--force` only when you have
checked the destination and intentionally want to keep those unknown files while
overwriting the bundled `wk` skill files:

```sh
wk install-agent codex --yes --force
```

To install manually on macOS or Linux instead:

```sh
WK_SKILL_HOME="${CODEX_HOME:-$HOME/.codex}/skills/wk"
mkdir -p "$WK_SKILL_HOME/agents"
curl -fsSL https://raw.githubusercontent.com/Thjodann/Wikiwiki/main/skills/wk/SKILL.md \
  -o "$WK_SKILL_HOME/SKILL.md"
curl -fsSL https://raw.githubusercontent.com/Thjodann/Wikiwiki/main/skills/wk/agents/openai.yaml \
  -o "$WK_SKILL_HOME/agents/openai.yaml"
```

PowerShell equivalent:

```powershell
$CodexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME ".codex" }
$WkSkillHome = Join-Path $CodexHome "skills/wk"
New-Item -ItemType Directory -Force (Join-Path $WkSkillHome "agents") | Out-Null
Invoke-WebRequest `
  -Uri "https://raw.githubusercontent.com/Thjodann/Wikiwiki/main/skills/wk/SKILL.md" `
  -OutFile (Join-Path $WkSkillHome "SKILL.md")
Invoke-WebRequest `
  -Uri "https://raw.githubusercontent.com/Thjodann/Wikiwiki/main/skills/wk/agents/openai.yaml" `
  -OutFile (Join-Path $WkSkillHome "agents/openai.yaml")
```

For other agentic IDEs, copy [skills/wk/SKILL.md](skills/wk/SKILL.md) into the
IDE's persistent agent instructions or skill system. The important behavior is
the same everywhere: start with `wk status --json` and `wk spin --json`, update
structured records when there is durable knowledge, and run `wk closeout` after
meaningful work. The closeout packet is reviewable; it does not silently append
records.

The npm package also includes the skill folder at `skills/wk/` for local
copy/install flows. The skill is not a separate product surface; it teaches an
agent to use the same deterministic CLI that non-AI users can run themselves.

## Quick Start

Initialize Wikiwiki in a repo:

```sh
wk setup --profile mixed --audience all
```

Check status:

```sh
wk status --json
```

Ask Wikiwiki to inspect the current working tree:

```sh
wk spin --profile mixed --json
```

Add a concept:

```sh
wk concept add \
  --name "Structured records" \
  --summary "JSONL records are the source of truth for repo knowledge." \
  --files .wikiwiki/records/concepts.jsonl \
  --tags audience:developer,architecture,docs
```

Add a decision:

```sh
wk decision add \
  --title "Use JSONL storage" \
  --context "Agents need storage they can inspect, append, validate, and repair." \
  --decision "Store each record type as append-only JSONL under .wikiwiki/records." \
  --consequences "The MVP stays repo-native and easy to audit."
```

Render the wiki:

```sh
wk validate
wk render
```

Generate the human-facing site:

```sh
wk site --audience all
open wiki-site/index.html
```

Generate a user-focused site:

```sh
wk site --audience user
open wiki-site/index.html
```

Generate a publish-ready site with source links back to GitHub:

```sh
wk site --audience all --source-base-url https://github.com/OWNER/REPO/blob/main/
```

Close out a completed objective with a deterministic review packet:

```sh
wk closeout --profile mixed --audience all --json
```

Search active records and rendered docs:

```sh
wk search renderer --json
```

## Recommended Dogfood Workflow

For a first real repo pass, use the profile recipe instead of free-form
recording:

```sh
wk setup --profile mixed --audience all
wk status --json
wk spin --profile mixed --json
```

Then add structured records from the recipe and current repo evidence:

- user-facing concepts: product promise, getting started, modes/features,
  privacy, FAQ, troubleshooting
- developer-facing concepts: architecture, data model, generated-file workflow
- decisions: key product, architecture, publishing, and workflow decisions
- devlog: only meaningful milestones, not every implementation detail
- notes: caveats, documentation drift, generated-file reminders
- symbols: developer-only source anchors

After adding deliberate records, close the pass:

```sh
wk closeout --profile mixed --audience all --json
```

Review `.wikiwiki/drafts/closeout/<closeout-id>/record-drafts/` for suggested
records. Apply only the drafts that are true and useful, then rerun
`wk validate`, `wk render`, and `wk site` or run another closeout.

Inspect the generated home page, guides page, search, mobile layout, and a few
record detail pages before committing or publishing. If a theme is customized,
inspect contrast on cards, panels, code blocks, and mobile navigation.

## JSON-First Agent Workflows

Most add commands support JSON input and JSON output:

```sh
wk concept add --json '{
  "name": "Spin",
  "summary": "Inspects repo changes and suggests knowledge updates.",
  "files": ["src/cli/commands/spin.ts"],
  "tags": ["audience:developer", "cli"],
  "source": "agent",
  "authority": "agent",
  "confidence": "high"
}'
```

Recommended authority rules:

- Use `authority: "user"` only for explicit user intent.
- Use `authority: "agent"` for agent-authored or inferred records.
- Use lower confidence when a record is a guess, partial summary, or stale.

## Record Revisions

Wikiwiki keeps record changes append-only. Updates add a new JSONL line with the
same logical `id`; deletes add a tombstone revision with `deleted_at`. Status,
rendering, search, and record reads use the latest active revision.

```sh
wk record list concept --json
wk record get concept concept_123 --json
wk record update concept concept_123 --json '{"summary":"Updated summary."}'
wk record delete concept concept_123 --reason "Superseded by decision_456"
```

## Commands

| Command | Purpose |
| --- | --- |
| `wk init [--profile mixed\|user\|developer]` | Create the knowledge store and choose a first-pass wiki profile |
| `wk setup [--profile mixed\|user\|developer] [--audience all\|user\|developer]` | Create repo defaults and safe package scripts for portable wiki automation |
| `wk closeout [--profile mixed\|user\|developer] [--audience all\|user\|developer] --json` | Create a deterministic closeout draft packet, then validate and render docs |
| `wk status --json` | Report store status, record counts, generated pages, and Git changes |
| `wk install-agent codex [--yes] [--force]` | Install the bundled wk skill for Codex-compatible agents |
| `wk spin [--profile mixed\|user\|developer] --json` | Inspect repo changes and emit a deterministic first-pass wiki recipe |
| `wk search <query> --json` | Search active records and rendered Markdown |
| `wk site [--audience all\|user\|developer] [--source-base-url <url>]` | Render a browseable static HTML wiki into `wiki-site/` |
| `wk compile draft --role all --json` | Create UX/DX human wiki drafts for an IDE agent |
| `wk compile apply <draft-id> --json` | Validate and publish a human wiki draft |
| `wk concept add` | Add a durable project concept |
| `wk decision add` | Add an architecture, product, or workflow decision |
| `wk event add` | Add a development event |
| `wk note add` | Add a lightweight note |
| `wk symbol add` | Add an important code symbol |
| `wk link add` | Link records, files, or wiki pages |
| `wk record list/get/update/delete` | Read and revise active records append-only |
| `wk validate` | Validate records and references |
| `wk render` | Render Markdown pages into `wiki/` |

## GitHub Pages

`wk site` writes static files and a `.nojekyll` marker into `wiki-site/`, so
GitHub Pages can publish the folder without Jekyll-specific routing. Use
`--source-base-url` so source links work when `wiki-site/` is published by
itself. Once the package is published, a minimal workflow can build and upload
that folder:

```yaml
name: Publish Wikiwiki Site

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run build --if-present
      - run: npx @thjodann/wk render
      - run: npx @thjodann/wk site --audience all --source-base-url https://github.com/OWNER/REPO/blob/main/
      - uses: actions/upload-pages-artifact@v3
        with:
          path: wiki-site
      - uses: actions/deploy-pages@v4
```

## Where It Is Headed

The turntable metaphor is light, but useful:

- `spin` inspects repo changes and suggests knowledge updates.
- `scratch` could review recent knowledge, events, and contradictions.
- `press` could become a friendly alias for rendering docs.
- `crate` could rebuild indexes and local retrieval data.
- `ask` could query the repo knowledge base.
- `watch` could batch near-real-time updates while work is happening.

Wikiwiki should stay local-first, text-first, and agent-friendly even as those
capabilities grow.

## Current Status

Wikiwiki is a V1 CLI foundation. It currently includes:

- TypeScript CLI
- JSONL record storage
- append-only record revisions and deletion tombstones
- Zod validation
- Git-aware `spin` with deterministic `user`, `developer`, and `mixed` profile recipes
- audience tagging with `audience:user`, `audience:developer`, and `audience:all`
- Markdown rendering for concepts, decisions, events, notes, symbols, and links
- static HTML site generation into `wiki-site/`
- audience-focused site rendering with `wk site --audience user|developer|all`
- project-first generated site UX with curated `guides.html`
- project theme overrides through `.wikiwiki/site-theme.json`
- basic contrast guardrails for common theme overrides
- agent-mediated UX/DX human wiki compilation
- local search across active records and rendered docs
- Agent-readable JSON output
- scriptable non-AI setup through `wk setup` and repo scripts
- deterministic closeout draft packets through `wk closeout`
- CI, tests, and package metadata for `@thjodann/wk`

Some planned pieces are not built yet:

- richer symbol extraction
- draft review flows
- watch mode
- actual npm publishing

Generated `wiki/` and `wiki-site/` are intentionally not shipped in the npm
package. Installed users generate their own copies from their own records.

The north star is still clear: living docs that are easy for agents to maintain
and easy for humans to trust.

## Development

Build:

```sh
npm run build
```

Run checks:

```sh
npm run check
```

Run tests:

```sh
npm test
```

Verify package contents:

```sh
npm run pack:dry-run
```

Run the CLI in development:

```sh
npm run dev -- spin --json
```

## License

MIT
