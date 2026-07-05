<p align="center">
  <img src="https://raw.githubusercontent.com/Thjodann/Wikiwiki/main/assets/wikiwiki-banner.png" alt="Wikiwiki banner: Spin the docs. Ship the code." width="100%">
</p>

# Wikiwiki

[![npm](https://img.shields.io/npm/v/@thjodann/wk?label=npm)](https://www.npmjs.com/package/@thjodann/wk)

> Spin the docs. Ship the code.

Wikiwiki is quiet infrastructure for a project's own wiki. It is a scriptable
CLI for teams that want local, deterministic project knowledge, and it becomes
more capable when an agentic IDE uses the same commands while code changes.

The core idea is simple: keep structured repo knowledge in plain JSONL records,
make `article` records the public wiki pages, and use concepts, decisions,
notes, symbols, events, and links as the evidence ledger behind them. No hosted
service, database, vector store, or hidden memory layer is required.

## Quick Start

Install Wikiwiki as `@thjodann/wk` in the repo that should keep a wiki:

```sh
test "$(npm prefix)" = "$PWD" || npm init -y
npm install --prefix "$PWD" --save-dev @thjodann/wk
./node_modules/.bin/wk --help
```

The public package is published on npm as `@thjodann/wk@1.0.0`.

The `npm prefix` check prevents npm from climbing into an ancestor project
when the target repo has no local `package.json`. Use your repo's normal
lockfile policy after the package is installed.

For local development on Wikiwiki itself, install and run from source:

```sh
npm install
npm run build
npm link
```

Initialize Wikiwiki in a repo:

```sh
wk setup --profile mixed --audience all
wk theme preview --json
wk theme init
wk pages init
```

For an agentic IDE install, include the companion skill:

```sh
wk setup --profile mixed --audience all --agent codex
```

Check status and inspect the current working tree:

```sh
wk status --json
wk spin --profile mixed --json
```

Add a public article as knowledge becomes durable:

```sh
wk article add \
  --title "Getting started" \
  --summary "The first successful path for a new user." \
  --body "Install the project, run the first command, and verify the expected output." \
  --categories guides,onboarding \
  --tags audience:user,getting-started
```

Add supporting records when they capture evidence, decisions, or maintainer
context:

```sh
wk concept add \
  --name "Structured records" \
  --summary "JSONL records are the source of truth for repo knowledge." \
  --files .wikiwiki/records/concepts.jsonl \
  --tags audience:developer,architecture,docs
```

Render the wiki and site:

```sh
wk validate
wk render
wk site --audience user
open wiki-site/index.html
```

Each `wk site` run replaces `wiki-site/`, so render only the audience you want
to inspect or publish last.

Close out meaningful work with a review packet:

```sh
wk closeout --profile mixed --audience all --json
```

If a repo already uses Beads, Wikiwiki detects `.beads/` automatically. Detailed
`bd` reads are opt-in through `.wikiwiki/config.json` because some Beads
versions can touch internal storage during read commands. Publishing the
Beads-powered `work.html` site page is also explicit opt-in; user-audience
sites omit Beads data entirely. If Beads is absent, the normal flow is
unchanged.

## Docs

- [Concepts](docs/concepts.md): what Wikiwiki stores, renders, and optimizes for.
- [Setup](docs/setup.md): source install, awesome initial install, agentic IDE setup, and the "Update wk" agent pipeline.
- [Workflows](docs/workflows.md): dogfooding, JSON-first agent work, revisions, and closeout.
- [Reference](docs/reference.md): commands, profiles, theming, GitHub Pages, npm releases, status, and roadmap.

## Current Status

Wikiwiki is an article-first CLI foundation. It currently includes:

- TypeScript CLI
- JSONL record storage with append-only revisions and deletion tombstones
- first-class `article` records with `wk article add`
- Zod validation
- Git-aware `spin` with deterministic `user`, `developer`, and `mixed` profile recipes
- audience tagging and audience-focused site rendering
- article-led Markdown rendering into `wiki/`
- article-led static HTML site generation into `wiki-site/`
- project theme overrides with light, dark, and system-auto support
- product-identity theme generation through `wk theme`, including paired light/dark palettes
- agent-mediated UX/DX human wiki compilation
- local search across articles, active records, and rendered docs
- scriptable non-AI setup through `wk setup`
- agentic setup that can install the companion `wk` skill through `wk setup --agent codex`
- user-focused GitHub Pages workflow scaffolding through `wk pages init`
- deterministic closeout draft packets through `wk closeout`
- installable Codex-compatible `wk` agent skill
- optional read-only Beads integration for developer work context
- npm package published as `@thjodann/wk@1.0.0`
- GitHub Release-based npm publishing through Trusted Publishing
- CI and tests

Some planned pieces are not built yet: richer symbol extraction, draft review
flows, and watch mode.

Generated `wiki/` and `wiki-site/` are intentionally not shipped in the npm
package. Installed users generate their own copies from their own records.

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

Release process:

GitHub Releases trigger npm publishing through Trusted Publishing. See
[npm Releases](docs/reference.md#npm-releases) for the version/tag checklist.

Run the CLI in development:

```sh
npm run dev -- spin --json
```

## Roadmap

Completion estimates are rough planning signals based on the current repo state,
not release commitments.

| Planned feature | Completion | Notes |
| --- | ---: | --- |
| Richer symbol extraction | 20% | Symbol records and pages exist, but important symbols are still captured manually. |
| Draft review flows | 45% | Closeout and compile draft packets exist; structured approve, reject, and apply flows are still early. |
| Watch mode | 10% | Batch commands exist for `status`, `spin`, and `closeout`; no file watcher is built yet. |
| `scratch` review command | 10% | Validation and search exist; contradiction, drift, and stale-knowledge review is not a dedicated command yet. |
| `press` render alias | 30% | `render`, `site`, and `closeout` cover the workflow; the friendlier alias is not implemented. |
| `crate` rebuild/index command | 35% | Markdown, static site, and search indexes can be rebuilt; no unified rebuild/retrieval command exists yet. |
| `ask` repo knowledge query | 25% | `wk search` provides local lookup; answer synthesis over repo knowledge is not built yet. |
| GitHub Pages scaffolding | 85% | `wk pages init` writes a GitHub Actions workflow for the user-facing site, persists user audience/source URL defaults, and reports the manual Pages settings step; authenticated settings and custom-domain automation remain future work. |
| Product-identity theme generation | 90% | `wk theme preview` and `wk theme init` create mood-based light/dark project themes with Auto/Light/Dark site controls; richer logo and layout customization remains future work. |

Shared completion snapshot:

- V1 package readiness: about 80%
- Named future roadmap: about 45%
- Blended overall product vision: about 72%

## License

MIT
