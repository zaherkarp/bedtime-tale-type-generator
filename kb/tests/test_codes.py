"""Code-grammar tests driven by the versioned corpora (assessment §3.10, §9).

A mis-parsed ``327A + 328`` becomes a wrong edge rather than an error (§4 risk
10), so the corpora are the contract: any parser change that alters a row here
is a breaking change and has to be reviewed rather than absorbed.
"""

from __future__ import annotations

import pytest

from atukb.codes import atu, tmi

from .conftest import load_corpus

ATU_ROWS = load_corpus("atu_codes.tsv")
TMI_ROWS = load_corpus("tmi_codes.tsv")


@pytest.mark.parametrize("row", ATU_ROWS, ids=lambda r: repr(r[0]))
def test_atu_corpus(row: list[str]) -> None:
    raw, outcome = row[0], row[1]
    if outcome == "error":
        with pytest.raises(atu.AtuCodeError):
            atu.parse(raw)
        return
    code = atu.parse(raw)
    assert code.kind == row[2], f"{raw!r} kind"
    assert code.canonical == row[3], f"{raw!r} canonical"


@pytest.mark.parametrize("row", TMI_ROWS, ids=lambda r: repr(r[0]))
def test_tmi_corpus(row: list[str]) -> None:
    raw, outcome = row[0], row[1]
    if outcome == "error":
        with pytest.raises(tmi.TmiCodeError):
            tmi.parse(raw)
        return
    code = tmi.parse(raw)
    assert code.canonical == row[2], f"{raw!r} canonical"
    assert code.path == row[3], f"{raw!r} ltree path"


def test_atu_suffix_sorts_between_its_neighbours() -> None:
    """510 < 510A < 510B < 511 — neither lexical nor numeric sorting gets this."""
    codes = ["511", "510A", "510", "510B", "99", "1000"]
    ordered = sorted(codes, key=lambda c: atu.parse(c).sort_key)
    assert ordered == ["99", "510", "510A", "510B", "511", "1000"]


def test_tmi_sort_key_orders_decimals_after_their_stem() -> None:
    codes = ["D672.1", "D99", "D672", "D673", "D672.10", "D672.2"]
    ordered = sorted(codes, key=lambda c: tmi.parse(c).sort_key)
    assert ordered == ["D99", "D672", "D672.1", "D672.2", "D672.10", "D673"]


def test_ltree_label_round_trip_is_lossless() -> None:
    """The dot/underscore substitution must be reversible, or the path lies."""
    for raw in ("A0", "D672", "A1.1.2", "B11.2.1.1", "F255.2"):
        code = tmi.parse(raw)
        leaf = code.path.rsplit(".", 1)[-1]
        assert tmi.code_from_label(leaf) == code.canonical


def test_tmi_ancestors_are_strict_prefixes_of_the_path() -> None:
    code = tmi.parse("D672.1")
    assert code.ancestors == ("D", "D600", "D670", "D672")
    assert code.path == "D.D600.D670.D672.D672_1"
    assert code.depth == 5


def test_only_single_atoms_may_own_a_record() -> None:
    """Ranges, compounds and cf. references are *about* types, not types."""
    assert atu.parse("510A").is_citable_type
    assert not atu.parse("300-359").is_citable_type
    assert not atu.parse("327A + 328").is_citable_type
    assert not atu.parse("cf. 510A").is_citable_type


def test_compound_code_keeps_both_atoms() -> None:
    """The failure §4 risk 10 describes is losing one half of 327A + 328."""
    code = atu.parse("327A + 328")
    assert [str(a) for a in code.atoms] == ["327A", "328"]


def test_division_matches_the_apps_own_ranges() -> None:
    assert atu.division(atu.parse("1")) == "Animal Tales"
    assert atu.division(atu.parse("510A")) == "Tales of Magic"
    assert atu.division(atu.parse("2044")) == "Formula Tales"
    assert atu.division(atu.parse("2400")) is None


def test_heading_ranges_witness_the_parse() -> None:
    """The CSV's own division columns are an independent check on the code."""
    code = tmi.parse("F255.2")
    assert tmi.contains("F200–F699. Marvelous creatures.", code) is True
    assert tmi.contains("F250. Other characteristics of fairies.", code) is True
    assert tmi.contains("A0–A99. Creator.", code) is False
    assert tmi.contains("", code) is None
