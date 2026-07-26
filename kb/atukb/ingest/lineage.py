"""Bibliographic ancestors, and how each retrieved source descends from them.

`assertion_evidence` that records only the immediate source yields "this motif
association is supported by trilogy/atu_seq row 918" — true, and nearly useless.
trilogy did not observe that association; it transcribed it from Uther, who
compiled it from Aarne and Thompson, who compiled it from national indexes and
collectors. A citation that terminates at the convenient dataset misrepresents
where the knowledge came from, and for a project whose entire premise is
citability that is the most damaging possible failure (§3.7).

So the compilations we never hold still get `core.source_version` rows, of kind
``bibliographic``, and every retrieved version points at its ancestor through
``derives_from_source_version_id``.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class BibliographicSource:
    key: str
    name: str
    homepage_url: str
    version_label: str
    publication_year: int
    description: str


#: Compilations that are cited but never ingested. They have no rights-register
#: entry because nothing is retrieved from them — §5.3 keeps the published
#: volumes reference-only for Version 1.
BIBLIOGRAPHIC_SOURCES: tuple[BibliographicSource, ...] = (
    BibliographicSource(
        key="aarne_thompson_1961",
        name="Aarne & Thompson, The Types of the Folktale (2nd rev. ed.)",
        homepage_url="https://en.wikipedia.org/wiki/Aarne%E2%80%93Thompson%E2%80%93Uther_Index",
        version_label="AT-1961",
        publication_year=1961,
        description=(
            "Antti Aarne and Stith Thompson, The Types of the Folktale: A "
            "Classification and Bibliography, FF Communications 184, Helsinki 1961."
        ),
    ),
    BibliographicSource(
        key="uther_2004",
        name="Uther, The Types of International Folktales",
        homepage_url="https://en.wikipedia.org/wiki/Aarne%E2%80%93Thompson%E2%80%93Uther_Index",
        version_label="ATU-2004",
        publication_year=2004,
        description=(
            "Hans-Jorg Uther, The Types of International Folktales, FF "
            "Communications 284-286, Helsinki 2004. In copyright; reference-only "
            "for Version 1 (§5.3)."
        ),
    ),
    BibliographicSource(
        key="thompson_tmi_1955",
        name="Thompson, Motif-Index of Folk-Literature (rev. ed.)",
        homepage_url="https://en.wikipedia.org/wiki/Motif-Index_of_Folk-Literature",
        version_label="TMI-1955-1958",
        publication_year=1955,
        description=(
            "Stith Thompson, Motif-Index of Folk-Literature, revised and enlarged "
            "edition, 6 vols, Indiana University Press 1955-1958. Renewal status "
            "unresolved (§5.1)."
        ),
    ),
)

#: ``(descendant version label, ancestor version label, note)``. The descendant
#: labels for retrieved sources are ``<source key>/<dataset>``.
DERIVATION_EDGES: tuple[tuple[str, str, str], ...] = (
    (
        "ATU-2004",
        "AT-1961",
        "Uther's revision restructures and renumbers the Aarne-Thompson types.",
    ),
    (
        "tmi_mellmann/tmi",
        "TMI-1955-1958",
        "CSV transcription of the six printed volumes.",
    ),
    (
        "trilogy/atu_df",
        "ATU-2004",
        "Tale-type rows transcribed from Uther 2004.",
    ),
    (
        "wikidata_p2540/p2540",
        "ATU-2004",
        "P2540 values are ATU type numbers as established by Uther 2004. "
        "Wikidata's CC0 dedication governs the database; the classification "
        "itself still descends from the index, and a citation should say so.",
    ),
    (
        "trilogy/atu_seq",
        "ATU-2004",
        "Motif lists per type transcribed from Uther 2004. Uther lists motifs "
        "largely without narrative ordering, so the ordering itself is inferred "
        "by trilogy rather than stated by Uther (§5.2).",
    ),
    (
        "trilogy/atu_combos",
        "ATU-2004",
        "Type co-occurrence derived from Uther's combination notes.",
    ),
)
