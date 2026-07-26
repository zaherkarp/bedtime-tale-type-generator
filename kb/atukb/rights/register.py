"""The source and rights register (assessment §6.7).

The register is the licensing spine, and it is *data* — one YAML file per source
under ``kb/data/rights_register/`` — so that changing what the project may
redistribute is an edit to a reviewed file, not a code change.

Two things here are deliberately unusual and both come from §6.7:

* ``license_asserted_*`` is kept separate from ``license_reviewed_*``. What a
  README claims and what a human checked are different facts, and collapsing
  them is how a project ends up believing its own unverified summary.
* ``upstream_rights_status`` records whether the source's own compiler held the
  rights it purports to grant. A permissive license applied by a transcriber
  cannot convey rights the transcriber did not hold, and for both of this
  project's ATU-derived sources that question is genuinely open.
"""

from __future__ import annotations

from datetime import date
from enum import StrEnum
from pathlib import Path

import yaml
from pydantic import BaseModel, ConfigDict, Field, model_validator

from atukb.config import RIGHTS_REGISTER_DIR


class GateStatus(StrEnum):
    """How far through the three gates (§6.4) this source has been reviewed.

    Publication is deliberately *not* on this axis. §5.1 gates a single source's
    structural data and its bibliographic annotations separately — "treat as
    source-specific assertion, and gate redistribution separately" — so the
    publication decision belongs to a field class, not to a whole source. See
    :class:`PublicationDecision`.
    """

    ACQUIRED = "acquired"
    APPROVED_FOR_INGESTION = "approved_for_ingestion"


class PublicationStatus(StrEnum):
    APPROVED = "approved"
    WITHHELD = "withheld"


class PublicationDecision(BaseModel):
    """Whether one class of a source's fields may be published (§6.4, §5.1).

    A *field class* is a group of columns that share a rights profile — the
    Motif-Index's codes and short labels are thin factual identifiers, while its
    bibliographic annotations are the thicker, more clearly copyrightable
    content. They get different answers, and every provenance-bearing row in
    ``core`` records which class it came from so the answer can be enforced.
    """

    model_config = ConfigDict(extra="forbid", frozen=True)

    status: PublicationStatus
    reasoning: str
    #: Questions that must be resolved before this class may be published. §6.7:
    #: must be empty to reach approval.
    open_questions: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def _approval_requires_no_open_questions(self) -> "PublicationDecision":
        if self.status is PublicationStatus.APPROVED and self.open_questions:
            raise ValueError(
                f"cannot be approved with {len(self.open_questions)} open question(s)"
            )
        return self


class UpstreamRightsStatus(StrEnum):
    """Did this source's compiler hold the rights it granted?"""

    CLEAR = "clear"
    UNRESOLVED = "unresolved"
    ENCUMBERED = "encumbered"


class DatabaseRightStatus(StrEnum):
    """EU/UK sui generis database right — distinct from copyright.

    It protects substantial investment in a compilation even where the
    individual facts are unprotectable, and it is jurisdiction-dependent.
    """

    NOT_APPLICABLE = "not_applicable"
    UNRESOLVED = "unresolved"
    ASSERTED = "asserted"


