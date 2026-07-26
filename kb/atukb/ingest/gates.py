"""Ingestion gates and their failure behaviour (assessment §6.8).

The proposal's Acquire -> Profile -> Normalize -> Resolve -> Publish flow is
sound; what it lacked was a *defined failure* at each step. An undeclared
failure becomes a shrug at 2am, and the failure mode that matters most — silent
truncation — looks exactly like success.

Each gate here does one of four things, and which one is a property of the
failure, not of the caller's mood:

``halt``       raise, abandon the run. Nothing partial reaches core.
``quarantine`` keep the row with its reason, continue, report the count.
``review``     route to the review queue as data. Never auto-merge.
``exclude``    drop from the published projection, log it, continue.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any

import psycopg

from atukb.db import fetch_one, scalar


class IngestionHalt(RuntimeError):
    """A gate that halts. Never downgraded to a warning."""


@dataclass
class GateReport:
    """What a run's gates observed, for the validation report."""

    source_version_id: int
    dataset: str
    rows_seen: int = 0
    rows_normalised: int = 0
    rows_quarantined: int = 0
    review_items: int = 0
    quarantine_reasons: dict[str, int] = field(default_factory=dict)
    notes: list[str] = field(default_factory=list)

    def quarantined(self, reason_class: str) -> None:
        self.rows_quarantined += 1
        self.quarantine_reasons[reason_class] = (
            self.quarantine_reasons.get(reason_class, 0) + 1
        )

    def as_dict(self) -> dict[str, Any]:
        return {
            "dataset": self.dataset,
            "rows_seen": self.rows_seen,
            "rows_normalised": self.rows_normalised,
            "rows_quarantined": self.rows_quarantined,
            "review_items": self.review_items,
            "quarantine_reasons": self.quarantine_reasons,
            "notes": self.notes,
        }


# -- Acquire ----------------------------------------------------------------

def gate_checksum_unchanged(
    conn: psycopg.Connection, source_key: str, name: str, sha256: str
) -> None:
    """An unannounced upstream change is never routine. **Halt.**"""
    previous = fetch_one(
        conn,
        """
        SELECT artifact_id, sha256 FROM core.artifact
         WHERE source_key = %s AND name = %s
         ORDER BY retrieved_at DESC LIMIT 1
        """,
        (source_key, name),
    )
    if previous and previous["sha256"] != sha256:
        raise IngestionHalt(
            f"{source_key}/{name}: upstream checksum changed from "
            f"{previous['sha256'][:12]} to {sha256[:12]}. Review the diff and "
            f"register a new source version deliberately (§6.8)."
        )


# -- Parse ------------------------------------------------------------------

#: §6.8's threshold. A 2% swing in row count is the signature of silent
#: truncation, which is the failure that looks like success.
ROW_COUNT_TOLERANCE = 0.02


def gate_row_count_stable(
    conn: psycopg.Connection, dataset: str, current_rows: int
) -> str | None:
    """**Halt** on a >2% deviation from the previous version of this dataset."""
    previous = scalar(
        conn,
        """
        SELECT (stats ->> 'rows_seen')::int
          FROM core.ingestion_run r
          JOIN core.source_version v USING (source_version_id)
         WHERE v.dataset = %s AND r.status = 'succeeded'
         ORDER BY r.finished_at DESC LIMIT 1
        """,
        (dataset,),
    )
    if previous in (None, 0):
        return None
    delta = abs(current_rows - previous) / previous
    if delta > ROW_COUNT_TOLERANCE:
        raise IngestionHalt(
            f"{dataset}: row count moved {delta:.1%} (from {previous} to "
            f"{current_rows}), beyond the {ROW_COUNT_TOLERANCE:.0%} tolerance. "
            f"This is what silent truncation looks like (§6.8)."
        )
    return f"row count within tolerance: {previous} -> {current_rows}"


def quarantine_row(
    conn: psycopg.Connection,
    *,
    source_version_id: int,
    dataset: str,
    source_locator: str,
    reason: str,
    payload: dict,
    report: GateReport,
    reason_class: str = "code_grammar",
) -> None:
    """**Quarantine** one row and continue. The count reaches the report."""
    conn.execute(
        """
        INSERT INTO core.quarantine (source_version_id, dataset, source_locator,
                                     reason, payload)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (source_version_id, dataset, source_locator, reason) DO NOTHING
        """,
        (source_version_id, dataset, source_locator, reason, json.dumps(payload)),
    )
    report.quarantined(reason_class)


# -- Normalize --------------------------------------------------------------

def gate_canonicalisation_is_idempotent(
    canonicalise, samples: list[str], *, what: str
) -> None:
    """**Halt** unless ``f(f(x)) == f(x)``.

    A non-idempotent normaliser corrupts data on every re-run, and the
    corruption compounds silently because each run looks locally reasonable.
    """
    for sample in samples:
        once = canonicalise(sample)
        twice = canonicalise(once)
        if once != twice:
            raise IngestionHalt(
                f"{what} canonicalisation is not idempotent: "
                f"{sample!r} -> {once!r} -> {twice!r} (§6.8)."
            )


# -- Resolve ----------------------------------------------------------------

def route_to_review(
    conn: psycopg.Connection,
    *,
    item_type: str,
    item_ref: str,
    reason: str,
    detail: dict,
    report: GateReport | None = None,
) -> None:
    """**Route to the review queue.** Never auto-merge.

    Records should not be merged solely because their titles are similar — the
    discipline most likely to be abandoned under schedule pressure, so it is a
    function call rather than a guideline.
    """
    inserted = scalar(
        conn,
        """
        INSERT INTO core.review_queue (item_type, item_ref, reason, detail)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (item_type, item_ref, reason) DO NOTHING
        RETURNING item_id
        """,
        (item_type, item_ref, reason, json.dumps(detail)),
    )
    if inserted is not None and report is not None:
        report.review_items += 1


def gate_resolution_is_stable(
    conn: psycopg.Connection, record_id: int, new_concept_id: int
) -> None:
    """**Halt** when a previously-resolved record resolves differently.

    This is how identity silently drifts between runs, and it is invisible
    unless something checks for it explicitly.
    """
    existing = scalar(
        conn,
        "SELECT concept_id FROM core.tale_type_record WHERE record_id = %s",
        (record_id,),
    )
    if existing is not None and existing != new_concept_id:
        raise IngestionHalt(
            f"record {record_id} previously resolved to concept {existing} and "
            f"now resolves to {new_concept_id}. Identity must not drift between "
            f"runs (§6.8)."
        )
