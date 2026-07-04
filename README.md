<p align="center">
  <img src="https://raw.githubusercontent.com/Thjodann/Wikiwiki/main/assets/wikiwiki-banner.png" alt="Wikiwiki banner: Spin the docs. Ship the code." width="100%">
</p>

# Wikiwiki

> Spin the docs. Ship the code.

Wikiwiki is quiet infrastructure for a project's own wiki. It is a scriptable
CLI for teams that want local, deterministic project knowledge, and it becomes
more capable when an agentic IDE uses the same commands while code changes.

The core idea is simple: keep structured repo knowledge in plain JSONL records,
render deterministic Markdown and static HTML from those records, and let agents
add judgment only when they are useful. No hosted service, database, vector
store, or hidden memory layer is required.

## Quick Start

Wikiwiki is package-ready as `@thjodann/wk`; publishing is still a manual
release step. Until the npm package is published, install it from GitHub in a
target repo:

```sh
test "$(npm prefix)" = "$PWD" || npm init -y
npm install --prefix "$PWD" --save-dev --package-lock=false git+https://github.com/Thjodann/Wikiwiki.git
./node_modules/.bin/wk --help
```

The `npm prefix` check prevents npm from climbing into an ancestor project
when the target repo has no local `package.json`. `--package-lock=false` is
intentional for this temporary GitHub source install: npm currently writes
GitHub git dependencies into `package-lock.json` as `git+ssh` URLs. Once
`@thjodann/wk` is published to npm, use the package name and your normal
lockfile workflow.

For local development on Wikiwiki itself, install and run from source:

```sh
npm install
npm run build
npm link
```

Initialize Wikiwiki in a repo:

```sh
wk setup --profile mixed --audience all
```

Check status and inspect the current working tree:

```sh
wk status --json
wk spin --profile mixed --json
```

Add records as knowledge becomes durable:

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
wk site --audience all
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
- [Setup](docs/setup.md): source install, non-AI setup, and agentic IDE setup.
- [Workflows](docs/workflows.md): dogfooding, JSON-first agent work, revisions, and closeout.
- [Reference](docs/reference.md): commands, profiles, theming, GitHub Pages, status, and roadmap.

## Current Status

Wikiwiki is a V1 CLI foundation. It currently includes:

- TypeScript CLI
- JSONL record storage with append-only revisions and deletion tombstones
- Zod validation
- Git-aware `spin` with deterministic `user`, `developer`, and `mixed` profile recipes
- audience tagging and audience-focused site rendering
- Markdown rendering into `wiki/`
- static HTML site generation into `wiki-site/`
- project theme overrides and basic contrast guardrails
- agent-mediated UX/DX human wiki compilation
- local search across active records and rendered docs
- scriptable non-AI setup through `wk setup`
- deterministic closeout draft packets through `wk closeout`
- installable Codex-compatible `wk` agent skill
- optional read-only Beads integration for developer work context
- CI, tests, and package metadata for `@thjodann/wk`

Some planned pieces are not built yet: richer symbol extraction, draft review
flows, watch mode, and actual npm publishing.

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

Run the CLI in development:

```sh
npm run dev -- spin --json
```

## Roadmap

Completion estimates are rough planning signals based on the current repo state,
not release commitments.

| Planned feature | Completion | Notes |
| --- | ---: | --- |
| Actual npm publishing | 85% | Package metadata, build, tests, and dry-run packaging are in place; publishing remains manual. |
| Richer symbol extraction | 20% | Symbol records and pages exist, but important symbols are still captured manually. |
| Draft review flows | 45% | Closeout and compile draft packets exist; structured approve, reject, and apply flows are still early. |
| Watch mode | 10% | Batch commands exist for `status`, `spin`, and `closeout`; no file watcher is built yet. |
| `scratch` review command | 10% | Validation and search exist; contradiction, drift, and stale-knowledge review is not a dedicated command yet. |
| `press` render alias | 30% | `render`, `site`, and `closeout` cover the workflow; the friendlier alias is not implemented. |
| `crate` rebuild/index command | 35% | Markdown, static site, and search indexes can be rebuilt; no unified rebuild/retrieval command exists yet. |
| `ask` repo knowledge query | 25% | `wk search` provides local lookup; answer synthesis over repo knowledge is not built yet. |
| GitHub Pages scaffolding | 55% | Static output, `.nojekyll`, and workflow docs exist; one-command Pages setup is not built. |
| Initial product-identity theme generation | 25% | Theme overrides and contrast guardrails exist; setup does not infer or create a custom product theme yet. |

Shared completion snapshot:

- V1 package readiness: about 80%
- Named future roadmap: about 35%
- Blended overall product vision: about 65%

## License

MIT
