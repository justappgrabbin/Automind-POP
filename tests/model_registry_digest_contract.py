"""Regression: a registry cannot activate a checkpoint without both verified hashes."""
import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from model_registry import ModelRegistry


class CheckpointDigestContract(unittest.TestCase):
    def test_missing_and_tampered_digest_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            registry = ModelRegistry(temporary)
            revision = "revision-" + "a" * 32
            directory = registry.weights / revision
            directory.mkdir(parents=True)
            for name in ("config.json", "weights.pt"):
                (directory / name).write_bytes(name.encode())
            hashes = {name: hashlib.sha256(name.encode()).hexdigest()
                      for name in ("config.json", "weights.pt")}
            state = {"specification": {"architecture": "portable"},
                     "revisions": {revision: {"architecture": "portable",
                         "qualifiedHeads": ["code"], "torch": "test-version",
                         "digests": hashes.copy()}}}
            with patch("model_registry.version", return_value="test-version"):
                self.assertEqual(registry.verified_checkpoint(state, revision, "code"), directory)
                for bad in ({}, {"config.json": hashes["config.json"]},
                            {**hashes, "extra.txt": "0" * 64},
                            {**hashes, "weights.pt": "0" * 64}):
                    state["revisions"][revision]["digests"] = bad
                    with self.subTest(digests=bad), self.assertRaisesRegex(ValueError, "digest mismatch"):
                        registry.verified_checkpoint(state, revision, "code")


if __name__ == "__main__":
    unittest.main()
