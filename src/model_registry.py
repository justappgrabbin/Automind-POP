"""Local TRIDENT registry and verification of the artifacts it activates."""

import fcntl
import hashlib
import json
import os
import re
from contextlib import contextmanager
from importlib.metadata import version
from pathlib import Path
from tempfile import NamedTemporaryFile


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


class ModelRegistry:
    def __init__(self, root):
        self.root = Path(root).resolve()
        self.path = self.root / "registry.json"
        self.weights = self.root / "training"

    @contextmanager
    def locked(self):
        self.root.mkdir(mode=0o700, parents=True, exist_ok=True)
        with (self.root / ".lock").open("a") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            state = json.loads(self.path.read_text()) if self.path.exists() else None
            if state is not None and state.get("version") != 1:
                raise ValueError("Unsupported model registry version")
            yield state

    def save(self, state, *, path=None):
        path = path or self.path
        with NamedTemporaryFile(mode="w", dir=path.parent, delete=False, encoding="utf-8") as stream:
            pending = Path(stream.name)
            try:
                json.dump(state, stream, indent=2, allow_nan=False)
                stream.flush()
                os.fsync(stream.fileno())
                os.replace(pending, path)
            finally:
                pending.unlink(missing_ok=True)

    def artifacts(self, revision):
        if not isinstance(revision, str) or not re.fullmatch(r"revision-[0-9a-f]{32}", revision):
            raise ValueError("Invalid TRIDENT revision ID")
        directory = self.weights / revision
        for name in ("config.json", "weights.pt"):
            path = directory / name
            if not path.is_file() or path.is_symlink() or directory.is_symlink():
                raise ValueError(f"Missing regular checkpoint artifact {path}")
        return directory

    def verified_checkpoint(self, state, revision, head):
        record = state["revisions"].get(revision)
        if not record or record["architecture"] != state["specification"]["architecture"]:
            raise ValueError("Unknown or incompatible model revision")
        if head is not None and head not in record["qualifiedHeads"]:
            raise ValueError(f"Revision has no qualification for {head}")
        if record["torch"] != version("torch"):
            raise ValueError("Checkpoint uses an incompatible PyTorch version")
        directory = self.artifacts(revision)
        if any(digest(directory / name) != expected for name, expected in record["digests"].items()):
            raise ValueError("Checkpoint digest mismatch")
        return directory
