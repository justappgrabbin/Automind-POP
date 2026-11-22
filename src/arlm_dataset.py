"""Checkpoint 2: deterministic lineage closure and outcome-blind partition manifests.

This module accepts metadata only. Evaluator targets and answer-bearing content
must be stored separately and bound to the inference digest by the evaluator.
"""
import hashlib
import json

LINK_FIELDS = ("family", "expressionFamily", "sourceLineage", "templateFamily",
               "graphAncestry", "derivedParent", "aliasFamily")
SPLITS = ("train", "validation", "test")


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def digest(value):
    return hashlib.sha256(canonical(value)).hexdigest()


def build_manifest(rows, salt):
    """Fail closed on unresolved ancestry and assign entire connected components.

    Every row must carry all lineage keys. Known aliases/revisions may be
    supplied as lists, and overlap transitively joins independent case families.
    """
    if not isinstance(salt, str) or not salt:
        raise ValueError("A nonempty frozen partition salt is required")
    if not isinstance(rows, list):
        raise TypeError("Dataset rows must be a list")
    parents = {}
    owners = {}
    normalized = []
    seen = set()

    def root(x):
        while parents[x] != x:
            parents[x] = parents[parents[x]]
            x = parents[x]
        return x

    for row in rows:
        if not isinstance(row, dict) or set(row) != set(LINK_FIELDS + ("condition", "revision")):
            raise ValueError("Incomplete lineage metadata; quarantine row")
        if any(key.lower().find(word) >= 0 for key in row for word in ("label", "answer", "target", "expected")):
            raise ValueError("Evaluation targets cannot enter predictor lineage")
        family = row["family"]
        if not isinstance(family, str) or not family.strip():
            raise ValueError("Invalid case family")
        if family not in parents:
            parents[family] = family
        if not isinstance(row["revision"], str) or not row["revision"].strip():
            raise ValueError("Missing source revision")
        if not isinstance(row["condition"], str) or not row["condition"].strip():
            raise ValueError("Missing condition")
        tokens = []
        for field in LINK_FIELDS[1:]:
            values = row[field] if isinstance(row[field], list) else [row[field]]
            if not values or any(not isinstance(v, str) or not v.strip() for v in values):
                raise ValueError("Unresolved lineage conflict; quarantine row")
            tokens.extend((field, v.strip()) for v in values)
        identity = (family, row["revision"], row["condition"])
        if identity in seen:
            raise ValueError("Duplicate source revision/condition")
        seen.add(identity)
        normalized.append({"family": family, "revision": row["revision"],
                           "condition": row["condition"], "tokens": sorted(set(tokens))})
        for token in tokens:
            prior = owners.setdefault(token, family)
            a, b = sorted((root(prior), root(family)))
            parents[b] = a

    components = {}
    for family in sorted(parents):
        components.setdefault(root(family), []).append(family)
    assignments = {}
    for members in components.values():
        bucket = int(digest([salt, sorted(members)]), 16) % 100
        split = SPLITS[0 if bucket < 60 else 1 if bucket < 80 else 2]
        assignments.update({family: split for family in members})
    normalized.sort(key=lambda row: (row["family"], row["revision"], row["condition"]))
    partition_digests = {
        split: digest([row for row in normalized if assignments[row["family"]] == split])
        for split in SPLITS
    }
    return {"schemaVersion": 1, "policy": "lineage-closure-v1", "saltDigest": digest(salt),
            "sourceDigest": digest(normalized), "partitions": partition_digests,
            "assignments": dict(sorted(assignments.items())),
            "independentFamilies": {split: sum(v == split for v in assignments.values())
                                    for split in SPLITS},
            "conditionRuns": {split: sum(assignments[row["family"]] == split for row in normalized)
                              for split in SPLITS},
            "manifestDigest": digest([normalized, assignments, partition_digests])}
