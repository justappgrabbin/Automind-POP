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
from functools import partial
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "vendor" / "automind"))

from automind.agent import Agent
from automind.backend import query_backend
from automind.coder import OneShotCoder
from automind.improver import OneShotImprover
from automind.planner import OneShotPlanner
from automind.interpreter import ExecutionResult
from automind.trajectory import Trajectory
from automind.utils.config import Config, _load_cfg, config_manager
from omegaconf import OmegaConf
from conductor_state import restore_development, restore_trajectory, snapshot, verify_model_identity, write_checkpoint

MISSION = """Convert one zero-based YNIV gate to its one-based equivalent (+1).
Read input/coordinates.json. It contains ONE JSON object, for example
{"micro":{"gate":7},"macro":{},"emergent":{}}. Read the integer at micro.gate.
Write submission/submission.csv: header id,gate and ONE row with the literal id
address and the converted gate. Check the conversion and CSV, and print the
metric gate_accuracy=1.0 after the checks succeed. POP independently verifies
the CSV against its address resolution. This is an arithmetic task."""
WORKER_GUIDANCE = (
    "The candidate runs in an isolated, offline worker with a 10-second limit. "
    "Use only Python standard library. Read the exact relative path input/coordinates.json "
    "and extract the integer at micro.gate in the JSON object. Write the exact relative "
    "path submission/submission.csv with header id,gate and one row whose first cell "
    "is the literal string address. Keep the response short and use the requested response format. During a retry, "
    "correct the fault exposed by the execution output and leave harness exceptions "
    "out of candidate code."
)
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
        executed_code = code
        if injected:
            executed_code += '\nraise RuntimeError("POP controlled worker failure. Retry with explicit input validation.")'
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
            "candidate": code,
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
        if execution.exc_type is not None:
            execution.term_out.append(f"\nPOP worker contract: {WORKER_GUIDANCE}")
        attempt["output"] = execution.term_out
        self.attempts.append(attempt)
        return execution


class AddressWorkerPrompt:
    """Describe the real POP worker through the archived prompt interfaces."""

    @property
    def _prompt_environment(self):
        return {"Worker environment": WORKER_GUIDANCE}


class AddressPlanner(AddressWorkerPrompt, OneShotPlanner):
    @property
    def _prompt_plan_guideline(self):
        return {"Plan guideline": "Cover the exact input path, object shape, one-row CSV and check."}

    @property
    def _prompt_resp_fmt(self):
        return {"Response format": "Return a plan of at most five short bullets. Do not include code."}


class AddressCoder(AddressWorkerPrompt, OneShotCoder):
    @property
    def _prompt_code_guideline(self):
        return {"Code guideline": "Use straightforward standalone Python and satisfy the exact mission contract."}

    @property
    def _prompt_resp_fmt(self):
        return {"Response format": "Return exactly one fenced Python code block, with no explanation."}


class AddressImprover(AddressWorkerPrompt, OneShotImprover):
    @property
    def _prompt_improve_guideline(self):
        return {"Improve guideline": (
            "Use the previous execution to identify one concrete correction or robustness improvement. "
            "Keep the exact input, output and verification contract. Keep the think and plan sections short."
        )}


def create_agent(workspace, model, trajectory, steps, interpreter):
    cfg = _load_cfg(use_cli_args=False)
    cfg.workspace_dir = str(workspace)
    cfg.data_dir = str(workspace / "input")
    cfg.exp_name = "pop-address-mission"
    cfg.agent.steps = steps
    cfg.agent.analyzer.strategy = "none"
    cfg.agent.k_fold_validation = 1
    cfg.agent.search.num_drafts = 1
    cfg.agent.search.debug_prob = 1
    cfg.agent.search.hpo_prob = 0
    for stage in ("planner", "coder", "improver", "verifier"):
        cfg.agent[stage].model = model
    cfg = OmegaConf.merge(OmegaConf.structured(Config), cfg)
    config_manager.cfg = cfg
    task = {"Task goal": MISSION}
    agent = Agent(task_desc=task, cfg=cfg, traj=trajectory, interpreter=interpreter)
    agent.planner = AddressPlanner(model, task)
    agent.coder = AddressCoder(model, task, interpreter=agent.interpreter)
    agent.improver = AddressImprover(model, task)
    return agent


