"""Exercise the real CPU donor through POP's public CLI in fresh processes."""

import json
import os
import subprocess
import sys
import tempfile
import unittest
from contextlib import nullcontext
from pathlib import Path

CLI = Path(__file__).resolve().parents[1] / "src" / "model_maker.py"


class ModelMakerContract(unittest.TestCase):
    def test_training_activation_and_restart(self):
        evidence = os.environ.get("POP_FOUNDRY_EVIDENCE_DIR")
        if evidence:
            Path(evidence).mkdir(mode=0o700, parents=True, exist_ok=True)
        workspace_context = (
            nullcontext(tempfile.mkdtemp(prefix="contract-", dir=evidence))
            if evidence else tempfile.TemporaryDirectory()
        )
        with workspace_context as temporary:
            root = Path(temporary)
            workspace = root / "foundry"
            design = root / "design.json"
            design.write_text(json.dumps({
                "theme": "abstract", "role": "code specialist", "direction": "learn fixture responses",
                "heads": ["code", "math"], "hardware": {"memoryMiB": 2048, "maxTrainingSteps": 32},
            }))
            corpus = root / "train.jsonl"
            holdout = root / "holdout.jsonl"
            for path, prompts in ((corpus, ["Reply to alpha.", "Reply to beta."]),
                                  (holdout, ["Reply to gamma.", "Reply to delta."])):
                path.write_text("".join(json.dumps({
                    "prompt": prompt, "response": "OK", "head": "code",
                }) + "\n" for prompt in prompts))

            def call(*args, rejects=None):
                result = subprocess.run([sys.executable, str(CLI), str(workspace), *map(str, args)],
                                        capture_output=True, text=True, timeout=120)
                if rejects:
                    self.assertNotEqual(result.returncode, 0)
                    self.assertIn(rejects, result.stderr)
                    return
                self.assertEqual(result.returncode, 0, result.stderr)
                return json.loads(result.stdout)

            initial = call("init", design)
            self.assertEqual(initial["specification"]["architecture"], "portable")
            call("train", corpus, holdout, "--head", "code", "--steps", 16,
                 rejects="Explicit corpus approval")
            call("train", corpus, corpus, "--head", "code", "--steps", 16,
                 "--approved", rejects="distinct prompts")
            revisions = []
            for _ in range(2):
                record = call("train", corpus, holdout, "--head", "code", "--steps", 16, "--approved")
                self.assertEqual(record["qualifiedHeads"], ["code"], record)
                evidence = record["training"]
                self.assertLess(evidence["heldout_after"]["teacher_forced_loss"],
                                evidence["heldout_before"]["teacher_forced_loss"])
                self.assertGreater(record["generation"]["bytes"], 0)
                revisions.append(record)

            first, second = revisions
            self.assertEqual(second["training"]["parent"], first["revision"])
            self.assertNotEqual(first["digests"]["weights.pt"], second["digests"]["weights.pt"])
            call("activate", first["revision"], "math", rejects="no qualification")
            call("activate", first["revision"], "code")
            generated = call("generate", "Reply to gamma.", "--seed", 42)
            self.assertTrue(generated["ready"])
            self.assertGreater(generated["bytes"], 0)
            self.assertEqual(generated, call("generate", "Reply to gamma.", "--seed", 42))
            call("activate", second["revision"], "code")
            call("rollback")
            self.assertEqual(call("status")["active"], {"revision": first["revision"], "head": "code"})
            self.assertEqual(call("status")["modelId"], initial["modelId"])
            config = workspace / "training" / first["revision"] / "config.json"
            original = config.read_bytes()
            try:
                config.write_text("{}")
                call("generate", "Reply to gamma.", rejects="digest mismatch")
            finally:
                config.write_bytes(original)
            if evidence:
                print("Evidence workspace:", workspace)
            print("Held-out losses:", [(r["training"]["heldout_before"]["teacher_forced_loss"],
                                        r["training"]["heldout_after"]["teacher_forced_loss"])
                                       for r in revisions])
            print("First head generation:", repr(generated["text"]))


if __name__ == "__main__":
    unittest.main()
