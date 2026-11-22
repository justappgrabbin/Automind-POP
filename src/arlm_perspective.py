"""Versioned six-field frames interpreted by the original Biverse engine."""

import math
from datetime import UTC, datetime
from pathlib import Path

from arlm_contact import DIMENSIONS
from arlm_state import encode, sha
from human_design import dimensional

FRAME_FIELDS = ("observer", "referenceFrame", "scale", "context", "knowledge", "temporalReference")


def normalize(request):
    frame = request["frame"]
    if set(frame) != set(FRAME_FIELDS) or any(
        not isinstance(frame[key], str) or not frame[key].strip() for key in FRAME_FIELDS
    ):
        raise ValueError("Perspective requires six nonempty frame fields")
    frame = {key: frame[key].strip() for key in FRAME_FIELDS}
    time = datetime.fromisoformat(frame["temporalReference"])
    if time.tzinfo is None:
        raise ValueError("Perspective temporalReference requires a timezone")
    frame["temporalReference"] = time.astimezone(UTC).isoformat()
    expressions = {}
    for raw, value in request["expressions"].items():
        key = raw.strip().casefold().rstrip("?")
        if (key not in dimensional.QUESTION_DIMENSIONS or key in expressions
                or not isinstance(value, str) or not value.strip()):
            raise ValueError("Invalid or duplicate perspective question")
        expressions[key] = value.strip()
    weights = {}
    for raw, value in request.get("weights", {}).items():
        key = raw.strip().casefold().rstrip("?")
        if key not in expressions or key in weights or type(value) not in (int, float) or not math.isfinite(value) or value <= 0:
            raise ValueError("Weights require a unique active question and a positive finite number")
        weights[key] = float(value)
    clarity = request.get("clarify")
    if not math.isfinite(sum(weights.values())):
        raise ValueError("Perspective weight total must be finite")
    if not expressions or (clarity is not None and clarity not in DIMENSIONS):
        raise ValueError("Perspective requires observations and a valid optional clarity dimension")
    return {
        "frame": frame, "expressions": dict(sorted(expressions.items())),
        "weights": {key: weights.get(key, 1.0) for key in sorted(expressions)}, "clarify": clarity,
    }


def provider():
    source = Path(dimensional.__file__)
    return {
        "id": "biverse:dimensional-perspective-engine",
        "sourceSha256": sha(source.read_bytes()),
        "ontologySha256": sha((source.parent / "assets/dimensions-v1.json").read_bytes()),
    }


def observe(request):
    engine = dimensional.PerspectiveEngine()
    observed = engine.locate(request["expressions"], request["weights"])
    clarified = engine.clarify(observed, request["clarify"]) if request["clarify"] else None
    implementation = provider()
    return {
        "schema": 1, "id": sha(encode([implementation, request])),
        "provider": implementation["id"], "implementation": implementation,
        **request, "observed": observed.to_dict(),
        "clarified": clarified.to_dict() if clarified else None,
        "informationLoss": {
            "suppressedProportions": {
                dimension: weight for dimension, weight in observed.proportions.items()
                if clarified and weight and not clarified.proportions[dimension]
            },
            "retainedOriginalObservation": True,
        },
    }


def transform(prior, current):
    changes = {}
    invariants = {}
    for key in FRAME_FIELDS:
        before, after = prior["frame"][key], current["frame"][key]
        if before != after:
            changes[key] = {"from": before, "to": after}
        else:
            invariants[key] = before
    return {
        "schema": 1, "operator": "reobserve-frame-v1", "from": prior["id"], "to": current["id"],
        "changes": changes, "invariants": invariants,
        "observationChanges": {
            key: {"from": prior[key], "to": current[key]}
            for key in ("expressions", "weights", "clarify") if prior[key] != current[key]
        },
        "informationLoss": current["informationLoss"],
    }


def transformation_input(store, previous_id, current_id, encounter_id, observed):
    """Read the verified Stage 2 path and project only frame facts."""
    import json

    previous, current = (store.revision(revision) for revision in (previous_id, current_id))
    for entry in (previous, current):
        store.validate(entry)
        event = entry["event"]
        if event["type"] != "arlm-interpretation" or event["encounterRevision"] != encounter_id:
            raise ValueError("Transformation must belong to the same verified encounter")
    saved = current["event"]["transformation"]
    if not saved or saved["fromRevision"] != previous_id:
        raise ValueError("Missing recorded perspective transformation")
    a, b = (json.loads(store.read(entry["manifest"]["components"]["P"]))
            for entry in (previous, current))
    recomputed = transform(a, b)
    if b["id"] != observed["id"] or any(saved[key] != value for key, value in recomputed.items()):
        raise ValueError("Perspective transformation trace mismatch")
    return {
        "operator": recomputed["operator"],
        "changedFields": sorted(recomputed["changes"]),
        "invariantFields": sorted(recomputed["invariants"]),
        "observationChanges": sorted(recomputed["observationChanges"]),
        "suppressedProportions": recomputed["informationLoss"]["suppressedProportions"],
    }