def run_steps(path, coordinates, model, steps, inject_failure, provider=None):
    identity = provider.identity if provider else {"backend": "openai", "model": model}
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path.with_suffix(path.suffix + ".lock"), "a", encoding="utf-8") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        with TemporaryDirectory(prefix="pop-conductor-") as work:
            workspace = Path(work)
            (workspace / "submission").mkdir()
            if path.exists():
                checkpoint = json.loads(path.read_text())
                if (checkpoint["version"] not in (1, 2) or checkpoint["coordinates"] != coordinates
                        or checkpoint["model"] != model):
                    raise ValueError("Checkpoint version, coordinates, or model differ from the mission")
                verify_model_identity(checkpoint, identity)
                trajectory = restore_trajectory(checkpoint["development"])
            else:
                reference = node_call("cli.mjs", "resolve-address",
                                      str(workspace / "reference.json"), json.dumps(coordinates))
                checkpoint = {
                    "version": 2, "coordinates": coordinates, "model": model,
                    "reference": reference, "steps": [],
                }
                trajectory = Trajectory()

            checkpoint["modelIdentity"] = identity
            checkpoint["executionSettings"] = {
                "capability": "execute_automind_python",
                "workerImage": "automind-pop-execution:1",
                "network": "none",
            }
            checkpoint["version"] = 2
            attempts = []
            interpreter = POPInterpreter(workspace, coordinates, checkpoint["reference"], attempts,
                                         inject_failure and not checkpoint["steps"])
            agent = create_agent(workspace, model, trajectory, len(trajectory) + steps, interpreter)
            if checkpoint["steps"]:
                restore_development(agent, checkpoint["development"])

            for _ in range(steps):
                try:
                    token = query_backend.set(partial(provider.query, guidance=WORKER_GUIDANCE) if provider else None)
                    try:
                        node = agent.step()
                    finally:
                        query_backend.reset(token)
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
                    "modelCalls": list(provider.observations) if provider else [],
                    "verifiedReceipt": final_run["receipt"] if not node.is_buggy else None,
                    "verifiedSubmission": (
                        base64.b64encode((workspace / "submission" / "submission.csv").read_bytes()).decode()
                        if not node.is_buggy else None
                    ),
                })
                checkpoint["development"] = snapshot(agent)
                write_checkpoint(path, checkpoint)
                attempts.clear()
                if provider:
                    provider.observations.clear()
                interpreter.inject_failure = False
            return {"steps": checkpoint["steps"], "currentStep": agent.current_step, "modelIdentity": identity}


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
        print(json.dumps({
            "steps": checkpoint["steps"], "currentStep": len(trajectory),
            "modelIdentity": checkpoint.get("modelIdentity", {
                "backend": "openai", "model": checkpoint["model"],
            }),
        }))
        return
    model = os.environ.get("POP_MODEL")
    backend = os.environ.get("POP_MODEL_BACKEND", "openai")
    if backend not in {"openai", "local"} or not model:
        parser.error("Set POP_MODEL and select POP_MODEL_BACKEND=local or openai")
    provider = None
    if backend == "local":
        from local_model import LocalModel
        try:
            provider = LocalModel(model, os.environ["POP_GGUF"], os.environ["POP_GGUF_SHA256"],
                                  context=int(os.getenv("POP_MODEL_CONTEXT", "8192")),
                                  threads=int(os.getenv("POP_MODEL_THREADS", "3")))
        except (KeyError, OSError, ValueError) as error:
            parser.error(f"Local model configuration: {error}")
    elif not os.environ.get("OPENAI_API_KEY"):
        parser.error("Set OPENAI_API_KEY for the selected OpenAI-compatible backend")
    if args.coordinates is None:
        parser.error("Coordinates JSON is required")
    logging.basicConfig(level=logging.WARNING)
    print(json.dumps(run_steps(args.checkpoint, args.coordinates, model,
                               args.steps, args.inject_failure, provider)))


if __name__ == "__main__":
    main()
