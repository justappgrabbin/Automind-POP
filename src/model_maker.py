"""Construct, train, evaluate and activate a native TRIDENT model revision."""

import argparse
import json
import math
import sys
from importlib.metadata import version
from pathlib import Path
from tempfile import TemporaryDirectory
from uuid import uuid4

from model_registry import ModelRegistry, digest

DONOR = Path(__file__).resolve().parents[1] / "vendor" / "trident"
DONOR_COMMIT = "dd31be007da9829df74460a82331aecf8634a1df"
HEADS = {"code", "math", "research"}
DIMENSIONS = {"portable": (64, 2, 260), "original-shape": (128, 4, 4096)}


def construction_spec(design):
    if not isinstance(design, dict):
        raise ValueError("Design must be a JSON object")
    for field in ("theme", "role", "direction"):
        if not isinstance(design.get(field), str) or not design[field].strip():
            raise ValueError(f"Design requires nonempty {field}")
    heads = design.get("heads", [])
    if not isinstance(heads, list) or not heads or any(
        not isinstance(head, str) or head not in HEADS for head in heads
    ) or len(set(heads)) != len(heads):
        raise ValueError("Select distinct TRIDENT heads from code, math and research")
    budget = design.get("hardware", {})
    steps = budget.get("maxTrainingSteps") if isinstance(budget, dict) else None
    memory = budget.get("memoryMiB") if isinstance(budget, dict) else None
    if type(steps) is not int or not 1 <= steps <= 128 or type(memory) is not int or memory < 1024:
        raise ValueError("CPU design requires memoryMiB >= 1024 and 1–128 maxTrainingSteps")
    mode = "original-shape" if memory >= 4096 else "portable"
    width, layers, vocabulary = DIMENSIONS[mode]
    return {
        "version": 1, "design": design, "architecture": mode, "heads": heads,
        "dimensions": {"width": width, "layers": layers, "vocabulary": vocabulary},
        "objective": "held-out answer-token prediction", "runtime": "TRIDENT PyTorch CPU",
        "maxTrainingSteps": steps, "donorCommit": DONOR_COMMIT,
    }


def initialize(registry, design):
    spec = construction_spec(design)
    with registry.locked() as current:
        if current is not None:
            raise ValueError("Model already initialized in this workspace")
        state = {"version": 1, "modelId": str(uuid4()), "specification": spec,
                 "revisions": {}, "active": None, "activationHistory": []}
        registry.save(state)
        return state


def donor_runtime():
    sys.path.insert(0, str(DONOR))
    import training_core
    return training_core


def train(registry, corpus, holdout, head, steps, seed, approved):
    if not approved:
        raise ValueError("Explicit corpus approval is required")
    with registry.locked() as state:
        if state is None:
            raise ValueError("Initialize a model design first")
        spec = state["specification"]
        if head not in spec["heads"] or not 1 <= steps <= spec["maxTrainingSteps"]:
            raise ValueError("Head or training steps are outside the construction specification")
        runtime = donor_runtime()
        with TemporaryDirectory() as temporary:
            copies = []
            for source, name in ((corpus, "training.jsonl"), (holdout, "holdout.jsonl")):
                with Path(source).open("rb") as stream:
                    content = stream.read(5_000_001)
                if len(content) > 5_000_000:
                    raise ValueError("Corpus exceeds 5 MB")
                copy = Path(temporary) / name
                copy.write_bytes(content)
                copies.append(copy)
            rows, evaluation = (runtime._jsonl(path) for path in copies)
            if any(row.get("head", "research") != head for row in rows + evaluation):
                raise ValueError("Training and holdout records must use the selected head")
            if {row["prompt"].strip().casefold() for row in rows} & {
                row["prompt"].strip().casefold() for row in evaluation
            }:
                raise ValueError("Holdout must use distinct prompts")
            variant = next(label for label, mode in runtime.MODES.items() if mode == spec["architecture"])
            with runtime.GUARD:
                previous_root = runtime.ROOT
                try:
                    runtime.ROOT = registry.weights
                    # The donor advances its training pointer before this registry
                    # records evaluation. Recover from the last registered parent.
                    registry.weights.mkdir(mode=0o700, exist_ok=True)
                    parent = next(reversed(state["revisions"]), None)
                    pointer = registry.weights / "current.json"
                    if parent:
                        registry.verified_checkpoint(state, parent, None)
                        registry.save({"revision": parent}, path=pointer)
                    else:
                        pointer.unlink(missing_ok=True)
                    runtime.torch.manual_seed(seed)
                    evidence = runtime.train_uploaded(str(copies[0]), str(copies[1]), variant, steps, True)
                finally:
                    runtime.ROOT = previous_root

            revision = evidence["revision"]
            directory = registry.artifacts(revision)
            maker = runtime.NeuralMaker.load(directory)
            sample = maker.generate(evaluation[0]["prompt"], head=head, max_new_bytes=16, seed=seed)
            before, after = (evidence[key]["teacher_forced_loss"]
                             for key in ("heldout_before", "heldout_after"))
            qualified = (
                before is not None and after is not None and math.isfinite(before)
                and math.isfinite(after) and after < before and sample["ready"] and sample["bytes"] > 0
            )
            record = {
                "revision": revision, "architecture": spec["architecture"],
                "digests": {name: digest(directory / name) for name in ("config.json", "weights.pt")},
                "corpusSha256": digest(copies[0]), "holdoutSha256": digest(copies[1]),
                "seed": seed, "torch": version("torch"), "head": head,
                "qualificationScope": "held-out answer-token loss improvement and local head generation",
                "qualifiedHeads": [head] if qualified else [],
                "training": evidence, "generation": sample,
            }
        state["revisions"][revision] = record
        registry.save(state)
        return record


