---
name: "problem-recorder"
description: "Records coding problems, architecture decisions, improvement ideas, and module-level code maps to a shared local SQLite DB. Invoke whenever you solve a bug, make a tech decision, identify a refactor, learn a new area of a codebase, or want to remember something about the current project for next time."
---

# Problem Recorder — Cross-project Knowledge Base

This skill tells the AI agent how to write and read structured knowledge about
the codebase it is working on — so future iterations (and other agents) can
build on what was learned instead of re-discovering it from scratch.

The backing tool is a zero-dependency Python script at:

- **Script path**: `~/.trae-knowledge/scripts/problem_kb.py`
- **Default DB**:  `~/.trae-knowledge/knowledge.db`
- **Override**:    `$env:PROBLEM_KB_PATH` (env var) or `--db /path/to/file.db`

On Windows the agent expands `~` to `$env:USERPROFILE`.

## How to invoke — short form

The agent should prefer the following idioms. They work from **any** project
directory and do **not** assume the script was copied into the project.

```bash
# Record a bug/pitfall that was just solved
python ~/.trae-knowledge/scripts/problem_kb.py add-problem \
    --project "<project-or-repo-name>" \
    --title "<concise specific headline, not 'bug fixed'>" \
    --category "<react_pattern | rust_lifetime | build | dependency | architecture | ...>" \
    --severity "<low | medium | high | critical>" \
    --problem "<what the user / test observed>" \
    --root-cause "<why it happened, at the deepest level found>" \
    --solution "<the actual fix>" \
    --lessons "<the reusable take-away — MOST IMPORTANT FIELD>" \
    --files "<comma-separated relevant source file paths>" \
    --tags "<comma-separated tags, e.g. 'react,useRef,closure'>"

# Record a tech / architecture decision
python ~/.trae-knowledge/scripts/problem_kb.py add-decision \
    --project "<project-name>" \
    --title "<the decision in one line>" \
    --type "<architecture | tech_choice | product | design_pattern | workflow>" \
    --background "<why the decision was needed>" \
    --decision "<what was chosen and why>" \
    --impact "<which modules / areas change>" \
    --tags "..."

# Record a refactor / perf / feature idea for later
python ~/.trae-knowledge/scripts/problem_kb.py add-improvement \
    --project "<project-name>" \
    --title "<one-line description>" \
    --category "<refactor | feature | perf | dx | test | security>" \
    --priority "<low | medium | high>" \
    --rationale "<why this is worth doing later>" \
    --related-problems "PROB-003, PROB-007" \
    --tags "..."

# Build a code-map entry (one per module / directory) to avoid full-project scans
python ~/.trae-knowledge/scripts/problem_kb.py add-module \
    --project "<project-name>" \
    --path "src/pages/Viewer" \
    --purpose "<short one-line purpose>" \
    --public-api "<what it exports / exposes>" \
    --dependencies "<what other modules or 3rd-party libs it uses>" \
    --key-files "<the 2-4 most important files>" \
    --summary "<2-3 sentences describing shape, data flow, and gotchas>" \
    --tags "..."
```

## Reading back

```bash
# Stats + projects tracked
python ~/.trae-knowledge/scripts/problem_kb.py info

# Cross-table search (text or tag or project)
python ~/.trae-knowledge/scripts/problem_kb.py search --project "<project-name>"
python ~/.trae-knowledge/scripts/problem_kb.py search --tag react
python ~/.trae-knowledge/scripts/problem_kb.py search --text "closure"

# Drill into one record
python ~/.trae-knowledge/scripts/problem_kb.py show --id PROB-001
python ~/.trae-knowledge/scripts/problem_kb.py show --id DEC-003
python ~/.trae-knowledge/scripts/problem_kb.py show --id IMP-002
python ~/.trae-knowledge/scripts/problem_kb.py show --id MOD-001

# List a table with filters
python ~/.trae-knowledge/scripts/problem_kb.py list --table problem_records --severity high --project "<name>"
python ~/.trae-knowledge/scripts/problem_kb.py list --table improvements --status proposed
python ~/.trae-knowledge/scripts/problem_kb.py list --table code_map_modules --project "<name>"

# Backup everything to JSON
python ~/.trae-knowledge/scripts/problem_kb.py export --output ./knowledge_backup.json
```

## When the agent MUST record

At the end of every coding session or conversation, the agent should consider
recording, even if the user didn't explicitly ask:

1. A bug / pitfall was solved → `add-problem`
2. A significant choice was made → `add-decision`
3. A clear improvement opportunity is identified → `add-improvement`
4. A new area of the codebase was understood → `add-module` (once per module)

Then run `info` and `search --project <name>` to confirm the capture and show
the user what was logged.

## Why --project matters

All records share one SQLite DB. Always pass `--project` so records are
filterable per repository. The `info` command lists every project that has
been recorded — it's a quick way to check if previous knowledge exists for
the current project.

## Suggested tag vocabulary

Use simple, consistent tags so searches are reliable:

- Languages / platforms: `python`, `typescript`, `rust`, `go`, `node`, `browser`
- Frameworks: `react`, `nextjs`, `vite`, `tauri`, `django`, `fastapi`
- Concepts: `closure`, `useref`, `useEffect`, `lifetime`, `async`, `sqlite`
- Problems: `race-condition`, `render-loop`, `dependency-hell`, `state-mismatch`
- Activities: `refactor`, `debug`, `code-review`, `migration`
