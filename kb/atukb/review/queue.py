"""The review queue, as data (assessment §3.8, §8).

`review_status` appeared on nine tables in the proposal, and no phase named a
reviewer, estimated the volume, or said what happens to unreviewed rows. The
arithmetic is unkind: automated resolution across ~2,400 types and ~46,000
motifs produces thousands of items needing review. If review gates publication
the project stalls; if it does not, `review_status` is decoration.

The way out is not a curator web app. It is a table, two views and a CSV
round-trip — adequate curator tooling for years, and a week of work rather than
a project. `review_status` stays honest because unreviewed rows *are* published,
labelled `unreviewed`, and a consumer can filter on it.
"""

from __future__ import annotations

import csv
import json
from pathlib import Path

import psycopg

from atukb.db import fetch_all

FIELDS = ("item_id", "item_type", "item_ref", "reason", "detail", "status", "decision_note")


def export_queue(conn: psycopg.Connection, out_path: str | Path) -> int:
    path = Path(out_path)
    rows = fetch_all(
        conn,
        """
        SELECT item_id, item_type, item_ref, reason, detail, status, decision_note
          FROM core.review_queue
         WHERE status = 'open'
         ORDER BY item_type, item_ref, reason
        """,
    )
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=FIELDS)
        writer.writeheader()
        for row in rows:
            writer.writerow({**row, "detail": json.dumps(row["detail"], ensure_ascii=False)})
    return len(rows)


def import_decisions(conn: psycopg.Connection, in_path: str | Path) -> int:
    """Apply a reviewed CSV back onto the queue.

    Only ``status`` and ``decision_note`` are read back. Everything else in the
    file is context for the reviewer, and letting a spreadsheet edit the
    underlying claim would make the queue a second write path — which is the
    mistake §6.2 is about.
    """
    applied = 0
    with Path(in_path).open(encoding="utf-8", newline="") as fh:
        for row in csv.DictReader(fh):
            status = (row.get("status") or "").strip()
            if status not in {"accepted", "rejected", "deferred"}:
                continue
            conn.execute(
                """
                UPDATE core.review_queue
                   SET status = %s,
                       decision_note = %s,
                       decided_at = now()
                 WHERE item_id = %s AND status = 'open'
                """,
                (status, (row.get("decision_note") or "").strip(), int(row["item_id"])),
            )
            applied += 1
    return applied


def summary(conn: psycopg.Connection) -> list[dict]:
    return fetch_all(
        conn,
        """
        SELECT item_type, reason, status, count(*) AS items
          FROM core.review_queue
         GROUP BY item_type, reason, status
         ORDER BY items DESC
        """,
    )
