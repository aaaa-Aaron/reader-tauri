#!/usr/bin/env python3
"""
Problem Knowledge Base — Local SQLite storage for AI agent coding records.

Stores 5 kinds of records across ALL projects:
  1. problem_records   — Bugs / issues encountered and how they were solved
  2. decision_logs     — Architecture / product / tech-choice decisions made
  3. improvements      — Proposed improvements and refactoring items
  4. code_map_modules  — Per-module summaries (the "code map" to avoid full-project scans)
  5. knowledge_sessions — Grouping of related records (for retrospective)

Default database:  <cwd>/.knowledge/knowledge.db
Override with:     PROBLEM_KB_PATH=/path/to/file.db  python problem_kb.py ...
           or:     python problem_kb.py --db /path/to/file.db ...

Cross-project usage:
  python <path-to-script>/problem_kb.py --db <path-to-shared-db> ...

Usage:
  python problem_kb.py add-problem --title "..." --category react_pattern --severity high ...
  python problem_kb.py list --table problem_records
  python problem_kb.py search --tag react
  python problem_kb.py search --text "closure"
  python problem_kb.py show --id PROB-001
  python problem_kb.py add-decision --title "..." --type tech_choice ...
  python problem_kb.py add-improvement --title "..." --category refactor ...
  python problem_kb.py add-module --path "src/pages/Viewer" --purpose "..." ...
  python problem_kb.py info
  python problem_kb.py export --output knowledge_backup.json
"""

import argparse
import json
import os
import sqlite3
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

DB_ENV_VAR = "PROBLEM_KB_PATH"


def _default_dir() -> Path:
    """Default data directory — placed inside the current working directory
    so the database is always writable regardless of sandbox restrictions.
    Cross-project sharing: set $PROBLEM_KB_PATH or use --db explicitly."""
    return Path.cwd() / ".knowledge"


