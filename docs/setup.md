# Setup

Wikiwiki works without AI tools. Agentic IDE setup is optional and uses the
same deterministic CLI commands as the non-AI path.

## Install From npm

Install Wikiwiki as `@thjodann/wk` in the repo that should use Wikiwiki:

```sh
test "$(npm prefix)" = "$PWD" || npm init -y
npm install --prefix "$PWD" --save-dev @thjodann/wk
./node_modules/.bin/wk --help
```

The `npm prefix` check matters in Swift, Rust, Python, and other non-JavaScript
repos. If the repo has no local `package.json`, npm may otherwise climb to a
parent project and install Wikiwiki there. `npm init -y` creates the local
manifest first, and `--prefix "$PWD"` keeps the install rooted in the repo you
are setting up.

Expect npm to create or update `package.json` and `node_modules/`. In non-JS
repos, add `node_modules/` to `.gitignore` if it is not already ignored. Use
the repo's normal lockfile policy after the package is installed.

For local development on Wikiwiki itself, install from source:

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

The smallest useful setup is a CLI install plus scripts that keep generated
docs current:

```sh
wk setup --profile mixed --audience all
wk theme init
wk pages init
npm run wiki:check
npm run wiki:site
```

`wk setup` creates `.wikiwiki/config.json` and adds package scripts when a
`package.json` exists:

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
copy-ready commands. Run the safe install sequence above first when you want
package scripts in a non-JS repo. Setup also refuses to overwrite existing
conflicting scripts unless `--force` is explicit.

You can also add only the scripts your team wants to run manually, in CI, or
before publishing docs:

```json
{
  "scripts": {
    "wiki:check": "wk validate",
    "wiki:site": "wk validate && wk render && wk site --audience all"
  }
}
```

This gives users a browseable local wiki in `wiki-site/` and deterministic
Markdown in `wiki/` without asking a model to summarize anything. `wk theme init`
is optional; it creates `.wikiwiki/site-theme.json` so the generated site starts
with project-specific colors, typography, surface treatment, and paired
light/dark palettes. Generated sites default to Auto, so they follow the user's
system appearance until the reader chooses Light or Dark.

`wk pages init` is optional for local use, but it is the fastest path to
publishing the generated user site. It writes a GitHub Actions workflow for
`wiki-site/`, saves `site_audience: "user"` and the resolved source-link base
URL, and prints the manual GitHub Settings > Pages step when GitHub needs the
repository source set to GitHub Actions. If the repo is not hosted on GitHub,
pass `--source-base-url` explicitly.

The first public page should usually be an article record:

```sh
wk article add \
  --title "Getting started" \
  --summary "The first successful user path." \
  --body "Install, run, and verify the project." \
  --categories guides,onboarding \
  --tags audience:user,getting-started
```

Use concepts, decisions, notes, events, symbols, and links for the supporting
ledger behind those public pages.

## Awesome Initial Install

For an agent-assisted first install, aim for both style and substance instead
of a merely valid wiki:

```sh
wk setup --profile mixed --audience all
wk theme preview --json
wk theme init
wk pages init
wk spin --profile mixed --json
wk validate
wk render
wk site --audience user
```

Before running `wk theme init`, the agent should inspect the host repo's actual
visual sources: app/global CSS, design tokens, theme files, landing page styles,
and app shell/layout styles. `wk theme preview` and `wk theme init` also inspect
those files automatically when they are present, then fall back to README and
package metadata for naming and copy. In styled web apps, this lets
`.wikiwiki/site-theme.json` start with the host product's likely color mode,
accent spectrum, radius, font family, gradients, glass/gloss, shadows, badges,
and tag colors.

After the theme is in place, seed a small set of high-signal records before
publishing the first site: product promise, privacy/data boundary, architecture
overview, distribution/support model, important symbols, and one development
event. Then verify the generated site like a real local artifact:

- open `wiki-site/index.html`
- check Auto, Light, and Dark controls
- check local links and source-file links
- check search
- check contrast for body text, muted text, accents, badges, and tags
- keep `wiki-site/` generated; edit `.wikiwiki/site-theme.json` and records

## Agentic IDE Setup

