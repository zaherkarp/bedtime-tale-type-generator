"""Aarne–Thompson–Uther tale-type code grammar.

The proposal modelled codes as ``code_numeric`` plus ``code_suffix``, which holds
the easy 90% and silently corrupts the rest: ranges (``300–359``), compound
classifications (``327A + 328``) and ``cf.`` references all appear in the
literature (assessment §3.10). A mis-parsed ``327A + 328`` becomes a wrong edge
rather than an error — §4 risk 10 — so parsing is total and explicit here, and
every caller either gets a structured code or an exception it must handle.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal

AtuKind = Literal["single", "range", "compound", "reference"]

#: One atom, in the forms that actually occur in the registered sources:
#: ``510``, ``510A``, ``1851A*``, ``2400**``, ``10***``, ``934D1``, ``*171``.
#:
#: The leading asterisk and the digit after a suffix letter are not theoretical.
#: Both appear in Wikidata's P2540 values, and a grammar that models only
#: ``number + suffix`` — which is what the proposal's ``code_numeric`` plus
#: ``code_suffix`` amounts to — turns them into wrong data rather than errors.
#: The sub-number is only meaningful after a suffix letter — ``934D1`` is a real
#: type, ``99999`` is a typo — so the two are one optional group, not two.
ATOM_RE = re.compile(r"^(\*{0,3})(\d{1,4})(?:([A-Z]{1,2})(\d{0,2}))?(\*{0,3})$")

#: Cyrillic letters that are visually identical to Latin ones. Real P2540 values
#: contain ``283В*`` and ``327С`` written with Cyrillic В and С. Silently
#: transliterating them would invent an identifier the source never asserted, so
#: they are refused with a message that says what is actually wrong.
_CYRILLIC_HOMOGLYPHS = {
    "А": "A", "В": "B", "Е": "E", "К": "K", "М": "M",
    "Н": "H", "О": "O", "Р": "P", "С": "C", "Т": "T",
    "Х": "X", "а": "a", "е": "e", "о": "o", "р": "p",
    "с": "c", "х": "x",
}

#: Separators as they appear in print. The dash may be an en or em dash.
_RANGE_SEP = re.compile(r"\s*[–—-]\s*")
_COMPOUND_SEP = re.compile(r"\s*\+\s*")
_CF_PREFIX = re.compile(r"^cf\.?\s+", re.IGNORECASE)
_ATU_PREFIX = re.compile(r"^(?:ATU|AT|AaTh)\s*", re.IGNORECASE)

#: Sort-key field separator. Must order below every character that can appear in
#: a suffix, which includes ``*`` (0x2A) as well as the uppercase letters.
_SEP = "!"


class AtuCodeError(ValueError):
    """A code that does not satisfy the grammar. Callers quarantine the row."""


@dataclass(frozen=True, slots=True)
class AtuAtom:
    """A single tale-type designation."""

    number: int
    suffix: str = ""
    subnumber: str = ""
    stars: str = ""
    prefix_stars: str = ""

    def __str__(self) -> str:
        return f"{self.prefix_stars}{self.number}{self.suffix}{self.subnumber}{self.stars}"

    @property
    def sort_key(self) -> str:
        """``510`` sorts before ``510A`` sorts before ``510A1`` sorts before ``511``.

        A lexical sort puts ``510A`` before ``511`` but also ``1000`` before
        ``99``; a numeric sort cannot see the suffix at all. Zero-padding the
        number and separating each remaining component with a character that
        orders below both ``*`` and the letters gets every case right (§3.10).
        Starred variants are ordered after their plain type, and a leading star
        after a trailing one — arbitrary, but fixed and documented, which is what
        a sort key needs to be.
        """
        return (
            f"{self.number:04d}{_SEP}{self.suffix}{self.subnumber}"
            f"{_SEP}{self.stars}{_SEP}{self.prefix_stars}"
        )


@dataclass(frozen=True, slots=True)
class AtuCode:
    """A parsed ATU code of any of the four kinds."""

    raw: str
    kind: AtuKind
    atoms: tuple[AtuAtom, ...]

    @property
    def canonical(self) -> str:
        """Normal form, with the printer's whitespace and dashes regularised."""
        if self.kind == "single":
            return str(self.atoms[0])
        if self.kind == "range":
            return f"{self.atoms[0]}-{self.atoms[1]}"
        if self.kind == "compound":
            return "+".join(str(a) for a in self.atoms)
        return f"cf. {self.atoms[0]}"

    @property
    def sort_key(self) -> str:
        """Sorted by the first atom; ties broken by kind then by the raw form."""
        rank = {"single": 0, "range": 1, "compound": 2, "reference": 3}[self.kind]
        return f"{self.atoms[0].sort_key}{_SEP}{rank}{_SEP}{self.canonical}"

    @property
    def is_citable_type(self) -> bool:
        """Whether this code designates one tale type that may own a record.

        Ranges, compounds and ``cf.`` references are *about* types; they are not
        types. Only a single atom may become a ``core.tale_type_record``.
        """
        return self.kind == "single"


