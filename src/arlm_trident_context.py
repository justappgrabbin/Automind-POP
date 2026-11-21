"""Package relational conditioning and exercise the pinned TRIDENT checkpoint."""

import json
from struct import pack

from arlm_state import sha
from model_maker import DONOR, DONOR_COMMIT, donor_runtime
from model_registry import ModelRegistry


def implementation():
    return {"commit": DONOR_COMMIT, **{
        name: sha((DONOR / "source" / name).read_bytes())
        for name in ("semantic_language_maker.py", "model.py")
    }}


def evaluate(store, theta_ref, artifact):
    import torch

    donor_runtime()
    from source.semantic_language_maker import BOS, NeuralMaker, semantic_features

    torch.set_num_threads(1)
    theta = json.loads(store.read(theta_ref))
    registry = ModelRegistry(theta["registry"])
    with registry.locked() as state:
        checkpoint = registry.verified_checkpoint(state, theta["revision"], theta["head"])
        maker = NeuralMaker.load(checkpoint)
    model = maker.model.eval()
    features = semantic_features(artifact["expression"], relations=artifact["relations"])
    tokens = [BOS, *maker.codec.encode(artifact["expression"])]
    if len(tokens) > model.cfg.max_seq_len:
        raise ValueError("Expression exceeds the pinned TRIDENT context limit")
    ids = torch.tensor([tokens], dtype=torch.long)
    with torch.inference_mode():
        logits = model(ids, klein=features[None], head=theta["head"])[0, -1]
        baseline = model(ids, klein=semantic_features(artifact["expression"])[None], head=theta["head"])[0, -1]
    if not torch.isfinite(logits).all():
        raise ValueError("Nonfinite TRIDENT logits")
    return {
        "schema": 1, "kind": "neural-computation-only", "model": theta_ref,
        "head": theta["head"], "implementation": implementation(),
        "features": features.tolist(), "logitSha256": sha(pack(f"<{logits.numel()}f", *logits.tolist())),
        "maxAbsDeltaFromLexicalOnly": float((logits - baseline).abs().max()),
    }
