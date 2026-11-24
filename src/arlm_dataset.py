"""Prepare reproducible ARLM datasets from verified ledger evidence."""

import hashlib
import json
from graphlib import TopologicalSorter
from pathlib import Path

from arlm_evaluation import CONDITIONS, coverage
from arlm_inference import build_inference, fields, strings
from arlm_leakage_audit import audit_cases
from arlm_state import encode, sha
from arlm_training_data import approved_targets

PROTOCOL = Path(__file__).resolve().parents[1] / "tests/fixtures/arlm_stage3/preregistration.json"


def source_registry(sources):
    for name, entry in sources.items():
        strings(name, entry.get("author"), entry.get("lineage"))
        fields(entry, "author lineage content sha256 trainingPermitted")
        if (not isinstance(entry["content"], str) or sha(entry["content"].encode()) != entry["sha256"]
                or type(entry["trainingPermitted"]) is not bool):
            raise ValueError("Source content or permission validation failed")
    return sources


def build_dataset(store, inventory, labels):
    fields(inventory, "sources cases")
    sources = source_registry(inventory["sources"])
    cases, source_labels, primary, address_evidence = {}, {}, {}, {}
    for key, entry in sorted(inventory["cases"].items()):
        strings(key)
        fields(entry, "family expressionFamily sourceLineage templateFamily condition primaryCondition kind "
                      "encounterRevision evidenceRevision frame parents" + (" aliases" if "aliases" in entry else ""))
        strings(*(entry[name] for name in ("family", "expressionFamily", "sourceLineage", "templateFamily")))
        if (entry["condition"] not in CONDITIONS or entry["primaryCondition"] not in CONDITIONS
                or entry["kind"] not in ("independent", "smoke", "synthetic")
                or not isinstance(entry["parents"], list)):
            raise ValueError("Invalid dataset case classification")
        family = entry["family"]
        group = (entry["primaryCondition"], entry["kind"])
        if primary.setdefault(family, group) != group:
            raise ValueError("Case family has inconsistent primary condition or origin")
        strings(*entry["parents"])
        encounter, evidence = entry["encounterRevision"], entry["evidenceRevision"]
        address_evidence[key] = {}
        artifact = build_inference(store, encounter, evidence, entry["frame"], stable_namespace=key,
                                   address_audit=address_evidence[key])
        event = store.revision(encounter)["event"]["encounter"]
        names = {event["source"]}
        for candidate in artifact["candidates"]:
            names.update(row["source"] + "#" + row["sourceRevision"] for row in candidate["evidence"])
        linked = [sources[name] for name in sorted(names)]
        if not any(source["lineage"] == entry["sourceLineage"] for source in linked):
            raise ValueError("Case source lineage must be anchored to a source record")
        cases[key] = {
            "inference": artifact, "family": family, "condition": entry["condition"],
            "primaryCondition": group[0], "independent": group[1] == "independent",
            "pairVerified": False, "parents": sorted(set(entry["parents"])),
            "sourceAuthors": sorted({*event["participants"], *names, *(source["author"] for source in linked)}),
            "sourceDigests": sorted({source["sha256"] for source in linked}),
            "trainingPermitted": group[1] == "independent" and all(
                source["trainingPermitted"] for source in linked
            ),
        }
        source_labels[key] = linked
    if set(labels) - set(cases):
        raise ValueError("Unexpected evaluation case")
    for key, case in cases.items():
        if not set(case["parents"]) <= set(cases) - {key}:
            raise ValueError("Derived case must reference known parents")
        if case["independent"] and key not in labels:
            raise ValueError("Independent cases require verified labels")
    tuple(TopologicalSorter({key: case["parents"] for key, case in cases.items()}).static_order())
    protocol_bytes = PROTOCOL.read_bytes()
    protocol = json.loads(protocol_bytes)
    split_rows = []
    for key, case in cases.items():
        row = inventory["cases"][key]
        assertions = [item["ref"] for candidate in case["inference"]["candidates"]
                      for item in candidate["evidence"]]
        split_rows.append({
            "family": case["family"], "expressionFamily": row["expressionFamily"],
            "sourceLineage": [row["sourceLineage"], *(source["lineage"] for source in source_labels[key]),
                              *("digest:" + digest for digest in case["sourceDigests"])],
            "templateFamily": row["templateFamily"],
            "graphAncestry": assertions or ["no-assertions:" + key],
            "derivedParent": [key, *case["parents"]],
            "aliasFamily": row.get("aliases", [case["family"]]),
            "condition": case["condition"], "revision": key,
        })
    manifest = build_manifest(split_rows, protocol["split"]["salt"], bucket_digest=lambda value: sha(encode(value)))
    assignments = manifest["assignments"]
    # Compare independently labeled frames without ever adding the comparison
    # to an inference artifact.
    targets = {}
    for key, revisions in sorted(labels.items()):
        case = cases[key]
        for revision in revisions:
            verification = revision["evaluation"]["verification"]
            source = sources[verification["source"]]
            if source["sha256"] != verification["sourceSha256"] or source["author"] != verification["evaluator"]:
                raise ValueError("Independent verification source digest or evaluator mismatch")
        target = approved_targets(case, revisions, assignments[case["family"]])
        if comparison := revisions[-1].get("comparison"):
            peer = comparison["peer"]
            if peer == key or peer not in labels or cases[peer]["family"] != case["family"]:
                raise ValueError("Perspective comparison requires another labeled case in the same family")
            left, right = (labels[member][-1]["evaluation"] for member in (key, peer))
            same = (left["expectedDecision"], set(left["meanings"])) == (
                right["expectedDecision"], set(right["meanings"]),
            )
            if same != (comparison["relation"] == "equivalent"):
                raise ValueError("Perspective comparison conflicts with independent labels")
            case["pairVerified"] = case["inference"]["perspective"] != cases[peer]["inference"]["perspective"]
            if target and target["perspectiveTarget"] and (
                not labels[peer][-1]["approval"] or not cases[peer]["trainingPermitted"]
            ):
                target["perspectiveTarget"] = None
        if target is not None:
            targets[key] = target
    audit = audit_cases(cases, assignments, forbidden_sources={
        sources[revision["evaluation"]["verification"]["source"]]["sha256"]
        for revisions in labels.values() for revision in revisions
    })
    report = coverage(cases, assignments, protocol, components=manifest["components"])
    return {"schemaVersion": 1, "preregistrationSha256": sha(protocol_bytes),
            "inventorySha256": sha(encode(inventory)), "labelHistorySha256": sha(encode(labels)),
            "assignments": assignments, "partitionManifest": manifest, "audit": audit, "coverage": report,
            "preparedForReview": audit["passed"] and report["coverageMet"],
            "inference": {key: case["inference"] for key, case in cases.items()},
            "privateAddressEvidence": address_evidence,
            "trainingTargets": targets if audit["passed"] else {}}


