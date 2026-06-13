#!/usr/bin/env python3
"""
Problem Knowledge Base - Local SQLite storage for AI agent coding records.

Stores three kinds of records:
  1. problem_records  - Bugs / issues encountered and how they were solved
  2. decision_logs    - Architecture / product / tech-choice decisions
  3. improvements     - Proposed improvements and refactoring items

Database default location:  ~/.trae-knowledge/knowledge.db
Override with:  export PROBLEM_KB_PATH=/path/to/file.db
          or:  python problem_kb.py --db /path/to/file.db <subcmd> ...

Usage examples:
  python scripts/problem_kb.py add-problem \
      --title "useEffect closure captures stale callback" \
      --category react_pattern \
      --severity high \
      --context "React StrictMode runs useEffect twice" \
      --problem "rendition.on() listener captured old onSelectedText" \
      --solution "Wrap callback in useRef, update ref.current on every render" \
      --files "src/pages/Viewer/components/EpubContent/index.tsx" \
      --tags "react,useRef,useEffect,closure" \
      --project "e-reader-tauri"

  python scripts/problem_kb.py list
  python scripts/problem_kb.py search --tag react
  python scripts/problem_kb.py show --id PROB-001
  python scripts/problem_kb.py add-decision --title "..." --content "..."
  python scripts/problem_kb.py add-improvement --title "..." --content "..."
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
DEFAULT_DB_DIR = Path.home() / ".trae-knowledge"
DEFAULT_DB_FILE = DEFAULT_DB_DIR / "knowledge.db"


# ---------------------------------------------------------------------------
# Database layer
# ---------------------------------------------------------------------------

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


def resolve_db_path(explicit: Optional[str]) -> Path:
    if explicit:
        return Path(explicit)
    env = os.environ.get(DB_ENV_VAR)
    if env:
        return Path(env)
    DEFAULT_DB_DIR.mkdir(parents=True, exist_ok=True)
    return DEFAULT_DB_FILE


def get_conn(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA_SQL)
    return conn


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

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


def _split_csv(val: Optional[str]) -> List[str]:
    if not val:
        return []
    return [x.strip() for x in val.split(",") if x.strip()]


def _join_csv(items: List[str]) -> str:
    return ", ".join(items) if items else ""


def _print_row(row: sqlite3.Row) -> None:
    print("-" * 72)
    for key in row.keys():
        val = row[key]
        if val is None or val == "":
            continue
        # Pretty-print multi-line / long values
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
# Problem records
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
            rec_id,
            args.project,
            args.title,
            args.category,
            args.severity,
            args.status or "resolved",
            args.context,
            args.problem,
            args.root_cause,
            args.solution,
            args.lessons,
            args.files,
            args.code_before,
            args.code_after,
            args.tags,
            args.references,
            now,
            now,
        ),
    )
    conn.commit()
    print(f"[OK] Created problem record: {rec_id}")
    return 0


# ---------------------------------------------------------------------------
# Decision logs
# ---------------------------------------------------------------------------

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
            rec_id,
            args.project,
            args.type,
            args.title,
            args.background,
            args.options,
            args.decision,
            args.impact,
            args.files,
            args.open_questions,
            args.author,
            args.tags,
            now,
            now,
        ),
    )
    conn.commit()
    print(f"[OK] Created decision log: {rec_id}")
    return 0


# ---------------------------------------------------------------------------
# Improvements
# ---------------------------------------------------------------------------

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
            rec_id,
            args.project,
            args.title,
            args.category,
            args.priority,
            args.status or "proposed",
            args.effort,
            args.context,
            args.rationale,
            args.prerequisites,
            args.files,
            args.related_decisions,
            args.related_problems,
            args.tags,
            now,
            now,
        ),
    )
    conn.commit()
    print(f"[OK] Created improvement item: {rec_id}")
    return 0


# ---------------------------------------------------------------------------
# Code map modules
# ---------------------------------------------------------------------------

def cmd_add_module(args: argparse.Namespace, conn: sqlite3.Connection) -> int:
    rec_id = _next_id(conn, "code_map_modules", "MOD")
    now = _now()
    conn.execute(
        """
        INSERT INTO code_map_modules (
            id, project, path, purpose, public_api, dependencies,
            key_files, summary, content_hash, version, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        """,
        (
            rec_id,
            args.project,
            args.path,
            args.purpose,
            args.public_api,
            args.dependencies,
            args.key_files,
            args.summary,
            args.hash,
            now,
            now,
        ),
    )
    conn.commit()
    print(f"[OK] Created code map module: {rec_id}")
    return 0


# ---------------------------------------------------------------------------
# Read operations: list / search / show / export
# ---------------------------------------------------------------------------

def _build_where_clause(args: argparse.Namespace) -> tuple:
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
            "OR context LIKE ? OR lessons_learned LIKE ?)"
        )
        needle = f"%{args.text}%"
        params.extend([needle] * 5)
    return " AND ".join(clauses) if clauses else "1=1", params


def cmd_list(args: argparse.Namespace, conn: sqlite3.Connection) -> int:
    where_sql, params = _build_where_clause(args)
    table = getattr(args, "table", "problem_records")
    rows = conn.execute(
        f"SELECT * FROM {table} WHERE {where_sql} ORDER BY created_at DESC LIMIT ?",
        params + [args.limit],
    ).fetchall()
    print(f"=== {table} ===\n")
    _print_rows(rows)
    return 0


def cmd_search(args: argparse.Namespace, conn: sqlite3.Connection) -> int:
    """Search across all three tables and print compact summary rows."""
    where_sql, params = _build_where_clause(args)
    combined: List[Dict[str, Any]] = []
    for table in ("problem_records", "decision_logs", "improvements"):
        rows = conn.execute(
            f"SELECT id, title, project, tags, created_at FROM {table} "
            f"WHERE {where_sql} ORDER BY created_at DESC",
            params,
        ).fetchall()
        for r in rows:
            combined.append(
                {
                    "table": table,
                    "id": r["id"],
                    "title": r["title"],
                    "project": r["project"],
                    "tags": r["tags"],
                    "created_at": r["created_at"],
                }
            )
    combined.sort(key=lambda x: x["created_at"], reverse=True)
    if not combined:
        print("(no records matched)")
        return 0
    print(f"{'TYPE':<18} {'ID':<10} {'PROJECT':<25} TITLE")
    print("-" * 120)
    for item in combined[: args.limit]:
        print(
            f"{item['table']:<18} {item['id']:<10} "
            f"{(item['project'] or '')[:24]:<25} {item['title']}"
        )
        if item["tags"]:
            print(f"{'':<56} tags: {item['tags']}")
    print()
    print(f"Total matches: {len(combined)}")
    return 0


def cmd_show(args: argparse.Namespace, conn: sqlite3.Connection) -> int:
    rec_id = args.id.upper()
    for table in ("problem_records", "decision_logs", "improvements", "code_map_modules"):
        row = conn.execute(
            f"SELECT * FROM {table} WHERE id = ?", (rec_id,)
        ).fetchone()
        if row:
            print(f"=== {table} :: {rec_id} ===\n")
            _print_row(row)
            return 0
    print(f"[!] No record found with id: {rec_id}")
    return 1


def cmd_export(args: argparse.Namespace, conn: sqlite3.Connection) -> int:
    """Export all tables to a JSON file for backup / sharing."""
    out: Dict[str, Any] = {"exported_at": _now(), "tables": {}}
    for table in ("problem_records", "decision_logs", "improvements", "code_map_modules"):
        rows = conn.execute(f"SELECT * FROM {table} ORDER BY created_at").fetchall()
        out["tables"][table] = [dict(r) for r in rows]
    path = Path(args.output)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    total = sum(len(v) for v in out["tables"].values())
    print(f"[OK] Exported {total} record(s) to {path}")
    return 0


def cmd_session(args: argparse.Namespace, conn: sqlite3.Connection) -> int:
    """Create a 'session' record that bundles several related ids + free-form summary."""
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
            args.project,
            args.topic,
            args.summary,
            args.problems,
            args.decisions,
            args.improvements,
            now,
        ),
    )
    conn.commit()
    print("[OK] Knowledge session saved")
    return 0


def cmd_info(args: argparse.Namespace, conn: sqlite3.Connection) -> int:
    print(f"Database: {Path(conn.execute('PRAGMA database_list').fetchone()['file']).resolve()}")
    print()
    for table in ("problem_records", "decision_logs", "improvements", "code_map_modules"):
        n = conn.execute(f"SELECT COUNT(*) AS c FROM {table}").fetchone()["c"]
        print(f"  {table:<20} {n} records")
    return 0


# ---------------------------------------------------------------------------
# Argument parser & entry point
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="problem_kb",
        description="Local SQLite knowledge base for coding problems, decisions, and improvements.",
    )
    p.add_argument(
        "--db",
        default=None,
        help=f"Path to the SQLite db file. Default: $PROBLEM_KB_PATH or {DEFAULT_DB_FILE}",
    )
    sub = p.add_subparsers(dest="cmd", required=True)

    # ---- add-problem ----
    sp = sub.add_parser("add-problem", help="Add a problem/solution record.")
    sp.add_argument("--title", required=True)
    sp.add_argument("--project", default=None)
    sp.add_argument("--category", default=None,
                    help="e.g. react_pattern | rust_lifetime | epubjs_pitfall | tauri_bug | architecture")
    sp.add_argument("--severity", default="medium",
                    choices=["low", "medium", "high", "critical"])
    sp.add_argument("--status", default="resolved",
                    choices=["open", "investigating", "resolved", "wontfix"])
    sp.add_argument("--context", default=None)
    sp.add_argument("--problem", default=None, dest="problem")
    sp.add_argument("--root-cause", default=None, dest="root_cause")
    sp.add_argument("--solution", default=None)
    sp.add_argument("--lessons", default=None)
    sp.add_argument("--files", default=None, help="Comma-separated related file paths.")
    sp.add_argument("--code-before", default=None, dest="code_before")
    sp.add_argument("--code-after", default=None, dest="code_after")
    sp.add_argument("--tags", default=None, help="Comma-separated tags.")
    sp.add_argument("--references", default=None)
    sp.set_defaults(func=cmd_add_problem)

    # ---- add-decision ----
    sp = sub.add_parser("add-decision", help="Add an architecture/tech decision.")
    sp.add_argument("--title", required=True)
    sp.add_argument("--project", default=None)
    sp.add_argument("--type", default="architecture",
                    choices=["architecture", "tech_choice", "product", "design_pattern"])
    sp.add_argument("--background", default=None)
    sp.add_argument("--options", default=None)
    sp.add_argument("--decision", default=None)
    sp.add_argument("--impact", default=None)
    sp.add_argument("--files", default=None)
    sp.add_argument("--open-questions", default=None, dest="open_questions")
    sp.add_argument("--author", default="AI-Agent")
    sp.add_argument("--tags", default=None)
    sp.set_defaults(func=cmd_add_decision)

    # ---- add-improvement ----
    sp = sub.add_parser("add-improvement", help="Add an improvement/refactoring item.")
    sp.add_argument("--title", required=True)
    sp.add_argument("--project", default=None)
    sp.add_argument("--category", default="refactor",
                    choices=["refactor", "feature", "perf", "dx", "test"])
    sp.add_argument("--priority", default="medium",
                    choices=["low", "medium", "high"])
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

    # ---- add-module (code map) ----
    sp = sub.add_parser("add-module", help="Add a module summary to the code map.")
    sp.add_argument("--path", required=True, help="Module path (e.g. src/pages/Viewer).")
    sp.add_argument("--project", default=None)
    sp.add_argument("--purpose", default=None)
    sp.add_argument("--public-api", default=None, dest="public_api")
    sp.add_argument("--dependencies", default=None)
    sp.add_argument("--key-files", default=None, dest="key_files")
    sp.add_argument("--summary", default=None)
    sp.add_argument("--hash", default=None, help="Content hash for change detection.")
    sp.set_defaults(func=cmd_add_module)

    # ---- list ----
    sp = sub.add_parser("list", help="List records in a single table with filters.")
    sp.add_argument("--table", default="problem_records",
                    choices=["problem_records", "decision_logs",
                             "improvements", "code_map_modules"])
    sp.add_argument("--project", default=None)
    sp.add_argument("--category", default=None)
    sp.add_argument("--severity", default=None,
                    choices=["low", "medium", "high", "critical"])
    sp.add_argument("--priority", default=None,
                    choices=["low", "medium", "high"])
    sp.add_argument("--status", default=None)
    sp.add_argument("--tag", default=None)
    sp.add_argument("--file", default=None)
    sp.add_argument("--limit", type=int, default=50)
    sp.set_defaults(func=cmd_list)

    # ---- search (cross-table) ----
    sp = sub.add_parser("search", help="Free-text/tag search across all tables.")
    sp.add_argument("--text", default=None, help="Free text to search in titles/body.")
    sp.add_argument("--tag", default=None)
    sp.add_argument("--project", default=None)
    sp.add_argument("--file", default=None)
    sp.add_argument("--limit", type=int, default=50)
    sp.set_defaults(func=cmd_search)

    # ---- show ----
    sp = sub.add_parser("show", help="Show full details of one record by id.")
    sp.add_argument("--id", required=True, help="e.g. PROB-001, DEC-003, IMP-002, MOD-001")
    sp.set_defaults(func=cmd_show)

    # ---- session ----
    sp = sub.add_parser("session", help="Bundle related records into a knowledge session.")
    sp.add_argument("--project", default=None)
    sp.add_argument("--topic", default=None)
    sp.add_argument("--summary", default=None)
    sp.add_argument("--problems", default=None)
    sp.add_argument("--decisions", default=None)
    sp.add_argument("--improvements", default=None)
    sp.set_defaults(func=cmd_session)

    # ---- export ----
    sp = sub.add_parser("export", help="Export all tables to JSON.")
    sp.add_argument("--output", default="knowledge_export.json")
    sp.set_defaults(func=cmd_export)

    # ---- info ----
    sp = sub.add_parser("info", help="Print database stats and location.")
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
