# Setup

Wikiwiki works without AI tools. Agentic IDE setup is optional and uses the
same deterministic CLI commands as the non-AI path.

## Install From Source

Wikiwiki is package-ready as `@thjodann/wk`; publishing is still a manual
release step. Until the npm package is published, install it from GitHub in the
repo that should use Wikiwiki:

```sh
test "$(npm prefix)" = "$PWD" || npm init -y
npm install --prefix "$PWD" --save-dev --package-lock=false git+https://github.com/Thjodann/Wikiwiki.git
./node_modules/.bin/wk --help
```

The `npm prefix` check matters in Swift, Rust, Python, and other non-JavaScript
repos. If the repo has no local `package.json`, npm may otherwise climb to a
parent project and install Wikiwiki there. `npm init -y` creates the local
manifest first, and `--prefix "$PWD"` keeps the install rooted in the repo you
are setting up.

Expect npm to create or update `package.json` and `node_modules/`. In non-JS
repos, add `node_modules/` to `.gitignore` if it is not already ignored. The
temporary `--package-lock=false` flag avoids committing npm's current `git+ssh`
lockfile normalization for GitHub source dependencies. Once `@thjodann/wk` is
published to npm, install the package normally and keep your lockfile.

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

## Agentic IDE Setup

Agentic IDE setup is for teams that want their coding agent to maintain the
wiki while development is happening. Install the CLI first, run the repo setup,
then install the bundled `wk` skill into your agentic IDE.

```sh
wk setup --profile mixed --audience all
```

If the repo also uses Beads, keep Beads as the task graph and Wikiwiki as the
knowledge graph. Initialize or preserve Beads in its own flow:

```sh
bd init
bd setup codex
```

Then install the Wikiwiki agent instructions:

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
update structured records when there is durable knowledge, and run
`wk closeout` after meaningful work. The closeout packet is reviewable; it does
not silently append records.

The npm package includes the skill folder at `skills/wk/` for local
copy/install flows. The skill is not a separate product surface; it teaches an
agent to use the same deterministic CLI that non-AI users can run themselves.

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
owns durable concepts, decisions, notes, events, symbols, links, generated
Markdown, and the static human wiki. Wikiwiki never creates, edits, claims, or
closes Beads issues.
