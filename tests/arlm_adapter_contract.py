"""Checkpoint 1 acceptance with a pre-existing pinned Foundry revision."""

import copy
import json
import os
import random
import subprocess
import sys
import tempfile
import types
import unittest
from contextlib import closing
from pathlib import Path
from uuid import UUID

import torch

ROOT = Path(__file__).resolve().parents[1]
BASELINE = "6faf759a95fbb698f7a2097d1d03f5cd452517f2"
FIXTURES = ROOT / "tests/fixtures"
sys.path.insert(0, str(ROOT / "src"))
from arlm_contact import initialize, record
from arlm_evaluation import CONDITIONS, partition_families, validate_binding, validate_evaluation
from arlm_inference import BUDGET, inference_digest, validate_inference
from arlm_interpretation import index_evidence
from arlm_interpretation_adapter import DECISIONS, load_adapter, preview
from arlm_state import ARLMState
from model_registry import ModelRegistry, digest


def capture(*command):
    return subprocess.check_output(list(map(str, command)), cwd=ROOT)


def json_file(path, data):
    path.write_text(json.dumps(data, indent=2) + "\n")
    return path


def parameter_bytes(module):
    return {key: bytes(value.detach().reshape(-1).contiguous().view(torch.uint8).tolist())
            for key, value in module.state_dict().items()}


class AdapterContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        torch.set_num_threads(1)
        cls.foundry = Path(os.environ["POP_STAGE3_FOUNDRY"])
        cls.registry = ModelRegistry(cls.foundry)
        with cls.registry.locked() as state:
            cls.revision = state["active"]["revision"]
        cls.adapter = load_adapter(cls.foundry, cls.revision)

    def test_pinned_legacy_logits_and_frozen_weights(self):
        original = types.ModuleType("original_trident")
        source = capture("git", "show", f"{BASELINE}:vendor/trident/source/model.py")
        exec(compile(source, "baseline_trident_model.py", "exec"), original.__dict__)
        pinned = self.adapter.model
        before = parameter_bytes(pinned)
        baseline = original.Trident(pinned.cfg).eval()
        donor_keys = baseline.state_dict()
        baseline.load_state_dict({name: pinned.state_dict()[name] for name in donor_keys}, strict=True)
        ids = torch.tensor([[257, 98, 97, 110, 107]])
        rng = torch.Generator().manual_seed(27)
        rag = torch.randn((1, 3, pinned.cfg.rag_dim), generator=rng)
        klein = torch.randn((1, 8, 32), generator=rng)
        with torch.inference_mode():
            for head in (None, "code", "math", "research"):
                for context in ({}, {"rag": rag}, {"klein": klein}, {"rag": {"research": rag}, "klein": klein}):
                    old_scores, old_router = baseline(ids, head=head, return_router=True, **context)
                    new_scores, new_router = pinned(ids, head=head, return_router=True, **context)
                    self.assertTrue(torch.equal(old_scores, new_scores))
                    self.assertTrue(torch.equal(old_router, new_router))
            hidden = pinned(ids, head="research", rag=rag, klein=klein, return_representations=True)
            self.assertTrue(torch.equal(pinned.heads["research"].lm_head(hidden),
                                        pinned(ids, head="research", rag=rag, klein=klein)))
        self.adapter.train()
        self.assertFalse(any(module.training for module in pinned.modules()))
        self.assertTrue(all(param.requires_grad == (not name.startswith("model."))
                            for name, param in self.adapter.named_parameters()))
        self.adapter.eval()
        self.assertEqual(parameter_bytes(pinned), before)
        checkpoint = self.registry.artifacts(self.revision)
        with self.registry.locked() as state:
            for file, expected in state["revisions"][self.revision]["digests"].items():
                self.assertEqual(digest(checkpoint / file), expected)
        print(f"Legacy logits and routing bitwise equal in 16 scenarios; {len(before)} frozen state tensors; "
              f"{self.revision} weights sha256={digest(checkpoint / 'weights.pt')}.")

    def test_artifact_separation_and_full_permutations(self):
        fixture = json.loads((FIXTURES / "arlm_positional_meaning.json").read_text())
        # One concept crosses the evidence budget and the others have fewer rows.
        assertions = fixture["assertions"] + [
            {**fixture["assertions"][0], "context": f"river-variant-{i}", "sourceRevision": f"revision-{i}"}
            for i in range(5)
        ]
        with tempfile.TemporaryDirectory() as directory:
            self.exercise_artifacts(Path(directory), fixture, assertions)

    def exercise_artifacts(self, directory, fixture, assertions):
        pop = directory / "pop.json"
        capture("node", "src/cli.mjs", "resolve-address", pop,
                json.dumps(assertions[0]["position"]["coordinates"]))
        capture("node", "src/cli.mjs", "locate-perspective", pop, '{"expressions":{"Where":"I move"}}')
        ledger = directory / "ledger.sqlite"
        store = ARLMState(ledger)
        with closing(store.db), store.transaction():
            initialize(store, self.foundry, pop)
            encounter = record(store, fixture["encounter"])
            evidence = index_evidence(store, encounter["revision"], assertions)
        frame = {
            "frame": {"observer": "observer:field", "referenceFrame": "domain", "scale": "term",
                      "context": "river", "knowledge": "edition-1", "temporalReference": "2026-01-01T12:00:00Z"},
            "expressions": {"Where": "local context", "What": "bank"},
            "weights": {"Where": 2, "What": 1}, "clarify": "Movement",
        }
        request = json_file(directory / "frame.json", frame)
        cli = (sys.executable, "src/arlm_cli.py", ledger)
        build = (*cli, "inference-artifact", encounter["revision"], evidence["revision"], request)
        artifact = json.loads(capture(*build))
        frame["frame"]["context"] = "finance"
        json_file(request, frame)
        counterframe = json.loads(capture(*build))
        compare_evidence = lambda item: {c["concept"]: c["evidence"] for c in item["candidates"]}
        self.assertEqual(compare_evidence(artifact), compare_evidence(counterframe))
        self.assertEqual(sorted(map(len, compare_evidence(artifact).values())), [2, 7])
        self.assertEqual(set(compare_evidence(artifact)), {"river-edge", "financial-institution"})
        for sensitive in ("address", "selected", "expected", "oracle", "status", "gold", "receipt"):
            self.assertNotIn(f'"{sensitive}', json.dumps({
                **artifact, "retrieval": {key: value for key, value in artifact["retrieval"].items()
                                          if key != "addresses"},
            }).lower())
        labels = {
            "schemaVersion": 1, "inferenceSha256": inference_digest(artifact), "caseFamily": "bank-smoke",
            "expectedDecision": "resolved", "meanings": [fixture["oracle"]["river"]["concept"]],
            "supportingRefs": [row["ref"] for row in compare_evidence(artifact)["river-edge"]
                               if row["context"] == "river"],
            "verification": {"evaluator": "fixture:independent-oracle", "method": "declared Stage 2 oracle",
                             "source": "tests/fixtures/arlm_positional_meaning.json#oracle",
                             "sourceSha256": digest(FIXTURES / "arlm_positional_meaning.json")},
        }
        validate_binding(labels, artifact)
        with self.assertRaisesRegex(ValueError, "another inference artifact"):
            validate_binding(labels, counterframe)
        with self.assertRaises(ValueError):
            validate_inference(labels)
        with self.assertRaises(ValueError):
            validate_evaluation(artifact)
        for target, key, value in (
            ((), "expectedDecision", "resolved"),
            (("candidates", 0), "selectedMeaning", "river-edge"),
            (("candidates", 0, "evidence", 0), "goldEvidence", True),
            (("candidates", 0, "evidence", 0), "addressReceipt", {"gate": 42}),
        ):
            poisoned = copy.deepcopy(artifact)
            node = poisoned
            for part in target:
                node = node[part]
            node[key] = value
            with self.assertRaises(ValueError):
                preview(self.adapter, poisoned)
        inference_path = json_file(directory / "inference.json", artifact)
        self.assertFalse((directory / "evaluation.json").exists())
        output = json.loads(capture(sys.executable, "src/arlm_interpretation_adapter.py",
                                    self.foundry, self.revision, inference_path))
        json_file(directory / "evaluation.json", labels)
        chunk_counts, composer_calls = [], []
        model = self.adapter.model
        gate = model.heads["research"].rag_gate.register_forward_pre_hook(
            lambda _, args: chunk_counts.append(args[1].shape[1])
        )
        composer = model.rel_composer.register_forward_hook(lambda *_: composer_calls.append(1))
        try:
            self.assertEqual(output, preview(self.adapter, artifact))
        finally:
            gate.remove()
            composer.remove()
        self.assertEqual(chunk_counts, [12, 14])  # Frame + observation + evidence + eight Klein chunks.
        self.assertEqual(len(composer_calls), 6)
        self.assertEqual(output["parent"]["revision"], self.revision)
        self.assertEqual(output["decision"], "unresolved")
        self.assertEqual(output["calibration"], "unqualified")
        self.assertEqual(set(output["decisionScores"]), set(DECISIONS))
        self.assertEqual(sorted(len(row["evidenceRefs"]) for row in output["rankedCandidates"]), [2, BUDGET])
        self.assertEqual(sorted(len(row["droppedRefs"]) for row in output["rankedCandidates"]), [0, 3])
        # Removing all candidates produces a separate unresolved evidence case.
        empty = preview(self.adapter, {**artifact, "candidates": []})
        self.assertEqual(empty["decision"], "unresolved")
        self.assertEqual(empty["rankedCandidates"], [])

        def semantic(result, input_data):
            concepts = {row["id"]: row["concept"] for row in input_data["candidates"]}
            return {**result, "rankedCandidates": [
                {**row, "id": concepts[row["id"]]} for row in result["rankedCandidates"]
            ]}

        before = parameter_bytes(self.adapter.model)
        self.check_permutations(self.adapter, artifact, semantic)
        tied = copy.deepcopy(self.adapter)
        with torch.no_grad():
            tied.rank_score.weight.zero_()
            tied.rank_score.bias.zero_()
            tied.citation_score.weight.zero_()
            tied.citation_score.bias.zero_()
        tied_output = preview(tied, artifact)
        self.assertEqual([row["rank"] for row in tied_output["rankedCandidates"]], [1, 1])
        self.assertEqual(tied_output["decisionScores"], output["decisionScores"])
        self.check_permutations(tied, artifact, semantic)
        # Hold every ranking score tied while changing only the decision head.
        with torch.no_grad():
            tied.decision_score.weight.zero_()
            for index, expected in enumerate(DECISIONS):
                tied.decision_score.bias.zero_()
                tied.decision_score.bias[index] = 1
                independent = preview(tied, artifact)
                self.assertEqual(independent["proposedDecision"], expected)
                self.assertEqual(independent["decision"], "unresolved")
                self.assertEqual(independent["rankedCandidates"], tied_output["rankedCandidates"])
        self.assertEqual(before, parameter_bytes(self.adapter.model))
        if destination := os.environ.get("POP_STAGE3_EVIDENCE"):
            destination = Path(destination)
            json_file(destination / "inference.json", artifact)
            json_file(destination / "evaluation.json", labels)
            json_file(destination / "preview.json", output)
        print("24 semantic-equivalent candidate/ID/evidence permutations, including forced rank/citation ties.")

    def check_permutations(self, adapter, artifact, semantic):
        expected = semantic(preview(adapter, artifact), artifact)
        for seed in range(12):
            rng = random.Random(seed)
            permuted = copy.deepcopy(artifact)
            if seed % 2:
                permuted["candidates"].reverse()
            for candidate in permuted["candidates"]:
                candidate["id"] = f"candidate-{UUID(int=rng.getrandbits(128)).hex}"
                rng.shuffle(candidate["evidence"])
            self.assertEqual(expected, semantic(preview(adapter, permuted), permuted))

    def test_preregistration_and_transitive_partition(self):
        manifest = FIXTURES / "arlm_stage3/preregistration.json"
        protocol = json.loads(manifest.read_text())
        self.assertEqual(protocol["conditions"], list(CONDITIONS))
        self.assertEqual(protocol["counts"]["minimumIndependentTestFamilies"], 600)
        self.assertEqual(protocol["counts"]["minimumIndependentTestFamiliesPerPrimaryCondition"], 75)
        self.assertEqual(len(protocol["requiredSeeds"]), 5)
        rows = [
            {"family": str(i), "expressionFamily": f"expression-{i}", "sourceLineage": f"source-{i}",
             "templateFamily": f"template-{i}", "condition": CONDITIONS[i % len(CONDITIONS)]}
            for i in range(100)
        ]
        rows[1]["templateFamily"] = rows[0]["templateFamily"]
        rows[2]["sourceLineage"] = rows[1]["sourceLineage"]
        rows.append({**rows[0], "condition": "swapped-context"})
        salt = protocol["split"]["salt"]
        assigned = partition_families(rows, salt)
        self.assertEqual(assigned, partition_families(reversed(rows), salt))
        self.assertEqual(len(assigned), 100)
        self.assertEqual(set(assigned.values()), {"train", "validation", "test"})
        self.assertEqual(len({assigned[key] for key in ("0", "1", "2")}), 1)
        for field in protocol["split"]["groupBy"]:
            seen = {}
            for row in rows:
                split = assigned[row["family"]]
                self.assertEqual(seen.setdefault(row[field], split), split)
        print(f"Preregistration sha256={digest(manifest)}; synthetic split contracts only.")


if __name__ == "__main__":
    unittest.main()
