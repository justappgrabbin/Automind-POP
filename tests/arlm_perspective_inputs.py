"""Checkpoint 2 provider eligibility and frozen TRIDENT conditioning."""

import copy
import os
import tempfile
import unittest
from contextlib import closing
from pathlib import Path

import torch

from arlm_dataset_contract import build_inference, frame, setup_ledger
from arlm_address_evidence import FIELDS, address_contract, public_address
from arlm_inference import validate_inference
from arlm_interpretation import interpret
from arlm_interpretation_adapter import load_adapter, preview
from model_registry import ModelRegistry


class PerspectiveInputs(unittest.TestCase):
    def test_live_frame_and_provider(self):
        torch.set_num_threads(1)
        with tempfile.TemporaryDirectory() as directory:
            store, encounter, evidence = setup_ledger(Path(directory))
            with closing(store.db), store.transaction():
                river = interpret(store, encounter, evidence, frame())
                finance = interpret(store, encounter, evidence, {
                    **frame("finance"), "fromRevision": river["revision"],
                })
                fixed = build_inference(store, encounter, evidence, frame(), stable_namespace="smoke")
                request = {**frame("finance"), "transformation": [river["revision"], finance["revision"]],
                           "addressMode": "private-comparable"}
                raw = {}
                changed = build_inference(store, encounter, evidence, request, stable_namespace="smoke",
                                          address_audit=raw)
                equivalent = copy.deepcopy(request)
                equivalent["frame"]["temporalReference"] = "2026-01-01T07:00:00-05:00"
                canonical = build_inference(store, encounter, evidence, equivalent, stable_namespace="smoke")
                self.assertEqual(changed, canonical)
        self.assertEqual(fixed["candidates"], changed["candidates"])
        trace = changed["conditioning"]["transformation"]
        self.assertEqual(trace["changedFields"], ["context"])
        self.assertEqual(len(trace["invariantFields"]), 5)
        self.assertEqual(list(trace["suppressedProportions"].values()), [1 / 3])
        bundle = changed["conditioning"]
        record = next(iter(bundle["addresses"].values()))[0]
        self.assertEqual(set(record["fields"]), set(FIELDS))
        self.assertEqual(set(public_address(record["fields"])), set(FIELDS[:7]))
        self.assertIsNone(record["fields"]["arc"])
        self.assertTrue(all(record["fields"][field] is None for field in FIELDS[7:]))
        self.assertEqual(next(iter(raw.values()))[0]["fields"]["degree"], 1)
        leaked = copy.deepcopy(changed)
        leaked["conditioning"]["addresses"] = raw
        with self.assertRaisesRegex(ValueError, "Private address"):
            validate_inference(leaked)
        projections = address_contract(changed["candidates"], bundle["addresses"], bundle["mappings"],
                                       bundle["addressMode"])
        self.assertEqual({len(values) for values in projections.values()}, {7})
        absent = copy.deepcopy(bundle["addresses"])
        for row in changed["candidates"][0]["evidence"]:
            absent[row["ref"]][0]["fields"]["gate"] = None
        masked = address_contract(changed["candidates"], absent, bundle["mappings"], bundle["addressMode"])
        self.assertTrue(all("gate" not in {row["field"] for row in rows} for rows in masked.values()))
        altered = copy.deepcopy(bundle["mappings"])
        provider = next(iter(altered))
        altered[provider]["mappingSha256"] = "0" * 64
        with self.assertRaisesRegex(ValueError, "fingerprint"):
            address_contract(changed["candidates"], bundle["addresses"], altered, bundle["addressMode"])
        disputed = copy.deepcopy(bundle["addresses"])
        key = changed["candidates"][0]["evidence"][0]["ref"]
        disputed[key][0]["fields"]["gate"] = 64
        conflict = address_contract(changed["candidates"], disputed, bundle["mappings"], bundle["addressMode"])
        self.assertTrue(all("gate" not in {row["field"] for row in rows} for rows in conflict.values()))

        secondary = copy.deepcopy(bundle["addresses"])
        alternative = {**bundle["mappings"], "alternate": {
            "mappingSha256": "1" * 64, "fields": ["gate"],
        }}
        for ref, entries in secondary.items():
            current = entries[0]
            entries.append({**current, "provider": "alternate", "mappingSha256": "1" * 64,
                            "fields": {**current["fields"], "gate": 64}})
        disagreement = address_contract(changed["candidates"], secondary, alternative, bundle["addressMode"])
        self.assertTrue(all("gate" not in {row["field"] for row in rows} for rows in disagreement.values()))
        self.assertEqual(len(secondary[key]), 2)

        foundry = os.environ["POP_STAGE3_FOUNDRY"]
        with ModelRegistry(foundry).locked() as state:
            revision = state["active"]["revision"]
        adapter = load_adapter(foundry, revision)
        before = {key: tensor.clone() for key, tensor in adapter.model.state_dict().items()}
        observed = []
        hook = adapter.model.heads["research"].rag_gate.register_forward_pre_hook(
            lambda _, args: observed.append(args[1].detach().clone())
        )
        try:
            preview(adapter, fixed)
            conditioned = preview(adapter, changed)
            ablated = copy.deepcopy(changed)
            ablated["conditioning"]["transformation"] = None
            preview(adapter, ablated)
            with torch.inference_mode():
                adapter(changed, include_perspective=False)
        finally:
            hook.remove()
        self.assertEqual([tensor.shape[1] for tensor in observed], [12, 12, 20, 20, 19, 19, 17, 17])
        self.assertFalse(torch.equal(observed[0][:, 0], observed[2][:, 0]))
        self.assertTrue(all(torch.equal(value, adapter.model.state_dict()[key]) for key, value in before.items()))
        self.assertEqual(conditioned, preview(adapter, canonical))
        self.assertEqual(conditioned["decision"], "unresolved")
        print("Original research fusion consumed typed frame, transformation and uniform address chunks.")


if __name__ == "__main__":
    unittest.main()
