from __future__ import annotations

import os
from pathlib import Path

import psycopg
import pytest

from atukb.config import CODE_CORPUS_DIR, settings


def load_corpus(name: str) -> list[list[str]]:
    """Read a versioned code corpus, preserving fields exactly.

    Fields are not stripped: leading and trailing whitespace around a code is
    part of what the corpus asserts the parser tolerates.
    """
    path = CODE_CORPUS_DIR / name
    rows: list[list[str]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        rows.append(line.split("\t"))
    return rows


def _database_available() -> bool:
    try:
        with psycopg.connect(settings.dsn, connect_timeout=3):
            return True
    except Exception:
        return False


requires_db = pytest.mark.skipif(
    not _database_available(),
    reason=f"no Postgres reachable at {settings.dsn}",
)


@pytest.fixture(scope="session")
def dsn() -> str:
    return settings.dsn


@pytest.fixture
def conn(dsn: str):
    from atukb.db import connect

    with connect(dsn) as c:
        yield c
        c.rollback()


@pytest.fixture(scope="session")
def repo_root() -> Path:
    return Path(os.environ.get("ATUKB_REPO_ROOT", Path(__file__).resolve().parents[2]))
