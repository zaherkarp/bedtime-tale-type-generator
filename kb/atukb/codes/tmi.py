"""Thompson Motif-Index code grammar.

TMI codes encode their own hierarchy: ``D672`` sits under the ``D600``s, which
sit under ``D``. The structure is a *function of the identifier*, so we derive it
rather than storing it as free-form edges that can disagree with the codes
(assessment §3.6, §6.6).

The derived path is materialised into a Postgres ``ltree`` column, which makes
"give me everything under D" a prefix match (``path <@ 'D'``) that cannot be
wrong, instead of a recursive CTE over a table that might be.

``ltree`` labels admit only ``[A-Za-z0-9_]``, so the dots inside a code become
underscores inside a label: ``A1.1.2`` yields the label ``A1_1_2``. The mapping
is bijective for well-formed codes, and :func:`code_from_label` proves it.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

#: A well-formed TMI code: one chapter letter, an integer, then decimal segments.
#: Real-world examples: ``A0``, ``D672``, ``A1.1``, ``F255.2``, ``B11.2.1.1``.
TMI_CODE_RE = re.compile(r"^([A-Z])(\d+)((?:\.\d+)*)$")

#: The chapter letters the Motif-Index actually uses. I, O and Y are not chapters.
TMI_CHAPTERS = frozenset("ABCDEFGHJKLMNPQRSTUVWXZ")


class TmiCodeError(ValueError):
    """A code that does not satisfy the grammar. Callers quarantine the row."""


@dataclass(frozen=True, slots=True)
class TmiCode:
    """A parsed TMI code and everything derivable from it."""

    raw: str
    chapter: str
    number: int
    decimals: tuple[int, ...]

    @property
    def canonical(self) -> str:
        """The code in normal form, e.g. ``B11.2.1``."""
        stem = f"{self.chapter}{self.number}"
        return ".".join([stem, *(str(d) for d in self.decimals)])

    @property
    def hundreds(self) -> int:
        """The hundreds bucket, e.g. 600 for ``D672``."""
        return (self.number // 100) * 100

    @property
    def tens(self) -> int:
        """The tens bucket ("section") the Motif-Index itself uses, e.g. 670."""
        return (self.number // 10) * 10

    @property
    def ancestors(self) -> tuple[str, ...]:
        """Canonical codes of every ancestor, outermost first, excluding self.

        ``D672.1`` yields ``('D', 'D600', 'D670', 'D672')``.
        """
        stem = f"{self.chapter}{self.number}"
        out = [
            self.chapter,
            f"{self.chapter}{self.hundreds}",
            f"{self.chapter}{self.tens}",
            stem,
        ]
        # Collapse the buckets that coincide with the code itself: D600 is its
        # own hundreds bucket, and we must not emit it twice.
        deduped: list[str] = []
        for a in out:
            if a not in deduped:
                deduped.append(a)
        for i in range(len(self.decimals)):
            deduped.append(".".join([stem, *(str(d) for d in self.decimals[: i + 1])]))
        return tuple(deduped[:-1])

    @property
    def path(self) -> str:
        """The ``ltree`` path, root first, including this code as the leaf."""
        return ".".join(label_from_code(c) for c in (*self.ancestors, self.canonical))

    @property
    def depth(self) -> int:
        """Number of ``ltree`` labels in :attr:`path`."""
        return self.path.count(".") + 1

    @property
    def sort_key(self) -> str:
        """A lexically sortable key.

        ``D672`` must sort after ``D99`` and before ``D672.1``; neither a plain
        lexical nor a plain numeric sort gets that right. Fixed-width numeric
        segments do.
        """
        parts = [f"{self.number:06d}", *(f"{d:06d}" for d in self.decimals)]
        return f"{self.chapter}" + ".".join(parts)


def label_from_code(code: str) -> str:
    """Convert a canonical code to a single ``ltree`` label."""
    return code.replace(".", "_")


def code_from_label(label: str) -> str:
    """Inverse of :func:`label_from_code`."""
    return label.replace("_", ".")


def parse(raw: str) -> TmiCode:
    """Parse a TMI code, raising :class:`TmiCodeError` if it is malformed.

    The published CSV contains rows whose code is empty (first-edition-only
    entries) and a handful carrying editorial brackets such as ``N50[b]``. Those
    raise, and the ingestion gate quarantines the row rather than guessing
    (§6.8).
    """
    text = (raw or "").strip()
    if not text:
        raise TmiCodeError("empty motif code")
    m = TMI_CODE_RE.match(text)
    if not m:
        raise TmiCodeError(f"malformed motif code: {raw!r}")
    chapter, number, decimals = m.group(1), int(m.group(2)), m.group(3)
    if chapter not in TMI_CHAPTERS:
        raise TmiCodeError(f"unknown Motif-Index chapter {chapter!r} in {raw!r}")
    tail = tuple(int(d) for d in decimals.split(".")[1:]) if decimals else ()
    return TmiCode(raw=text, chapter=chapter, number=number, decimals=tail)


#: ``A0–A99. Creator.`` — the range headings the CSV carries in its division and
#: section columns. The dash is an en dash in the published file.
RANGE_RE = re.compile(r"^([A-Z])(\d+)[–-]([A-Z])?(\d+)\.")
SINGLE_RE = re.compile(r"^([A-Z])(\d+)\.")


def parse_range(heading: str) -> tuple[str, int, int] | None:
    """Parse a division/section heading into ``(chapter, low, high)``.

    Returns ``None`` when the heading carries no code range, which is how the
    CSV represents "this level does not apply to this row".
    """
    text = (heading or "").strip()
    if not text:
        return None
    m = RANGE_RE.match(text)
    if m:
        return m.group(1), int(m.group(2)), int(m.group(4))
    m = SINGLE_RE.match(text)
    if m:
        # A bare section heading such as ``D670. Magic flight.`` covers its tens.
        low = int(m.group(2))
        return m.group(1), low, low + 9
    return None


def contains(heading: str, code: TmiCode) -> bool | None:
    """Is ``code`` inside the range this heading declares?

    ``None`` means the heading declares no range and so cannot contradict the
    parse. This is the check behind the "materialised hierarchy matches the
    parse" validation in §6.6: the CSV's own division columns are an independent
    witness, and where they disagree with the code we quarantine rather than
    silently trusting either one.
    """
    rng = parse_range(heading)
    if rng is None:
        return None
    chapter, low, high = rng
    return chapter == code.chapter and low <= code.number <= high
