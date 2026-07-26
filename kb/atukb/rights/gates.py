"""The three gates (assessment §6.4).

The proposal said "complete the rights register before downloading anything",
which is a deadlock: a dataset's license lives in a LICENSE file, a README or a
data dictionary that ships *with* the artifact you are not yet allowed to fetch.
An unimplementable rule gets quietly violated, and then the register documents a
process that did not happen.

So there are three gates, not one, and they permit different things:

===========  ================================================  =================
Gate         Permits                                           Requires
===========  ================================================  =================
``acquire``  download, checksum, preserve to quarantine        nothing
``ingest``   parse into ``raw``, normalise into ``core``       a reviewed entry
``publish``  appear in ``publish.*``, the API, or any export   effective license
===========  ================================================  =================

Enforcement lives at publication, because that is the only point at which a
rights error becomes a rights problem.
"""

from __future__ import annotations

from dataclasses import dataclass

from atukb.rights.register import GateStatus, RightsRegister, SourceRights


class GateRefusal(RuntimeError):
    """A gate refused. Never caught and downgraded to a warning."""

    def __init__(self, gate: str, source_key: str, reason: str) -> None:
        super().__init__(f"{gate} gate refused {source_key}: {reason}")
        self.gate = gate
        self.source_key = source_key
        self.reason = reason


def check_acquire(source: SourceRights) -> None:
    """Always permitted.

    You must be able to fetch an artifact to read its license. What acquisition
    does *not* permit is parsing, normalising or exposing — the artifact lands in
    a quarantine store and nothing else may read it until the ingest gate opens.
    """
    return None


def check_ingest(register: RightsRegister, source_key: str) -> SourceRights:
    """Permit parsing into ``raw`` and normalising into ``core``."""
    source = register[source_key]
    if source.gate_status is GateStatus.ACQUIRED:
        raise GateRefusal(
            "ingest",
            source_key,
            "rights-register entry has not been reviewed to "
            "'approved_for_ingestion'",
        )
    if not source.extraction_ok or not source.transformation_ok:
        raise GateRefusal(
            "ingest",
            source_key,
            "the reviewed license does not permit extraction and transformation",
        )
    return source


#: One contribution to a record: which source, and which of its field classes.
Contribution = tuple[str, str]


def check_publish(
    register: RightsRegister, contributions: set[Contribution]
) -> "EffectiveLicense":
    """Permit appearing in ``publish``, the API, or any export.

    Takes the *set* of contributions to a record, because share-alike
    obligations are contagious: one CC-BY-SA source can determine the license of
    any output it materially contributes to (§6.7).
    """
    eff = effective_license(register, contributions)
    if not eff.redistribution_ok:
        raise GateRefusal(
            "publish",
            "+".join(sorted(f"{k}:{c}" for k, c in contributions)) or "<none>",
            eff.reason,
        )
    return eff


@dataclass(frozen=True, slots=True)
class EffectiveLicense:
    """The license of a record, computed over every source that fed it."""

    spdx: str
    redistribution_ok: bool
    commercial_ok: bool
    share_alike_required: bool
    attribution: tuple[str, ...]
    contributing_sources: tuple[str, ...]
    reason: str

    def as_dict(self) -> dict[str, object]:
        return {
            "spdx": self.spdx,
            "redistribution_ok": self.redistribution_ok,
            "commercial_ok": self.commercial_ok,
            "share_alike_required": self.share_alike_required,
            "attribution": list(self.attribution),
            "contributing_sources": list(self.contributing_sources),
            "reason": self.reason,
        }


#: Share-alike licenses in increasing order of obligation. Combining sources
#: takes the most restrictive, which is what makes the obligation contagious.
_SHARE_ALIKE_RANK = {"CC0-1.0": 0, "CC-BY-4.0": 1, "CC-BY-SA-4.0": 2}


def effective_license(
    register: RightsRegister, contributions: set[Contribution]
) -> EffectiveLicense:
    """Compute the effective license over a *set* of contributions.

    This is the mechanism behind acceptance criterion #12. Computing it per
    source independently — which is what the proposal's model implied — gets
    combination wrong in exactly the case that matters: a permissively licensed
    record that also drew one field from a share-alike source is share-alike.
    """
    if not contributions:
        return EffectiveLicense(
            spdx="NONE",
            redistribution_ok=False,
            commercial_ok=False,
            share_alike_required=False,
            attribution=(),
            contributing_sources=(),
            reason="no contributing source recorded; provenance is missing",
        )

    ordered = sorted(contributions)
    blockers: list[str] = []
    entries: list[SourceRights] = []
    for key, field_class in ordered:
        entry = register[key]
        entries.append(entry)
        if not entry.redistribution_ok:
            blockers.append(f"{key}: redistribution_ok is false")
        decision = entry.publication.get(field_class)
        if decision is None:
            blockers.append(f"{key}:{field_class}: no publication decision recorded")
        elif not entry.may_publish_class(field_class):
            blockers.append(
                f"{key}:{field_class}: withheld — {decision.reasoning.strip()[:120]}"
            )

    licenses = [e.license_reviewed_spdx or e.license_asserted_spdx for e in entries]
    strongest = max(licenses, key=lambda s: _SHARE_ALIKE_RANK.get(s, 99))
    attribution = tuple(
        dict.fromkeys(
            e.attribution_text_required for e in entries if e.attribution_text_required
        )
    )

    return EffectiveLicense(
        spdx=strongest,
        redistribution_ok=not blockers,
        commercial_ok=all(e.commercial_ok for e in entries) and not blockers,
        share_alike_required=any(e.share_alike_required for e in entries),
        attribution=attribution,
        contributing_sources=tuple(f"{k}:{c}" for k, c in ordered),
        reason="; ".join(blockers) if blockers else "all contributions cleared",
    )