LINK_FIELDS = ("family", "expressionFamily", "sourceLineage", "templateFamily",
               "graphAncestry", "derivedParent", "aliasFamily")
SPLITS = ("train", "validation", "test")


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def digest(value):
    return hashlib.sha256(canonical(value)).hexdigest()


def build_manifest(rows, salt, *, bucket_digest=digest):
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
        if not isinstance(family, str) or not family.strip() or family != family.strip():
            raise ValueError("Invalid case family")
        if family not in parents:
            parents[family] = family
        if (not isinstance(row["revision"], str) or not row["revision"].strip()
                or row["revision"] != row["revision"].strip()):
            raise ValueError("Missing source revision")
        if row["condition"] not in CONDITIONS:
            raise ValueError("Unknown preregistered condition; quarantine row")
        tokens = []
        for field in LINK_FIELDS[1:]:
            values = row[field] if isinstance(row[field], list) else [row[field]]
            if not values or any(not isinstance(v, str) or not v.strip() or v != v.strip() for v in values):
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
        bucket = int(bucket_digest([salt, sorted(members)]), 16) % 100
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
            "components": {family: root(family) for family in sorted(parents)},
            "independentFamilies": {split: sum(assignments[members[0]] == split for members in components.values())
                                    for split in SPLITS},
            "conditionRuns": {split: sum(assignments[row["family"]] == split for row in normalized)
                              for split in SPLITS},
            "manifestDigest": digest([normalized, assignments, partition_digests])}
