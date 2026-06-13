---
name: problem-recorder
description: Record & retrieve coding problems, architecture decisions, improvements, and module summaries to a local SQLite knowledge base. Cross-project ready — works from any repo.
command_template: python {script_path} {subcommand} {args}
tags: [knowledge-base, documentation, architecture, sqlite, cross-project]
---

## Purpose
Persist structured notes about problems you hit / decisions you make / improvements you want / module summaries you write. Any project, any language. Query them later by text, tag, project, or file.

**No dependency** beyond Python 3 standard library (sqlite3, argparse, json, pathlib).

## Script Location

Preferred path (global, usable from any project):

- Linux / macOS: `$HOME/.trae-knowledge/scripts/problem_kb.py`
- Windows: `%APPDATA%\trae_kb\scripts\problem_kb.py`

If the global script doesn't exist in the current session, use the project-local copy:
`scripts/problem_kb.py`

## Database Location

Default (auto-created on first write):

- `<current-working-directory>/.knowledge/knowledge.db`
- Override with `--db /absolute/path/to/shared.db` or set `$PROBLEM_KB_PATH`

Each project can keep its own `.knowledge/knowledge.db`; set `PROBLEM_KB_PATH` to share one DB across projects.

## Usage Pattern

When you **solve a bug** during this conversation, immediately record:

```
python scripts/problem_kb.py add-problem \
    --project "<project-name>" \
    --title "<short summary>" \
    --category "<bug|state_management|perf|build|..." \
    --severity low|medium|high|critical \
    --problem "<description of what happened>" \
    --root-cause "<why it happened>" \
    --solution "<what fixed it>" \
    --lessons "<takeaway>" \
    --files "path/to/file1.ts,path/to/file2.py" \
    --tags "tag1,tag2"
```

When you make an **architecture/tech-choice decision**, record:

```
python scripts/problem_kb.py add-decision \
    --project "<project-name>" \
    --title "<decision title>" \
    --type architecture|tech_choice|product|design_pattern|workflow \
    --decision "<what was decided>" \
    --background "<context and why" \
    --impact "<what areas are affected>" \
    --tags "tag1,tag2"
```

When you identify an **improvement/feature idea**:

```
python scripts/problem_kb.py add-improvement \
    --project "<project-name>" \
    --title "<idea title>" \
    --category refactor|feature|perf|dx|test|security \
    --priority low|medium|high \
    --rationale "<why it matters>" \
    --tags "tag1,tag2"
```

When you explore/understand a **code module** (building the code map):

```
python scripts/problem_kb.py add-module \
    --project "<project-name>" \
    --path "src/pages/Viewer" \
    --purpose "<what this module does" \
    --summary "<architecture notes>" \
    --dependencies "<what it imports / depends on>" \
    --key-files "file1.tsx,file2.ts" \
    --tags "tag1,tag2"
```

## Query

- `python scripts/problem_kb.py search --text "state"` — cross-table text search
- `python scripts/problem_kb.py search --tag "react"` — filter by tag
- `python scripts/problem_kb.py search --project "e-reader"` — filter by project
- `python scripts/problem_kb.py list --table problem_records` — list a single table
- `python scripts/problem_kb.py show --id PROB-001` — full details of one record
- `python scripts/problem_kb.py info` — DB location + counts per table
- `python scripts/problem_kb.py export --output backup.json` — full JSON export

## Rule: Always Tag With `--project`

Every record must carry `--project` so queries by project work cross-project. Use a stable, short project slug (repo name is fine).

## Rule: Record While You Code

Use this skill immediately after:
1. Solving a non-trivial bug
2. Making an architecture/tech decision
3. Identifying a meaningful future improvement
4. Understanding a new code module (build the code map incrementally)

## Rule: Cross-Project Sharing

When the same problem or decision is relevant to multiple projects, record it once with `--project` covering all of them, or record it per project with the appropriate `--project` tag. To share a single DB across all projects, point `PROBLEM_KB_PATH` to a shared path.