DEFAULT_DIR = _default_dir()
DEFAULT_DB = DEFAULT_DIR / "knowledge.db"


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS problem_records (
    id                  TEXT PRIMARY KEY,
    project             TEXT,
    title               TEXT NOT NULL,
    category            TEXT,
    severity            TEXT,
    status              TEXT DEFAULT 'resolved',
    context             TEXT,
    problem_description TEXT,
    root_cause          TEXT,
    solution            TEXT,
    lessons_learned     TEXT,
    related_files       TEXT,
    code_before         TEXT,
    code_after          TEXT,
    tags                TEXT,
    refs                TEXT,
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS decision_logs (
    id                  TEXT PRIMARY KEY,
    project             TEXT,
    type                TEXT,
    title               TEXT NOT NULL,
    background          TEXT,
    considered_options  TEXT,
    final_decision      TEXT,
    impact_area         TEXT,
    related_files       TEXT,
    open_questions      TEXT,
    author              TEXT,
    tags                TEXT,
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS improvements (
    id                  TEXT PRIMARY KEY,
    project             TEXT,
    title               TEXT NOT NULL,
    category            TEXT,
    priority            TEXT,
    status              TEXT DEFAULT 'proposed',
    effort_estimate     TEXT,
    context             TEXT,
    rationale           TEXT,
    prerequisites       TEXT,
    related_files       TEXT,
    related_decision_ids TEXT,
    related_problem_ids  TEXT,
    tags                TEXT,
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS code_map_modules (
    id                  TEXT PRIMARY KEY,
    project             TEXT,
    path                TEXT NOT NULL,
    purpose             TEXT,
    public_api          TEXT,
    dependencies        TEXT,
    key_files           TEXT,
    summary             TEXT,
    content_hash        TEXT,
    tags                TEXT,
    version             INTEGER DEFAULT 1,
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS knowledge_sessions (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    project             TEXT,
    topic               TEXT,
    summary             TEXT,
    related_problem_ids TEXT,
    related_decision_ids TEXT,
    related_improvement_ids TEXT,
    created_at          TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_problem_project   ON problem_records(project);
CREATE INDEX IF NOT EXISTS idx_problem_category  ON problem_records(category);
CREATE INDEX IF NOT EXISTS idx_problem_severity  ON problem_records(severity);
CREATE INDEX IF NOT EXISTS idx_decision_project  ON decision_logs(project);
CREATE INDEX IF NOT EXISTS idx_improvement_project ON improvements(project);
CREATE INDEX IF NOT EXISTS idx_codemap_project   ON code_map_modules(project);
"""


def _expand(p: str) -> Path:
    return Path(os.path.expandvars(os.path.expanduser(str(p))))


def resolve_db_path(explicit: Optional[str]) -> Path:
    if explicit:
        candidate = _expand(explicit)
    else:
        env = os.environ.get(DB_ENV_VAR)
        if env:
            candidate = _expand(env)
        else:
            candidate = DEFAULT_DB
    return candidate if candidate.is_absolute() else Path.cwd() / candidate


def get_conn(db_path: Path) -> sqlite3.Connection:
    """Connect to (creating if needed) the SQLite database at db_path."""
    p = Path(db_path)
    p.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(p))
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA_SQL)
    return conn


def _now() -> str:
    return datetime.now().isoformat(timespec="seconds")


def _next_id(conn: sqlite3.Connection, table: str, prefix: str) -> str:
    cursor = conn.execute(
        f"SELECT id FROM {table} WHERE id LIKE ? ORDER BY id DESC LIMIT 1",
        (f"{prefix}-%",),
    )
    row = cursor.fetchone()
    if not row:
        return f"{prefix}-001"
    try:
        num = int(row["id"].split("-")[1])
    except (IndexError, ValueError):
        return f"{prefix}-001"
    return f"{prefix}-{num + 1:03d}"


def _print_row(row: sqlite3.Row) -> None:
    print("-" * 72)
    for key in row.keys():
        val = row[key]
        if val is None or val == "":
            continue
        if isinstance(val, str) and ("\n" in val or len(val) > 80):
            print(f"{key}:")
            for line in str(val).splitlines():
                print(f"  {line}")
        else:
            print(f"{key}: {val}")


def _print_rows(rows: List[sqlite3.Row]) -> None:
    if not rows:
        print("(no records)")
        return
    for row in rows:
        _print_row(row)
    print()
    print(f"Total: {len(rows)} record(s)")


# ---------------------------------------------------------------------------
# Write operations
# ---------------------------------------------------------------------------

def cmd_add_problem(args: argparse.Namespace, conn: sqlite3.Connection) -> int:
    rec_id = _next_id(conn, "problem_records", "PROB")
    now = _now()
    conn.execute(
        """
        INSERT INTO problem_records (
            id, project, title, category, severity, status,
            context, problem_description, root_cause, solution,
            lessons_learned, related_files, code_before, code_after,
            tags, refs, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            rec_id, args.project, args.title, args.category, args.severity,
            args.status or "resolved", args.context, args.problem,
            args.root_cause, args.solution, args.lessons, args.files,
            args.code_before, args.code_after, args.tags, args.references,
            now, now,
        ),
    )
    conn.commit()
    print(f"[OK] Created problem record: {rec_id}")
    return 0


def cmd_add_decision(args: argparse.Namespace, conn: sqlite3.Connection) -> int:
    rec_id = _next_id(conn, "decision_logs", "DEC")
    now = _now()
    conn.execute(
        """
        INSERT INTO decision_logs (
            id, project, type, title, background, considered_options,
            final_decision, impact_area, related_files, open_questions,
            author, tags, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            rec_id, args.project, args.type, args.title, args.background,
            args.options, args.decision, args.impact, args.files,
            args.open_questions, args.author or "AI-Agent", args.tags,
            now, now,
        ),
    )
    conn.commit()
    print(f"[OK] Created decision log: {rec_id}")
    return 0


def cmd_add_improvement(args: argparse.Namespace, conn: sqlite3.Connection) -> int:
    rec_id = _next_id(conn, "improvements", "IMP")
    now = _now()
    conn.execute(
        """
        INSERT INTO improvements (
            id, project, title, category, priority, status,
            effort_estimate, context, rationale, prerequisites,
            related_files, related_decision_ids, related_problem_ids,
            tags, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            rec_id, args.project, args.title, args.category, args.priority,
            args.status or "proposed", args.effort, args.context,
            args.rationale, args.prerequisites, args.files,
            args.related_decisions, args.related_problems, args.tags,
            now, now,
        ),
    )
    conn.commit()
    print(f"[OK] Created improvement item: {rec_id}")
    return 0


def cmd_add_module(args: argparse.Namespace, conn: sqlite3.Connection) -> int:
    rec_id = _next_id(conn, "code_map_modules", "MOD")
    now = _now()
    conn.execute(
        """
        INSERT INTO code_map_modules (
            id, project, path, purpose, public_api, dependencies,
            key_files, summary, content_hash, tags, version, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        """,
        (
            rec_id, args.project, args.path, args.purpose, args.public_api,
            args.dependencies, args.key_files, args.summary, args.hash,
            args.tags, now, now,
        ),
    )
    conn.commit()
    print(f"[OK] Created code map module: {rec_id}")
    return 0


# ---------------------------------------------------------------------------
# Read operations
# ---------------------------------------------------------------------------

def _build_where(args: argparse.Namespace) -> tuple:
    clauses: List[str] = []
    params: List[Any] = []
    if getattr(args, "project", None):
        clauses.append("project LIKE ?")
        params.append(f"%{args.project}%")
    if getattr(args, "category", None):
        clauses.append("category LIKE ?")
        params.append(f"%{args.category}%")
    if getattr(args, "severity", None):
        clauses.append("severity = ?")
        params.append(args.severity)
    if getattr(args, "priority", None):
        clauses.append("priority = ?")
        params.append(args.priority)
    if getattr(args, "status", None):
        clauses.append("status = ?")
        params.append(args.status)
    if getattr(args, "tag", None):
        clauses.append("tags LIKE ?")
        params.append(f"%{args.tag}%")
    if getattr(args, "file", None):
        clauses.append("related_files LIKE ?")
        params.append(f"%{args.file}%")
    if getattr(args, "text", None):
        clauses.append(
            "(title LIKE ? OR problem_description LIKE ? OR solution LIKE ? "
            "OR context LIKE ? OR lessons_learned LIKE ? "
            "OR background LIKE ? OR final_decision LIKE ? "
            "OR rationale LIKE ? OR summary LIKE ?)"
        )
        needle = f"%{args.text}%"
        params.extend([needle] * 9)
    return " AND ".join(clauses) if clauses else "1=1", params


def cmd_list(args: argparse.Namespace, conn: sqlite3.Connection) -> int:
    where_sql, params = _build_where(args)
    table = getattr(args, "table", "problem_records")
    rows = conn.execute(
        f"SELECT * FROM {table} WHERE {where_sql} ORDER BY created_at DESC LIMIT ?",
        params + [args.limit],
    ).fetchall()
    print(f"=== {table} ===\n")
    _print_rows(rows)
    return 0


def cmd_search(args: argparse.Namespace, conn: sqlite3.Connection) -> int:
    table_columns = {
        "problem_records":  ("title", "project", "tags", "related_files",
                              "problem_description", "root_cause", "solution",
                              "context", "lessons_learned"),
        "decision_logs":    ("title", "project", "tags", "related_files",
                              "background", "considered_options",
                              "final_decision", "impact_area"),
        "improvements":     ("title", "project", "tags", "related_files",
                              "context", "rationale", "prerequisites",
                              "category"),
        "code_map_modules": ("path", "project", "tags", "purpose",
                              "public_api", "dependencies", "key_files",
                              "summary"),
    }
    common_filters: List[str] = []
    common_params: List[Any] = []
    if getattr(args, "project", None):
        common_filters.append("project LIKE ?")
        common_params.append(f"%{args.project}%")
    if getattr(args, "tag", None):
        common_filters.append("tags LIKE ?")
        common_params.append(f"%{args.tag}%")
    if getattr(args, "file", None):
        common_filters.append("(related_files LIKE ? OR key_files LIKE ?)")
        common_params.extend([f"%{args.file}%", f"%{args.file}%"])

    combined: List[Dict[str, Any]] = []
    for table, cols in table_columns.items():
        clauses = list(common_filters)
        params = list(common_params)
        if getattr(args, "text", None):
            needle = f"%{args.text}%"
            text_clause = " OR ".join(f"{c} LIKE ?" for c in cols)
            clauses.append(f"({text_clause})")
            params.extend([needle] * len(cols))
        where_sql = " AND ".join(clauses) if clauses else "1=1"
        title_col = "path" if table == "code_map_modules" else "title"
        rows = conn.execute(
            f"SELECT id, {title_col} AS display_title, project, tags, created_at FROM {table} "
            f"WHERE {where_sql} ORDER BY created_at DESC",
            params,
        ).fetchall()
        for r in rows:
            combined.append({
                "table": table, "id": r["id"], "title": r["display_title"],
                "project": r["project"], "tags": r["tags"],
                "created_at": r["created_at"],
            })
    combined.sort(key=lambda x: x["created_at"], reverse=True)
    if not combined:
        print("(no records matched)")
        return 0
    print(f"{'TYPE':<18} {'ID':<10} {'PROJECT':<22} TITLE")
    print("-" * 120)
    for item in combined[: args.limit]:
        print(
            f"{item['table']:<18} {item['id']:<10} "
            f"{(item['project'] or '')[:21]:<22} {item['title']}"
        )
        if item["tags"]:
            print(f"{'':<50} tags: {item['tags']}")
    print()
    print(f"Total matches: {len(combined)}")
    return 0


def cmd_show(args: argparse.Namespace, conn: sqlite3.Connection) -> int:
    rec_id = args.id.upper()
    for table in ("problem_records", "decision_logs", "improvements", "code_map_modules"):
        row = conn.execute(f"SELECT * FROM {table} WHERE id = ?", (rec_id,)).fetchone()
        if row:
            print(f"=== {table} :: {rec_id} ===\n")
            _print_row(row)
            return 0
    print(f"[!] No record found with id: {rec_id}")
    return 1


def cmd_session(args: argparse.Namespace, conn: sqlite3.Connection) -> int:
    now = _now()
    conn.execute(
        """
        INSERT INTO knowledge_sessions (
            project, topic, summary,
            related_problem_ids, related_decision_ids, related_improvement_ids,
            created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            args.project, args.topic, args.summary,
            args.problems, args.decisions, args.improvements, now,
        ),
    )
    conn.commit()
    print("[OK] Knowledge session saved")
    return 0


def cmd_export(args: argparse.Namespace, conn: sqlite3.Connection) -> int:
    out: Dict[str, Any] = {"exported_at": _now(), "tables": {}}
    for table in ("problem_records", "decision_logs", "improvements",
                   "code_map_modules", "knowledge_sessions"):
        rows = conn.execute(f"SELECT * FROM {table} ORDER BY created_at").fetchall()
        out["tables"][table] = [dict(r) for r in rows]
    path = Path(args.output)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    total = sum(len(v) for v in out["tables"].values())
    print(f"[OK] Exported {total} record(s) to {path}")
    return 0


def cmd_info(args: argparse.Namespace, conn: sqlite3.Connection) -> int:
    db_file = Path(conn.execute("PRAGMA database_list").fetchone()["file"]).resolve()
    print(f"Database: {db_file}")
    print()
    for table in ("problem_records", "decision_logs", "improvements", "code_map_modules"):
        n = conn.execute(f"SELECT COUNT(*) AS c FROM {table}").fetchone()["c"]
        print(f"  {table:<20} {n} records")
    projects = set()
    for table in ("problem_records", "decision_logs", "improvements", "code_map_modules"):
        rows = conn.execute(f"SELECT DISTINCT project FROM {table} WHERE project IS NOT NULL").fetchall()
        projects.update(r["project"] for r in rows if r["project"])
    if projects:
        print()
        print("Projects tracked: " + ", ".join(sorted(projects)))
    return 0


# ---------------------------------------------------------------------------
# Argument parser & entry point
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="problem_kb",
        description="Local SQLite knowledge base for coding problems, decisions, and improvements. Works across ALL projects; use --project to tag each record.",
    )
    p.add_argument("--db", default=None,
                   help=f"Path to SQLite db. Default: ${DB_ENV_VAR} or {DEFAULT_DB}")
    sub = p.add_subparsers(dest="cmd", required=True)

    sp = sub.add_parser("add-problem", help="Add a bug/issue record with its solution.")
    sp.add_argument("--title", required=True)
    sp.add_argument("--project", default=None)
    sp.add_argument("--category", default=None)
    sp.add_argument("--severity", default="medium",
                    choices=["low", "medium", "high", "critical"])
    sp.add_argument("--status", default="resolved",
                    choices=["open", "investigating", "resolved", "wontfix"])
    sp.add_argument("--context", default=None)
    sp.add_argument("--problem", default=None, dest="problem")
    sp.add_argument("--root-cause", default=None, dest="root_cause")
    sp.add_argument("--solution", default=None)
    sp.add_argument("--lessons", default=None)
    sp.add_argument("--files", default=None)
    sp.add_argument("--code-before", default=None, dest="code_before")
    sp.add_argument("--code-after", default=None, dest="code_after")
    sp.add_argument("--tags", default=None)
    sp.add_argument("--references", default=None)
    sp.set_defaults(func=cmd_add_problem)

    sp = sub.add_parser("add-decision", help="Add an architecture/tech/product decision.")
    sp.add_argument("--title", required=True)
    sp.add_argument("--project", default=None)
    sp.add_argument("--type", default="architecture",
                    choices=["architecture", "tech_choice", "product", "design_pattern", "workflow"])
    sp.add_argument("--background", default=None)
    sp.add_argument("--options", default=None)
    sp.add_argument("--decision", default=None)
    sp.add_argument("--impact", default=None)
    sp.add_argument("--files", default=None)
    sp.add_argument("--open-questions", default=None, dest="open_questions")
    sp.add_argument("--author", default="AI-Agent")
    sp.add_argument("--tags", default=None)
    sp.set_defaults(func=cmd_add_decision)

    sp = sub.add_parser("add-improvement", help="Add a refactor/perf/dx/feature idea.")
    sp.add_argument("--title", required=True)
    sp.add_argument("--project", default=None)
    sp.add_argument("--category", default="refactor",
                    choices=["refactor", "feature", "perf", "dx", "test", "security"])
    sp.add_argument("--priority", default="medium", choices=["low", "medium", "high"])
    sp.add_argument("--status", default="proposed",
                    choices=["proposed", "planned", "in_progress", "done", "rejected"])
    sp.add_argument("--effort", default=None)
    sp.add_argument("--context", default=None)
    sp.add_argument("--rationale", default=None)
    sp.add_argument("--prerequisites", default=None)
    sp.add_argument("--files", default=None)
    sp.add_argument("--related-decisions", default=None, dest="related_decisions")
    sp.add_argument("--related-problems", default=None, dest="related_problems")
    sp.add_argument("--tags", default=None)
    sp.set_defaults(func=cmd_add_improvement)

    sp = sub.add_parser("add-module", help="Add a module summary (build your code map).")
    sp.add_argument("--path", required=True)
    sp.add_argument("--project", default=None)
    sp.add_argument("--purpose", default=None)
    sp.add_argument("--public-api", default=None, dest="public_api")
    sp.add_argument("--dependencies", default=None)
    sp.add_argument("--key-files", default=None, dest="key_files")
    sp.add_argument("--summary", default=None)
    sp.add_argument("--tags", default=None)
    sp.add_argument("--hash", default=None)
    sp.set_defaults(func=cmd_add_module)

    sp = sub.add_parser("list", help="List records in a table with filters.")
    sp.add_argument("--table", default="problem_records",
                    choices=["problem_records", "decision_logs",
                             "improvements", "code_map_modules"])
    sp.add_argument("--project", default=None)
    sp.add_argument("--category", default=None)
    sp.add_argument("--severity", default=None)
    sp.add_argument("--priority", default=None)
    sp.add_argument("--status", default=None)
    sp.add_argument("--tag", default=None)
    sp.add_argument("--file", default=None)
    sp.add_argument("--limit", type=int, default=50)
    sp.set_defaults(func=cmd_list)

    sp = sub.add_parser("search", help="Cross-table search by text, tag, project, or file.")
    sp.add_argument("--text", default=None)
    sp.add_argument("--tag", default=None)
    sp.add_argument("--project", default=None)
    sp.add_argument("--file", default=None)
    sp.add_argument("--limit", type=int, default=50)
    sp.set_defaults(func=cmd_search)

    sp = sub.add_parser("show", help="Show full details of a record by id (e.g. PROB-001).")
    sp.add_argument("--id", required=True, help="PROB-NNN / DEC-NNN / IMP-NNN / MOD-NNN")
    sp.set_defaults(func=cmd_show)

    sp = sub.add_parser("session", help="Bundle related record ids + a summary.")
    sp.add_argument("--project", default=None)
    sp.add_argument("--topic", default=None)
    sp.add_argument("--summary", default=None)
    sp.add_argument("--problems", default=None)
    sp.add_argument("--decisions", default=None)
    sp.add_argument("--improvements", default=None)
    sp.set_defaults(func=cmd_session)

    sp = sub.add_parser("export", help="Export all tables to JSON.")
    sp.add_argument("--output", default=str(Path.cwd() / "knowledge_export.json"))
    sp.set_defaults(func=cmd_export)

    sp = sub.add_parser("info", help="Print DB location and record counts.")
    sp.set_defaults(func=cmd_info)

    return p


def main(argv: Optional[List[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    db_path = resolve_db_path(args.db)
    conn = get_conn(db_path)
    try:
        return args.func(args, conn)
    finally:
        conn.close()


if __name__ == "__main__":
    sys.exit(main())
