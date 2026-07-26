"""Sync the rights register and the artifact store into ``core``.

Nothing may be ingested until its source, its retrieved version and its reviewed
rights-register row all exist in the database, because that is what the ingest
gate consults (§6.4). Registering also materialises the derivational lineage in
:mod:`atukb.ingest.lineage`, so a citation can be resolved with a query rather
than assembled by hand.
"""

from __future__ import annotations

import json

import psycopg

from atukb.acquire.artifact_store import Artifact, ArtifactStore
from atukb.acquire.plans import PLANS
from atukb.db import scalar
from atukb.ingest.lineage import BIBLIOGRAPHIC_SOURCES, DERIVATION_EDGES
from atukb.rights.register import RightsRegister, SourceRights


def upsert_artifact(
    conn: psycopg.Connection, artifact: Artifact, *, is_license_evidence: bool
) -> str:
    conn.execute(
        """
        INSERT INTO core.artifact (artifact_id, source_key, name, url, sha256,
                                   bytes_len, media_type, retrieved_at,
                                   is_license_evidence)
        VALUES (%(artifact_id)s, %(source_key)s, %(name)s, %(url)s, %(sha256)s,
                %(bytes_len)s, %(media_type)s, %(retrieved_at)s, %(evidence)s)
        ON CONFLICT (artifact_id) DO UPDATE
            SET url = EXCLUDED.url,
                retrieved_at = EXCLUDED.retrieved_at,
                is_license_evidence = EXCLUDED.is_license_evidence
        """,
        {
            "artifact_id": artifact.artifact_id,
            "source_key": artifact.source_key,
            "name": artifact.name,
            "url": artifact.url,
            "sha256": artifact.sha256,
            "bytes_len": artifact.bytes_len,
            "media_type": artifact.media_type,
            "retrieved_at": artifact.retrieved_at,
            "evidence": is_license_evidence,
        },
    )
    return artifact.artifact_id


def upsert_source(
    conn: psycopg.Connection, key: str, name: str, homepage_url: str, description: str
) -> int:
    return scalar(
        conn,
        """
        INSERT INTO core.source (key, name, homepage_url, description)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (key) DO UPDATE
            SET name = EXCLUDED.name,
                homepage_url = EXCLUDED.homepage_url,
                description = EXCLUDED.description
        RETURNING source_id
        """,
        (key, name, homepage_url, description),
    )


def upsert_rights(conn: psycopg.Connection, source_id: int, entry: SourceRights) -> None:
    conn.execute(
        """
        INSERT INTO core.rights_register (
            source_id, license_asserted_spdx, license_reviewed_spdx,
            license_asserted_evidence, reviewed_by, reviewed_at,
            redistribution_ok, commercial_ok, share_alike_required,
            attribution_text_required, upstream_rights_status,
            database_right_status, open_questions, gate_status, entry)
        VALUES (%(source_id)s, %(asserted)s, %(reviewed)s, %(evidence)s,
                %(reviewed_by)s, %(reviewed_at)s, %(redistribution_ok)s,
                %(commercial_ok)s, %(share_alike)s, %(attribution)s,
                %(upstream)s, %(dbright)s, %(questions)s, %(gate)s, %(entry)s)
        ON CONFLICT (source_id) DO UPDATE SET
            license_asserted_spdx = EXCLUDED.license_asserted_spdx,
            license_reviewed_spdx = EXCLUDED.license_reviewed_spdx,
            license_asserted_evidence = EXCLUDED.license_asserted_evidence,
            reviewed_by = EXCLUDED.reviewed_by,
            reviewed_at = EXCLUDED.reviewed_at,
            redistribution_ok = EXCLUDED.redistribution_ok,
            commercial_ok = EXCLUDED.commercial_ok,
            share_alike_required = EXCLUDED.share_alike_required,
            attribution_text_required = EXCLUDED.attribution_text_required,
            upstream_rights_status = EXCLUDED.upstream_rights_status,
            database_right_status = EXCLUDED.database_right_status,
            open_questions = EXCLUDED.open_questions,
            gate_status = EXCLUDED.gate_status,
            entry = EXCLUDED.entry
        """,
        {
            "source_id": source_id,
            "asserted": entry.license_asserted_spdx,
            "reviewed": entry.license_reviewed_spdx,
            # Resolved to an artifact id by `link_license_evidence` once the
            # evidence artifact is known to the database.
            "evidence": None,
            "reviewed_by": entry.reviewed_by,
            "reviewed_at": entry.reviewed_at,
            "redistribution_ok": entry.redistribution_ok,
            "commercial_ok": entry.commercial_ok,
            "share_alike": entry.share_alike_required,
            "attribution": entry.attribution_text_required,
            "upstream": str(entry.upstream_rights_status),
            "dbright": str(entry.database_right_status),
            "questions": entry.open_questions,
            "gate": str(entry.gate_status),
            "entry": json.dumps(entry.model_dump(mode="json")),
        },
    )


