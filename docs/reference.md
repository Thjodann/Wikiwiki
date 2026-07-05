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
| `wk pages init [--branch <branch>] [--source-base-url <url>]` | Scaffold GitHub Pages publishing for the user-facing `wiki-site/` |
| `wk spin [--profile mixed\|user\|developer] --json` | Inspect repo changes and emit a deterministic first-pass wiki recipe |
| `wk search <query> --json` | Search active records and rendered Markdown |
| `wk site [--audience all\|user\|developer] [--source-base-url <url>]` | Render a browseable static HTML wiki into `wiki-site/` |
| `wk theme preview\|init [--mood calm\|vivid\|editorial\|utility\|playful\|dark]` | Preview or write light/dark `.wikiwiki/site-theme.json` palettes from project identity |
| `wk compile draft --role all --json` | Create UX/DX human wiki drafts for an IDE agent |
| `wk compile apply <draft-id> --json` | Validate and publish a human wiki draft |
| `wk article add` | Add a public wiki article |
| `wk concept add` | Add a durable project concept |
| `wk decision add` | Add an architecture, product, or workflow decision |
| `wk event add` | Add a development event |
| `wk note add` | Add a lightweight note |
| `wk symbol add` | Add an important code symbol |
| `wk link add` | Link records, files, or wiki pages |
| `wk record list/get/update/delete` | Read and revise active records append-only |
| `wk validate` | Validate records and references |
| `wk render` | Render Markdown pages into `wiki/` |

## Article Records

Article records are the public wiki surface. Concepts, decisions, notes,
events, symbols, and links remain the ledger behind them: evidence, provenance,
maintainer context, and source anchors.

```sh
wk article add \
  --title "Skyrim:Alchemy" \
  --summary "How alchemy works for players and maintainers." \
  --body "Alchemy combines ingredients into potions and poisons." \
  --categories gameplay,crafting \
  --aliases alchemy,potions \
  --source-records concept_123,decision_456 \
  --files src/alchemy.ts \
  --tags audience:all
```

If `--slug` is omitted, Wikiwiki generates one from the title. Slugs may use
namespace-style names such as `Skyrim:Alchemy`; generated files still use safe
filenames such as `Skyrim-Alchemy.html`. Validation rejects active duplicate
slugs, duplicate generated filenames, and `source_record_ids` that do not point
to active records.

Articles render to `wiki/articles/` and `wiki-site/articles/`. Article records
do not generate `records/article/*` detail pages.

## Agent Requests

