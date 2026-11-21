# AutoMind POP

**AutoMind is the primary adaptive conductor.** This is the working repository for the user's self-organizing, self-cultivating computer, built from original existing source, not a substitute mockup.

## Source of truth
- `AGENTS.md` contains the standing engineering instructions.
- `docs/INTEGRATION_PLAN.md` defines the source-preserving integration sequence and milestone acceptance criteria.
- Original AutoMind archive: Google Drive file `1KTfBH69E6t6iI6Ra2gBXf5rdcX7YoohH` (`AutoMind-main.zip`).
- Existing source archives and GitHub repositories are *donors*, not authority to replace AutoMind.
- The previous `SynthAi` computer repository is reference material only; do not require migration into it.

## Status
Repository initialized with execution instructions. **No application source has been imported or verified here yet.** Do not report the computer complete until end-to-end tests prove it.

## Next action for an autonomous coding agent
Read `AGENTS.md` and `docs/INTEGRATION_PLAN.md`; retrieve the original AutoMind source, inventory it, and continue the source-preserving implementation on a development branch. Work through milestones without requesting approval for routine reversible steps. Record evidence in the repository.

## Run the verified providers

Use Node.js 22 or later and Python 3.11 or later. Use a single writer per state file.

```sh
node src/cli.mjs resolve-address .pop/state.json '{"micro":{"gate":41,"line":4,"color":2,"tone":5,"base":3},"macro":{"planet":0,"dimension":0,"zodiac":0,"house":0},"emergent":{"degree":1,"minute":0,"second":0,"arcSecond":0}}'
node src/cli.mjs latest-address .pop/state.json

node src/cli.mjs locate-perspective .pop/state.json '{"expressions":{"Who":"I think","Where":"I define"},"weights":{"who":3,"where":1},"clarify":"Movement"}'
node src/cli.mjs latest-perspective .pop/state.json

npm test
bash tests/address-cli.sh
```

See the [implementation checkpoint](docs/PROGRESS.md) for the current AutoMind conductor status.

## Run the original AutoMind conductor

The address mission uses AutoMind's original one-shot planner, coder, search policy,
improver, and submission verifier. Each generated candidate runs in a fresh,
network-disabled Docker container through POP's `execute_automind_python` capability.
The host verifies the CSV against a YNIV address resolved by POP.

Use Node.js 22+, Python 3.12, and Docker with BuildKit. Install the host
dependencies and build the isolated worker from the repository root.

```sh
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r src/conductor-requirements.txt
bash tests/build-execution-worker.sh
python tests/conductor_components.py
```

For the optional external backend, set `POP_MODEL` to an available chat
completions model and `OPENAI_API_KEY` to its credential in the conductor environment. Set `OPENAI_BASE_URL` to the
provider's OpenAI-compatible API base URL when using a different provider.
Choose a model that supports tool calls and the sampling parameters used by the
original AutoMind backend.

```sh
POP_PYTHON=python bash tests/conductor-live.sh
```

The live acceptance script injects one controlled worker failure and runs the
next agent step in a new process using the same checkpoint. To keep a mission's
checkpoint, call `python src/conductor.py CHECKPOINT COORDINATES_JSON` and use
the same checkpoint and coordinates to continue. Read the checkpoint with
`python src/conductor.py CHECKPOINT --status`. Store checkpoints privately
because they contain mission inputs, generated code, and execution diagnostics.

Compare the Kimi and Foundry mandala mappings at the same tropical position.

```sh
node src/cli.mjs compare-position .pop/state.json '{"birthDate":"1990-01-01","birthTime":"12:00"}'
node src/cli.mjs latest-position .pop/state.json
```

Kimi derives an approximate position from the supplied UTC date and time.
Foundry independently maps that tropical coordinate into its mandala.
The persisted output retains each provider's result and the differences.

### Credential-free local model

Install the local inference dependency in the conductor environment. On x86-64
Linux with Python 3.12, the upstream CPU wheel works without a C++ toolchain.

```sh
python -m pip install --only-binary llama-cpp-python \
  --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu \
  -r src/local-model-requirements.txt
export POP_MODEL_BACKEND=local
export POP_MODEL_THREADS=2
export POP_MODEL=Qwen2.5-Coder-3B-Instruct-Q4_K_M
export POP_GGUF=/absolute/path/qwen2.5-coder-3b-instruct-q4_k_m.gguf
export POP_GGUF_SHA256=724fb256bec1ff062b2f65e4569e871ad2e95ab2a3989723d1769c54294730b7
python tests/local_model_contract.py
POP_PYTHON=python bash tests/conductor-live.sh
```

The pinned weight revision and artifact are listed in
[the source inventory](docs/SOURCE_INVENTORY.md). The model runs in the
conductor process. The existing Docker worker executes generated candidates in
a separate network-disabled container. The local backend needs a local weight
file and uses no API key. `POP_MODEL_CONTEXT` and `POP_MODEL_THREADS` default to
8192 and 3. Use the same settings and GGUF digest to resume a checkpoint.
Select `POP_MODEL_BACKEND=openai` to use the optional external provider.

Set `POP_EVIDENCE_DIR` for the acceptance script to retain checkpoints and
outputs in a private run directory. Local checkpoints include compiled prompts
and raw model outputs for audit and contain user mission data.