def upsert_source_version(
    conn: psycopg.Connection,
    *,
    source_id: int,
    version_label: str,
    kind: str = "retrieved",
    artifact_id: str | None = None,
    dataset: str | None = None,
    retrieved_at: str | None = None,
) -> int:
    return scalar(
        conn,
        """
        INSERT INTO core.source_version (source_id, version_label, kind,
                                         artifact_id, dataset, retrieved_at)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (source_id, version_label) DO UPDATE
            SET artifact_id = EXCLUDED.artifact_id,
                dataset = EXCLUDED.dataset,
                retrieved_at = EXCLUDED.retrieved_at
        RETURNING source_version_id
        """,
        (source_id, version_label, kind, artifact_id, dataset, retrieved_at),
    )


def register_all(
    conn: psycopg.Connection, register: RightsRegister, store: ArtifactStore
) -> dict[str, int]:
    """Register every source, artifact, version and lineage edge.

    Returns a map of version label to ``source_version_id``, which is what the
    dataset loaders need to attach their rows to.
    """
    versions: dict[str, int] = {}

    for bib in BIBLIOGRAPHIC_SOURCES:
        source_id = upsert_source(
            conn, bib.key, bib.name, bib.homepage_url, bib.description
        )
        versions[bib.version_label] = upsert_source_version(
            conn,
            source_id=source_id,
            version_label=bib.version_label,
            kind="bibliographic",
        )

    for entry in register:
        source_id = upsert_source(
            conn, entry.key, entry.name, entry.homepage_url, entry.description
        )
        upsert_rights(conn, source_id, entry)

        plan = PLANS.get(entry.key)
        if plan is None:
            continue
        for artifact_plan in plan.artifacts:
            artifact = store.get(entry.key, artifact_plan.name)
            if artifact is None:
                continue
            upsert_artifact(
                conn, artifact, is_license_evidence=artifact_plan.is_license_evidence
            )
            if artifact_plan.is_license_evidence:
                continue
            dataset = artifact_plan.name.rsplit(".", 1)[0]
            label = f"{entry.key}/{dataset}"
            versions[label] = upsert_source_version(
                conn,
                source_id=source_id,
                version_label=label,
                artifact_id=artifact.artifact_id,
                dataset=dataset,
                retrieved_at=artifact.retrieved_at,
            )

        link_license_evidence(conn, source_id, entry, store)

    _link_derivations(conn, versions)
    return versions


def link_license_evidence(
    conn: psycopg.Connection,
    source_id: int,
    entry: SourceRights,
    store: ArtifactStore,
) -> None:
    """Point the register row at the LICENSE/README artifact as retrieved.

    §4 risk 9: GitHub datasets vanish, and a license asserted in a since-deleted
    README leaves no proof of the right you relied on. Linking the *snapshot*,
    not the URL, is what survives that.
    """
    if not entry.license_asserted_evidence:
        return
    _, _, name = entry.license_asserted_evidence.partition("/")
    artifact = store.get(entry.key, name)
    if artifact is None:
        return
    conn.execute(
        "UPDATE core.rights_register SET license_asserted_evidence = %s "
        "WHERE source_id = %s",
        (artifact.artifact_id, source_id),
    )


def _link_derivations(conn: psycopg.Connection, versions: dict[str, int]) -> None:
    for descendant, ancestor, note in DERIVATION_EDGES:
        if descendant not in versions or ancestor not in versions:
            continue
        conn.execute(
            """
            UPDATE core.source_version
               SET derives_from_source_version_id = %s,
                   derivation_note = %s
             WHERE source_version_id = %s
            """,
            (versions[ancestor], note, versions[descendant]),
        )
