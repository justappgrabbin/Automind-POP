"""Run the original AutoMind Agent against POP's isolated execution capability."""

import argparse
import base64
import binascii
import csv
import fcntl
import hashlib
import io
import json
import logging
import os
import subprocess
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "vendor" / "automind"))

from automind.agent import Agent
from automind.interpreter import ExecutionResult
from automind.trajectory import Trajectory
from automind.utils.config import Config, _load_cfg, config_manager
from omegaconf import OmegaConf
from conductor_state import restore_development, restore_trajectory, snapshot, write_checkpoint

MISSION = """Read the zero-based YNIV coordinate object from input/coordinates.json.
Resolve the one-based gate by converting the micro gate to the contract convention.
Write submission/submission.csv with exactly the header id,gate and one data row
with id address and the resolved integer gate. Use Python's standard library and
relative paths. Print the validation metric gate_accuracy=1.0 only if your
implementation's independent assertions pass. There is no training or holdout
dataset for this exact arithmetic task. The POP spine verifies the actual CSV."""
DOCKER_ENV = ("PATH", "HOME", "DOCKER_HOST", "DOCKER_CONTEXT", "DOCKER_CONFIG", "XDG_RUNTIME_DIR")


def node_call(script, *args, payload=None):
    environment = {key: os.environ[key] for key in DOCKER_ENV if key in os.environ}
    result = subprocess.run(
        ["node", str(ROOT / "src" / script), *args],
        input=json.dumps(payload) if payload is not None else "",
        capture_output=True, text=True, timeout=45, env=environment, check=False,
    )
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or f"POP command exited {result.returncode}")
    return json.loads(result.stdout)


def consume_submission(encoded, gate):
    if encoded is None:
        raise ValueError("No regular submission/submission.csv was produced")
    try:
        content = base64.b64decode(encoded, validate=True)
        rows = list(csv.reader(io.StringIO(content.decode("utf-8"), newline=""), strict=True))
    except (UnicodeError, csv.Error, binascii.Error) as error:
        raise ValueError("Submission must be a UTF-8 CSV") from error
    if rows != [["id", "gate"], ["address", str(gate)]]:
        raise ValueError("Submission must have id,gate and one address row matching the resolved gate")
    return content


class POPInterpreter:
    def __init__(self, path, coordinates, reference, attempts, inject_failure=False):
        self.path = path
        self.coordinates = coordinates
        self.reference = reference
        self.attempts = attempts
        self.inject_failure = inject_failure
        self.infrastructure_error = None

    def run(self, code, reset_session=True):
        if not reset_session:
            raise ValueError("The isolated capability accepts independent one-shot candidates")
        if self.infrastructure_error is not None:
            raise self.infrastructure_error

        submission = self.path / "submission" / "submission.csv"
        submission.unlink(missing_ok=True)
        injected = self.inject_failure and not self.attempts
        executed_code = 'raise RuntimeError("POP controlled worker failure")' if injected else code
        try:
            observed = node_call("execute-candidate.mjs", payload={
                "code": executed_code, "coordinates": self.coordinates,
            })
        except (OSError, ValueError, RuntimeError, subprocess.TimeoutExpired) as error:
            self.infrastructure_error = error
            raise

        execution = ExecutionResult(**observed["execution"])
        attempt = {
            **observed["run"],
            "candidateSha256": hashlib.sha256(code.encode()).hexdigest(),
            "controlledFailure": injected,
            "exception": execution.exc_type,
            "receipt": None,
        }
        if execution.exc_type is None:
            try:
                content = consume_submission(observed["submission"], self.reference["address"]["gate"])
            except ValueError as error:
                execution.exc_type = "SubmissionVerificationError"
                execution.term_out.append(str(error))
                attempt["exception"] = execution.exc_type
            else:
                submission.write_bytes(content)
                attempt["receipt"] = {
                    "consumer": "pop-address-submission-verifier",
                    "referenceMissionId": self.reference["id"],
                    "sha256": hashlib.sha256(content).hexdigest(),
                    "gate": self.reference["address"]["gate"],
                }
        attempt["output"] = execution.term_out
        self.attempts.append(attempt)
        return execution