Agentic IDE setup is for teams that want their coding agent to maintain the
wiki while development is happening. Install the CLI first, then run setup with
the companion skill install enabled:

```sh
wk setup --profile mixed --audience all --agent codex
```

For Codex-compatible skills, `--agent codex` installs the bundled `wk` skill
into `${CODEX_HOME:-$HOME/.codex}/skills/wk`. Use `--agent-dest <path>` for a
custom skill directory. If that directory contains unknown files, setup refuses
to install the skill; use `--force` only after checking the destination.

If the repo also uses Beads, keep Beads as the task graph and Wikiwiki as the
knowledge graph. Initialize or preserve Beads in its own flow:

```sh
bd init
bd setup codex
```

`wk install-agent codex` remains available when you want to preview or refresh
only the companion skill.

Preview the destination:

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
checked the destination and intentionally want to keep those unknown files
while overwriting the bundled `wk` skill files:

```sh
wk install-agent codex --yes --force
```

To install manually on macOS or Linux:

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

For other agentic IDEs, copy [skills/wk/SKILL.md](../skills/wk/SKILL.md) into
the IDE's persistent agent instructions or skill system. The important behavior
is the same everywhere: start with `wk status --json` and `wk spin --json`,
read relevant articles and source records, update article records when public
wiki knowledge changes, add evidence records when durable context is worth
keeping, then run `wk validate`, `wk render`, `wk site`, and `wk closeout`
after meaningful work. The closeout packet is reviewable; it does not silently
append records.

The npm package includes the skill folder at `skills/wk/` for local
copy/install flows. The skill is not a separate product surface; it teaches an
agent to use the same deterministic CLI that non-AI users can run themselves.

## Agentic Update Pipeline

When a user asks an agent to "Update wk", the agent should try to update both
the repo-local CLI and the installed agent instructions. Start by inspecting the
current state:

```sh
command -v wk || true
wk --version || true
git status --short
```

If npm is available, update from the published npm package:

```sh
test "$(npm prefix)" = "$PWD" || npm init -y
npm install --prefix "$PWD" --save-dev @thjodann/wk@latest
./node_modules/.bin/wk --version
./node_modules/.bin/wk install-agent codex --yes
```

If the repo uses `pnpm`, `yarn`, or another JavaScript package manager, use the
closest equivalent and keep the install rooted in the target repo.

If npm and equivalent package managers are not available, the agent cannot
rebuild or replace the CLI from source because the generated `dist/` files are
not the Git source of truth. In that case, refresh only the agent skill from
GitHub raw files and report the CLI update as blocked:

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

PowerShell users can use the same `Invoke-WebRequest` commands from the manual
skill install section above. After either path, verify only what was actually
updated:

```sh
wk --version || true
wk status --json || true
```

Agents should not delete lockfiles, overwrite unknown agent files, or claim the
CLI was updated when only the skill instructions changed.

## Optional Beads Coordination

Wikiwiki's Beads detection is automatic, but detailed `bd` reads are opt-in for
internal command output. This keeps `wk status`, `wk spin`, and `wk closeout`
from dirtying `.beads/` in environments where `bd --readonly` still touches
internal storage.

- No `.beads/`: Wikiwiki behaves normally.
- `.beads/` plus auto config: Wikiwiki reports that Beads was detected and
  skips detailed reads.
- `.beads/` plus `integrations.beads.enabled: true`: `wk status`, `wk spin`,
  `wk closeout`, and developer-facing JSON outputs include task context when
  `bd` can read without changing `.beads/`.
- `.beads/` without `bd`: Wikiwiki still works and reports that Beads context
  is unavailable.

Detailed Beads task data and `wiki-site/work.html` are explicit opt-in. Add
this only for internal developer sites or repos where the local `bd` read path
has been checked:

```json
{
  "integrations": {
    "beads": {
      "enabled": true
    }
  }
}
```

User-audience sites omit Beads data from generated pages, `site-manifest.json`,
and search data.

Beads owns tasks, blockers, dependencies, ownership, and follow-ups. Wikiwiki
owns public articles, durable concepts, decisions, notes, events, symbols,
links, generated Markdown, and the static human wiki. Wikiwiki never creates,
edits, claims, or closes Beads issues.
