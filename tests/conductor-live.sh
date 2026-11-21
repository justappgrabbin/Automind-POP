#!/usr/bin/env bash
set -euo pipefail

python_bin=${POP_PYTHON:-python3}
if [[ -n ${POP_EVIDENCE_DIR:-} ]]; then
  mkdir -m 700 -p "$POP_EVIDENCE_DIR"
  test_state=$(mktemp -d "$POP_EVIDENCE_DIR/run.XXXXXX")
  printf 'Evidence directory %s\n' "$test_state"
else
  test_state=$(mktemp -d)
  trap 'rm -rf "$test_state"' EXIT
fi
checkpoint="$test_state/mission.json"
coordinates='{"micro":{"gate":41,"line":4,"color":2,"tone":5,"base":3},"macro":{"planet":0,"dimension":0,"zodiac":0,"house":0},"emergent":{"degree":1,"minute":0,"second":0,"arcSecond":0}}'

"$python_bin" src/conductor.py "$checkpoint" "$coordinates" --inject-failure > "$test_state/draft"
"$python_bin" src/conductor.py "$checkpoint" "$coordinates" > "$test_state/result"
"$python_bin" src/conductor.py "$checkpoint" --status > "$test_state/restored"
cmp "$test_state/result" "$test_state/restored"
"$python_bin" - "$test_state/restored" <<'PY'
import ast
import json
import sys
from pathlib import Path

state = json.loads(Path(sys.argv[1]).read_text())
draft, continuation = state["steps"]
assert state["currentStep"] == 2
assert draft["plan"] and continuation["plan"]
assert draft["stage"] == "draft" and continuation["parentId"] == draft["nodeId"]
attempts = [attempt for step in state["steps"] for attempt in step["attempts"]]
failure = attempts[0]
# A model-generated error can occur before the appended controlled fault.
assert failure["controlledFailure"] and failure["exception"] and failure["receipt"] is None
successful = next(attempt for attempt in attempts[1:] if attempt["receipt"])
assert successful["codeSha256"] == successful["candidateSha256"]
assert successful["candidateSha256"] != failure["candidateSha256"]
assert ast.dump(ast.parse(successful["candidate"])) != ast.dump(ast.parse(failure["candidate"]))
assert draft["verifiedReceipt"] and draft["verifiedReceipt"]["gate"] == 42
assert continuation["verifiedReceipt"] and continuation["verifiedReceipt"]["gate"] == 42
if state["modelIdentity"]["backend"] == "local":
    assert len(state["modelIdentity"]["sha256"]) == 64
    calls = draft["modelCalls"]
    assert any(failure["exception"] in message["content"]
               for call in calls for message in call["input"])
    assert any(call["function"] == "submission_verify" and "rejected" not in call
               for call in calls)
    assert continuation["modelCalls"]
print("Live AutoMind plan, worker failure, correction, verified POP receipt, and restart passed.")
PY
