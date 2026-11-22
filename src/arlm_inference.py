"""Outcome-blind ARLM inference artifacts from the Stage 1/2 ledger."""

import re
from math import isclose
from uuid import uuid4

from arlm_contact import DIMENSIONS
from arlm_interpretation import active_basis, candidates, graph_copy
from arlm_perspective import FRAME_FIELDS, normalize, observe
from arlm_state import encode, sha

BUDGET = 4
POLICY = "all-source-linked-constituents-v1"


def fields(value, expected):
    if not isinstance(value, dict) or set(value) != set(expected.split()):
        raise ValueError(f"Expected exactly these artifact fields: {expected}")


def strings(*values):
    if any(not isinstance(value, str) or not value.strip() or len(value) > 2000 for value in values):
        raise ValueError("Expected nonempty artifact strings within bounds")


def digest(value):
    return isinstance(value, str) and re.fullmatch(r"[0-9a-f]{64}", value) is not None


def evidence_content(row):
    """Transport references and provenance stay outside model features."""
    return {key: row[key] for key in ("constituent", "relation", "context")}


def validate_inference(artifact):
    fields(artifact, "schemaVersion expression perspective observations candidates provenance retrieval")
    if type(artifact["schemaVersion"]) is not int or artifact["schemaVersion"] != 1:
        raise ValueError("Unsupported inference schema")
    strings(artifact["expression"])
    frame = artifact["perspective"]
    fields(frame, " ".join(FRAME_FIELDS))
    strings(*frame.values())
    normal = normalize({"frame": frame, "expressions": {"what": "observation"}})["frame"]
    if normal != frame:
        raise ValueError("Inference frame must use canonical values")
    observation = artifact["observations"]
    fields(observation, "proportions clarity")
    proportions = observation["proportions"]
    fields(proportions, " ".join(DIMENSIONS))
    if (any(type(x) not in (int, float) or not 0 <= x <= 1 for x in proportions.values())
            or not isclose(sum(proportions.values()), 1.0)
            or (observation["clarity"] is not None and (
                observation["clarity"] not in DIMENSIONS or not proportions[observation["clarity"]]))):
        raise ValueError("Invalid five-dimensional observation")
    provenance = artifact["provenance"]
    fields(provenance, "encounterRevision evidenceRevision graphSha256 perspectiveSourceSha256 ontologySha256")
    if (any(type(provenance[key]) is not int or provenance[key] < 1
            for key in ("encounterRevision", "evidenceRevision"))
            or not all(digest(provenance[key]) for key in
                       ("graphSha256", "perspectiveSourceSha256", "ontologySha256"))):
        raise ValueError("Invalid inference provenance")
    retrieval = artifact["retrieval"]
    fields(retrieval, "policy perCandidateBudget addresses")
    if retrieval != {"policy": POLICY, "perCandidateBudget": BUDGET, "addresses": "omitted-for-all"}:
        raise ValueError("Unsupported retrieval policy")
    rows = artifact["candidates"]
    if not isinstance(rows, list) or len(rows) > 32:
        raise ValueError("Invalid candidate collection")
    candidate_ids, evidence_refs, concepts = set(), set(), set()
    for candidate in rows:
        fields(candidate, "id concept evidence")
        cid, concept, evidence = candidate["id"], candidate["concept"], candidate["evidence"]
        strings(cid, concept)
        if re.fullmatch(r"candidate-[0-9a-f]{32}", cid) is None or cid in candidate_ids or concept in concepts:
            raise ValueError("Candidate identifiers and concepts must be distinct")
        candidate_ids.add(cid)
        concepts.add(concept)
        if not isinstance(evidence, list) or not 1 <= len(evidence) <= 32:
            raise ValueError("Invalid candidate evidence")
        for row in evidence:
            fields(row, "ref constituent relation context source sourceRevision")
            strings(*row.values())
            if not digest(row["ref"]) or row["ref"] in evidence_refs or row["relation"] != "denotes":
                raise ValueError("Invalid typed evidence reference")
            evidence_refs.add(row["ref"])
    if len(evidence_refs) > 32:
        raise ValueError("Evidence exceeds the ledger revision limit")


def inference_digest(artifact):
    return sha(encode(artifact))


def build_inference(store, encounter_id, evidence_id, request):
    _, lineage, encounter = active_basis(store, encounter_id)
    revision = store.revision(evidence_id)
    event = revision["event"]
    if evidence_id not in lineage or event["type"] != "arlm-evidence" or event["encounterRevision"] != encounter_id:
        raise ValueError("An active-lineage evidence revision for this encounter is required")
    store.validate(revision)
    graph_ref = revision["manifest"]["components"]["G"]
    with graph_copy(store, graph_ref) as (graph, _):
        rows = candidates(graph, encounter["outcome"]["learning"], event["assertions"], None)
    grouped = {}
    for row in rows:
        grouped.setdefault(row["concept"], []).append({
            "ref": row["evidenceId"],
            **{key: row[key] for key in ("constituent", "relation", "context", "source", "sourceRevision")},
        })
    perspective = observe(normalize(request))
    artifact = {
        "schemaVersion": 1, "expression": encounter["encounter"]["expression"],
        "perspective": perspective["frame"],
        "observations": {"proportions": perspective["observed"]["proportions"], "clarity": perspective["clarify"]},
        "candidates": [{"id": f"candidate-{uuid4().hex}", "concept": concept, "evidence": grouped[concept]}
                       for concept in sorted(grouped)],
        "provenance": {"encounterRevision": encounter_id, "evidenceRevision": evidence_id,
                       "graphSha256": graph_ref["sha256"],
                       "perspectiveSourceSha256": perspective["implementation"]["sourceSha256"],
                       "ontologySha256": perspective["implementation"]["ontologySha256"]},
        "retrieval": {"policy": POLICY, "perCandidateBudget": BUDGET, "addresses": "omitted-for-all"},
    }
    validate_inference(artifact)
    return artifact
