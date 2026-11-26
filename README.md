# AutoMind POP

**AutoMind is the primary adaptive conductor.** This is the working repository for the user's self-organizing, self-cultivating computer, built from original existing source, not a substitute mockup.

## Source of truth
- `AGENTS.md` contains the standing engineering instructions.
- `docs/INTEGRATION_PLAN.md` defines the source-preserving integration sequence and milestone acceptance criteria.
- Original AutoMind archive: Google Drive file `1KTfBH69E6t6iI6Ra2gBXf5rdcX7YoohH` (`AutoMind-main.zip`).
- Existing source archives and GitHub repositories are *donors*, not authority to replace AutoMind.
- The previous `SynthAi` computer repository is reference material only; do not require migration into it.

## Status — integration branch
The original AutoMind source has been imported under `vendor/automind` with provenance recorded in `docs/SOURCE_INVENTORY.md`. The existing engineering record in `docs/TEST_EVIDENCE.md` documents an original-agent Qwen local-model mission with real worker failure, correction, downstream CSV receipt, and restart persistence. TRIDENT Model Maker and ARLM Stage 1–3 experimental checkpoints are also documented in `docs/PROGRESS.md`.

**These are recorded historical tests, not a claim that the full computer is finished or publicly deployed.** The ARLM Stage 3 neural qualification remains blocked on independent evaluation data and separate approval; see `docs/BLOCKERS.md`. For the next verified work item, consult `docs/PROGRESS.md` and rerun the relevant tests before claiming a new acceptance result.

## Next action for an autonomous coding agent
Read `AGENTS.md`, `docs/INTEGRATION_PLAN.md`, `docs/PROGRESS.md`, `docs/TEST_EVIDENCE.md`, and `docs/BLOCKERS.md`. Continue from the latest verified checkpoint on this integration branch. Preserve original source and previous results; do not restart the import or mistake the original scaffold status for the current implementation.

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

### Native TRIDENT Model Maker

The CPU Model Maker has its own persistent workspace and uses the pinned
TRIDENT trainer. A design declares `theme`, `role`, `direction`, an ordered list
of `heads` from `code`, `math`, and `research`, and a `hardware` object with
`memoryMiB` and `maxTrainingSteps`. The memory budget selects the portable
or original-size architecture. The current CPU workflow requests 1–128 steps
per revision. Run it in a private workspace because the donor saves the
approved training records beside the checkpoint.

```sh
python -m pip install -r src/model-maker-requirements.txt
python src/model_maker.py .pop/foundry init design.json
python src/model_maker.py .pop/foundry train train.jsonl holdout.jsonl --head code --steps 16 --approved
python src/model_maker.py .pop/foundry activate REVISION_ID code
python src/model_maker.py .pop/foundry generate 'Reply to gamma.' --seed 42
python src/model_maker.py .pop/foundry status
python src/model_maker.py .pop/foundry rollback
python tests/model_maker_contract.py
```

Each JSONL row provides `prompt`, `response`, and `head`. Training and holdout
prompts must be disjoint and use the selected head. Qualification requires a
lower finite held-out answer-token loss and nonempty local head generation.
The scope is token prediction and local generation. Fluency, factuality,
and eligibility to conduct an AutoMind mission require separate tests.

### ARLM encounter ledger

Stage 1 is opt-in. Use the same Python environment as the Model Maker. Prepare
a POP state file with `resolve-address` and `locate-perspective`, and activate a
qualified TRIDENT revision in a Foundry workspace. Then initialize a private
ARLM ledger.

```sh
python src/arlm_cli.py .pop/arlm.sqlite init .pop/foundry .pop/state.json
python src/arlm_cli.py .pop/arlm.sqlite record encounter.json
python src/arlm_cli.py .pop/arlm.sqlite show
python src/arlm_cli.py .pop/arlm.sqlite show 2 --public
python src/arlm_cli.py .pop/arlm.sqlite approve encounter-1 operator
python src/arlm_cli.py .pop/arlm.sqlite export > approved.jsonl
python src/arlm_cli.py .pop/arlm.sqlite history
python src/arlm_cli.py .pop/arlm.sqlite rollback 1
```

The encounter file contains an `id`, original `expression`, `source`,
`participants`, `context`, `modality`, an ISO-8601 `observedAt` with timezone,
and `evaluation` with a separate `verifier` label and independently declared
`expectedTokens`. For example, the fixture “Observe movement” has expected
tokens `["observe","movement"]`. A correction adds `supersedes` with an earlier
encounter ID on the active lineage. The ledger records donor results and
compares token order, observed edges, and graph provenance with the fixture.

The SQLite ledger holds private source text and context. The explicit public
view exposes only the encounter ID, modality, outcome status, and address
fields through Base. It is an output projection. File access and operator
identity are managed outside the CLI. The lexical verifier establishes
agreement with a declared fixture and graph readback. It cannot establish
the truth of an utterance or authenticate the verifier label.

