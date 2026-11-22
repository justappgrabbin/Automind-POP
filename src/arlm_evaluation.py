"""Private evaluation schema and preregistered case-family splits."""

from arlm_inference import digest, fields, inference_digest, strings, validate_inference
from arlm_state import encode, sha


def validate_evaluation(artifact):
    fields(artifact, "schemaVersion inferenceSha256 caseFamily expectedDecision meanings supportingRefs verification")
    if type(artifact["schemaVersion"]) is not int or artifact["schemaVersion"] != 1 or not digest(artifact["inferenceSha256"]):
        raise ValueError("Invalid evaluation schema or input binding")
    strings(artifact["caseFamily"])
    verification = artifact["verification"]
    fields(verification, "evaluator method source sourceSha256")
    strings(verification["evaluator"], verification["method"], verification["source"])
    if not digest(verification["sourceSha256"]):
        raise ValueError("Verification evidence digest required")
    allowed = {"resolved": (1, 1), "ambiguous": (2, 32), "unresolved": (0, 0)}
    decision = artifact["expectedDecision"]
    if not isinstance(decision, str) or decision not in allowed:
        raise ValueError("Invalid evaluation decision")
    meanings, refs = artifact["meanings"], artifact["supportingRefs"]
    low, high = allowed[decision]
    if not isinstance(meanings, list) or not low <= len(meanings) <= high or not isinstance(refs, list):
        raise ValueError("Invalid evaluation meanings or references")
    strings(*meanings)
    if len(set(meanings)) != len(meanings) or any(not digest(ref) for ref in refs) or len(set(refs)) != len(refs):
        raise ValueError("Duplicate meaning or invalid evidence reference")


def validate_binding(labels, inference):
    """Evaluator-side validation of the exact input and supporting references."""
    validate_evaluation(labels)
    validate_inference(inference)
    if labels["inferenceSha256"] != inference_digest(inference):
        raise ValueError("Evaluation labels are bound to another inference artifact")
    support = {
        candidate["concept"]: {item["ref"] for item in candidate["evidence"]}
        for candidate in inference["candidates"]
    }
    eligible = [support.get(concept, set()) for concept in labels["meanings"]]
    cited = set(labels["supportingRefs"])
    if (not cited <= set().union(*eligible) or any(not cited & refs for refs in eligible)):
        raise ValueError("Evaluation support must cite each expected candidate in the input")


CONDITIONS = (
    "no-context", "correct-context", "swapped-context", "equivalent-frame",
    "ambiguous", "unresolved", "stale", "lossy",
)


def partition_families(rows, salt):
    """Assign connected families as a unit across expression, source and template."""
    strings(salt)
    parents = {}
    ownership = {}

    def root(key):
        while parents[key] != key:
            key = parents[key]
        return key

    for row in rows:
        fields(row, "family expressionFamily sourceLineage templateFamily condition")
        strings(*row.values())
        if row["condition"] not in CONDITIONS:
            raise ValueError("Unknown evaluation condition")
        family = row["family"]
        parents.setdefault(family, family)
        for key in ("expressionFamily", "sourceLineage", "templateFamily"):
            linked = ownership.setdefault((key, row[key]), family)
            left, right = sorted([root(family), root(linked)])
            parents[right] = left
    groups = {}
    for family in sorted(parents):
        groups.setdefault(root(family), []).append(family)
    assignment = {}
    for group in groups.values():
        bucket = int(sha(encode([salt, group])), 16) % 100
        split = "train" if bucket < 60 else "validation" if bucket < 80 else "test"
        assignment.update(dict.fromkeys(group, split))
    return assignment


def coverage(cases, assignments, protocol, *, components=None):
    primary = {}
    runs = {condition: 0 for condition in CONDITIONS}
    paired = set()
    for case in cases.values():
        if not case["independent"] or assignments[case["family"]] != "test":
            continue
        family = case["family"]
        component = components[family] if components is not None else family
        condition = case["primaryCondition"]
        if primary.setdefault(component, condition) != condition:
            raise ValueError("Connected evaluation family has conflicting primary conditions")
        runs[case["condition"]] += 1
        if case["pairVerified"]:
            paired.add(component)
    families = {condition: sum(value == condition for value in primary.values()) for condition in CONDITIONS}
    limits = protocol["counts"]
    shortfall = max(0, limits["minimumIndependentTestFamilies"] - len(primary))
    by_condition = {key: max(0, limits["minimumIndependentTestFamiliesPerPrimaryCondition"] - count)
                    for key, count in families.items()}
    return {"independentTestFamilies": len(primary), "familiesByPrimaryCondition": families,
            "conditionRuns": runs, "independentlyLabeledPairedFamilies": len(paired),
            "shortfall": shortfall, "shortfallByCondition": by_condition,
            "coverageMet": not shortfall and not any(by_condition.values()),
            "requiredSeeds": protocol["requiredSeeds"]}