def parse_atom(text: str) -> AtuAtom:
    stripped = text.strip()
    homoglyphs = sorted({c for c in stripped if c in _CYRILLIC_HOMOGLYPHS})
    if homoglyphs:
        raise AtuCodeError(
            f"tale-type atom {text!r} contains Cyrillic homoglyph(s) "
            f"{homoglyphs} of Latin letters; the source value is ambiguous and "
            f"is quarantined rather than transliterated"
        )
    m = ATOM_RE.match(stripped)
    if not m:
        raise AtuCodeError(f"malformed tale-type atom: {text!r}")
    return AtuAtom(
        prefix_stars=m.group(1),
        number=int(m.group(2)),
        suffix=m.group(3) or "",
        subnumber=m.group(4) or "",
        stars=m.group(5),
    )


def parse(raw: str) -> AtuCode:
    """Parse any ATU code form into a structured code.

    >>> parse("510A").canonical
    '510A'
    >>> parse("327A + 328").kind
    'compound'
    >>> parse("300–359").kind
    'range'
    >>> parse("cf. 510A").kind
    'reference'
    """
    text = (raw or "").strip()
    if not text:
        raise AtuCodeError("empty tale-type code")

    is_reference = bool(_CF_PREFIX.match(text))
    text = _CF_PREFIX.sub("", text)
    text = _ATU_PREFIX.sub("", text).strip()
    if not text:
        raise AtuCodeError(f"tale-type code with no designation: {raw!r}")

    if _COMPOUND_SEP.search(text):
        atoms = tuple(parse_atom(p) for p in _COMPOUND_SEP.split(text))
        if len(atoms) < 2:
            raise AtuCodeError(f"compound code with one atom: {raw!r}")
        kind: AtuKind = "compound"
    elif _RANGE_SEP.search(text) and not text.startswith("-"):
        parts = _RANGE_SEP.split(text)
        if len(parts) != 2:
            raise AtuCodeError(f"range code with {len(parts)} endpoints: {raw!r}")
        atoms = (parse_atom(parts[0]), parse_atom(parts[1]))
        if atoms[1].number < atoms[0].number:
            raise AtuCodeError(f"descending range: {raw!r}")
        kind = "range"
    else:
        atoms = (parse_atom(text),)
        kind = "single"

    if is_reference:
        if kind != "single":
            raise AtuCodeError(f"cf. reference to a non-single code: {raw!r}")
        kind = "reference"

    return AtuCode(raw=(raw or "").strip(), kind=kind, atoms=atoms)


#: The seven top-level ATU divisions, as ``(low, high, label)`` triples. These
#: are the same boundaries the app's ``lib/atu-index.ts`` uses, kept here so the
#: knowledge base can assign a category without importing the app.
ATU_DIVISIONS: tuple[tuple[int, int, str], ...] = (
    (1, 299, "Animal Tales"),
    (300, 749, "Tales of Magic"),
    (750, 849, "Religious Tales"),
    (850, 999, "Realistic Tales"),
    (1000, 1199, "Tales of the Stupid Ogre"),
    (1200, 1999, "Anecdotes and Jokes"),
    (2000, 2399, "Formula Tales"),
)


def division(code: AtuCode) -> str | None:
    """The top-level ATU division a code's first atom falls in."""
    n = code.atoms[0].number
    for low, high, label in ATU_DIVISIONS:
        if low <= n <= high:
            return label
    return None
