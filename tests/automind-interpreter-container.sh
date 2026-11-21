#!/usr/bin/env bash
set -euo pipefail

wheel_dir=$(mktemp -d)
trap 'rm -rf "$wheel_dir"' EXIT
python3 -m pip download --only-binary=:all: --dest "$wheel_dir" \
  humanize==4.8.0 dataclasses-json==0.6.7 shutup==0.2.0
docker build --network none --build-context wheels="$wheel_dir" \
  --file tests/automind-interpreter.Dockerfile --tag automind-pop-interpreter-smoke .
docker run --rm --network none --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,nodev,size=32m \
  --cap-drop ALL --security-opt no-new-privileges --memory 256m --pids-limit 64 \
  automind-pop-interpreter-smoke
