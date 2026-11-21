"""Validate model output and, when configured, exercise real GGUF inference."""

import base64
import json
import os
import resource
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from conductor import consume_submission, query_backend
from conductor_state import verify_model_identity
from automind.backend import query
from automind.backend.utils import FuncSpec
from local_model import LocalModel, structured_output

SCHEMA = {
    "type": "object",
    "properties": {"answer": {"type": "integer", "enum": [0, 42]}},
    "required": ["answer"],
    "additionalProperties": False,
}


class LocalContract(unittest.TestCase):
    def test_original_schema_is_enforced(self):
        self.assertEqual(structured_output('{"answer":42}', SCHEMA), {"answer": 42})
        for invalid in ('{"answer": "42"}', '{"answer": 42, "answer": 0}',
                        '{"answer": NaN}', '{"answer":42, "extra":true}', '{"answer":'):
            with self.subTest(output=invalid), self.assertRaises(ValueError):
                structured_output(invalid, SCHEMA)

    def test_zero_based_candidate_gets_specific_feedback(self):
        candidate = base64.b64encode(b"id,gate\naddress,41\n").decode()
        with self.assertRaisesRegex(ValueError, "zero-based gate"):
            consume_submission(candidate, 42)

    def test_model_identity_and_legacy_checkpoint(self):
        legacy = {"version": 1, "model": "external"}
        verify_model_identity(legacy, {"backend": "openai", "model": "external"})
        local = {"backend": "local", "model": "local", "sha256": "a" * 64, "context": 8192}
        verify_model_identity({"version": 2, "modelIdentity": local}, local)
        with self.assertRaisesRegex(ValueError, "identity"):
            verify_model_identity({"version": 2, "modelIdentity": local}, {**local, "context": 2048})

    @unittest.skipUnless(os.environ.get("POP_GGUF"), "set POP_GGUF for real inference")
    def test_real_local_text_and_structured_inference(self):
        model = LocalModel(
            os.environ["POP_MODEL"], os.environ["POP_GGUF"], os.environ["POP_GGUF_SHA256"],
            context=int(os.getenv("POP_MODEL_CONTEXT", "8192")),
            threads=int(os.getenv("POP_MODEL_THREADS", "3")),
        )
        token = query_backend.set(model.query)
        try:
            output = query("Reply briefly and accurately.", "What is 40 plus 2?",
                           model=model.identity["model"], temperature=0, max_tokens=80)
            result = query("Compute the answer.", "What is 40 plus 2?",
                           model=model.identity["model"], temperature=0, max_tokens=80,
                           func_spec=FuncSpec("arithmetic_result", SCHEMA, "Report the sum."))
            self.assertEqual(result, {"answer": 42})
            self.assertEqual(output.strip(), "42")
        finally:
            query_backend.reset(token)
            print(json.dumps({
                "model": model.identity,
                "calls": model.observations,
                "loadSeconds": model.load_seconds,
                "peakRssKiB": resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
            }))


if __name__ == "__main__":
    unittest.main()
