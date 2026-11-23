"""Checkpoint 2 intake, corpus lineage, exact approval, and readiness."""

import copy
import json
import os
import subprocess
import sys
import tempfile
import unittest
from contextlib import closing
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "tests/fixtures"
sys.path.insert(0, str(ROOT / "src"))

from arlm_contact import initialize, record
from arlm_dataset import build_dataset, build_manifest
from arlm_inference import build_inference, inference_digest
from arlm_interpretation import index_evidence
from arlm_state import ARLMState, sha
from arlm_training_data import approved_targets, revision_digest


def setup_ledger(path):
    foundry = Path(os.environ["POP_STAGE3_FOUNDRY"])
    fixture = json.loads((FIXTURES / "arlm_positional_meaning.json").read_text())
    pop = path / "pop.json"
    for command, request in (
        ("resolve-address", fixture["assertions"][0]["position"]["coordinates"]),
        ("locate-perspective", {"expressions": {"Where": "I move"}}),
    ):
        subprocess.check_output(["node", "src/cli.mjs", command, str(pop), json.dumps(request)], cwd=ROOT)
    store = ARLMState(path / "ledger.sqlite")
    with store.transaction():
        initialize(store, foundry, pop)
        encounter = record(store, fixture["encounter"])["revision"]
        evidence = index_evidence(store, encounter, fixture["assertions"])["revision"]
    return store, encounter, evidence


def frame(context="river"):
    return {
        "schemaVersion": 2,
        "frame": {"observer": "test", "referenceFrame": "domain", "scale": "term",
                  "context": context, "knowledge": "edition-1", "temporalReference": "2026-01-01T12:00:00Z"},
        "expressions": {"Where": "local context", "What": "bank"},
        "weights": {"Where": 2, "What": 1}, "clarify": "Movement",
    }


def source(author, lineage, content):
    return {"author": author, "lineage": lineage, "content": content,
            "sha256": sha(content.encode()), "trainingPermitted": True}


def label(artifact, family, oracle):
    return {
        "schemaVersion": 1, "caseFamily": family, "inferenceSha256": inference_digest(artifact),
        "expectedDecision": "resolved", "meanings": ["river-edge"],
        "supportingRefs": [row["ref"] for item in artifact["candidates"] if item["concept"] == "river-edge"
                           for row in item["evidence"] if row["context"] == "river"],
        "verification": {"evaluator": oracle["author"], "method": "smoke fixture oracle",
                         "source": "fixture:oracle", "sourceSha256": oracle["sha256"]},
    }


class DatasetContract(unittest.TestCase):
    def test_empty_and_real_ledger_intake(self):
        empty = build_dataset(None, {"sources": {}, "cases": {}}, {})
        self.assertTrue(empty["audit"]["passed"])
        self.assertEqual(empty["coverage"]["shortfall"], 600)
        self.assertEqual(set(empty["coverage"]["shortfallByCondition"].values()), {75})
        self.assertEqual(len(empty["coverage"]["requiredSeeds"]), 5)
        self.assertFalse(empty["preparedForReview"])
        with tempfile.TemporaryDirectory() as directory:
            store, encounter, evidence = setup_ledger(Path(directory))
            with closing(store.db), store.transaction():
                self.exercise(store, encounter, evidence)

    def exercise(self, store, encounter, evidence):
        entry = {"family": "bank-smoke", "expressionFamily": "bank", "sourceLineage": "encounter",
                 "templateFamily": "bank", "condition": "correct-context", "primaryCondition": "correct-context",
                 "kind": "smoke", "encounterRevision": encounter, "evidenceRevision": evidence,
                 "frame": frame(), "parents": []}
        sources = {
            "fixture:spoken-input": source("author", "encounter", "bank"),
            "fixture:contextual-lexicon#edition-1": source("lexicographer", "lexicon", "bank senses"),
            "fixture:oracle": source("evaluator", "oracle", "river-edge in river"),
        }
        inventory = {"sources": sources, "cases": {"river": entry, "finance": {
            **entry, "frame": frame("finance"), "condition": "swapped-context", "parents": ["river"],
        }}}
        artifact = build_inference(store, encounter, evidence, frame(), stable_namespace="river")
        outcome = label(artifact, entry["family"], sources["fixture:oracle"])
        revision = {"supersedes": None, "evaluation": outcome, "approval": None}
        approved = {**revision, "approval": {"purpose": "interpretation-training", "approver": "operator",
                                             "labelSha256": revision_digest(None, revision)}}
        labels = {"river": [approved]}
        before = store.history()
        result = build_dataset(store, inventory, labels)
        shuffled = {"sources": dict(reversed(list(sources.items()))),
                    "cases": dict(reversed(list(inventory["cases"].items())))}
        self.assertEqual(result, build_dataset(store, shuffled, labels))
        self.assertEqual(store.history(), before)
        self.assertTrue(result["audit"]["passed"])
        self.assertEqual(result["coverage"]["independentTestFamilies"], 0)
        self.assertEqual(result["inference"]["river"], artifact)
        self.assertEqual(result["trainingTargets"], {})
        loop = copy.deepcopy(inventory)
        loop["cases"]["river"]["parents"] = ["finance"]
        with self.assertRaisesRegex(ValueError, "cycle"):
            build_dataset(store, loop, labels)

        authority = {"family": entry["family"], "inference": artifact,
                     "sourceAuthors": ["author"], "trainingPermitted": True}
        target = approved_targets(authority, [approved], "train")
        self.assertEqual(target["rankTargets"], ["river-edge"])
        self.assertIsNone(approved_targets(authority, [approved], "test"))
        self.assertIsNone(approved_targets({**authority, "trainingPermitted": False}, [approved], "train"))
        correction = {**revision, "supersedes": approved["approval"]["labelSha256"]}
        self.assertIsNone(approved_targets(authority, [approved, correction], "train"))
        with self.assertRaisesRegex(ValueError, "Approval must bind"):
            approved_targets(authority, [{**approved, "approval": {**approved["approval"],
                             "purpose": "lexical-contact"}}], "train")
        tampered = copy.deepcopy(inventory)
        tampered["sources"]["fixture:spoken-input"]["content"] = "replacement"
        with self.assertRaisesRegex(ValueError, "Source content"):
            build_dataset(store, tampered, labels)
        with self.assertRaisesRegex(ValueError, "verification source"):
            build_dataset(store, inventory, {"river": [{**revision, "evaluation": {
                **outcome, "verification": {**outcome["verification"], "sourceSha256": "0" * 64},
            }}]})
        print("Real ledger intake reproduced, source digests checked, correction lineage and exact approval enforced.")


