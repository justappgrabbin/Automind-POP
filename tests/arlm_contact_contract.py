"""Real POP state, TRIDENT lineage, donor contact, and restart acceptance."""

import hashlib
import json
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class ContactContract(unittest.TestCase):
    def test_contact_publication_rollback_and_export(self):
        with tempfile.TemporaryDirectory() as temporary:
            tmp = Path(temporary)

            def run(*args, rejects=None, raw=False):
                result = subprocess.run(list(map(str, args)), cwd=ROOT, text=True,
                                        capture_output=True, timeout=120)
                if rejects:
                    self.assertNotEqual(result.returncode, 0)
                    self.assertIn(rejects, result.stderr)
                    return
                self.assertEqual(result.returncode, 0, result.stderr)
                return result if raw else json.loads(result.stdout)

            pop = tmp / "pop.json"
            coordinates = {
                "micro": {"gate": 41, "line": 4, "color": 2, "tone": 5, "base": 3},
                "macro": {"planet": 0, "dimension": 0, "zodiac": 0, "house": 0},
                "emergent": {"degree": 1, "minute": 0, "second": 0, "arcSecond": 0},
            }
            address = run("node", "src/cli.mjs", "resolve-address", pop, json.dumps(coordinates))
            perspective = run("node", "src/cli.mjs", "locate-perspective", pop,
                              '{"expressions":{"Where":"I move"}}')
            foundry = (sys.executable, "src/model_maker.py", tmp / "foundry")
            design, corpus, holdout = (tmp / name for name in ("design.json", "train.jsonl", "holdout.jsonl"))
            design.write_text(json.dumps({
                "theme": "abstract", "role": "contact researcher", "direction": "lexical fixture",
                "heads": ["research"], "hardware": {"memoryMiB": 2048, "maxTrainingSteps": 32},
            }))
            corpus.write_text('{"prompt":"Reply to alpha.","response":"OK","head":"research"}\n')
            holdout.write_text('{"prompt":"Reply to gamma.","response":"OK","head":"research"}\n')
            run(*foundry, "init", design)
            training = run(*foundry, "train", corpus, holdout, "--head", "research", "--steps", 16, "--approved")
            run(*foundry, "activate", training["revision"], "research")

            ledger = tmp / "arlm.sqlite"
            cli = (sys.executable, "src/arlm_cli.py", ledger)
            initial = run(*cli, "init", tmp / "foundry", pop)
            self.assertEqual(set(initial["manifest"]["components"]), set("ΘGAPHOK"))
            request = {
                "id": "contact-1", "expression": "Observe movement", "source": "source:fixture",
                "participants": ["person:a", "agent:b"], "context": {"private": "context-secret"},
                "modality": "language", "observedAt": "2026-01-01T12:00:00Z",
                "evaluation": {"verifier": "independent-fixture", "expectedTokens": ["observe", "movement"]},
            }
            path = tmp / "request.json"

            def contact(value, **kwargs):
                path.write_text(json.dumps(value))
                return run(*cli, "record", path, **kwargs)

            def export():
                return run(*cli, "export", raw=True)

            contact({**request, "evaluation": {
                **request["evaluation"], "verifier": "person:a",
            }}, rejects="Independent evaluator")
            first = contact(request)
            self.assertTrue(first["event"]["verification"]["passed"])
            self.assertEqual(first["event"]["encounter"], request)
            self.assertEqual(first["event"]["references"]["address"], address["id"])
            self.assertEqual(first["event"]["references"]["perspective"], perspective["id"])
            self.assertEqual(first["event"]["outcome"]["probe"]["dimension"], "Movement")
            self.assertEqual(first["event"]["outcome"]["learning"]["learned_edges"][0]["observations"], 1)
            self.assertEqual(first, contact(request))
            self.assertEqual(first, run(*cli, "show"))
            contact({**request, "expression": "Different"}, rejects="already bound")
            self.assertEqual(export().stdout, "")

            public = run(*cli, "show", first["revision"], "--public")
            self.assertEqual(set(public), {"id", "modality", "address", "verified"})
            self.assertEqual(set(public["address"]), set("planetary dimension gate line color tone base".split()))
            self.assertNotIn("context-secret", json.dumps(public))

            rejected = contact({**request, "id": "bad", "evaluation": {
                **request["evaluation"], "expectedTokens": ["wrong"],
            }})
            self.assertFalse(rejected["event"]["verification"]["passed"])
            self.assertEqual(rejected["manifest"]["components"]["G"], first["manifest"]["components"]["G"])
            run(*cli, "approve", "bad", "operator", rejects="Only a verified")
            no_tokens = contact({**request, "id": "no-tokens", "expression": "…"})
            self.assertFalse(no_tokens["event"]["verification"]["passed"])
            self.assertIn("lexical item", no_tokens["event"]["outcome"]["error"])
            approval = run(*cli, "approve", "contact-1", "operator")
            self.assertEqual(approval, run(*cli, "approve", "contact-1", "operator"))
            output = export()
            row = json.loads(output.stdout)
            self.assertEqual(row["head"], "research")
            self.assertEqual(row["provenance"]["encounterRevision"], first["revision"])
            self.assertEqual(row["provenance"]["approvalRevision"], approval["revision"])
            self.assertIn(hashlib.sha256(output.stdout.encode()).hexdigest(), output.stderr)

            corrected = contact({**request, "id": "contact-2", "supersedes": "contact-1",
                                 "expression": "Observe space",
                                 "evaluation": {**request["evaluation"], "expectedTokens": ["observe", "space"]}})
            self.assertTrue(corrected["event"]["verification"]["passed"])
            self.assertEqual(export().stdout, "")
            run(*cli, "approve", "contact-2", "operator")
            corrected_export = export().stdout
            self.assertEqual(json.loads(corrected_export)["provenance"]["encounter"], "contact-2")
            run(*cli, "rollback", approval["revision"])
            self.assertEqual(run(*cli, "show"), approval)
            self.assertEqual(export().stdout, "")
            history = run(*cli, "history")
            self.assertEqual(len(history["revisions"]), 7)
            self.assertEqual(history["activations"][-1]["revision"], approval["revision"])
            self.assertIn(corrected, history["revisions"])
            self.assertIn(rejected, history["revisions"])

            # A real publication failure cannot leave a new donor graph or event visible.
            with sqlite3.connect(ledger) as db:
                before = db.execute("SELECT COUNT(*) FROM artifacts").fetchone()
                db.execute("""CREATE TRIGGER fail_publication BEFORE INSERT ON activation
                              BEGIN SELECT RAISE(ABORT, 'controlled publication failure'); END""")
            fresh = {**request, "id": "after-failure", "expression": "Observe movement again",
                     "evaluation": {**request["evaluation"],
                                    "expectedTokens": ["observe", "movement", "again"]}}
            contact(fresh, rejects="controlled publication failure")
            self.assertEqual(run(*cli, "history"), history)
            self.assertEqual(run(*cli, "show"), approval)
            with sqlite3.connect(ledger) as db:
                self.assertEqual(db.execute("SELECT COUNT(*) FROM artifacts").fetchone(), before)
                db.execute("DROP TRIGGER fail_publication")
            retry = contact(fresh)
            self.assertTrue(retry["event"]["verification"]["passed"])
            self.assertEqual(retry["event"]["outcome"]["learning"]["learned_edges"][0]["observations"], 2)
            run(*cli, "rollback", approval["revision"])

            # Simulate an incompatible reference and verify failed publication cannot change activation.
            with sqlite3.connect(ledger) as db:
                ref = corrected["manifest"]["components"]["G"]["sha256"]
                db.execute("UPDATE artifacts SET content=? WHERE digest=?", (b"corrupt", ref))
            run(*cli, "rollback", corrected["revision"], rejects="digest mismatch")
            self.assertEqual(run(*cli, "show"), approval)

            # The exact exported bytes pass the original Foundry JSONL input contract.
            exported = tmp / "exported.jsonl"
            exported.write_text(corrected_export)
            next_revision = run(*foundry, "train", exported, holdout, "--head", "research", "--steps", 1, "--approved")
            self.assertEqual(next_revision["corpusSha256"], hashlib.sha256(exported.read_bytes()).hexdigest())
            pinned_config = tmp / "foundry" / "training" / training["revision"] / "config.json"
            original_config = pinned_config.read_bytes()
            try:
                pinned_config.write_text("{}")
                run(*cli, "show", rejects="Checkpoint digest mismatch")
            finally:
                pinned_config.write_bytes(original_config)
            self.assertEqual(run(*cli, "show"), approval)
            print("Real Biverse contact, verified export and TRIDENT lineage passed.")


if __name__ == "__main__":
    unittest.main()
