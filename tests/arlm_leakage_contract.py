"""Checkpoint 2 materialized evidence and ancestry audit."""

import copy
import tempfile
import unittest
from contextlib import closing
from pathlib import Path

from arlm_dataset_contract import build_inference, frame, setup_ledger
from arlm_leakage_audit import audit_cases
from arlm_retrieval import retrieval_snapshot


class LeakageContract(unittest.TestCase):
    def test_planted_contamination(self):
        with tempfile.TemporaryDirectory() as directory:
            store, encounter, evidence = setup_ledger(Path(directory))
            with closing(store.db), store.transaction():
                left = build_inference(store, encounter, evidence, frame())
                right = build_inference(store, encounter, evidence, frame("finance"))
        left["expression"] = "the meaning depends on the observer"
        right["expression"] = "the meaning depends on this observer"
        cases = {
            "a": {"inference": left, "family": "a", "parents": [], "sourceDigests": ["shared"]},
            "b": {"inference": right, "family": "b", "parents": ["a"], "sourceDigests": ["shared"]},
        }
        clean = audit_cases(cases, {"a": "train", "b": "train"})
        self.assertTrue(clean["passed"])
        oracle_leak = audit_cases(cases, {"a": "train", "b": "train"}, forbidden_sources={"shared"})
        self.assertEqual({row["kind"] for row in oracle_leak["issues"]}, {"evaluator-source-in-retrieval"})
        cases["b"]["snapshot"] = {"winning-candidate-only": []}
        report = audit_cases(cases, {"a": "train", "b": "test"})
        self.assertFalse(report["passed"])
        self.assertTrue({"cross-split-source", "cross-split-derived-parent", "cross-split-assertion",
                         "cross-split-near-duplicate", "altered-retrieval"} <= {
                             issue["kind"] for issue in report["issues"]
                         })
        shuffled = copy.deepcopy(left)
        shuffled["candidates"].reverse()
        for item in shuffled["candidates"]:
            item["evidence"].reverse()
        self.assertEqual(retrieval_snapshot(left), retrieval_snapshot(shuffled))
        for key in ("winningReceipt", "goldEvidence"):
            poisoned = copy.deepcopy(left)
            poisoned["candidates"][0]["evidence"][0][key] = True
            with self.assertRaises(ValueError):
                audit_cases({"a": {**cases["a"], "inference": poisoned}}, {"a": "train"})
        poisoned = copy.deepcopy(left)
        poisoned["candidates"][0]["evidence"][0]["relation"] = "verified-winning-meaning"
        with self.assertRaisesRegex(ValueError, "Invalid typed"):
            audit_cases({"a": {**cases["a"], "inference": poisoned}}, {"a": "train"})
        print("Quarantined planted source, derivation, assertion, near-duplicate and retrieval leaks.")


if __name__ == "__main__":
    unittest.main()
