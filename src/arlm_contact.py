"""Run original Biverse contact and retain an independently checked observation."""

import json
import sys
from datetime import UTC, datetime
from pathlib import Path
from tempfile import TemporaryDirectory

from arlm_state import CONTACT_SOURCE, encode, sha
from model_registry import ModelRegistry

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "vendor/biverse"))
from human_design.language_contact import Autoling, Diseminer, SemanticGraph

FIELDS = (
    "planetary", "dimension", "gate", "line", "color", "tone", "base",
    "degree", "minute", "second", "arc", "zodiac", "house",
)
DIMENSIONS = {"Movement", "Evolution", "Being", "Design", "Space"}
MODALITIES = {"language", "gesture", "sign", "body", "pointer"}


def now():
    return datetime.now(UTC).isoformat()


def initialize(store, foundry, pop_state):
    if store.active():
        raise ValueError("ARLM is already initialized")
    registry = ModelRegistry(foundry)
    with registry.locked() as model:
        active = model and model["active"]
        if not active:
            raise ValueError("Activate a qualified TRIDENT revision first")
        registry.verified_checkpoint(model, active["revision"], active["head"])
        theta = {
            **active, "modelId": model["modelId"], "registry": str(registry.root),
            "digests": model["revisions"][active["revision"]]["digests"],
        }
    pop_path = Path(pop_state).resolve(strict=True)
    surface = json.loads(pop_path.read_text())["automind-pop"]
    address = surface["address"]["latest"]
    perspective = surface["perspective"]["latest"]
    if (address["capability"] != "resolve_address" or set(address["address"]) != set(FIELDS)
            or address["receipt"]["consumer"] != "canonical-address-verifier"):
        raise ValueError("An existing verified POP address is required")
    if (perspective["provider"] != "biverse:dimensional-perspective-engine"
            or set(perspective["observed"]["proportions"]) != DIMENSIONS):
        raise ValueError("An existing Biverse perspective is required")
    with TemporaryDirectory() as temporary:
        path = Path(temporary) / "graph.sqlite"
        graph = SemanticGraph(path)
        graph.connection.close()
        graph_ref = store.artifact(path.read_bytes(), "biverse-semantic-graph")
    refs = {
        "Θ": store.artifact(theta, "trident-model-registry"),
        "G": graph_ref,
        "A": {**store.artifact(address, "pop-address-state"),
              "origin": str(pop_path), "locator": "automind-pop/address/latest"},
        "P": {**store.artifact(perspective, "pop-perspective-state"),
              "origin": str(pop_path), "locator": "automind-pop/perspective/latest"},
        "O": store.artifact({"operators": ["Diseminer.learn", "Autoling.suggest"],
                             "sourceSha256": sha(CONTACT_SOURCE.read_bytes())}, "biverse-contact-source"),
        "K": store.artifact({"addressReceipt": address["receipt"], "modelHead": active,
                             "contactQualification": "pending"}, "pop-receipts-and-model-registry"),
    }
    return store.publish(None, refs, "initialization", {"type": "initialization", "at": now()})


