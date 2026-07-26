"""Runtime configuration: where the database is and where artifacts land."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parent
KB_ROOT = PACKAGE_ROOT.parent
DATA_ROOT = KB_ROOT / "data"

RIGHTS_REGISTER_DIR = DATA_ROOT / "rights_register"
CODE_CORPUS_DIR = DATA_ROOT / "code_corpus"
FIXTURES_DIR = DATA_ROOT / "fixtures"

DEFAULT_DSN = "postgresql://atukb:atukb@127.0.0.1:5432/atukb"


@dataclass(frozen=True, slots=True)
class Settings:
    dsn: str
    artifact_store: Path
    export_dir: Path

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            dsn=os.environ.get("ATUKB_DSN", DEFAULT_DSN),
            # The quarantine store. Acquisition may write here before any rights
            # question is settled; nothing else may read from it (§6.4).
            artifact_store=Path(
                os.environ.get("ATUKB_ARTIFACT_STORE", str(KB_ROOT / "artifacts"))
            ),
            export_dir=Path(
                os.environ.get("ATUKB_EXPORT_DIR", str(KB_ROOT / "export"))
            ),
        )


settings = Settings.from_env()
