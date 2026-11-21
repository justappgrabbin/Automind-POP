#!/usr/bin/env bash
set -euo pipefail

python_bin=${POP_PYTHON:-python3}
test_state=$(mktemp -d)
trap 'rm -rf "$test_state"' EXIT
checkpoint="$test_state/mission.json"
coordinates='{"micro":{"gate":41,"line":4,"color":2,"tone":5,"base":3},"macro":{"planet":0,"dimension":0,"zodiac":0,"house":0},"emergent":{"degree":1,"minute":0,"second":0,"arcSecond":0}}'

"$python_bin" src/conductor.py "$checkpoint" "$coordinates" --inject-failure > "$test_state/draft"
"$python_bin" src/conductor.py "$checkpoint" "$coordinates" > "$test_state/result"
"$python_bin" src/conductor.py "$checkpoint" --status > "$test_state/restored"
cmp "$test_state/result" "$test_state/restored"
"$python_bin" - "$test_state/restored" <<'PY'
import json
import sys
from pathlib import Path

state = json.loads(Path(sys.argv[1]).read_text())
draft, continuation = state["steps"]
assert state["currentStep"] == 2
assert draft["plan"] and continuation["plan"]
assert draft["stage"] == "draft" and continuation["parentId"] == draft["nodeId"]
attempts = [attempt for step in state["steps"] for attempt in step["attempts"]]
assert attempts[0]["controlledFailure"] and attempts[0]["exception"] == "RuntimeError"
assert any(step["verifiedReceipt"] and step["verifiedReceipt"]["gate"] == 42
           for step in state["steps"])
print("Live AutoMind plan, worker failure, correction, verified POP receipt, and restart passed.")
PY
