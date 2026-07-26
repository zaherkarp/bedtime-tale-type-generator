"""Rights register and the three gates (assessment §6.4, §6.7)."""

from __future__ import annotations

import pytest

from atukb.rights.gates import GateRefusal, check_ingest, check_publish, effective_license
from atukb.rights.register import (
    GateStatus,
    PublicationStatus,
    SourceRights,
    load_register,
)


@pytest.fixture(scope="module")
def register():
    return load_register()


def test_every_registered_source_is_loadable(register) -> None:
    assert set(register.sources) == {"tmi_mellmann", "trilogy", "wikidata_p2540"}


def test_an_unregistered_source_cannot_be_gated_at_all(register) -> None:
    """§6.4: no register row, no gate evaluation. Not a default-allow."""
    with pytest.raises(KeyError, match="no rights-register entry"):
        register["ashliman_folktexts"]


def test_acquisition_never_needs_the_register() -> None:
    """§3.3: you must fetch the artifact to read its license.

    The proposal's "complete the rights register before downloading anything" is
    a deadlock, so acquisition is unconditional and enforcement moves to ingest
    and publish.
    """
    from atukb.rights.gates import check_acquire

    assert check_acquire.__doc__  # documented as deliberately unconditional
    entry = SourceRights(
        key="unreviewed",
        name="Something we have only just found",
        homepage_url="https://example.invalid/",
        license_asserted_spdx="NOASSERTION",
        upstream_rights_status="unresolved",
        database_right_status="unresolved",
    )
    assert check_acquire(entry) is None
    assert entry.gate_status is GateStatus.ACQUIRED


def test_ingest_refuses_an_unreviewed_source(register) -> None:
    unreviewed = SourceRights(
        key="unreviewed",
        name="Something we have only just found",
        homepage_url="https://example.invalid/",
        license_asserted_spdx="NOASSERTION",
        upstream_rights_status="unresolved",
        database_right_status="unresolved",
    )
    reg = register.model_copy(
        update={"sources": {**register.sources, "unreviewed": unreviewed}}
    )
    with pytest.raises(GateRefusal, match="has not been reviewed"):
        check_ingest(reg, "unreviewed")


def test_ingest_admits_the_three_reviewed_sources(register) -> None:
    for key in ("tmi_mellmann", "trilogy", "wikidata_p2540"):
        assert check_ingest(register, key).key == key


def test_thick_uther_text_is_not_ingestable(register) -> None:
    """§5.3: the parts you most want are the parts you most clearly may not take."""
    trilogy = register["trilogy"]
    assert trilogy.may_ingest_field("atu_df", "atu_id")
    assert trilogy.may_ingest_field("atu_df", "tale_name")
    for withheld in ("tale_type", "remarks", "litvar", "provenance"):
        assert not trilogy.may_ingest_field("atu_df", withheld), withheld
        assert withheld in trilogy.withheld_fields


def test_motif_bibliographies_are_not_ingestable(register) -> None:
    tmi = register["tmi_mellmann"]
    assert tmi.may_ingest_field("tmi", "code")
    assert tmi.may_ingest_field("tmi", "MOTIF")
    assert not tmi.may_ingest_field("tmi", "bibliographies")
    assert tmi.field_class("tmi", "code") == "structure"


def test_annotations_class_is_withheld_from_publication(register) -> None:
    """§5.1: one source, two field classes, two different answers."""
    tmi = register["tmi_mellmann"]
    assert tmi.may_publish_class("structure")
    assert not tmi.may_publish_class("annotations")
    assert tmi.publication["annotations"].status is PublicationStatus.WITHHELD
    assert tmi.publication["annotations"].open_questions


def test_a_class_cannot_be_approved_with_open_questions() -> None:
    """§6.7: open_questions must be empty to reach approval."""
    with pytest.raises(ValueError, match="cannot be approved"):
        SourceRights(
            key="x",
            name="x",
            homepage_url="https://example.invalid/",
            license_asserted_spdx="CC0-1.0",
            license_reviewed_spdx="CC0-1.0",
            reviewed_by="someone",
            redistribution_ok=True,
            upstream_rights_status="clear",
            database_right_status="not_applicable",
            gate_status="approved_for_ingestion",
            ingestable_fields={"d": {"c": ["a"]}},
            publication={
                "c": {
                    "status": "approved",
                    "reasoning": "r",
                    "open_questions": ["unresolved"],
                }
            },
        )


def test_an_ingested_class_must_have_a_publication_decision() -> None:
    """Otherwise the publish gate silently has nothing to evaluate."""
    with pytest.raises(ValueError, match="no publication decision"):
        SourceRights(
            key="x",
            name="x",
            homepage_url="https://example.invalid/",
            license_asserted_spdx="CC0-1.0",
            license_reviewed_spdx="CC0-1.0",
            reviewed_by="someone",
            upstream_rights_status="clear",
            database_right_status="not_applicable",
            gate_status="approved_for_ingestion",
            ingestable_fields={"d": {"undeclared": ["a"]}},
        )


def test_a_record_with_no_provenance_cannot_be_published(register) -> None:
    eff = effective_license(register, set())
    assert not eff.redistribution_ok
    assert "provenance is missing" in eff.reason


def test_cc0_alone_publishes_without_share_alike(register) -> None:
    eff = effective_license(register, {("wikidata_p2540", "identity")})
    assert eff.redistribution_ok
    assert eff.spdx == "CC0-1.0"
    assert not eff.share_alike_required
    assert eff.attribution == ()


def test_share_alike_is_contagious_across_a_record(register) -> None:
    """§6.7: a single CC-BY-SA source determines the license of the whole record.

    This is the mechanism behind acceptance criterion #12, and the reason the
    computation runs over the *set* of contributing sources rather than each
    source independently.
    """
    eff = effective_license(
        register,
        {("wikidata_p2540", "identity"), ("trilogy", "thin_facts")},
    )
    assert eff.redistribution_ok
    assert eff.spdx == "CC-BY-SA-4.0"
    assert eff.share_alike_required
    assert any("trilogy" in a for a in eff.attribution)


def test_a_withheld_class_blocks_the_whole_record(register) -> None:
    """One withheld contribution is enough; the record does not publish."""
    with pytest.raises(GateRefusal, match="withheld"):
        check_publish(
            register,
            {("wikidata_p2540", "identity"), ("tmi_mellmann", "annotations")},
        )


def test_flipping_redistribution_empties_the_source(register) -> None:
    """§10's "pause the ATU-derived portion", made operable.

    If professional review of the Uther and Ashliman questions lands badly, one
    edit to trilogy.yaml removes every trilogy-contributed record from publish
    and from every export. No code change, and the mechanism is tested rather
    than merely asserted.
    """
    paused = register["trilogy"].model_copy(update={"redistribution_ok": False})
    reg = register.model_copy(
        update={"sources": {**register.sources, "trilogy": paused}}
    )
    with pytest.raises(GateRefusal, match="redistribution_ok is false"):
        check_publish(reg, {("trilogy", "thin_facts")})
    # Wikidata is unaffected: the clean half keeps moving (§10's split decision).
    assert check_publish(reg, {("wikidata_p2540", "identity")}).redistribution_ok


def test_open_questions_are_recorded_not_hidden(register) -> None:
    """The unresolved questions stay visible even where a class is approved."""
    assert register["trilogy"].upstream_rights_status == "unresolved"
    assert len(register["trilogy"].open_questions) >= 3
    assert register["tmi_mellmann"].database_right_status == "unresolved"
    assert any(
        "renew" in q.lower() for q in register["tmi_mellmann"].open_questions
    )