class SourceRights(BaseModel):
    """One register entry. Field order follows §6.7."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    key: str
    name: str
    homepage_url: str
    description: str = ""

    # -- what is claimed vs what was checked ---------------------------------
    license_asserted_spdx: str
    license_reviewed_spdx: str | None = None
    #: Path, relative to the artifact store, of the LICENSE/README *as
    #: retrieved*. A license you can no longer prove was granted is a license
    #: you do not have (§6.7, §4 risk 9).
    license_asserted_evidence: str | None = None
    reviewed_by: str | None = None
    reviewed_at: date | None = None
    review_reasoning: str = ""

    # -- the rights that are actually distinct from each other ---------------
    reading_ok: bool = False
    extraction_ok: bool = False
    transformation_ok: bool = False
    redistribution_ok: bool = False
    commercial_ok: bool = False
    share_alike_required: bool = False
    attribution_text_required: str | None = None

    # -- the two that most projects forget -----------------------------------
    upstream_rights_status: UpstreamRightsStatus
    database_right_status: DatabaseRightStatus
    open_questions: list[str] = Field(default_factory=list)

    # -- gate + ingestion scope ----------------------------------------------
    gate_status: GateStatus = GateStatus.ACQUIRED
    #: Columns admitted into ``core``, keyed by dataset then by field class.
    #: Everything else stops at immutable ``raw``. This is §5.3's thin/thick
    #: asymmetry, enforced mechanically instead of by policy.
    ingestable_fields: dict[str, dict[str, list[str]]] = Field(default_factory=dict)
    #: Columns explicitly held back, with the reason, so the exclusion is
    #: reviewable rather than merely absent.
    withheld_fields: dict[str, str] = Field(default_factory=dict)
    #: Publication decision per field class (§5.1, §6.4).
    publication: dict[str, PublicationDecision] = Field(default_factory=dict)

    @model_validator(mode="after")
    def _review_is_recorded_and_classes_line_up(self) -> "SourceRights":
        if self.gate_status is not GateStatus.ACQUIRED:
            if self.reviewed_by is None or self.license_reviewed_spdx is None:
                raise ValueError(
                    f"{self.key}: {self.gate_status} without a recorded review"
                )
        for decision in self.publication.values():
            if decision.status is PublicationStatus.APPROVED and not self.redistribution_ok:
                raise ValueError(
                    f"{self.key}: a field class is approved for publication but "
                    f"redistribution_ok is false"
                )
        ingest_classes = {
            cls for dataset in self.ingestable_fields.values() for cls in dataset
        }
        undeclared = ingest_classes - set(self.publication)
        if undeclared:
            raise ValueError(
                f"{self.key}: field class(es) {sorted(undeclared)} are ingested but "
                f"have no publication decision; the publish gate could not be evaluated"
            )
        return self

    def field_class(self, dataset: str, column: str) -> str | None:
        """Which field class does this column belong to, if it is ingestable?"""
        for cls, columns in self.ingestable_fields.get(dataset, {}).items():
            if column in columns:
                return cls
        return None

    def may_ingest_field(self, dataset: str, column: str) -> bool:
        """Is this column admitted into ``core``?"""
        return self.field_class(dataset, column) is not None

    def may_publish_class(self, field_class: str) -> bool:
        decision = self.publication.get(field_class)
        return decision is not None and decision.status is PublicationStatus.APPROVED


class RightsRegister(BaseModel):
    """Every registered source, keyed by ``key``."""

    model_config = ConfigDict(frozen=True)

    sources: dict[str, SourceRights]

    def __getitem__(self, key: str) -> SourceRights:
        try:
            return self.sources[key]
        except KeyError:
            raise KeyError(
                f"{key!r} has no rights-register entry; no gate can be evaluated "
                f"for it (§6.4)"
            ) from None

    def __contains__(self, key: str) -> bool:
        return key in self.sources

    def __iter__(self):  # type: ignore[override]
        return iter(self.sources.values())


def load_register(directory: Path | None = None) -> RightsRegister:
    """Load every ``*.yaml`` in the register directory."""
    directory = directory or RIGHTS_REGISTER_DIR
    sources: dict[str, SourceRights] = {}
    for path in sorted(directory.glob("*.yaml")):
        raw = yaml.safe_load(path.read_text(encoding="utf-8"))
        entry = SourceRights.model_validate(raw)
        if entry.key in sources:
            raise ValueError(f"duplicate rights-register key {entry.key!r} in {path}")
        sources[entry.key] = entry
    if not sources:
        raise ValueError(f"no rights-register entries found in {directory}")
    return RightsRegister(sources=sources)