def row(family, **changes):
    data = dict(family=family, expressionFamily="expression-" + family,
                sourceLineage="source-" + family, templateFamily="template-" + family,
                graphAncestry="graph-" + family, derivedParent="parent-" + family,
                aliasFamily="alias-" + family, condition="correct-context", revision="r1")
    data.update(changes)
    return data


class LineageManifestContract(unittest.TestCase):
    def test_reordering_preserves_manifest(self):
        rows = [row("a"), row("b"), row("c")]
        self.assertEqual(build_manifest(rows, "frozen"), build_manifest(list(reversed(rows)), "frozen"))

    def test_transitive_ancestry_never_crosses_partitions(self):
        rows = [row("a", aliasFamily=["a", "shared"]),
                row("b", aliasFamily=["shared", "other"]),
                row("c", aliasFamily="other")]
        result = build_manifest(rows, "frozen")
        self.assertEqual(len(set(result["assignments"].values())), 1)
        self.assertEqual(set(result["components"].values()), {"a"})
        self.assertEqual(sum(result["independentFamilies"].values()), 1)

    def test_revisions_preserved(self):
        rows = [row("a"), row("a", revision="r2", condition="lossy")]
        self.assertEqual(build_manifest(rows, "frozen")["conditionRuns"]["train"] +
                         build_manifest(rows, "frozen")["conditionRuns"]["validation"] +
                         build_manifest(rows, "frozen")["conditionRuns"]["test"], 2)

    def test_missing_lineage_quarantined(self):
        broken = row("a")
        del broken["graphAncestry"]
        with self.assertRaises(ValueError):
            build_manifest([broken], "frozen")

    def test_unresolved_alias_quarantined(self):
        with self.assertRaises(ValueError):
            build_manifest([row("a", aliasFamily=[])], "frozen")

    def test_duplicate_revision_rejected(self):
        with self.assertRaises(ValueError):
            build_manifest([row("a"), row("a")], "frozen")

    def test_label_leakage_rejected(self):
        with self.assertRaises(ValueError):
            build_manifest([dict(row("a"), expectedDecision="resolved")], "frozen")

    def test_unknown_condition_quarantined_before_partitioning(self):
        with self.assertRaisesRegex(ValueError, "Unknown preregistered condition"):
            build_manifest([row("a", condition="unregistered-condition")], "frozen")

    def test_ambiguous_identifier_whitespace_quarantined(self):
        for candidate in (row(" a"), row("a", revision="r1 "), row("a", revision=" r1")):
            with self.subTest(candidate=candidate):
                with self.assertRaises(ValueError):
                    build_manifest([candidate], "frozen")

    def test_source_change_changes_digest(self):
        original = row("a")
        changed = copy.deepcopy(original)
        changed["sourceLineage"] = "different"
        self.assertNotEqual(build_manifest([original], "frozen")["sourceDigest"],
                            build_manifest([changed], "frozen")["sourceDigest"])


if __name__ == "__main__":
    unittest.main()
