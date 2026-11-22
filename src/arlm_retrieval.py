"""Bounded typed retrieval shared by the Stage 3 predictor."""

from arlm_inference import BUDGET, evidence_content
from arlm_state import encode


def retrieve(candidate):
    # Source provenance and stable references break ties between identical
    # semantic rows. They never enter a feature tensor.
    ordered = sorted(candidate["evidence"], key=lambda row: (
        encode(evidence_content(row)), row["source"], row["sourceRevision"], row["ref"],
    ))
    return ordered[:BUDGET], ordered[BUDGET:]
