#!/usr/bin/env python3
"""Download actual pretrained browser model artifacts; no inference API."""
import argparse
from pathlib import Path
from huggingface_hub import snapshot_download, HfApi
MODELS = {"chitra": "udgamlabs/Chitra-Tiny-ONNX", "drishya": "udgamlabs/Drishya-Tiny"}
def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--model", choices=["all", *MODELS], default="all")
    p.add_argument("--destination", type=Path, required=True, help="Local directory outside the Git checkout recommended")
    p.add_argument("--accept-drishya-noncommercial", action="store_true")
    a=p.parse_args()
    keys=list(MODELS) if a.model=="all" else [a.model]
    if "drishya" in keys and not a.accept_drishya_noncommercial:
        p.error("Drishya weights are CC BY-NC 4.0; acknowledge noncommercial restriction explicitly.")
    for key in keys:
        repo=MODELS[key]
        info=HfApi().model_info(repo, token=False)
        dest=a.destination/key
        snapshot_download(repo_id=repo, revision=info.sha, local_dir=dest, token=False)
        if not any(f.is_file() and f.suffix in {".onnx", ".safetensors", ".bin", ".pt", ".data"} for f in dest.rglob("*")):
            raise RuntimeError(f"No model artifacts detected for {repo}")
        print(f"{repo}@{info.sha} downloaded to {dest}", flush=True)
if __name__=="__main__":
    main()