def activate(registry, revision=None, head=None, rollback=False):
    with registry.locked() as state:
        if state is None:
            raise ValueError("Initialize a model design first")
        if rollback:
            if len(state["activationHistory"]) < 2:
                raise ValueError("No previous active revision")
            previous = state["activationHistory"][-2]
            revision, head = previous["revision"], previous["head"]
        registry.verified_checkpoint(state, revision, head)
        target = {"revision": revision, "head": head}
        if target != state["active"]:
            state["active"] = target
            state["activationHistory"].append(target)
            registry.save(state)
        return target


def generate(registry, prompt, count, seed):
    if not prompt.strip() or len(prompt) > 2000:
        raise ValueError("Provide a nonempty prompt of at most 2000 characters")
    with registry.locked() as state:
        active = state and state["active"]
        if not active:
            raise ValueError("Activate a qualified revision first")
        directory = registry.verified_checkpoint(state, active["revision"], active["head"])
        maker = donor_runtime().NeuralMaker.load(directory)
        return {**active, "modelId": state["modelId"],
                **maker.generate(prompt, head=active["head"], max_new_bytes=count, seed=seed)}


def main():
    # External toolkits are additive; native registry commands are unchanged.
    if len(sys.argv) >= 3 and sys.argv[2] == "external":
        from external_model_maker import main as external_main
        sys.exit(external_main(sys.argv[3:]))
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("workspace", type=Path)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("init").add_argument("design", type=Path)
    trainer = commands.add_parser("train")
    trainer.add_argument("corpus", type=Path)
    trainer.add_argument("holdout", type=Path)
    trainer.add_argument("--head", required=True, choices=sorted(HEADS))
    trainer.add_argument("--steps", required=True, type=int)
    trainer.add_argument("--seed", type=int, default=42)
    trainer.add_argument("--approved", action="store_true")
    activation = commands.add_parser("activate")
    activation.add_argument("revision")
    activation.add_argument("head", choices=sorted(HEADS))
    commands.add_parser("rollback")
    commands.add_parser("status")
    generation = commands.add_parser("generate")
    generation.add_argument("prompt")
    generation.add_argument("--bytes", type=int, default=32)
    generation.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    registry = ModelRegistry(args.workspace)
    try:
        if args.command == "init":
            result = initialize(registry, json.loads(args.design.read_text()))
        elif args.command == "train":
            result = train(registry, args.corpus, args.holdout, args.head, args.steps, args.seed, args.approved)
        elif args.command == "activate":
            result = activate(registry, args.revision, args.head)
        elif args.command == "rollback":
            result = activate(registry, rollback=True)
        elif args.command == "generate":
            result = generate(registry, args.prompt, args.bytes, args.seed)
        else:
            with registry.locked() as state:
                result = state
        print(json.dumps(result, allow_nan=False))
    except (OSError, ValueError, RuntimeError) as error:
        parser.exit(1, f"{error}\n")


if __name__ == "__main__":
    main()
