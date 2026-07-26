"""Load retrieved artifacts into ``raw`` exactly as they arrived.

``raw`` keeps every column, including the ones the rights register withholds
from ``core``. That is not a loophole — it is what makes the withholding
checkable. A reviewer resolving the Motif-Index renewal question needs to see
the bibliographies column to judge it; a consumer of the API must never receive
it. Immutability and the publish gate keep those two facts compatible.
"""

from __future__ import annotations

import csv
import io
import json
from collections.abc import Iterator

import psycopg

from atukb.acquire.artifact_store import ArtifactStore
from atukb.db import scalar


def read_csv_rows(store: ArtifactStore, source_key: str, name: str) -> Iterator[dict]:
    """Yield the CSV's rows as dicts, preserving every column verbatim."""
    text = store.read(source_key, name).decode("utf-8", errors="replace")
    yield from csv.DictReader(io.StringIO(text))


def load_rows(
    conn: psycopg.Connection,
    *,
    source_version_id: int,
    dataset: str,
    artifact_id: str,
    rows: Iterator[dict],
    batch_size: int = 5000,
) -> int:
    """Append rows to ``raw.record``. Re-running is a no-op, never an update."""
    inserted = 0
    batch: list[tuple] = []
    with conn.cursor() as cur:
        for number, row in enumerate(rows, start=1):
            batch.append((source_version_id, dataset, number, json.dumps(row), artifact_id))
            if len(batch) >= batch_size:
                inserted += _flush(cur, batch)
                batch.clear()
        if batch:
            inserted += _flush(cur, batch)
    return inserted


def _flush(cur: psycopg.Cursor, batch: list[tuple]) -> int:
    cur.executemany(
        """
        INSERT INTO raw.record (source_version_id, dataset, row_number, data,
                                artifact_id)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (source_version_id, dataset, row_number) DO NOTHING
        """,
        batch,
    )
    return len(batch)


def raw_row_count(conn: psycopg.Connection, source_version_id: int, dataset: str) -> int:
    return scalar(
        conn,
        "SELECT count(*) FROM raw.record WHERE source_version_id = %s AND dataset = %s",
        (source_version_id, dataset),
    )


def iter_raw(
    conn: psycopg.Connection, source_version_id: int, dataset: str
) -> Iterator[tuple[int, dict]]:
    """Stream ``(row_number, data)`` out of ``raw`` in source order."""
    with conn.cursor(name=f"raw_{dataset}_{source_version_id}") as cur:
        cur.execute(
            """
            SELECT row_number, data FROM raw.record
             WHERE source_version_id = %s AND dataset = %s
             ORDER BY row_number
            """,
            (source_version_id, dataset),
        )
        for row in cur:
            yield row["row_number"], row["data"]
