"""SQLite helpers. Single database, tenant_id scoping on every table."""
from __future__ import annotations
import sqlite3
from pathlib import Path

SCHEMA_PATH = Path(__file__).parent / "schema.sql"


def connect(path: str) -> sqlite3.Connection:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript(SCHEMA_PATH.read_text())
    conn.commit()
    return conn


def rows(conn, sql: str, args=()) -> list[dict]:
    return [dict(r) for r in conn.execute(sql, args).fetchall()]


def one(conn, sql: str, args=()) -> dict | None:
    r = conn.execute(sql, args).fetchone()
    return dict(r) if r else None


def insert(conn, table: str, data: dict) -> int:
    cols = ", ".join(data)
    ph = ", ".join("?" for _ in data)
    cur = conn.execute(f"INSERT INTO {table} ({cols}) VALUES ({ph})",
                       tuple(data.values()))
    conn.commit()
    return cur.lastrowid


def update(conn, table: str, row_id: int, tenant_id: int, data: dict) -> None:
    sets = ", ".join(f"{k} = ?" for k in data)
    conn.execute(f"UPDATE {table} SET {sets} WHERE id = ? AND tenant_id = ?",
                 (*data.values(), row_id, tenant_id))
    conn.commit()
