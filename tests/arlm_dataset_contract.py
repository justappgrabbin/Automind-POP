"""Executable Stage 3 checkpoint 2 dataset integrity fixtures."""
import copy
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from arlm_dataset import build_manifest


def row(family, **changes):
    data = dict(family=family, expressionFamily="expression-" + family,
                sourceLineage="source-" + family, templateFamily="template-" + family,
                graphAncestry="graph-" + family, derivedParent="parent-" + family,
                aliasFamily="alias-" + family, condition="correct-context", revision="r1")
    data.update(changes)
    return data


class DatasetContract(unittest.TestCase):
    def test_reordering_preserves_manifest(self):
        rows = [row("a"), row("b"), row("c")]
        self.assertEqual(build_manifest(rows, "frozen"), build_manifest(list(reversed(rows)), "frozen"))

    def test_transitive_ancestry_never_crosses_partitions(self):
        rows = [row("a", aliasFamily=["a", "shared"]),
                row("b", aliasFamily=["shared", "other"]),
                row("c", aliasFamily="other")]
        result = build_manifest(rows, "frozen")
        self.assertEqual(len(set(result["assignments"].values())), 1)

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

    def test_source_change_changes_digest(self):
        original = row("a")
        changed = copy.deepcopy(original)
        changed["sourceLineage"] = "different"
        self.assertNotEqual(build_manifest([original], "frozen")["sourceDigest"],
                            build_manifest([changed], "frozen")["sourceDigest"])


if __name__ == "__main__":
    unittest.main()
