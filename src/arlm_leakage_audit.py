"""Audit materialized predictor inputs and derivation lineage."""

import re
from collections import defaultdict
from difflib import SequenceMatcher
from itertools import combinations

from arlm_inference import validate_inference
from arlm_retrieval import retrieval_snapshot
from arlm_state import encode, sha


def audit_cases(cases, assignments, *, forbidden_sources=()):
    owners = defaultdict(set)
    expressions = {}
    issues = set()
    snapshots = {}
    for case_id, case in sorted(cases.items()):
        model_input = case["inference"]
        validate_inference(model_input)
        split = assignments[case["family"]]
        expression = " ".join(re.findall(r"\w+", model_input["expression"].casefold()))
        expressions[(expression, split)] = case_id
        for kind, refs in (
            ("expression", [expression]), ("source", case["sourceDigests"]),
            ("derived-parent", [case_id, *case["parents"]]),
            ("assertion", [row["ref"] for item in model_input["candidates"] for row in item["evidence"]]),
        ):
            for ref in refs:
                owners[kind, ref].add(split)
        if set(case["sourceDigests"]).intersection(forbidden_sources):
            issues.add(("evaluator-source-in-retrieval", case_id))
        snapshot = retrieval_snapshot(model_input)
        if case.get("snapshot", snapshot) != snapshot:
            issues.add(("altered-retrieval", case_id))
        snapshots[case_id] = sha(encode(snapshot))
    for (kind, key), splits in owners.items():
        if len(splits) > 1:
            issues.add((f"cross-split-{kind}", key))
    # This catches close text variants. Semantic paraphrases need intake review.
    for (left, a), (right, b) in combinations(sorted(expressions), 2):
        if a != b and left != right and min(len(left), len(right)) >= 16:
            if abs(len(left) - len(right)) < max(len(left), len(right)) * 0.24:
                if SequenceMatcher(None, left, right, autojunk=False).ratio() >= 0.88:
                    issues.add(("cross-split-near-duplicate", "|".join(sorted([
                        expressions[left, a], expressions[right, b],
                    ]))))
    return {"schemaVersion": 1, "passed": not issues,
            "issues": [{"kind": kind, "ref": ref} for kind, ref in sorted(issues)],
            "retrievalDigests": snapshots}
