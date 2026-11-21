"""Exercise real POP routing, Docker execution, verification and AutoMind state."""

import json
import os
import subprocess
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from conductor import POPInterpreter, create_agent, node_call
from conductor_state import restore_development, restore_trajectory, snapshot, write_checkpoint
from automind.agent import Action
from automind.trajectory import Node, Trajectory
from automind.utils.metric import MetricValue, WorstMetricValue

COORDINATES = {
    "micro": {"gate": 41, "line": 4, "color": 2, "tone": 5, "base": 3},
    "macro": {"planet": 0, "dimension": 0, "zodiac": 0, "house": 0},
    "emergent": {"degree": 1, "minute": 0, "second": 0, "arcSecond": 0},
}
SOLUTION = """import csv, json, os
from pathlib import Path
assert "OPENAI_API_KEY" not in os.environ
data = json.loads(Path("input/coordinates.json").read_text())
gate = data["micro"]["gate"] + 1
with open("submission/submission.csv", "w") as output:
    csv.writer(output).writerows([["id", "gate"], ["address", gate]])
print("gate_accuracy=1.0")
"""


def reopen(path):
    checkpoint = json.loads(path.read_text())
    trajectory = restore_trajectory(checkpoint)
    agent = create_agent(path.parent, "test-model", trajectory, 3, None)
    restore_development(agent, checkpoint)
    return agent


def verify_restored(path):
    agent = reopen(path)
    parent, child = agent.traj.nodes
    assert agent.current_step == 2
    assert child.parent is parent and child.improve_parent is parent
    assert child in parent.children
    assert agent.traj.get_best_node() is child
    assert agent._retrieved_tricks == [{"invalid": True}]


def main():
    if len(sys.argv) > 1:
        verify_restored(Path(sys.argv[1]))
        return
    os.environ.setdefault("OPENAI_API_KEY", "component-test-credential-sentinel")
    with TemporaryDirectory() as directory:
        path = Path(directory)
        (path / "submission").mkdir()
        reference = node_call("cli.mjs", "resolve-address", str(path / "pop.json"),
                              json.dumps(COORDINATES))
        attempts = []
        interpreter = POPInterpreter(path, COORDINATES, reference, attempts, inject_failure=True)
        agent = create_agent(path, "test-model", Trajectory(), 3, interpreter)
        assert agent.coder.interpreter is interpreter
        assert agent.search_policy() == (None, Action.DRAFT)
        failure = interpreter.run(SOLUTION)
        assert failure.exc_type == "RuntimeError" and attempts[-1]["controlledFailure"]
        wrong = interpreter.run(SOLUTION.replace('["address", gate]', '["address", 1]'))
        assert wrong.exc_type == "SubmissionVerificationError"
        assert not (path / "submission" / "submission.csv").exists()
        failed_node = Node(plan="Resolve address", code=SOLUTION, metric=WorstMetricValue(), is_buggy=True)
        failed_node.absorb_exec_result(failure)
        agent.traj.append(failed_node)
        agent.current_step = 1
        assert agent.search_policy() == (failed_node, Action.DEBUG)
        checkpoint = path / "checkpoint.json"
        write_checkpoint(checkpoint, snapshot(agent))
        resumed = reopen(checkpoint)
        assert resumed.start_time == agent.start_time
        assert resumed.search_policy() == (resumed.traj.nodes[0], Action.DEBUG)

        good = interpreter.run(SOLUTION)
        assert good.exc_type is None
        assert attempts[-1]["receipt"]["gate"] == 42
        assert len({attempt["id"] for attempt in attempts}) == 3
        assert attempts[0]["codeSha256"] != attempts[0]["candidateSha256"]
        parent = agent.traj.nodes[0]
        child = Node(plan="Resolve address after correction", code=SOLUTION, parent=parent,
                     improve_parent=parent, metric=MetricValue(1, maximize=True), is_buggy=False)
        child.absorb_exec_result(good)
        agent.traj.append(child)
        agent.current_step = 2
        agent._retrieved_tricks = [{"invalid": True}]
        write_checkpoint(checkpoint, snapshot(agent))
        subprocess.run([sys.executable, __file__, str(checkpoint)], check=True)
    print("Real worker failure, artifact rejection, verified submission, and original tree restart passed.")


if __name__ == "__main__":
    main()
