# Workflows

Wikiwiki is built for small, repeatable maintenance loops. Humans and scripts
handle deterministic work; agents add judgment when they are already close to
the code change.

## Recommended Dogfood Workflow

For a first real repo pass, use the profile recipe instead of free-form
recording:

```sh
wk setup --profile mixed --audience all
wk status --json
wk spin --profile mixed --json
```

Then add public articles first, backed by structured records from the recipe and
current repo evidence:

- articles: overview, getting started, features/workflows, FAQ/troubleshooting,
  and developer guide
- concepts: product promise, architecture, data model, and generated-file workflow
- decisions: key product, architecture, publishing, and workflow decisions that
  explain why article guidance is true
- devlog: only meaningful milestones, not every implementation detail
- notes: titled caveats, documentation drift, generated-file reminders
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
wk article add --json '{
  "title": "Spin",
  "summary": "How Spin orients a maintainer before wiki updates.",
  "body": "Spin inspects repo changes and suggests knowledge updates.",
  "categories": ["workflow"],
  "aliases": ["first-pass recipe"],
  "source_record_ids": ["concept_spin"],
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

Wikiwiki keeps record changes append-only. Updates add a new JSONL line with
the same logical `id`; deletes add a tombstone revision with `deleted_at`.
Status, rendering, search, and record reads use the latest active revision.

```sh
wk record list concept --json
wk record get concept concept_123 --json
wk record update concept concept_123 --json '{"summary":"Updated summary."}'
wk record delete concept concept_123 --reason "Superseded by decision_456"
```

The same generic revision flow works for `article` records:

```sh
wk record update article article_123 --json '{"summary":"Updated public summary."}'
```

## Closeout

`wk closeout` is the end-of-objective review flow:

```sh
wk closeout --profile mixed --audience all --json
```

It runs status, spin, validation, Markdown rendering, and site generation. It
then writes a deterministic draft packet under `.wikiwiki/drafts/closeout/`.

Closeout drafts are review artifacts. They should be read before any records
are added, and they should only become records when they are true and useful.

## With Beads

When a repo has `.beads/`, Wikiwiki treats Beads as the developer work graph
and stays out of the task database. By default, `wk status`, `wk spin`, and
`wk closeout` report that Beads was detected but skip detailed `bd` reads so
read-only wiki commands do not dirty `.beads/`.

If a repo has verified that local `bd` reads are clean, opt in to detailed
context with `.wikiwiki/config.json`:

```json
{
  "integrations": {
    "beads": {
      "enabled": true
    }
  }
}
```

With that opt-in, Wikiwiki includes ready work, in-progress work, recent closed
work, and related issue IDs when `bd` can read without changing `.beads/`.

Recommended agent flow in a Beads repo:

```sh
bd prime
wk status --json
wk spin --profile mixed --json
```

Use Beads for task state, blockers, dependencies, ownership, and follow-ups.
Use Wikiwiki for public articles, durable concepts, decisions, notes, events,
symbols, links, generated Markdown, and the human wiki. During closeout, review
the Beads context in `.wikiwiki/drafts/closeout/<closeout-id>/summary.md`, but
only add Wikiwiki records for knowledge that should outlive the task.

Generated sites also do not publish Beads task details unless
`integrations.beads.enabled` is `true`. Use that only for internal developer
sites; user-audience sites omit Beads from pages, manifests, and search data.

## Search

Search articles, active records, and rendered docs:

```sh
wk search renderer --json
```

Search is local and article-first. It indexes article titles, slugs, aliases,
categories, source text, active records, and generated Markdown. It is useful
for quick orientation before changing code or writing new records.
