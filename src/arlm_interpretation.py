"""Index typed evidence and publish deterministic contextual interpretations."""

import json
import subprocess
from contextlib import closing, contextmanager
from pathlib import Path
from tempfile import TemporaryDirectory

from arlm_contact import FIELDS, ROOT, SemanticGraph
from arlm_perspective import normalize, observe, provider, transform
from arlm_state import encode, sha
from arlm_trident_context import evaluate, implementation


@contextmanager
def graph_copy(store, reference):
    with TemporaryDirectory() as temporary:
        path = Path(temporary) / "graph.sqlite"
        path.write_bytes(store.read(reference))
        graph = SemanticGraph(path)
        with closing(graph.connection):
            yield graph, path


def active_basis(store, encounter_id):
    current = store.active()
    if current is None:
        raise ValueError("Initialize ARLM first")
    store.validate(current)
    lineage = {entry["revision"] for entry in store.lineage()}
    encounter = store.revision(encounter_id)
    event = encounter["event"]
    if encounter_id not in lineage or event["type"] != "encounter" or not event["verification"]["passed"]:
        raise ValueError("An active-lineage verified encounter is required")
    return current, lineage, event


def replay(store, key):
    existing = store.by_key(key)
    if existing is not None:
        store.validate(existing)
    return existing


def text(value):
    if not isinstance(value, str) or not value.strip():
        raise ValueError("Typed evidence requires nonempty text fields")
    return value.strip()


def index_evidence(store, encounter_id, assertions):
    key = "evidence:" + sha(encode([1, encounter_id, assertions]))
    if existing := replay(store, key):
        return existing
    current, _, encounter = active_basis(store, encounter_id)
    if not isinstance(assertions, list) or not 1 <= len(assertions) <= 32:
        raise ValueError("An evidence revision requires 1–32 assertions")
    learning = encounter["outcome"]["learning"]
    lexical = dict(zip(learning["tokens"], learning["node_ids"], strict=True))
    refs = dict(current["manifest"]["components"])
    evidence = {}
    with graph_copy(store, refs["G"]) as (graph, path):
        for assertion in assertions:
            expression = text(assertion["constituent"]).casefold()
            concept = text(assertion["concept"])
            context = text(assertion["context"])
            source = text(assertion["source"])
            source_version = text(assertion["sourceRevision"])
            if assertion["relation"] != "denotes" or expression not in lexical:
                raise ValueError("Evidence must denote a concept from a donor-observed constituent")
            if concept != concept.casefold():
                raise ValueError("Concept identity must be in canonical lowercase")
            address = assertion["position"]
            if not isinstance(address["coordinates"], dict):
                raise ValueError("Address requires provider coordinates")
            text(address["provider"])
            normalized = {
                "constituent": expression, "context": context, "concept": concept, "relation": "denotes",
                "source": source, "sourceRevision": source_version, "position": address,
            }
            digest = sha(encode(normalized))
            if digest in evidence:
                raise ValueError("Duplicate evidence assertion")
            origin = f"{source}#{source_version}"
            assertion_node = graph.upsert_node(digest, kind="arlm-evidence")
            concept_node = graph.upsert_node(concept, kind="arlm-concept")
            context_node = graph.upsert_node(sha(encode(context)), kind="arlm-context")
            edges = [
                graph.observe_edge(lexical[expression], "has-evidence", assertion_node.node_id, source_ref=origin),
                graph.observe_edge(assertion_node.node_id, "denotes", concept_node.node_id, source_ref=origin),
                graph.observe_edge(assertion_node.node_id, "in-context", context_node.node_id, source_ref=origin),
            ]
            evidence[digest] = {
                **normalized, "node": assertion_node.node_id, "edges": [edge.edge_id for edge in edges],
                "origin": origin,
            }
        refs["G"] = store.artifact(path.read_bytes(), "biverse-semantic-graph")
    return store.publish(current["revision"], refs, key, {
        "type": "arlm-evidence", "schema": 1, "encounterRevision": encounter_id, "assertions": evidence,
    })


