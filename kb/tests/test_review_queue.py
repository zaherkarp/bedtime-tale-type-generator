"""The review queue's CSV round-trip (assessment §3.8, §8).

§8 answers "should the editorial interface arrive earlier?" with: the *workflow*
yes, the *interface* no — possibly never. A queue table with SQL views and a CSV
round-trip is adequate curator tooling for years. This is the test that says the
round-trip actually works, which is the difference between that answer being a
plan and being a decision.
"""

from __future__ import annotations

import csv

import pytest

from atukb.db import fetch_one, scalar
from atukb.review.queue import export_queue, import_decisions, summary

from .conftest import requires_db

pytestmark = requires_db


@pytest.fixture
def seeded(conn, tmp_path):
    conn.execute("SAVEPOINT review_round_trip")
    conn.execute(
        """
        INSERT INTO core.review_queue (item_type, item_ref, reason, detail)
        VALUES ('tale_type_record', 'TEST-1', 'round-trip probe', '{"a": 1}')
        ON CONFLICT DO NOTHING
        """
    )
    yield tmp_path
    conn.execute("ROLLBACK TO SAVEPOINT review_round_trip")


def test_open_items_export_to_csv(conn, seeded) -> None:
    path = seeded / "queue.csv"
    count = export_queue(conn, path)
    assert count > 0
    rows = list(csv.DictReader(path.open(encoding="utf-8")))
    assert {"item_id", "item_type", "item_ref", "reason", "detail", "status"} <= set(
        rows[0]
    )
    probe = next(r for r in rows if r["item_ref"] == "TEST-1")
    assert probe["status"] == "open"
    assert probe["detail"] == '{"a": 1}'


def test_decisions_come_back_in(conn, seeded) -> None:
    path = seeded / "queue.csv"
    export_queue(conn, path)
    rows = list(csv.DictReader(path.open(encoding="utf-8")))
    probe = next(r for r in rows if r["item_ref"] == "TEST-1")
    probe["status"] = "accepted"
    probe["decision_note"] = "checked against the printed index"

    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)

    assert import_decisions(conn, path) >= 1
    stored = fetch_one(
        conn,
        "SELECT status, decision_note, decided_at FROM core.review_queue "
        "WHERE item_ref = 'TEST-1'",
    )
    assert stored["status"] == "accepted"
    assert stored["decision_note"] == "checked against the printed index"
    assert stored["decided_at"] is not None


def test_a_spreadsheet_cannot_edit_the_underlying_claim(conn, seeded) -> None:
    """Only status and decision_note are read back.

    Letting the CSV write the claim itself would make the queue a second write
    path into the data, which is the mistake §6.2 is about — one level up from
    the schema, in the workflow.
    """
    path = seeded / "queue.csv"
    export_queue(conn, path)
    rows = list(csv.DictReader(path.open(encoding="utf-8")))
    probe = next(r for r in rows if r["item_ref"] == "TEST-1")
    probe["status"] = "rejected"
    probe["reason"] = "tampered"
    probe["item_ref"] = "TEST-999"
    probe["detail"] = '{"a": 99}'
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    import_decisions(conn, path)

    stored = fetch_one(
        conn,
        "SELECT item_ref, reason, detail, status FROM core.review_queue "
        "WHERE item_id = %s",
        (int(probe["item_id"]),),
    )
    assert stored["item_ref"] == "TEST-1"
    assert stored["reason"] == "round-trip probe"
    assert stored["detail"] == {"a": 1}
    assert stored["status"] == "rejected"


def test_an_unknown_status_is_ignored_not_applied(conn, seeded) -> None:
    path = seeded / "queue.csv"
    export_queue(conn, path)
    rows = list(csv.DictReader(path.open(encoding="utf-8")))
    for row in rows:
        row["status"] = "maybe"
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    assert import_decisions(conn, path) == 0
    assert (
        scalar(
            conn,
            "SELECT status FROM core.review_queue WHERE item_ref = 'TEST-1'",
        )
        == "open"
    )


def test_summary_groups_by_reason(conn, seeded) -> None:
    rows = summary(conn)
    assert any(r["reason"] == "round-trip probe" for r in rows)
