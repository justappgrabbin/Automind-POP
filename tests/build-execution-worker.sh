#!/usr/bin/env bash
set -euo pipefail
wheel_dir=$(mktemp -d)
trap 'rm -rf "$wheel_dir"' EXIT
python3 -m pip download --only-binary=:all: --dest "$wheel_dir" \
  humanize==4.8.0 dataclasses-json==0.6.7 shutup==0.2.0
docker build --network none --build-context wheels="$wheel_dir" \
  --file src/isolated-worker.Dockerfile --tag automind-pop-execution:1 .