def create_agent(workspace, model, trajectory, steps, interpreter):
    cfg = _load_cfg(use_cli_args=False)
    cfg.workspace_dir = str(workspace)
    cfg.data_dir = str(workspace / "input")
    cfg.exp_name = "pop-address-mission"
    cfg.agent.steps = steps
    cfg.agent.analyzer.strategy = "none"
    cfg.agent.search.num_drafts = 1
    cfg.agent.search.debug_prob = 1
    cfg.agent.search.hpo_prob = 0
    for stage in ("planner", "coder", "improver", "verifier"):
        cfg.agent[stage].model = model
    cfg = OmegaConf.merge(OmegaConf.structured(Config), cfg)
    config_manager.cfg = cfg
    return Agent(task_desc={"Task goal": MISSION}, cfg=cfg, traj=trajectory,
                 interpreter=interpreter)


def run_steps(path, coordinates, model, steps, inject_failure):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path.with_suffix(path.suffix + ".lock"), "a", encoding="utf-8") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        with TemporaryDirectory(prefix="pop-conductor-") as work:
            workspace = Path(work)
            (workspace / "submission").mkdir()
            if path.exists():
                checkpoint = json.loads(path.read_text())
                if (checkpoint["version"] != 1 or checkpoint["coordinates"] != coordinates
                        or checkpoint["model"] != model):
                    raise ValueError("Checkpoint version, coordinates, or model differ from the mission")
                trajectory = restore_trajectory(checkpoint["development"])
            else:
                reference = node_call("cli.mjs", "resolve-address",
                                      str(workspace / "reference.json"), json.dumps(coordinates))
                checkpoint = {
                    "version": 1, "coordinates": coordinates, "model": model,
                    "reference": reference, "steps": [],
                }
                trajectory = Trajectory()

            attempts = []
            interpreter = POPInterpreter(workspace, coordinates, checkpoint["reference"], attempts,
                                         inject_failure and not checkpoint["steps"])
            agent = create_agent(workspace, model, trajectory, len(trajectory) + steps, interpreter)
            if checkpoint["steps"]:
                restore_development(agent, checkpoint["development"])

            for _ in range(steps):
                try:
                    node = agent.step()
                except Exception:
                    if interpreter.infrastructure_error is not None:
                        raise interpreter.infrastructure_error
                    raise
                if interpreter.infrastructure_error is not None:
                    raise interpreter.infrastructure_error
                final_run = attempts[-1] if attempts else None
                code_hash = hashlib.sha256(node.code.encode()).hexdigest()
                if not node.is_buggy and (
                    not final_run or not final_run["receipt"] or final_run["codeSha256"] != code_hash
                ):
                    raise RuntimeError("Original agent accepted a node without a matching verified POP execution")
                checkpoint["steps"].append({
                    "nodeId": node.id,
                    "parentId": node.parent.id if node.parent else None,
                    "stage": node.stage_name,
                    "plan": node.plan,
                    "buggy": node.is_buggy,
                    "attempts": list(attempts),
                    "verifiedReceipt": final_run["receipt"] if not node.is_buggy else None,
                    "verifiedSubmission": (
                        base64.b64encode((workspace / "submission" / "submission.csv").read_bytes()).decode()
                        if not node.is_buggy else None
                    ),
                })
                checkpoint["development"] = snapshot(agent)
                write_checkpoint(path, checkpoint)
                attempts.clear()
                interpreter.inject_failure = False
            return {"steps": checkpoint["steps"], "currentStep": agent.current_step}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("checkpoint", type=Path)
    parser.add_argument("coordinates", nargs="?", type=json.loads)
    parser.add_argument("--steps", type=int, default=1, choices=range(1, 11))
    parser.add_argument("--inject-failure", action="store_true")
    parser.add_argument("--status", action="store_true")
    args = parser.parse_args()
    if args.status:
        checkpoint = json.loads(args.checkpoint.read_text())
        trajectory = restore_trajectory(checkpoint["development"])
        print(json.dumps({"steps": checkpoint["steps"], "currentStep": len(trajectory)}))
        return
    model = os.environ.get("POP_MODEL")
    if not model or not os.environ.get("OPENAI_API_KEY"):
        parser.error("Set POP_MODEL and OPENAI_API_KEY for an OpenAI-compatible chat completions endpoint")
    if args.coordinates is None:
        parser.error("Coordinates JSON is required")
    logging.basicConfig(level=logging.WARNING)
    print(json.dumps(run_steps(args.checkpoint, args.coordinates, model,
                               args.steps, args.inject_failure)))


if __name__ == "__main__":
    main()