When a user asks an agent to "Update wk", the agent should follow the
[agentic update pipeline](setup.md#agentic-update-pipeline). The short version:
use npm or the repo's JavaScript package manager to update the CLI when
available; if npm is not available, refresh only the installed `wk` agent skill
from GitHub raw files and report that the CLI itself still needs a package
manager or release artifact.

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

If a repo contains `.beads/`, Wikiwiki automatically detects it. Detailed
Beads reads are opt-in because some `bd --readonly` commands can still touch
internal storage in `.beads/`. The integration is best-effort and never
creates, edits, claims, closes, or imports Beads issues.

The detection appears in JSON reports for `wk setup`, `wk status`, `wk spin`,
and `wk closeout`. When `.wikiwiki/config.json` explicitly sets
`integrations.beads.enabled: true`, those reports include detailed Beads
context if `bd` can read without changing `.beads/`. Closeout manifests include
the same Beads context so an agent can relate durable wiki updates to active
work without treating tasks as records.

Site publishing is explicit opt-in for task details. `wk site --audience all`
and `wk site --audience developer` generate `work.html` with ready work,
in-progress work, and recently closed work only when `.wikiwiki/config.json`
contains `integrations.beads.enabled: true`. Without that explicit opt-in, site
manifests keep at most safe Beads counts and omit issue IDs, titles, labels, and
assignees. `wk site --audience user` hides Beads entirely, including from
`site-manifest.json` and search data.

Enable Beads site output only for internal developer publishing:

```json
{
  "integrations": {
    "beads": {
      "enabled": true
    }
  }
}
```

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
- `.beads/` with auto config: detected, with detailed reads skipped
- `.beads/` plus explicit `enabled: true`: combined task/wiki context when
  `bd` reads cleanly
- `.beads/` without `bd`: Wikiwiki reports that Beads context is unavailable
- `.beads/` that changes during a `bd` read: Wikiwiki reports Beads as
  unavailable for that run instead of using potentially mutating context

## Project Theme

Agents can make the generated site feel like the project without changing the
layout. Generated themes include light and dark palettes, and the static site
ships with Auto, Light, and Dark controls. Preview or create a theme from repo
identity:

```sh
wk theme preview --json
wk theme init --mood editorial
```

`wk theme preview` and `wk theme init` inspect likely visual sources before
falling back to README copy: app/global CSS, design tokens, theme files, landing
page styles, and app shell/layout styles. In styled repos, the generated theme
can infer a likely default color mode, accent spectrum, radius, font family,
gradients, glass/gloss, shadows, badges, and tag colors. In plain repos, the
named mood palettes remain the fallback.

`wk theme init` writes `.wikiwiki/site-theme.json` and refuses to overwrite an
existing theme unless `--force` is explicit. You can also edit
`.wikiwiki/site-theme.json` by hand, then run `wk site`:

```json
{
  "project_name": "PRISM",
  "project_description": "A project wiki for PRISM.",
  "default_color_scheme": "auto",
  "accent": "#7c3aed",
  "accent_strong": "#4c1d95",
  "bg": "#faf9ff",
  "panel": "#fffaff",
  "panel_soft": "#f3f0ff",
  "text": "#1f1b2e",
  "muted": "#655f75",
  "border": "#ded7f2",
  "code_bg": "#f1edf8",
  "radius": "8px",
  "font_family": "Inter, ui-sans-serif, system-ui, sans-serif",
  "modes": {
    "light": {
      "accent": "#7c3aed",
      "accent_strong": "#4c1d95",
      "bg": "#faf9ff",
      "panel": "#fffaff"
    },
    "dark": {
      "accent": "#c4b5fd",
      "accent_strong": "#ede9fe",
      "bg": "#171225",
      "panel": "#211936",
      "text": "#f7f2ff"
    }
  }
}
```

Top-level color values are treated as the light/default palette for backwards
compatibility. `modes.light` and `modes.dark` can override them with richer
visual tokens such as `hero_gradient`, `card_gradient`, `sidebar_bg`, `shadow`,
`shadow_strong`, `brand_gradient`, `badge_bg`, `tag_bg`, `focus_ring`, and
`gloss`.

Wikiwiki writes those values into `wiki-site/assets/project-theme.css`, including
`prefers-color-scheme` rules and explicit `data-theme` overrides. Keep that file
generated; edit `.wikiwiki/site-theme.json` instead.

Wikiwiki applies basic contrast guardrails for common hex-color themes. For
example, if a dark `bg` or `panel` would leave text unreadable, generated theme
CSS adjusts dependent text/surface variables and comments why. For safest
results, set `bg`, `panel`, `panel_soft`, `text`, `muted`, `border`, and
`code_bg` together inside each mode.

## GitHub Pages

`wk site` writes static files and a `.nojekyll` marker into `wiki-site/`, so
GitHub Pages can publish the folder without Jekyll-specific routing. Use
`wk pages init` to create the publishing workflow:

```sh
wk pages init
```

The command writes `.github/workflows/wikiwiki-pages.yml`, saves
`site_audience: "user"` and the resolved `source_base_url` in
`.wikiwiki/config.json`, and reports the repository Settings > Pages URL when it
can infer one from `origin`. Pages publishing is intentionally user-facing: the
generated workflow always runs `wk site --audience user`.

Defaults are designed for low ceremony:

- branch comes from `--branch`, `origin/HEAD`, then `main`
- source links come from `--source-base-url`, config, then a GitHub `origin`

If the repo is not hosted on GitHub, pass `--source-base-url` explicitly. The
workflow path defaults to `.github/workflows/wikiwiki-pages.yml`; existing
different workflows are preserved unless `--force` is explicit. Wikiwiki does
not call `gh`, change repository settings, create deployment branches, or
configure custom domains. On GitHub, set Pages Build and deployment Source to
GitHub Actions if it is not already selected.

The generated workflow uses Node 22, installs project dependencies when present,
falls back to a direct GitHub source install for `wk`, runs
`wk validate`, `wk render`, and `wk site`, then publishes `wiki-site/` through
the official Pages artifact and deploy actions.

## npm Releases

The npm package publishes from `.github/workflows/publish-npm.yml` through npm
Trusted Publishing. The workflow runs only when a GitHub Release is published,
not on every push to `main`; npm versions are immutable, so each release needs a
new `package.json` version first.

For the initial `v1.0.0` GitHub Release, tag the commit that matches the
already-published `@thjodann/wk@1.0.0` npm package.

Release checklist:

```sh
npm version patch
git push
git push --tags
```

Then publish a GitHub Release for that tag. GitHub Actions runs install, tests,
Wikiwiki validation, and `npm publish --access public` using the trusted
publisher OIDC relationship. No `NPM_TOKEN` secret is required.

## Current Status

Wikiwiki is an article-first CLI foundation. It currently includes:

- TypeScript CLI
- JSONL record storage
- first-class article records
- append-only record revisions and deletion tombstones
- Zod validation
- Git-aware `spin` with deterministic `user`, `developer`, and `mixed` profile recipes
- audience tagging with `audience:user`, `audience:developer`, and `audience:all`
- Markdown rendering for article pages plus concepts, decisions, events, notes, symbols, and links
- article-led static HTML site generation into `wiki-site/`
- audience-focused site rendering with `wk site --audience user|developer|all`
- project-first generated site UX with curated `guides.html`
- project theme overrides through `.wikiwiki/site-theme.json`
- product-identity light/dark theme generation through `wk theme`
- basic contrast guardrails for common theme overrides
- agent-mediated UX/DX human wiki compilation
- local search across articles, active records, and rendered docs
- agent-readable JSON output
- scriptable non-AI setup through `wk setup` and repo scripts
- user-focused GitHub Pages workflow scaffolding through `wk pages init`
- deterministic closeout draft packets through `wk closeout`
- optional read-only Beads integration with developer-only `work.html`
- npm package published as `@thjodann/wk@1.0.0`
- GitHub Release-based npm publishing through Trusted Publishing
- CI and tests

Some planned pieces are not built yet:

- richer symbol extraction
- draft review flows
- watch mode

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
