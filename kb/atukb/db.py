"""Database access: psycopg 3 with explicit SQL.

No ORM. This is an ingest-and-read-only-API shape where SQL *is* the model, and
an ORM mostly adds a layer to see through (assessment §6.6).
"""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from typing import Any

import psycopg
from psycopg.rows import dict_row

from atukb.config import settings


@contextmanager
def connect(dsn: str | None = None, *, autocommit: bool = False) -> Iterator[psycopg.Connection]:
    with psycopg.connect(
        dsn or settings.dsn, row_factory=dict_row, autocommit=autocommit
    ) as conn:
        yield conn


def fetch_all(conn: psycopg.Connection, sql: str, params: Any = None) -> list[dict]:
    with conn.cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchall()


def fetch_one(conn: psycopg.Connection, sql: str, params: Any = None) -> dict | None:
    with conn.cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchone()


def scalar(conn: psycopg.Connection, sql: str, params: Any = None) -> Any:
    row = fetch_one(conn, sql, params)
    if row is None:
        return None
    return next(iter(row.values()))
