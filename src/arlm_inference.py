"""Outcome-blind ARLM inference artifacts from the Stage 1/2 ledger."""

import re
from math import isclose
from uuid import uuid4

from arlm_contact import DIMENSIONS
from arlm_interpretation import active_basis, candidates, graph_copy
from arlm_perspective import FRAME_FIELDS, normalize, observe, transformation_input
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
    base = "schemaVersion expression perspective observations candidates provenance retrieval"
    version = artifact.get("schemaVersion") if isinstance(artifact, dict) else None
    fields(artifact, base + (" conditioning" if version == 2 else ""))
    if type(version) is not int or version not in (1, 2):
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
    if version == 2:
        validate_conditioning(artifact)


def validate_conditioning(artifact):
    from arlm_address_evidence import PUBLIC_FIELDS, address_contract

    conditioning = artifact["conditioning"]
    fields(conditioning, "transformation addressMode addresses mappings")
    trace = conditioning["transformation"]
    if trace is not None:
        fields(trace, "operator changedFields invariantFields observationChanges suppressedProportions")
        if trace["operator"] != "reobserve-frame-v1":
            raise ValueError("Unsupported transformation")
        for key, allowed in (("changedFields", FRAME_FIELDS), ("invariantFields", FRAME_FIELDS),
                             ("observationChanges", ("expressions", "weights", "clarify"))):
            value = trace[key]
            if not isinstance(value, list) or any(item not in allowed for item in value) or value != sorted(set(value)):
                raise ValueError("Invalid transformation fields")
        if (set(trace["changedFields"]) & set(trace["invariantFields"])
                or set(trace["changedFields"] + trace["invariantFields"]) != set(FRAME_FIELDS)):
            raise ValueError("Invalid frame transformation partition")
        loss = trace["suppressedProportions"]
        if (not isinstance(loss, dict) or set(loss) - DIMENSIONS
                or any(type(value) not in (int, float) or not 0 < value <= 1 for value in loss.values())):
            raise ValueError("Invalid perspective information loss")
    for provider, policy in conditioning["mappings"].items():
        strings(provider)
        if not digest(policy.get("mappingSha256")):
            raise ValueError("Provider mapping digest required")
    address_contract(artifact["candidates"], conditioning["addresses"], conditioning["mappings"],
                     conditioning["addressMode"])
    if any(value is not None and field not in PUBLIC_FIELDS
           for records in conditioning["addresses"].values() for record in records
           for field, value in record["fields"].items()):
        raise ValueError("Private address fields cannot enter the v2 predictor artifact")



def inference_digest(artifact):
    return sha(encode(artifact))


def build_inference(store, encounter_id, evidence_id, request, *, stable_namespace=None, address_audit=None):
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
    version = request.get("schemaVersion", 1)
    artifact = {
        "schemaVersion": version, "expression": encounter["encounter"]["expression"],
        "perspective": perspective["frame"],
        "observations": {"proportions": perspective["observed"]["proportions"], "clarity": perspective["clarify"]},
        "candidates": [{"id": "candidate-" + (uuid4().hex if stable_namespace is None else sha(encode([stable_namespace, index]))[:32]), "concept": concept, "evidence": grouped[concept]}
                       for index, concept in enumerate(sorted(grouped))],
        "provenance": {"encounterRevision": encounter_id, "evidenceRevision": evidence_id,
                       "graphSha256": graph_ref["sha256"],
                       "perspectiveSourceSha256": perspective["implementation"]["sourceSha256"],
                       "ontologySha256": perspective["implementation"]["ontologySha256"]},
        "retrieval": {"policy": POLICY, "perCandidateBudget": BUDGET, "addresses": "omitted-for-all"},
    }
    if version == 2:
        from arlm_address_evidence import PUBLIC_FIELDS, resolve_records

        pair = request.get("transformation")
        trace = transformation_input(store, *pair, encounter_id, perspective) if pair is not None else None
        mode = request.get("addressMode", "omitted-for-all")
        records = {}
        mappings = {}
        if mode == "private-comparable":
            records = resolve_records([item for row in grouped.values() for item in row],
                                      {row["evidenceId"]: row["position"] for row in rows})
            if address_audit is not None:
                address_audit.update(records)
            records = {ref: [{**record, "fields": {
                field: value if field in PUBLIC_FIELDS else None for field, value in record["fields"].items()
            }} for record in entries] for ref, entries in records.items()}
            for address, in records.values():
                mappings[address["provider"]] = {"mappingSha256": address["mappingSha256"],
                                                 "fields": list(PUBLIC_FIELDS)}
        artifact["conditioning"] = {"transformation": trace, "addressMode": mode,
                                    "addresses": records, "mappings": mappings}
    validate_inference(artifact)
    return artifact
