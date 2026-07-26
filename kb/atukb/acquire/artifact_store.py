"""The quarantine artifact store (assessment §6.4 "Acquire", §6.7, §4 risk 9).

Acquisition is the one gate that requires nothing, because you cannot read a
dataset's license without retrieving the artifact it ships inside. What
acquisition buys is *only* a checksummed copy in quarantine: no parsing, no
``core``, no exposure.

Two properties matter more than they look:

* **Content-addressed.** An artifact is identified by the SHA-256 of its bytes,
  so "the file we actually parsed" and "the file we recorded a license for" are
  the same object by construction.
* **License evidence is an artifact too.** GitHub datasets vanish, and a license
  asserted in a since-deleted README leaves no proof of the right you relied on.
  So the LICENSE and README are snapshotted *as retrieved*, alongside the data,
  and the register points at them by digest.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from pathlib import Path

import httpx


@dataclass(frozen=True, slots=True)
class Artifact:
    """One retrieved file and everything needed to cite or re-verify it."""

    artifact_id: str
    source_key: str
    name: str
    url: str
    sha256: str
    bytes_len: int
    media_type: str
    retrieved_at: str

    @property
    def relative_path(self) -> str:
        return f"{self.source_key}/{self.name}"


class ArtifactStore:
    """A directory of quarantined artifacts plus their manifests."""

    def __init__(self, root: Path) -> None:
        self.root = root

    def _paths(self, source_key: str, name: str) -> tuple[Path, Path]:
        base = self.root / source_key
        return base / name, base / f"{name}.manifest.json"

    def path_for(self, source_key: str, name: str) -> Path:
        return self._paths(source_key, name)[0]

    def get(self, source_key: str, name: str) -> Artifact | None:
        _, manifest = self._paths(source_key, name)
        if not manifest.exists():
            return None
        return Artifact(**json.loads(manifest.read_text(encoding="utf-8")))

    def put(
        self,
        source_key: str,
        name: str,
        content: bytes,
        *,
        url: str,
        media_type: str,
    ) -> Artifact:
        data_path, manifest_path = self._paths(source_key, name)
        data_path.parent.mkdir(parents=True, exist_ok=True)
        digest = hashlib.sha256(content).hexdigest()
        artifact = Artifact(
            artifact_id=f"{source_key}/{name}@{digest[:12]}",
            source_key=source_key,
            name=name,
            url=url,
            sha256=digest,
            bytes_len=len(content),
            media_type=media_type,
            retrieved_at=datetime.now(UTC).isoformat(timespec="seconds"),
        )
        data_path.write_bytes(content)
        manifest_path.write_text(
            json.dumps(asdict(artifact), indent=2) + "\n", encoding="utf-8"
        )
        return artifact

    def fetch(
        self,
        source_key: str,
        name: str,
        url: str,
        *,
        params: dict[str, str] | None = None,
        headers: dict[str, str] | None = None,
        timeout: float = 180.0,
    ) -> Artifact:
        """Retrieve a URL into quarantine and record its manifest."""
        with httpx.Client(follow_redirects=True, timeout=timeout) as client:
            response = client.get(url, params=params, headers=headers)
            response.raise_for_status()
            return self.put(
                source_key,
                name,
                response.content,
                url=str(response.url),
                media_type=response.headers.get("content-type", "application/octet-stream"),
            )

    def verify(self, artifact: Artifact) -> bool:
        """Re-hash the stored bytes and compare against the manifest."""
        path = self.path_for(artifact.source_key, artifact.name)
        if not path.exists():
            return False
        return hashlib.sha256(path.read_bytes()).hexdigest() == artifact.sha256

    def read(self, source_key: str, name: str) -> bytes:
        return self.path_for(source_key, name).read_bytes()
