"""Prepare reproducible ARLM datasets from verified ledger evidence."""

import json
from graphlib import TopologicalSorter
from pathlib import Path

from arlm_evaluation import CONDITIONS, coverage, partition_families
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
                      "encounterRevision evidenceRevision frame parents")
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
    split_fields = protocol["split"]["groupBy"] + ["condition"]
    split_rows = [{name: row[name] for name in split_fields} for row in inventory["cases"].values()]
    # Feed additional ancestry links through the existing connected split algorithm.
    for key, case in cases.items():
        row = inventory["cases"][key]
        links = [("sourceLineage", source["lineage"]) for source in source_labels[key]]
        links += [("sourceLineage", "digest:" + digest) for digest in case["sourceDigests"]]
        links += [("templateFamily", "derived:" + parent) for parent in [key, *case["parents"]]]
        for name, value in links:
            split_rows.append({**{field: row[field] for field in split_fields}, name: value})
    assignments = partition_families(split_rows, protocol["split"]["salt"])
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
    report = coverage(cases, assignments, protocol)
    return {"schemaVersion": 1, "preregistrationSha256": sha(protocol_bytes),
            "inventorySha256": sha(encode(inventory)), "labelHistorySha256": sha(encode(labels)),
            "assignments": assignments, "audit": audit, "coverage": report,
            "preparedForReview": audit["passed"] and report["coverageMet"],
            "inference": {key: case["inference"] for key, case in cases.items()},
            "privateAddressEvidence": address_evidence,
            "trainingTargets": targets if audit["passed"] else {}}