def candidates(graph, learning, evidence, context):
    by_node = {record["node"]: (digest, record) for digest, record in evidence.items()}
    found = {}
    checked = set()
    for constituent, node in zip(learning["tokens"], learning["node_ids"], strict=True):
        for link in graph.neighbors(node, relation="has-evidence"):
            if link.target_id not in by_node:
                continue
            digest, record = by_node[link.target_id]
            concept_link, = graph.neighbors(link.target_id, relation="denotes")
            context_link, = graph.neighbors(link.target_id, relation="in-context")
            concept_node = graph.get_node(concept_link.target_id)
            context_node = graph.get_node(context_link.target_id)
            edges = (link, concept_link, context_link)
            if (graph.get_node(link.target_id).kind != "arlm-evidence"
                    or graph.get_node(link.target_id).label != digest
                    or constituent != record["constituent"]
                    or concept_node.kind != "arlm-concept" or concept_node.label != record["concept"]
                    or context_node.kind != "arlm-context" or context_node.label != sha(encode(record["context"]))
                    or [edge.edge_id for edge in edges] != record["edges"]
                    or any(record["origin"] not in edge.provenance for edge in edges)):
                raise ValueError("Typed evidence graph and provenance mismatch")
            checked.add(digest)
            if context is None or record["context"] == context:
                found[digest] = record
    if checked != set(evidence):
        raise ValueError("Typed evidence graph is missing source links")
    return [dict(found[digest], evidenceId=digest) for digest in sorted(found)]


def resolve_address(position):
    command = ["node", str(ROOT / "src/arlm_address.mjs")]
    completed = subprocess.run(command, input=encode(position), capture_output=True, timeout=30)
    if completed.returncode:
        raise ValueError(f"POP address resolver failed: {completed.stderr.decode().strip()}")
    result = json.loads(completed.stdout)
    if (set(result["address"]) != set(FIELDS)
            or result["receipt"]["consumer"] != "canonical-address-verifier"
            or result["mapping"]["provider"] != position["provider"]):
        raise ValueError("Unverified or incompatible POP address")
    return result


def interpret(store, encounter_id, evidence_id, request):
    frame = normalize(request)
    previous_id = request.get("fromRevision")
    key = "interpretation:" + sha(encode([1, encounter_id, evidence_id, frame, previous_id, provider()]))
    if existing := replay(store, key):
        return existing
    current, lineage, encounter = active_basis(store, encounter_id)
    evidence = store.revision(evidence_id)
    event = evidence["event"]
    if evidence_id not in lineage or event["type"] != "arlm-evidence" or event["encounterRevision"] != encounter_id:
        raise ValueError("An active-lineage evidence revision for this encounter is required")
    store.validate(evidence)
    refs = dict(current["manifest"]["components"])
    graph_ref = evidence["manifest"]["components"]["G"]
    learning = encounter["outcome"]["learning"]
    with graph_copy(store, graph_ref) as (graph, _):
        matches = candidates(graph, learning, event["assertions"], frame["frame"]["context"])
    concepts = sorted({record["concept"] for record in matches})
    positions = {encode(record["position"]) for record in matches}
    status = "resolved" if len(concepts) == len(positions) == 1 else "ambiguous" if matches else "unresolved"
    address = resolve_address(matches[0]["position"]) if status == "resolved" else None
    perspective = observe(frame)
    transformation = None
    if previous_id is not None:
        previous = store.revision(previous_id)
        if (previous_id not in lineage or previous["event"]["type"] != "arlm-interpretation"
                or previous["event"]["encounterRevision"] != encounter_id):
            raise ValueError("Transformation requires a prior interpretation of this encounter")
        store.validate(previous)
        original = json.loads(store.read(previous["manifest"]["components"]["P"]))
        transformation = {
            **transform(original, perspective), "fromRevision": previous_id,
            "retainedEncounterRevision": encounter_id,
            "evidenceChanged": previous["event"]["evidenceRevision"] != evidence_id,
        }
    refs["P"] = store.artifact(perspective, "pop-perspective-state")
    address_ref = None
    if address is not None:
        refs["A"] = address_ref = store.artifact(address, "pop-address-state")
    expression = encounter["encounter"]["expression"]
    relations = [
        {"subject": record["constituent"], "relation": record["relation"], "object": record["concept"],
         "verified": False, "evidenceId": record["evidenceId"]}
        for record in matches
    ]
    artifact = {
        "schema": 1, "expression": expression, "encounterRevision": encounter_id,
        "evidenceRevision": evidence_id, "graph": graph_ref, "perspective": refs["P"],
        "address": address_ref, "transformation": transformation,
        "status": status, "relations": relations, "evidence": matches,
        "encoder": implementation(),
    }
    artifact_ref = store.artifact(artifact, "arlm-trident-input")
    computation = store.artifact(evaluate(store, refs["Θ"], artifact), "arlm-trident-computation")
    return store.publish(current["revision"], refs, key, {
        "type": "arlm-interpretation", "schema": 1, "encounterRevision": encounter_id,
        "encounterId": encounter["encounter"]["id"], "expression": expression,
        "constituents": learning["tokens"], "source": encounter["encounter"]["source"],
        "evidenceRevision": evidence_id, "perspectiveId": perspective["id"],
        "concept": concepts[0] if status == "resolved" else None, "candidates": concepts,
        "status": status, "semanticAddress": address_ref, "transformation": transformation,
    }, attachments={"tridentInput": artifact_ref, "tridentComputation": computation})
