"""Atomic checkpoints for AutoMind's original developmental state."""

import json
import os
import random
from dataclasses import replace
from tempfile import NamedTemporaryFile

from automind.trajectory import Trajectory
from automind.utils.serialize import dumps_json, loads_json


def snapshot(agent):
    # The upstream serializer restores parent links. Save improvement links by
    # ID as well so they resolve to the same objects as the trajectory nodes.
    clean_nodes = [replace(node, parent=None, improve_parent=None, children=set())
                   for node in agent.traj.nodes]
    trajectory = json.loads(dumps_json(Trajectory(clean_nodes)))
    trajectory["node2parent"] = {node.id: node.parent.id for node in agent.traj.nodes if node.parent}
    return {
        "trajectory": trajectory,
        "improvement_parents": {
            node.id: node.improve_parent.id for node in agent.traj.nodes if node.improve_parent
        },
        "current_step": agent.current_step,
        "started_at": agent.start_time,
        "retrieved_papers": agent._retrieved_papers,
        "retrieved_tricks": agent._retrieved_tricks,
        "data_analysis": agent._data_analysis,
        "random_state": random.getstate(),
    }


def restore_trajectory(state):
    trajectory = loads_json(json.dumps(state["trajectory"]), Trajectory)
    nodes = {node.id: node for node in trajectory.nodes}
    for child, parent in state["improvement_parents"].items():
        nodes[child].improve_parent = nodes[parent]
    if len(trajectory) != state["current_step"]:
        raise ValueError("Checkpoint step count does not match its trajectory")
    return trajectory


def restore_development(agent, state):
    agent.current_step = state["current_step"]
    agent.start_time = state["started_at"]
    agent._retrieved_papers = state["retrieved_papers"]
    agent._retrieved_tricks = state["retrieved_tricks"]
    agent._data_analysis = state["data_analysis"]
    version, rng, cached = state["random_state"]
    random.setstate((version, tuple(rng), cached))


def verify_model_identity(checkpoint, identity):
    saved = checkpoint.get("modelIdentity")
    if saved is None and checkpoint.get("version") == 1 and identity["backend"] == "openai":
        # Version 1 checkpoints predate explicit backend selection.
        saved = {"backend": "openai", "model": checkpoint.get("model")}
    if saved != identity:
        raise ValueError("Checkpoint model identity or inference settings differ from this run")


def write_checkpoint(path, state):
    with NamedTemporaryFile(mode="w", dir=path.parent, delete=False, encoding="utf-8") as stream:
        pending = stream.name
        try:
            json.dump(state, stream, allow_nan=False)
            stream.flush()
            os.fsync(stream.fileno())
            os.replace(pending, path)
        finally:
            if os.path.exists(pending):
                os.unlink(pending)