Export writes TRIDENT JSONL to stdout and its dataset digest and row count to
stderr. Each row identifies its encounter, independent verification,
perspective, transformations, and approval. Rejected, unapproved, inactive,
and superseded records stay in history and are excluded from export. Rolling
back does not reauthorize a superseded encounter. Keep the pinned Foundry
weights and registry available for active restore and rollback.

### ARLM positional interpretation

Record a verified encounter, then index source-linked evidence for its
donor-observed constituents. Each assertion supplies a constituent, canonical
lowercase concept ID, context ID, `denotes` relation, source and source revision,
and a position with an explicit provider and provider coordinates. The position
is a supplied reference. The resolver does not derive coordinates from spelling.

```sh
python src/arlm_cli.py .pop/arlm.sqlite index-evidence 2 evidence.json
python src/arlm_cli.py .pop/arlm.sqlite interpret 2 3 frame.json
python src/arlm_cli.py .pop/arlm.sqlite interpretation-artifacts 4
```

The first two numeric arguments identify the encounter and evidence revisions.
Use the revision IDs returned by your ledger. A frame request has a `frame`
object with `observer`, `referenceFrame`, `scale`, `context`, `knowledge`, and a
timezone-aware `temporalReference`. Supply Biverse `expressions` keyed by its
questions (Who, What, Where, When, Why), optional positive `weights`, and optional
`clarify` naming one active dimension. An optional `fromRevision` references an
earlier interpretation of the encounter and creates a transformation record.

A single supported concept and position resolve. Multiple competing concepts
or positions yield `ambiguous`, and a context with no matching evidence yields
`unresolved`. Replaying the same request returns its historical revision
without changing activation. Use `rollback` to activate a historical revision.
The artifact command is private and returns the preserved frame, any address
receipt, the TRIDENT input, and separate neural-computation measurements.
Interpretations and neural metrics do not enter the Stage 1 training export.

Run the positional meaning experiment and optionally save its sample artifacts.

```sh
POP_ARLM_SAMPLE=/tmp/arlm-positional-meaning.json python tests/arlm_positional_meaning.py
```

### Stage 3 Checkpoint 1 · Frozen TRIDENT preview

Export an outcome-blind inference artifact from the ledger, then run it
through a pinned Foundry checkpoint. Use the revision IDs for your workspace.

```sh
python src/arlm_cli.py .pop/arlm.sqlite inference-artifact 2 3 frame.json > inference.json
python src/arlm_interpretation_adapter.py .pop/foundry "$REVISION" inference.json
```

The preview receives the original expression, the six-field frame, five
Biverse proportions and optional clarity, and all source-linked candidate
concepts from the selected evidence revision. It uses one retrieval policy
and one four-row budget per candidate. It records dropped references. Version
1 omits semantic addresses uniformly. The separate evaluator schema binds
independent labels and supporting evidence to the exact inference digest.

The preview emits candidate ranks, exploratory evidence references, and
separate three-class decision scores. The proposal is uncalibrated and the
operational decision is unresolved. A fresh child process can use the frozen
research head with an existing, verified Foundry checkpoint. No adapter
training or registration is needed for the preview.

The independent evaluation protocol is pinned in
`tests/fixtures/arlm_stage3/preregistration.json`. See
`docs/TEST_EVIDENCE.md` for the executable acceptance and sample outputs.

### Stage 3 Checkpoint 2 · Dataset readiness

```sh
python src/arlm_cli.py .pop/arlm.sqlite dataset-build inventory.json private-labels.json
```

The operator-side command checks content digests, verified ledger revisions,
independent evaluator records, interpretation-specific approvals, derivation
lineage, and leakage evidence. Its default view returns an audit and readiness
report. Request the `inference`, `training`, or `private-addresses` view separately
with `--view`. Give the predictor only its inference artifact. Keep the label
file, private address view, and training targets under separate operator
access. The existing preview command consumes one inference artifact.

The inventory contains `sources` and `cases`. Each case pins a verified
encounter, an evidence revision, a perspective request, lineage selectors,
case classification, and derived parents. Label histories are keyed by case
and bind to the exact inference digest. A correction supersedes the preceding
label digest and needs a new interpretation-training approval. This route only
prepares data. The preregistered family, condition, and seed requirements still
govern any future qualification.


## Personal development workspace (new cumulative capability)

This branch now includes a mobile-responsive personal workspace at [web/index.html](web/index.html), original licensed MIMO/MYLIFE/Sage Coach materials in [vendor/personal](vendor/personal), a source-derived Pocket Sage decision calculator, and an additive local-only bridge to the existing AutoMind runtime.

From the repository root with Node.js 22+:

```bash
npm start
```

Open **http://127.0.0.1:8787** on the same computer. Use MIMO, MYLIFE Vault, Decide, Coach, Projects and the original AutoMind computer tools from the visible navigation. The original runtime's JSON input validation still applies. `npm test` exercises the new personal contracts and preserved existing tests.

See [docs/PERSONAL_WORKSPACE.md](docs/PERSONAL_WORKSPACE.md) for verified features, exact source provenance, privacy controls, runtime constraints and unfinished work. This is a local working slice, not a public deployment, complete autonomous AI coach, secure login service, or finished general-purpose computer.