def record(store, request):
    key = request["id"]
    if not isinstance(key, str) or not key.strip() or len(key) > 128:
        raise ValueError("Encounter ID must be nonempty and at most 128 characters")
    event_key = f"encounter:{key}"
    request_digest = sha(encode(request))
    if existing := store.by_key(event_key):
        if existing["event"]["requestSha256"] != request_digest:
            raise ValueError("Encounter ID is already bound to different input")
        return existing
    current = store.active()
    if not current:
        raise ValueError("Initialize ARLM first")
    store.validate(current)
    expression, source = request["expression"], request["source"]
    participants, context = request["participants"], request["context"]
    modality, observed_at = request["modality"], request["observedAt"]
    evaluation = request["evaluation"]
    if (not isinstance(expression, str) or not expression.strip() or len(expression) > 2000
            or not isinstance(source, str) or not source.strip()
            or not isinstance(participants, list) or not participants
            or any(not isinstance(p, str) or not p.strip() for p in participants)
            or not isinstance(context, dict) or modality not in MODALITIES
            or datetime.fromisoformat(observed_at).tzinfo is None):
        raise ValueError("Invalid encounter expression, source, participants, context, modality or time")
    verifier = evaluation["verifier"]
    expected = evaluation["expectedTokens"]
    if (not isinstance(verifier, str) or not verifier.strip() or verifier in [source, *participants]
            or not isinstance(expected, list) or not expected
            or any(not isinstance(token, str) or not token for token in expected)):
        raise ValueError("Independent evaluator and expected tokens required")
    supersedes = request.get("supersedes")
    if supersedes is not None:
        prior = next((r for r in store.lineage()
                      if r["event"].get("encounter", {}).get("id") == supersedes), None)
        if not prior or not prior["event"]["verification"]["passed"]:
            raise ValueError("Correction must reference a verified encounter on the active lineage")
        if supersedes in superseded_ids(store):
            raise ValueError("Encounter already superseded")

    refs = dict(current["manifest"]["components"])
    address = json.loads(store.read(refs["A"]))
    perspective = json.loads(store.read(refs["P"]))
    observed = perspective["clarified"] or perspective["observed"]
    identity = {"basis": current["revision"], "address": address["id"], "perspective": perspective["id"]}
    expected_edges = [(left, "precedes", right) for left, right in zip(expected, expected[1:])]
    # Donor commits are isolated in a private copy until this ARLM transaction publishes.
    with TemporaryDirectory() as temporary:
        path = Path(temporary) / "graph.sqlite"
        path.write_bytes(store.read(refs["G"]))
        graph = SemanticGraph(path)
        try:
            probe = Autoling().suggest(proportions=observed["proportions"])
            try:
                result = Diseminer(graph).learn(expression, source_ref=f"{source}#{key}")
            except ValueError as error:
                passed = False
                outcome = {"learning": None, "probe": probe.to_dict(), "observedEdges": [],
                           "error": str(error)}
            else:
                edges = [(graph.get_node(edge.source_id).label, edge.relation,
                          graph.get_node(edge.target_id).label) for edge in result.learned_edges]
                passed = list(result.tokens) == expected and edges == expected_edges and all(
                    result.source_ref in graph.get_edge(edge.edge_id).provenance
                    for edge in result.learned_edges
                )
                outcome = {"learning": result.to_dict(), "probe": probe.to_dict(), "observedEdges": edges}
        finally:
            graph.connection.close()
        if passed:
            refs["G"] = store.artifact(path.read_bytes(), "biverse-semantic-graph")
    verification = {
        "verifier": verifier, "method": "declared-lexical-fixture-plus-graph-readback-v1",
        "expectedTokens": expected, "expectedEdges": expected_edges, "passed": passed,
    }
    if passed:
        caps = json.loads(store.read(refs["K"]))
        caps["contactQualification"] = {"scope": verification["method"], "encounter": key}
        refs["K"] = store.artifact(caps, "pop-receipts-and-model-registry")
    event = {
        "type": "encounter", "at": now(), "requestSha256": request_digest, "encounter": request,
        "references": identity, "representation": "textual-observation",
        "transformations": {"registry": refs["O"], "applied": ["Diseminer.learn", "Autoling.suggest"]},
        "outcome": outcome,
        "verification": verification,
        "publicAddress": {field: address["address"][field] for field in FIELDS[:7]},
    }
    return store.publish(current["revision"], refs, event_key, event)


def superseded_ids(store):
    return {r["event"]["encounter"].get("supersedes") for r in store.events()
            if r["event"]["type"] == "encounter" and r["event"]["verification"]["passed"]}


def approve(store, encounter_id, approver):
    current = store.active()
    lineage = store.lineage()
    encounter = next((r["event"] for r in lineage
                      if r["event"].get("encounter", {}).get("id") == encounter_id), None)
    if (not encounter or not encounter["verification"]["passed"]
            or encounter_id in superseded_ids(store) or not approver.strip()):
        raise ValueError("Only a verified, unsuperseded active encounter can be approved")
    if approval := next((r for r in lineage if r["event"].get("approvedEncounter") == encounter_id), None):
        if approval["event"]["approver"] != approver:
            raise ValueError("Encounter already approved by a different operator")
        return approval
    key = f"approval:{current['revision']}:{encounter_id}"
    if existing := store.by_key(key):
        if existing["event"]["approver"] != approver:
            raise ValueError("Approval is already bound to a different operator")
        return existing
    return store.publish(current["revision"], current["manifest"]["components"], key, {
        "type": "approval", "at": now(), "approvedEncounter": encounter_id, "approver": approver,
    })


def export_rows(store):
    current = store.active()
    if not current:
        raise ValueError("Initialize ARLM first")
    store.validate(current)
    lineage = store.lineage()
    approvals = {r["event"]["approvedEncounter"]: r for r in lineage if r["event"]["type"] == "approval"}
    superseded = superseded_ids(store)
    head = json.loads(store.read(current["manifest"]["components"]["Θ"]))["head"]
    for entry in lineage:
        event = entry["event"]
        if event["type"] != "encounter":
            continue
        encounter = event["encounter"]
        key = encounter["id"]
        if key not in approvals or key in superseded or not event["verification"]["passed"]:
            continue
        yield {
            "prompt": encounter["expression"],
            "response": json.dumps(event["outcome"]["observedEdges"], ensure_ascii=False),
            "head": head,
            "provenance": {
                "encounter": key, "encounterRevision": entry["revision"],
                "approvalRevision": approvals[key]["revision"],
                "requestSha256": event["requestSha256"],
                "references": event["references"], "transformations": event["transformations"],
                "verificationSha256": sha(encode(event["verification"])),
            },
        }


def public_view(revision):
    event = revision["event"]
    if event["type"] != "encounter":
        raise ValueError("Public view requires an encounter revision")
    return {"id": event["encounter"]["id"], "modality": event["encounter"]["modality"],
            "address": event["publicAddress"], "verified": event["verification"]["passed"]}
