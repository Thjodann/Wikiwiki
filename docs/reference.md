# Reference

This page collects command, profile, theme, publishing, status, and roadmap
details that are useful after the first quick start.

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

## Site Options

By default, source file links point back to files beside `wiki-site/` in a
local checkout. For published sites, pass a source base URL so links point to
GitHub:

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

Each render replaces the same `wiki-site/` folder. Run the audience variant you
want to inspect or publish last, or copy `wiki-site/` elsewhere before rendering
another audience.

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

## Optional Beads Integration

If a repo contains `.beads/`, Wikiwiki automatically reads Beads context when
`bd` is available. The integration is best-effort and read-only. It never
creates, edits, claims, closes, or imports Beads issues.

The integration appears in JSON reports for `wk setup`, `wk status`,
`wk spin`, and `wk closeout`. Closeout manifests include the same Beads context
so an agent can relate durable wiki updates to active work without treating
tasks as records.

`wk site --audience all` and `wk site --audience developer` generate
`work.html` with ready work, in-progress work, and recently closed work.
`wk site --audience user` hides Beads entirely.

Disable the integration in `.wikiwiki/config.json` when needed:

```json
{
  "integrations": {
    "beads": {
      "enabled": false
    }
  }
}
```

Fallback behavior is intentionally calm:

- no `.beads/`: no Beads output
- `.beads/` plus `bd`: combined task/wiki context
- `.beads/` without `bd`: Wikiwiki reports that Beads context is unavailable

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
that file generated; edit `.wikiwiki/site-theme.json` instead.

Wikiwiki applies basic contrast guardrails for common hex-color themes. For
example, if a dark `bg` or `panel` would leave text unreadable, generated theme
CSS adjusts dependent text/surface variables and comments why. For safest
results, set `bg`, `panel`, `panel_soft`, `text`, `muted`, `border`, and
`code_bg` together.

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
- agent-readable JSON output
- scriptable non-AI setup through `wk setup` and repo scripts
- deterministic closeout draft packets through `wk closeout`
- optional read-only Beads integration with developer-only `work.html`
- CI, tests, and package metadata for `@thjodann/wk`

Some planned pieces are not built yet:

- richer symbol extraction
- draft review flows
- watch mode
- actual npm publishing

Generated `wiki/` and `wiki-site/` are intentionally not shipped in the npm
package. Installed users generate their own copies from their own records.

## Roadmap

The turntable metaphor is light, but useful:

- `spin` inspects repo changes and suggests knowledge updates.
- `scratch` could review recent knowledge, events, and contradictions.
- `press` could become a friendly alias for rendering docs.
- `crate` could rebuild indexes and local retrieval data.
- `ask` could query the repo knowledge base.
- `watch` could batch near-real-time updates while work is happening.

Wikiwiki should stay local-first, text-first, and agent-friendly even as those
capabilities grow.
