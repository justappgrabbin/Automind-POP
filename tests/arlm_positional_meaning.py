"""Section 14 Experiment 1 through real processes, stores, and providers."""

import json
import os
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = json.loads((ROOT / "tests/fixtures/arlm_positional_meaning.json").read_text())


class PositionalMeaning(unittest.TestCase):
    def test_contextual_interpretation_and_restore(self):
        with tempfile.TemporaryDirectory() as temporary:
            self.exercise(Path(temporary))

    def exercise(self, work):
        def run(*args, rejects=None, json_output=True):
            process = subprocess.run(list(map(str, args)), cwd=ROOT, capture_output=True,
                                     text=True, timeout=120)
            if rejects:
                self.assertNotEqual(process.returncode, 0)
                self.assertIn(rejects, process.stderr)
                return
            self.assertEqual(process.returncode, 0, process.stderr)
            return json.loads(process.stdout) if json_output else process.stdout

        def write(name, payload):
            path = work / name
            path.write_text(json.dumps(payload))
            return path

        pop, ledger = work / "pop.json", work / "arlm.sqlite"
        pop_cli = ("node", "src/cli.mjs")
        coordinates = FIXTURE["assertions"][0]["position"]["coordinates"]
        run(*pop_cli, "resolve-address", pop, json.dumps(coordinates))
        run(*pop_cli, "locate-perspective", pop, '{"expressions":{"Where":"I move"}}')
        foundry = work / "foundry"
        maker = (sys.executable, "src/model_maker.py", foundry)
        run(*maker, "init", write("design.json", {
            "theme": "abstract", "role": "contact researcher", "direction": "lexical fixture",
            "heads": ["research"], "hardware": {"memoryMiB": 2048, "maxTrainingSteps": 32},
        }))
        train, holdout = work / "train.jsonl", work / "holdout.jsonl"
        train.write_text('{"prompt":"Reply to alpha.","response":"OK","head":"research"}\n')
        holdout.write_text('{"prompt":"Reply to gamma.","response":"OK","head":"research"}\n')
        checkpoint = run(*maker, "train", train, holdout, "--head", "research", "--steps", 16, "--approved")
        run(*maker, "activate", checkpoint["revision"], "research")
        cli = (sys.executable, "src/arlm_cli.py", ledger)
        initial = run(*cli, "init", foundry, pop)
        encounter = run(*cli, "record", write("encounter.json", FIXTURE["encounter"]))
        self.assertTrue(encounter["event"]["verification"]["passed"])
        encounter_id = encounter["revision"]
        evidence_request = write("evidence.json", FIXTURE["assertions"])
        evidence = run(*cli, "index-evidence", encounter_id, evidence_request)
        self.assertEqual(evidence, run(*cli, "index-evidence", encounter_id, evidence_request))

        def request(scope, **extra):
            return {
                "frame": {"observer": "observer:field", "referenceFrame": "domain",
                          "scale": "term", "context": scope, "knowledge": "edition-1",
                          "temporalReference": "2026-01-01T12:00:00Z"},
                "expressions": {"Where": "local context", "What": "bank"},
                "weights": {"Where": 2, "What": 1}, "clarify": "Movement", **extra,
            }

        def interpret(scope, **extra):
            return run(*cli, "interpret", encounter_id, evidence["revision"],
                       write("frame.json", request(scope, **extra)))

        def artifacts(entry):
            return run(*cli, "interpretation-artifacts", entry["revision"])

        river = interpret("river")
        finance = interpret("finance", fromRevision=river["revision"])
        mixed = interpret("mixed")
        unknown = interpret("unknown")
        samples = {}
        for scope, result in zip(("river", "finance", "mixed", "unknown"),
                                 (river, finance, mixed, unknown), strict=True):
            event = result["event"]
            oracle = FIXTURE["oracle"][scope]
            self.assertEqual(event["expression"], "bank")
            self.assertEqual(event["status"], oracle["status"])
            self.assertEqual(event["concept"], oracle["concept"])
            self.assertEqual(event["source"], FIXTURE["encounter"]["source"])
            bundle = artifacts(result)
            self.assertEqual(bundle["tridentInput"]["evidenceRevision"], evidence["revision"])
            self.assertEqual(bundle["tridentInput"]["encounterRevision"], encounter_id)
            self.assertEqual(bundle["tridentComputation"]["kind"], "neural-computation-only")
            self.assertEqual(bundle["tridentComputation"]["head"], "research")
            self.assertEqual([len(channel) for channel in bundle["tridentComputation"]["features"]], [32] * 8)
            if "gate" in oracle:
                self.assertEqual(bundle["address"]["address"]["gate"], oracle["gate"])
                self.assertEqual(len(bundle["address"]["address"]), 13)
                self.assertEqual(bundle["address"]["receipt"]["consumer"], "canonical-address-verifier")
                self.assertEqual(bundle["address"]["mapping"]["provider"], FIXTURE["assertions"][0]["position"]["provider"])
                self.assertGreater(bundle["tridentComputation"]["maxAbsDeltaFromLexicalOnly"], 0)
                self.assertFalse(bundle["tridentInput"]["relations"][0]["verified"])
            else:
                self.assertNotIn("address", bundle)
                self.assertIsNone(event["semanticAddress"])
            samples[scope] = {"interpretation": event, **bundle}
        self.assertEqual(mixed["event"]["candidates"], ["financial-institution", "river-edge"])
        self.assertEqual(unknown["event"]["candidates"], [])
        self.assertNotEqual(samples["river"]["tridentComputation"]["logitSha256"],
                            samples["finance"]["tridentComputation"]["logitSha256"])

        trace = finance["event"]["transformation"]
        self.assertEqual(trace["changes"], {"context": {"from": "river", "to": "finance"}})
        self.assertEqual(set(trace["invariants"]), {"observer", "referenceFrame", "scale", "knowledge",
                                                   "temporalReference"})
        original = samples["finance"]["perspective"]["observed"]["proportions"]
        self.assertEqual(original["Movement"], 2 / 3)
        self.assertEqual(set(original), {"Movement", "Evolution", "Being", "Design", "Space"})
        self.assertEqual(list(trace["informationLoss"]["suppressedProportions"].values()), [1 / 3])
        self.assertTrue(trace["informationLoss"]["retainedOriginalObservation"])
        self.assertFalse(trace["evidenceChanged"])
        self.assertEqual(trace["observationChanges"], {})
        public = run(*cli, "show", encounter_id, "--public")
        self.assertEqual(set(public["address"]), set("planetary dimension gate line color tone base".split()))
        run(*cli, "show", finance["revision"], "--public", rejects="Public view requires an encounter")
        self.assertEqual(run(*cli, "export", json_output=False), "")

        history = run(*cli, "history")
        replay_request = request("river")
        replay_request["frame"]["temporalReference"] = "2026-01-01T07:00:00-05:00"
        self.assertEqual(river, run(*cli, "interpret", encounter_id, evidence["revision"],
                                    write("frame.json", replay_request)))
        self.assertEqual(history, run(*cli, "history"))
        run(*cli, "rollback", river["revision"])
        self.assertEqual(run(*cli, "show"), river)
        self.assertEqual(artifacts(river)["tridentInput"], samples["river"]["tridentInput"])
        self.assertEqual(run(*cli, "show", finance["revision"]), finance)
        # An explicit return transformation keeps both historical interpretations.
        run(*cli, "rollback", unknown["revision"])
        returned = interpret("river", fromRevision=finance["revision"])
        self.assertEqual(returned["event"]["concept"], river["event"]["concept"])
        self.assertEqual(artifacts(returned)["address"]["address"], samples["river"]["address"]["address"])
        self.assertEqual(returned["event"]["perspectiveId"], river["event"]["perspectiveId"])

        with sqlite3.connect(ledger) as db:
            db.execute("""CREATE TRIGGER fail_activation BEFORE INSERT ON activation
                          BEGIN SELECT RAISE(ABORT, 'controlled interpretation publication failure'); END""")
            count = db.execute("SELECT COUNT(*) FROM artifacts").fetchone()
        run(*cli, "interpret", encounter_id, evidence["revision"], write("frame.json", request("new")),
            rejects="controlled interpretation publication failure")
        self.assertEqual(run(*cli, "show"), returned)
        with sqlite3.connect(ledger) as db:
            self.assertEqual(db.execute("SELECT COUNT(*) FROM artifacts").fetchone(), count)
            db.execute("DROP TRIGGER fail_activation")
        run(*cli, "rollback", initial["revision"])
        with sqlite3.connect(ledger) as db:
            target = finance["manifest"]["attachments"]["tridentInput"]["sha256"]
            db.execute("UPDATE artifacts SET content=? WHERE digest=?", (b"corrupt", target))
        run(*cli, "rollback", finance["revision"], rejects="digest mismatch")
        run(*cli, "interpretation-artifacts", finance["revision"], rejects="digest mismatch")
        self.assertEqual(run(*cli, "show"), initial)
        self.assertIn(finance, run(*cli, "history")["revisions"])
        with sqlite3.connect(ledger) as db:
            changed = {**river["event"], "concept": "wrong-meaning"}
            db.execute("UPDATE revisions SET event=? WHERE id=?",
                       (json.dumps(changed), river["revision"]))
        run(*cli, "rollback", river["revision"], rejects="event digest")
        self.assertEqual(run(*cli, "show"), initial)

        print("Experiment 1: river and finance oracle passed, mixed ambiguous, unknown unresolved.")
        print("Verified fresh-process restoration, return transformation, digest rejection and atomic rollback.")
        print("TRIDENT: separately captured features and forward metrics",
              {scope: samples[scope]["tridentComputation"]["maxAbsDeltaFromLexicalOnly"]
               for scope in ("river", "finance")})
        if destination := os.environ.get("POP_ARLM_SAMPLE"):
            Path(destination).write_text(json.dumps(samples, indent=2) + "\n")


if __name__ == "__main__":
    unittest.main()
