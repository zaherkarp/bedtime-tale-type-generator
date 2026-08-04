/**
 * GENERATED FILE — do not edit by hand.
 *
 * Written by `npm run motifs:build` from the knowledge base's
 * `attribution.json`. These are the attributions the reviewed licences of the
 * contributing sources actually require, not a courtesy list, which is why the
 * app renders them at /credits rather than burying them in a README.
 *
 * `openQuestions` are unresolved upstream rights questions the knowledge base
 * recorded against a source. They are surfaced rather than hidden: a source can
 * be licensed permissively by its transcriber and still rest on a compilation
 * whose status nobody has established.
 */

export interface CreditedSource {
  key: string;
  name: string;
  homepageUrl: string;
  license: string;
  /** The attribution text the licence requires, where it requires one. */
  attribution: string | null;
  upstreamRightsStatus: string;
  openQuestions: readonly string[];
}

export const CREDITS_NOTE = "Attribution required by the reviewed licenses of every source contributing to this export. Sources with a non-empty open_questions list have unresolved upstream rights questions recorded against them; see docs/atu-kb-decisions.md.";

export const CREDITED_SOURCES: readonly CreditedSource[] = [
  {
    key: "tmi_mellmann",
    name: "Thompson Motif-Index as CSV (Mellmann)",
    homepageUrl: "https://github.com/KatjaMellmann/TMI_as_CSV",
    license: "CC-BY-4.0",
    attribution: "Motif data from Katja Mellmann, TMI_as_CSV (CC BY 4.0), transcribed from Stith Thompson, Motif-Index of Folk-Literature, rev. ed., Indiana University Press 1955-1958.",
    upstreamRightsStatus: "unresolved",
    openQuestions: ["Was the 1955-1958 revised edition's copyright renewed? Resolving evidence: the renewal record in the Catalog of Copyright Entries, or the Stanford Copyright Renewal Database, for the six volumes.","Does Indiana University Press assert any continuing rights in the compilation's structure as distinct from its contents?","EU/UK sui generis database right in the compilation - jurisdiction-dependent and needs professional review, not an engineer's reading."],
  },
  {
    key: "trilogy",
    name: "trilogy (Hagedorn) - ATU tale types, motif sequences, and co-occurrences",
    homepageUrl: "https://github.com/j-hagedorn/trilogy",
    license: "CC-BY-SA-4.0",
    attribution: "Tale-type data from j-hagedorn/trilogy (CC BY-SA 4.0), derived from Hans-Jorg Uther, The Types of International Folktales (2004).",
    upstreamRightsStatus: "unresolved",
    openQuestions: ["Uther (2004) is in copyright and is published in Finland. Did trilogy's compiler hold the rights it grants over Uther-derived content? Resolving evidence: trilogy's own documentation of what it transcribed and under what permission.","How was atu_seq constructed? Uther lists motifs per type largely WITHOUT narrative ordering, so a motif_order column may encode ordering the underlying authority does not assert. Until answered, every atu_seq edge is stored with derivation='inferred' and evidence_kind='inferred_from' (§5.2).","The corpus was seeded from D.L. Ashliman's Folktexts, which is a personally maintained compilation containing Ashliman's own translations. No aft content is ingested; confirm no aft-derived text reached atu_df.","EU/UK sui generis database right over the Uther compilation - needs professional review."],
  },
  {
    key: "wikidata_p2540",
    name: "Wikidata (property P2540, ATU tale-type number)",
    homepageUrl: "https://www.wikidata.org/wiki/Property:P2540",
    license: "CC0-1.0",
    attribution: null,
    upstreamRightsStatus: "clear",
    openQuestions: [],
  },
];
