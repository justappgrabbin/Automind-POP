"""Validate and export approval-bound supervision without running an optimizer."""

from arlm_evaluation import validate_binding
from arlm_inference import fields, strings
from arlm_retrieval import retrieval_snapshot
from arlm_state import encode, sha


def revision_digest(previous, revision):
    label = revision["evaluation"]
    payload = [previous, label]
    if "comparison" in revision:
        payload.append(revision["comparison"])
    return sha(encode(payload))


def approved_targets(case, revisions, split):
    if not isinstance(revisions, list) or not revisions:
        raise ValueError("Evaluation revision history required")
    previous = None
    for revision in revisions:
        fields(revision, "supersedes evaluation approval" + (" comparison" if "comparison" in revision else ""))
        if "comparison" in revision:
            comparison = revision["comparison"]
            fields(comparison, "peer relation")
            strings(comparison["peer"])
            if comparison["relation"] not in ("equivalent", "changes-meaning"):
                raise ValueError("Unknown supervised perspective comparison")
        if revision["supersedes"] != previous:
            raise ValueError("Evaluation revisions must form an ordered correction lineage")
        label = revision["evaluation"]
        validate_binding(label, case["inference"])
        if label["caseFamily"] != case["family"]:
            raise ValueError("Evaluation family mismatch")
        verification = label["verification"]
        if verification["evaluator"] in case["sourceAuthors"]:
            raise ValueError("Evaluator must be independent of source participants")
        previous = revision_digest(previous, revision)
        approval = revision["approval"]
        if approval is not None:
            fields(approval, "purpose labelSha256 approver")
            strings(approval["approver"])
            if approval["purpose"] != "interpretation-training" or approval["labelSha256"] != previous:
                raise ValueError("Approval must bind the exact interpretation label revision")
    latest = revisions[-1]
    if split != "train" or latest["approval"] is None or not case["trainingPermitted"]:
        return None
    label = latest["evaluation"]
    admitted = {ref for group in retrieval_snapshot(case["inference"]).values() for ref in group[0]}
    citations = set(label["supportingRefs"])
    return {
        "inferenceSha256": label["inferenceSha256"], "labelRevisionSha256": previous,
        "approval": latest["approval"], "decision": label["expectedDecision"],
        "rankTargets": label["meanings"] or None, "citationTargets": sorted(citations & admitted),
        "unretrievedGoldRefs": sorted(citations - admitted), "perspectiveTarget": latest.get("comparison"),
    }
