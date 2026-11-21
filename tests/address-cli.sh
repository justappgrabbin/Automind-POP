#!/usr/bin/env bash
set -euo pipefail

test_state=$(mktemp -d)
trap 'rm -rf "$test_state"' EXIT
state_file="$test_state/state.json"
input='{"micro":{"gate":41,"line":4,"color":2,"tone":5,"base":3},"macro":{"planet":0,"dimension":0,"zodiac":0,"house":0},"emergent":{"degree":1,"minute":0,"second":0,"arcSecond":0}}'
node src/cli.mjs resolve-address "$state_file" "$input" > "$test_state/first"
bad_input=${input/\"arcSecond\":0/\"arcSecond\":0,\"axis\":\"invalid\"}
if node src/cli.mjs resolve-address "$state_file" "$bad_input" > "$test_state/failure" 2>&1; then
  echo 'Expected the canonical verifier to reject the invalid axis' >&2
  exit 1
fi
rg -q 'failed canonical verification.*arcAxis.axis' "$test_state/failure"
node src/cli.mjs latest-address "$state_file" > "$test_state/restored"
cmp "$test_state/first" "$test_state/restored"

input=${input/\"gate\":41/\"gate\":42}
node src/cli.mjs resolve-address "$state_file" "$input" > "$test_state/retry"
node src/cli.mjs latest-address "$state_file" > "$test_state/restored"
cmp "$test_state/retry" "$test_state/restored"
rg -q '"gate": 43' "$test_state/retry"
echo 'Address CLI recovered the verified retry across processes.'
