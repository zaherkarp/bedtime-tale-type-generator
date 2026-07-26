"""What each registered source consists of, and how to retrieve it.

An acquisition plan names the artifacts a source is made of — the data files
*and* the license evidence — so that ``atukb acquire`` is a declarative sweep
rather than a script per source.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from atukb.acquire.artifact_store import Artifact, ArtifactStore

USER_AGENT = "atukb/0.1 (folklore knowledge base; +https://github.com/zaherkarp)"

#: Wikidata items that *are* ATU tale types, with their multilingual labels.
#: Wikidata is CC0, which is what makes it the tale-type spine (§5.4); it is also
#: community-edited, so the retrieval is checksummed like any other artifact and
#: the query is pinned here rather than composed at call time.
#:
#: The ``P31 = Q47451145`` filter is load-bearing, not tidying. P2540 is carried
#: by individual stories as well as by the types themselves — "this tale is an
#: instance of ATU 500" — and about a third of the property's ~1,900 subjects are
#: instances. Without the filter the spine treats a variant's title as the type's
#: canonical title, so ATU 500 comes back as "Whuppity Stoorie" rather than
#: "Rumpelstiltskin". Tale *examples* are deferred to v1.1 (§7 Out).
P2540_SPARQL = """
SELECT ?item ?atu ?label ?lang WHERE {
  ?item wdt:P2540 ?atu .
  ?item wdt:P31 wd:Q47451145 .
  ?item rdfs:label ?labelNode .
  BIND(STR(?labelNode) AS ?label)
  BIND(LANG(?labelNode) AS ?lang)
  FILTER(?lang IN ("en", "de", "fr", "es", "it", "ru", "fi", "sv"))
}
ORDER BY ?atu ?lang
"""


@dataclass(frozen=True, slots=True)
class ArtifactPlan:
    name: str
    url: str
    #: True when this artifact exists to evidence the license rather than to be
    #: parsed — §6.7's ``license_asserted_evidence``.
    is_license_evidence: bool = False
    params: dict[str, str] | None = None
    headers: dict[str, str] | None = None


@dataclass(frozen=True, slots=True)
class AcquisitionPlan:
    source_key: str
    artifacts: tuple[ArtifactPlan, ...] = field(default_factory=tuple)

    def acquire(self, store: ArtifactStore) -> dict[str, Artifact]:
        out: dict[str, Artifact] = {}
        for plan in self.artifacts:
            headers = {"User-Agent": USER_AGENT, **(plan.headers or {})}
            out[plan.name] = store.fetch(
                self.source_key,
                plan.name,
                plan.url,
                params=plan.params,
                headers=headers,
            )
        return out


_TMI_BASE = "https://raw.githubusercontent.com/KatjaMellmann/TMI_as_CSV/main"
_TRILOGY_BASE = "https://raw.githubusercontent.com/j-hagedorn/trilogy/master"

PLANS: dict[str, AcquisitionPlan] = {
    "tmi_mellmann": AcquisitionPlan(
        source_key="tmi_mellmann",
        artifacts=(
            ArtifactPlan(name="tmi.csv", url=f"{_TMI_BASE}/tmi.csv"),
            ArtifactPlan(
                name="LICENSE", url=f"{_TMI_BASE}/LICENSE", is_license_evidence=True
            ),
            ArtifactPlan(
                name="README.md", url=f"{_TMI_BASE}/README.md", is_license_evidence=True
            ),
        ),
    ),
    "trilogy": AcquisitionPlan(
        source_key="trilogy",
        artifacts=(
            ArtifactPlan(name="atu_df.csv", url=f"{_TRILOGY_BASE}/data/atu_df.csv"),
            ArtifactPlan(name="atu_seq.csv", url=f"{_TRILOGY_BASE}/data/atu_seq.csv"),
            ArtifactPlan(
                name="atu_combos.csv", url=f"{_TRILOGY_BASE}/data/atu_combos.csv"
            ),
            ArtifactPlan(
                name="README.md",
                url=f"{_TRILOGY_BASE}/README.md",
                is_license_evidence=True,
            ),
        ),
    ),
    "wikidata_p2540": AcquisitionPlan(
        source_key="wikidata_p2540",
        artifacts=(
            ArtifactPlan(
                name="p2540.json",
                url="https://query.wikidata.org/sparql",
                params={"query": P2540_SPARQL, "format": "json"},
                headers={"Accept": "application/sparql-results+json"},
            ),
            ArtifactPlan(
                name="license.html",
                url="https://www.wikidata.org/wiki/Wikidata:Licensing",
                is_license_evidence=True,
            ),
        ),
    ),
}
