"""Additive launcher for the original upstream LLM construction toolkit.
Run from TRIDENT: python src/model_maker.py WORKSPACE external llm ACTION [ARGS].
Upstream processes run in their own directory to avoid collisions with TRIDENT's src package.
"""
import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LLM = ROOT / "vendor" / "train-llm-from-scratch"
SEMANTIC = ROOT / "vendor" / "semantic-model-generator"
SCRIPTS = {
    "report": "model_report.py",
    "pretrain": "pretrain_base.py",
    "train": "train_transformer.py",
    "sft": "train_sft.py",
    "reward": "train_reward.py",
    "dpo": "train_dpo.py",
    "ppo": "train_ppo.py",
    "grpo": "train_grpo.py",
    "evaluate": "eval_post_training.py",
    "chat": "chat.py",
}

def command(engine, action, args):
    if engine == "llm":
        if action in SCRIPTS:
            entry = LLM / "scripts" / SCRIPTS[action]
            cmd = [sys.executable, str(entry), *args]
        elif action == "ui":
            entry = LLM / "ui" / "app.py"
            cmd = [sys.executable, "-m", "streamlit", "run", str(entry), *args]
        else:
            raise ValueError("Unknown LLM action: " + action)
        cwd = LLM
    elif engine == "semantic" and action == "ui":
        entry = SEMANTIC / "app.py"
        cmd = [sys.executable, "-m", "streamlit", "run", str(entry), *args]
        cwd = SEMANTIC
    else:
        raise ValueError("Unknown external engine or action")
    if not entry.is_file():
        raise FileNotFoundError(f"Missing {entry}; run git submodule update --init --recursive")
    return cmd, cwd

def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("engine", choices=["llm", "semantic"])
    parser.add_argument("action")
    parser.add_argument("args", nargs=argparse.REMAINDER)
    a = parser.parse_args(argv)
    try:
        cmd, cwd = command(a.engine, a.action, a.args)
        return subprocess.run(cmd, cwd=cwd, check=False).returncode
    except (OSError, ValueError) as exc:
        parser.exit(1, f"{exc}\n")

if __name__ == "__main__":
    sys.exit(main())
