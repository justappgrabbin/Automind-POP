"""Uncalibrated interpretation preview using frozen TRIDENT parameters."""

import argparse
import json
from pathlib import Path

import torch
from torch import nn

from arlm_inference import DIMENSIONS, evidence_content, validate_inference
from arlm_perspective import FRAME_FIELDS
from model_maker import donor_runtime
from model_registry import ModelRegistry
from arlm_retrieval import retrieve

DECISIONS = ("resolved", "ambiguous", "unresolved")


class InterpretationAdapter(nn.Module):
    def __init__(self, model, parent):
        super().__init__()
        self.model = model.requires_grad_(False).eval()
        self.parent = parent
        width, rag = model.cfg.d_model, model.cfg.rag_dim
        self.frame_projection = nn.Linear(width * len(FRAME_FIELDS), rag)
        self.observation_projection = nn.Linear(len(DIMENSIONS) * 2, rag)
        self.evidence_projection = nn.Linear(width * 4, rag)
        self.citation_score = nn.Bilinear(width, rag, 1)
        self.rank_score = nn.Linear(width + 2, 1)
        self.decision_score = nn.Linear(width * 2 + 1, len(DECISIONS))

    def train(self, mode=True):
        super().train(mode)
        self.model.eval()
        return self

    def forward(self, artifact):
        validate_inference(artifact)
        from source.semantic_language_maker import BOS, ByteCodec, semantic_features

        expression = artifact["expression"]
        tokens = [BOS, *ByteCodec().encode(expression)]
        weights = self.model.embed.weight
        if len(tokens) > self.model.cfg.max_seq_len:
            raise ValueError("Expression exceeds the pinned TRIDENT context limit")
        ids = torch.tensor([tokens], dtype=torch.long, device=weights.device)
        frame = artifact["perspective"]
        frame_chunk = self.frame_projection(torch.cat([
            self.model.word_embedding(frame[key]) for key in FRAME_FIELDS
        ]))
        observation = artifact["observations"]
        dimensions = sorted(DIMENSIONS)
        observation_chunk = self.observation_projection(weights.new_tensor(
            [observation["proportions"][key] for key in dimensions]
            + [float(key == observation["clarity"]) for key in dimensions]
        ))
        outcomes, representations = [], []
        for candidate in sorted(artifact["candidates"], key=lambda item: item["concept"]):
            admitted, dropped = retrieve(candidate)
            concept = candidate["concept"]
            relations = [{"subject": row["constituent"], "relation": row["relation"], "object": concept,
                          "verified": False} for row in admitted]
            evidence_chunks = [self.evidence_projection(torch.cat([
                self.model.word_embedding(value) for value in (*evidence_content(row).values(), concept)
            ])) for row in admitted]
            chunks = torch.stack([frame_chunk, observation_chunk, *evidence_chunks])[None]
            klein = semantic_features(expression, relations=relations)[None].to(weights)
            representation = self.model(ids, head="research", rag=chunks, klein=klein,
                                        return_representations=True)[0, -1]
            relation = torch.stack([
                torch.stack(self.model.relation_scores(edge["subject"], edge["relation"], concept))
                for edge in relations
            ]).mean(dim=0)
            scores = torch.stack([self.citation_score(representation, chunk).squeeze(0)
                                  for chunk in evidence_chunks])
            outcomes.append({
                "id": candidate["id"],
                "score": self.rank_score(torch.cat([representation, relation])).squeeze(0),
                "evidenceScores": [(row["ref"], score) for row, score in zip(admitted, scores, strict=True)],
                "droppedRefs": [row["ref"] for row in dropped],
            })
            representations.append(representation)
        if representations:
            stacked = torch.stack(representations)
            summary = torch.cat([stacked.mean(dim=0), stacked.amax(dim=0), weights.new_tensor([len(outcomes)])])
        else:
            summary = weights.new_zeros(self.model.cfg.d_model * 2 + 1)
        return outcomes, self.decision_score(summary)


def preview(adapter, artifact):
    with torch.inference_mode():
        outcomes, decision = adapter(artifact)
    if not torch.isfinite(decision).all() or any(
        not torch.isfinite(score) for item in outcomes
        for score in (item["score"], *(value for _, value in item["evidenceScores"]))
    ):
        raise ValueError("Nonfinite interpretation scores")
    ranking = []
    for item in sorted(outcomes, key=lambda item: -float(item["score"])):
        score = float(item["score"])
        tied = ranking and score == ranking[-1]["score"]
        refs = sorted(item["evidenceScores"], key=lambda pair: -float(pair[1]))
        ranking.append({
            "id": item["id"], "score": score, "rank": ranking[-1]["rank"] if tied else len(ranking) + 1,
            "evidenceRefs": [ref for ref, _ in refs], "droppedRefs": item["droppedRefs"],
        })
    proposed = "unresolved"
    maximum = decision.max()
    if ranking and int((decision == maximum).sum()) == 1:
        winner = DECISIONS[int(decision.argmax())]
        if winner != "ambiguous" or len(ranking) > 1:
            proposed = winner
    return {
        "schemaVersion": 1, "path": "frozen-trident-preview", "parent": adapter.parent,
        "rankedCandidates": ranking,
        "decisionScores": dict(zip(DECISIONS, decision.tolist(), strict=True)),
        "proposedDecision": proposed, "decision": "unresolved", "calibration": "unqualified",
    }


def load_adapter(foundry, revision):
    donor_runtime()
    from source.semantic_language_maker import NeuralMaker

    registry = ModelRegistry(foundry)
    with registry.locked() as state:
        if not state:
            raise ValueError("Foundry registry is empty")
        checkpoint = registry.verified_checkpoint(state, revision, None)
        model = NeuralMaker.load(checkpoint).model
        parent = {"modelId": state["modelId"], "revision": revision,
                  "digests": dict(state["revisions"][revision]["digests"])}
    if "research" not in model.heads:
        raise ValueError("Checkpoint lacks the TRIDENT research head")
    # Fixed preview initialization is reproducible and isolates the caller's RNG.
    with torch.random.fork_rng(devices=[]):
        torch.manual_seed(0)
        return InterpretationAdapter(model, parent).eval()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("foundry", type=Path)
    parser.add_argument("revision")
    parser.add_argument("inference", type=Path)
    args = parser.parse_args()
    try:
        data = json.loads(args.inference.read_text())
        validate_inference(data)
        torch.set_num_threads(1)
        print(json.dumps(preview(load_adapter(args.foundry, args.revision), data), allow_nan=False))
    except (OSError, TypeError, ValueError, KeyError, RuntimeError) as error:
        parser.exit(1, f"{error}\n")


if __name__ == "__main__":
    main()
