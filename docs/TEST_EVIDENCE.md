# Test evidence

Verified on Node 24.22.3 and Python 3.12.14.

| Check | Result |
| --- | --- |
| POP `npm test` | 2 passing integration tests. The YNIV provider returned gate 42, the spine rejected an invalid axis, and gate 43 persisted after correction. Biverse calculated 0.75 Space and 0.25 Movement and preserved state lineage on explicit clarification. Rejected clarity left the verified state available after reopening. |
| POP `bash tests/address-cli.sh` | Passed. Independent CLI processes recovered the original receipt after rejection and reproduced the corrected receipt after the subsequent successful execution. |
| POP `python tests/automind_interpreter_smoke.py` | Passed with `humanize==4.8.0`, `dataclasses-json==0.6.7`, and `shutup==0.2.0`. The original interpreter detected a real `ZeroDivisionError`, reset its child process, and executed corrected trusted code that wrote `4` to a file. |
| POP `bash tests/automind-interpreter-container.sh` | Passed. Built from locally downloaded wheels, then ran the original interpreter smoke test as a non-root user with no network, a read-only root filesystem, and bounded temporary storage, memory, and processes. |
| `PYTHONPATH=vendor/biverse python -m pytest -q vendor/biverse/tests/test_dimensional.py` | 5 passing original tests. Covers dimension/base mapping, active coordinates and weights, explicit clarity, emergence lineage, and unknown coordinates. |
| SynthAi `npm test` | 13 passing test files and successful diagnostic staging after adding the donor submodule, checking out `public/`, and installing `ephem` on the Python path. |
| SynthAi `node --test --test-isolation=none computer/tests/*.test.mjs` | 23 passing test cases with the same prerequisites. Before completing the sparse checkout and dependencies, application mounting lacked `public/computer.html` and two tests lacked the Python ephemeris path. |
| Original source integrity | 13 archive ZIP integrity checks passed. All 1,155 vendored AutoMind source files matched their archive entry bytes. |

SynthAi coverage includes core runtime and adapters, routing, application mounting, world events, morph state, persistence, resonance, experiment rollback, state-space operations, historical donor recovery, and grammar learning and generation with a downstream consumer. The PyEphem provider runs, and the donor code identifies its Penta position calculation as a placeholder. The Skynthia test verifies morph-expression state and records its absent renderer. The diagnostic build stages a subset of runtime files. Browser operation and live GitHub publishing were outside these checks.

The POP failure and retry tests use the real engines. The operator supplies corrected input. Model-driven replanning, durable AutoMind adaptation, and model-backed restart acceptance are pending.

## Original conductor integration

| Check | Result |
| --- | --- |
| `bash tests/build-execution-worker.sh` | Built the pinned Python image with local wheels and container build networking disabled. |
| `python tests/conductor_components.py` | Passed with the real SynthAi reference provider, Node ProcessFabric, Docker worker, and original AutoMind interpreter. A controlled RuntimeError and an incorrect CSV produced distinct feedback. The good CSV produced a gate 42 receipt. Original Agent draft/debug routing, improvement-parent identity, best node, retrieval flags, and the counter were checked against the restored trajectory in a fresh process. Candidate code verified the conductor credential sentinel was absent from its environment. |
| `POP_PYTHON=python bash tests/conductor-live.sh` | Blocked before any model request. The conductor returned exit 2 with `Set POP_MODEL and OPENAI_API_KEY for an OpenAI-compatible chat completions endpoint`. The live acceptance script remains available for a configured endpoint. |
| `npm test` and `bash tests/address-cli.sh` | Passed existing POP regression tests. |

The conductor component test supplies known candidate programs so it can exercise
the existing engines without model credentials. A live model must generate the
original plan and corrected candidate before M1 can be marked accepted.

## M2 positional provider comparison

`npm test` exercised the new `compare_position` capability and restored the
saved disagreement. For the Sun at `1990-01-01T12:00:00Z`, Kimi's approximate
position is Capricorn 11°19′15″. Kimi mapped it to gate 64 and Foundry mapped the
same tropical DMS coordinate to gate 38. The providers differed by one arcsecond
in their stored arc because their conversions round differently. This compares
mandala mappings using one approximate ephemeris. It does not validate the
ephemeris against an external astronomical reference.

## Local quantized inference

The Qwen and TinyLlama archives were verified against the SHA-256 digests in
the source inventory. The CPU runtime used the upstream llama-cpp-python
0.3.36 manylinux wheel. The older 0.3.18 wheel found during setup depended on
musl and could not load on this glibc environment.

Qwen2.5-Coder-3B-Instruct Q4_K_M passed the real probe over AutoMind's query
boundary with a configured 8192-token context, three CPU threads, and no API
credentials. It produced plain text `42` and structured `{"answer": 42}`.
The calls took 5.276 s and 8.809 s, with 4.319 s model load and 3,888,560 KiB
process peak RSS. These are single-run measurements on an AMD EPYC host with
a two-CPU cgroup budget. They qualify the local inference path for the live
mission. Schema rejection and checkpoint identity tests also passed.

A read-only PyEphem 4.2.1 cross-check used
`ephem.Ecliptic(ephem.Sun(when), epoch=when)` at `1990-01-01 12:00 UTC`.
It returned tropical longitude 280.816738°, about 0.5043° below Kimi's
281.321044° approximation. It falls inside Kimi's gate 64 interval
[277.375°, 283°) and Foundry's gate 38 interval [279.5°, 285.125°). The
reference position therefore does not reconcile the two mandala conventions.

The first live Qwen draft exposed an environment mismatch. Three generated
programs imported pandas after receiving AutoMind's archived benchmark package
list, and the worker raised `ModuleNotFoundError` each time. The original
verifier and trajectory retained the failed draft. The local conductor now
supplies the actual worker package and file constraints through AutoMind's
mission guidance. This preserves the original planner and coder loops.

TinyLlama-1.1B-Chat-v1.0 Q4_K_M produced schema-valid `{"answer": 42}`
with a 2048-token context. Its plain-text answer contradicted itself:
“40 plus 2 = 42” followed by “42 is not a valid answer.” The structured
contract passed and the plain-text output fails an exact-answer check.
Peak process RSS was 1,322,796 KiB and load time was 0.901 s. The calls
took 25.811 s and 16.387 s during a concurrent Qwen run, so the timings
are contention measurements. TinyLlama remains a resource baseline.

A second draft with supplemental worker guidance used the standard library,
but treated the input object as an array and repeated a `TypeError`. The
failed trajectory and model outputs were retained. The conductor's final
address profile supplies the exact one-object contract and short response
shapes through the original planner, coder and improver prompt hooks.

The first run with the address-specific profile generated the correct arithmetic
plan but dropped both directory names in the candidate. The worker reported
`FileNotFoundError`, then `SystemExit` when the model added an exit handler
without fixing the path. The final profile states the exact relative paths and
literal CSV identifier again at the local query boundary and in worker feedback.

A later run resolved the file paths but emitted the zero-based input unchanged.
The independent consumer rejected both retries. The mission now supplies the
one-based conversion in the worker contract, and independently detected
zero-based submissions receive a specific correction message.

In the final-profile draft, Qwen generated a five-step plan and a candidate
that failed in the real worker with `NameError: name 'csv' is not defined`.
That error occurred before the appended controlled fault. The next model call
received the traceback. Its generated replacement added `import csv`, ran in a
fresh worker, and produced the one-based gate 42. The original
`submission_verify` function arguments passed schema validation and AutoMind
accepted the node. The POP consumer verified the actual CSV with SHA-256
`955cb528c2f769cc0993d7bc9a47b53499fab7bf3ba1221833d39a6c3deca26d`.
The four draft model calls took 20.529, 26.334, 30.891 and 34.399 seconds.
Their prompt lengths ranged from 468 to 926 tokens.

The complete `tests/conductor-live.sh` run passed on Qwen with CPU-only
llama.cpp, two threads, an 8192-token context and seed 42. Both external
credential variables were unset. A fresh process restored draft
`189bb937fe67400a94a83fba5c6a930a`, generated improvement node
`dc67658e40af4fc192702745d1a5b149`, and obtained another verified gate-42
receipt. The three continued model calls took 41.078, 31.785 and 34.095 seconds.
The largest prompt in this mission was 1019 tokens. The worker image ID was
`sha256:caa741561a2cecf13c3706445fcc4f1639bcbcb68b449b082aaab555d640b121`.

A third `--status` process produced byte-identical JSON to the resumed run.
Then a resume with context changed to 4096 was rejected before generation
and left checkpoint SHA-256 unchanged at
`eeaed9779da031b2927ac8320d9f8fb5a9449fdf292cf1a1a40c9a84627e78f8`.
The private evidence directory for this workspace run is
`/workspace/scratch/pop-local-evidence/run.0d3mMY`. The checkpoint contains
the compiled prompts, generated sources and verifier calls, exception,
validated CSVs, worker run IDs, receipts, and trajectory.

## Native TRIDENT Model Maker

`python tests/model_maker_contract.py` passed through the public CLI using
Python 3.12 and `torch==2.6.0+cpu`. The fixture constructed a portable model
with width 64, two layers, 260 byte tokens, and selected code and math heads.
Each revision took 16 optimizer steps on approved code-head records.
Answer-token loss on separate prompts moved from 5.6760 to 3.5658 and then
from 3.5658 to 1.9150 after continued training. The revisions had different
weight digests and the second revision referenced the first.

The CLI rejected an unapproved corpus, overlapping holdout prompts, activation
of the unqualified math head, and inference with an altered config artifact.
Fresh processes generated reproducibly with the activated code head, switched
revisions, rolled back, and restored the same model identity and activation.
The first sample was `OZK�KO�#O`. This fixture verifies real local generation
and measured token-prediction improvement. It establishes no text fluency or
conductor readiness for these revisions.

The retained fixture registry and weights are in the private local workspace
`/workspace/scratch/pop-foundry-evidence/contract-ojszyxuu/foundry`.
`npm test` and `bash tests/address-cli.sh` also passed.

## ARLM Stage 1 encounter acceptance

The approved Stage 1 changed only the ARLM CLI, contact and state modules,
their new contract test, the imported Biverse contact source, and the five
documentation files. These commands were run from the repository root with
Node 24 and the existing Python 3.12 environments.

| Command | Result |
| --- | --- |
| `/tmp/pop-trident-probe-venv/bin/python tests/arlm_contact_contract.py` | 1 passed in 13.031 s. The CLI used original Biverse contact, actual POP address and perspective output, and a trained TRIDENT research head. |
| `npm test` | 3 passed. Address retry and restore, Biverse perspective, and positional provider comparison. |
| `bash tests/address-cli.sh` | Passed across separate CLI processes. |
| `/tmp/pop-trident-probe-venv/bin/python tests/model_maker_contract.py` | 1 passed. Two real training revisions changed weights, lowered fixture loss from 5.6760 to 1.9150, and exercised activation and rollback. |
| `/tmp/pop-python/bin/python tests/conductor_components.py` | Passed with Docker. Real worker error, false artifact rejection, verified CSV, and original trajectory restoration. |
| `PYTHONPATH=/tmp/pop-local-wheel36 /tmp/pop-python/bin/python tests/local_model_contract.py` | 3 contract checks passed. The GGUF-required probe skipped in this invocation. |
| `PYTHONPATH="$PWD/vendor/biverse" /tmp/pop-python/bin/python -m pytest -q "$work/test_language_contact.py"` | 4 passed with the original donor test copied to a temporary directory and the mounted Biverse source on the import path. |

The Stage 1 acceptance test checks full encounter retention, real adjacency
updates, provenance readback, no-token donor rejection, duplicate event replay,
and the public address slice through Base. It checks explicit approval,
supersession, rollback and preserved history, and digest rejection on restore.
A SQLite trigger forced failure at activation and confirmed that the event,
graph snapshot, and active pointer remained unchanged. The retry produced
exactly one more observation. Exported bytes entered real TRIDENT training and
matched the Foundry corpus digest. The mounted donor module matches its archive
source byte for byte with SHA-256
`ad29bf59fa19555a5fc9f0d9ad8106669d4c764a623ce62c59bb325f56ac82b4`.

The unchanged live conductor also passed a fresh regression with the pinned
Qwen local model, Docker worker, and no external credentials. The draft failed
with `NameError`, corrected itself, and verified gate 42. A fresh process
restored the model and draft and produced a second verified gate-42 receipt.
The restored status matched the continuation output. The new mission SHA-256
is `d6a8cb0f0404ef886db6f416614988c204defe177a0d02f886850f066ec95c01`,
retained at `/workspace/scratch/pop-arlm-regression/run.hE40uc/mission.json`.

Exact live invocation in this workspace:

```sh
env -u OPENAI_API_KEY -u OPENAI_BASE_URL \
  PYTHONPATH=/tmp/pop-local-wheel36 PYTHONDONTWRITEBYTECODE=1 \
  POP_MODEL_BACKEND=local POP_PYTHON=/tmp/pop-python/bin/python \
  POP_MODEL=Qwen2.5-Coder-3B-Instruct-Q4_K_M \
  POP_GGUF=/workspace/scratch/pop-models/qwen2.5-coder-3b-q4_k_m.gguf \
  POP_GGUF_SHA256=724fb256bec1ff062b2f65e4569e871ad2e95ab2a3989723d1769c54294730b7 \
  POP_MODEL_THREADS=2 POP_EVIDENCE_DIR=/workspace/scratch/pop-arlm-regression \
  bash tests/conductor-live.sh
```

## ARLM Stage 2 · Experiment 1 and regressions

Baseline `718ef4fc607c05d2aeb3d67645582b51630980cb`. Commands ran from the
repository root on Linux with Node 24.22.3, Python 3.12.14, CPU PyTorch 2.6.0+cpu,
and the existing Docker worker and llama-cpp-python 0.3.36 environments.

| Exact invocation | Actual result |
| --- | --- |
| `POP_ARLM_SAMPLE=/workspace/scratch/pop-arlm-stage2/positional-meaning.json PYTHONDONTWRITEBYTECODE=1 /tmp/pop-trident-probe-venv/bin/python tests/arlm_positional_meaning.py` | Passed in 32.719 s. All four fixture contexts, original weighted observation, exact frame delta, declared invariants, suppression record, replay, fresh-process restoration, rollback, public boundary, and atomic publication fault. Corrupt input attachment and modified journal event were rejected. |
| `PYTHONDONTWRITEBYTECODE=1 /tmp/pop-trident-probe-venv/bin/python tests/arlm_contact_contract.py` | Passed, including contact correction, approval, rollback, and training with exported rows. |
| `npm test && bash tests/address-cli.sh` | Three Node tests passed. The shell check restored a verified address retry across processes. |
| `PYTHONDONTWRITEBYTECODE=1 /tmp/pop-trident-probe-venv/bin/python tests/model_maker_contract.py` | Passed in 35.295 s. Held-out loss pairs were 5.6760 → 3.5658 and 3.5658 → 1.9150, with activation and rollback. |
| `PYTHONDONTWRITEBYTECODE=1 /tmp/pop-python/bin/python tests/conductor_components.py` | Passed with Docker. Worker failure, invalid artifact rejection, verified submission and original-tree restoration. |
| `PYTHONDONTWRITEBYTECODE=1 /tmp/pop-python/bin/python tests/automind_interpreter_smoke.py` | Passed with the original interpreter. Detected division by zero and wrote the corrected result. |
| `PYTHONPATH=/tmp/pop-local-wheel36 PYTHONDONTWRITEBYTECODE=1 /tmp/pop-python/bin/python tests/local_model_contract.py` | Three passed, GGUF probe skipped in this invocation and passed in the configured invocation below. |
| `work=$(mktemp -d); cp /workspace/scratch/pop-sources/biverse-check/biverse-guide/tests/test_language_contact.py "$work/"; PYTHONDONTWRITEBYTECODE=1 PYTHONPATH="$PWD/vendor/biverse" /tmp/pop-python/bin/python -m pytest -q "$work/test_language_contact.py"` | Four original donor tests passed. |
| Standalone interpreter image rebuild, `bash tests/automind-interpreter-container.sh` | Skipped. The original interpreter smoke and real Docker conductor tests ran against the existing toolchain. |

The independent fixture oracle is read only by the test. Identical input
`bank` resolved to `river-edge` with gate 42 in the river frame and to
`financial-institution` with gate 26 in finance. Mixed evidence preserved both
candidate IDs without selecting an address. An unrelated context returned
`unresolved`. A return transformation reproduced the same logical river frame,
meaning, and canonical address, and rollback restored the exact earlier
artifacts. Provider receipt IDs and donor observation timestamps are preserved
as execution metadata rather than used as semantic identity.

The existing TRIDENT encoder produced 8 × 32 features for each context.
The activated research head ran actual forward passes. River and finance
had maximum absolute logit deltas from their lexical-only controls of
0.00008648634 and 0.00008815527. These values measure neural sensitivity.
The fixture oracle and independent canonical POP receipt establish their
respective correctness checks. The sample JSON includes the event, address,
frame, input, features and computation receipt for all four cases. It is at
`/workspace/scratch/pop-arlm-stage2/positional-meaning.json`, SHA-256
`7f21f7018aee0183b2663e50f769d866abaf1130ed392f8ae37f28394fd53020`.

During development, the first experiment run exposed an unintended NumPy
dependency in logit serialization. The digest now uses standard-library
little-endian float packing. An intermediate run caught a missing `Path`
import. Both were corrected before the passing run.

The GGUF probe passed all four checks in 54.109 s with raw output `42` and
structured output `{"answer": 42}`. The live conductor passed with no external
credentials. The draft encountered a real `NameError`, corrected its candidate,
and produced a verified gate-42 receipt. A fresh process produced a second
gate-42 receipt and a separate status process matched its restored output.
The mission is at `/workspace/scratch/pop-arlm-stage2/run.bz6zmd/mission.json`,
SHA-256 `8386df534b0284af5a6b10f61fcd96a2c472b6f2287014c64785cddd48e3a837`.

```sh
PYTHONPATH=/tmp/pop-local-wheel36 PYTHONDONTWRITEBYTECODE=1 \
  POP_MODEL=Qwen2.5-Coder-3B-Instruct-Q4_K_M \
  POP_GGUF=/workspace/scratch/pop-models/qwen2.5-coder-3b-q4_k_m.gguf \
  POP_GGUF_SHA256=724fb256bec1ff062b2f65e4569e871ad2e95ab2a3989723d1769c54294730b7 \
  POP_MODEL_THREADS=2 /tmp/pop-python/bin/python tests/local_model_contract.py

env -u OPENAI_API_KEY -u OPENAI_BASE_URL \
  PYTHONPATH=/tmp/pop-local-wheel36 PYTHONDONTWRITEBYTECODE=1 \
  POP_MODEL_BACKEND=local POP_PYTHON=/tmp/pop-python/bin/python \
  POP_MODEL=Qwen2.5-Coder-3B-Instruct-Q4_K_M \
  POP_GGUF=/workspace/scratch/pop-models/qwen2.5-coder-3b-q4_k_m.gguf \
  POP_GGUF_SHA256=724fb256bec1ff062b2f65e4569e871ad2e95ab2a3989723d1769c54294730b7 \
  POP_MODEL_THREADS=2 POP_EVIDENCE_DIR=/workspace/scratch/pop-arlm-stage2 \
  bash tests/conductor-live.sh
```

## ARLM Stage 3 Checkpoint 1

Ran on Linux, Node 24.22.3, Python 3.12.14, PyTorch 2.6.0+cpu,
llama-cpp-python 0.3.36, and the existing Docker execution worker.
Logs and sample artifacts are in `/workspace/scratch/pop-arlm-stage3-cp1`.

| Exact command from the repository root | Actual result |
| --- | --- |
| `PYTHONDONTWRITEBYTECODE=1 POP_STAGE3_FOUNDRY=/workspace/scratch/pop-foundry-evidence/contract-ojszyxuu/foundry POP_STAGE3_EVIDENCE=/workspace/scratch/pop-arlm-stage3-cp1 /tmp/pop-trident-probe-venv/bin/python tests/arlm_adapter_contract.py` | 3 passed in 5.197 s. Schema, independent evaluator binding, fresh-process inference without an evaluator file, 24 remapped permutations, forced ranking and citation ties, independent three-class decision output, real retrieval/composer calls, frozen parameters, and family-wise partitioning. |
| `PYTHONDONTWRITEBYTECODE=1 /tmp/pop-trident-probe-venv/bin/python tests/arlm_contact_contract.py` | 1 passed in 33.257 s. Existing Stage 1 contact, export, and verified lineage. |
| `PYTHONDONTWRITEBYTECODE=1 /tmp/pop-trident-probe-venv/bin/python tests/arlm_positional_meaning.py` | 1 passed in 40.983 s. Existing contextual interpretation, corruption rejection, restart, and rollback. |
| `PYTHONDONTWRITEBYTECODE=1 /tmp/pop-trident-probe-venv/bin/python tests/model_maker_contract.py` | 1 passed in 38.880 s. Existing training loss pairs 5.6760 → 3.5658 and 3.5658 → 1.9150. |
| `npm test && bash tests/address-cli.sh` | Three POP tests and separate-process address CLI passed. |
| `/tmp/pop-python/bin/python tests/conductor_components.py` | Passed with the real Docker worker. |
| `/tmp/pop-python/bin/python tests/automind_interpreter_smoke.py` | Passed with the original interpreter. |

The frozen preview test uses existing Foundry revision
`revision-7591e3fa723b4ef2b809ba2c7e8abc0b`, weights SHA-256
`940a0af2311eaa78b715bcd070249ec0678eae35a44358be17252b04cf20be14`.
The model's prior training qualification is for the code head. The research
head is exercised as an experimental computational path. The test loads
the same weights into the baseline source from Git and the updated source.
Logits and router outputs are bitwise equal in all 16 legacy combinations.
All 123 state tensors are byte-identical after preview, and every original
parameter is frozen. The research head received 12 and 14 retrieval chunks
including eight Klein chunks, and the original relation composer ran six
times. The only trainable parameters belong to the new adapter. The
checkpoint did not train any Stage 3 parameters. Earlier acceptance tests
ran their existing training regressions.

The two bank contexts exposed identical evidence and candidate concepts.
The fixture supplied unequal evidence counts of 2 and 7, with one
candidate dropping 3 rows at the four-row boundary. Randomly reassigning
opaque candidate IDs and shuffling candidate and evidence order preserved
scores, mapped ranks, cited and dropped references, and decisions. Forced
ties preserved joint rank 1. Changing only the decision head exercised all
three proposed decision values at identical tied ranks. Proposals remained
unqualified and the operational preview abstained. The strict schemas
rejected injected nested gold labels and receipts. The preview process ran
before the private evaluator artifact existed.

Sample SHA-256 digests:

| File | SHA-256 |
| --- | --- |
| `inference.json` | `721a942dc961426303d52766a796c8d7209a8b9974ace98a1b640f070275097c` |
| `evaluation.json` | `fb3fcb22cfbb6c44e4a903d8d810651b958e65ffcf60ea7b091e867d86473157` |
| `preview.json` | `b000c807c267edd7c427588f7722249330b2aa6d9b21d48e21c3e9ddcaeac078` |
| `tests/fixtures/arlm_stage3/preregistration.json` | `f1fdb3b06f92aa49c04ac26ceefb42e475badc0dabdf50f76c0eca72fbacd1fa` |

The synthetic split contract assigned 100 groups reproducibly when input
order was reversed, including transitive links across source and template.
The fixture smoke family does not count toward qualification. The independent
test count is 0 of 600. The preregistered sample gates are preserved.

An initial run found that byte comparison needed to flatten scalar tensors
before reinterpreting their dtype. The corrected contracts passed. The runtime
emitted a PyTorch optional NumPy warning. The tests used no NumPy requirement.
The standalone rebuild of the interpreter image was skipped. The original
interpreter, Docker components, and live Docker mission all ran.

The following shell prefix was used for both local Qwen commands, with output
redirected to the evidence directory:

```sh
env -u OPENAI_API_KEY -u OPENAI_BASE_URL \
  PYTHONPATH=/tmp/pop-local-wheel36 PYTHONDONTWRITEBYTECODE=1 \
  POP_MODEL_BACKEND=local POP_PYTHON=/tmp/pop-python/bin/python \
  POP_MODEL=Qwen2.5-Coder-3B-Instruct-Q4_K_M \
  POP_GGUF=/workspace/scratch/pop-models/qwen2.5-coder-3b-q4_k_m.gguf \
  POP_GGUF_SHA256=724fb256bec1ff062b2f65e4569e871ad2e95ab2a3989723d1769c54294730b7 \
  POP_MODEL_THREADS=2 POP_EVIDENCE_DIR=/workspace/scratch/pop-arlm-stage3-cp1 \
  /tmp/pop-python/bin/python tests/local_model_contract.py

env -u OPENAI_API_KEY -u OPENAI_BASE_URL \
  PYTHONPATH=/tmp/pop-local-wheel36 PYTHONDONTWRITEBYTECODE=1 \
  POP_MODEL_BACKEND=local POP_PYTHON=/tmp/pop-python/bin/python \
  POP_MODEL=Qwen2.5-Coder-3B-Instruct-Q4_K_M \
  POP_GGUF=/workspace/scratch/pop-models/qwen2.5-coder-3b-q4_k_m.gguf \
  POP_GGUF_SHA256=724fb256bec1ff062b2f65e4569e871ad2e95ab2a3989723d1769c54294730b7 \
  POP_MODEL_THREADS=2 POP_EVIDENCE_DIR=/workspace/scratch/pop-arlm-stage3-cp1 \
  bash tests/conductor-live.sh
```

The GGUF contract passed all four checks in 32.149 s. The live mission
observed a real `NameError`, corrected itself, produced gate 42 in both draft
and continuation, and matched the fresh status process. The mission
checkpoint is `run.PYYGU0/mission.json` under the evidence directory, SHA-256
`5a7ef0a64c356538e7e9c77247fbf019a3aebee6fd4aff0a24a7bcb7871b441d`.

## ARLM Stage 3 Checkpoint 2

The earlier remote metadata-only checkpoint at `8aaebc1` is retained in Git
history. Its lineage manifest and eight original checks are integrated here.

Baseline `0dbae1b2edbc573bca27d4d2632e7faffc3ea458`. Tests ran on Linux,
Node 24.22.3, Python 3.12.14, CPU PyTorch 2.6.0+cpu, the existing Docker
worker, and llama-cpp-python 0.3.36. Logs and the readiness report are in
`/workspace/scratch/pop-arlm-cp2`.

```sh
P=/workspace/scratch/pop-arlm-cp2
PYTHONDONTWRITEBYTECODE=1 /tmp/pop-trident-probe-venv/bin/python src/arlm_cli.py \
  "$P/readiness.sqlite" dataset-build \
  tests/fixtures/arlm_stage3/checkpoint2/empty-inventory.json \
  tests/fixtures/arlm_stage3/checkpoint2/empty-labels.json > "$P/readiness.json"

for t in arlm_dataset_contract arlm_leakage_contract arlm_perspective_inputs arlm_adapter_contract; do
  PYTHONDONTWRITEBYTECODE=1 \
    POP_STAGE3_FOUNDRY=/workspace/scratch/pop-foundry-evidence/contract-ojszyxuu/foundry \
    /tmp/pop-trident-probe-venv/bin/python "tests/$t.py" > "$P/$t.log" 2>&1 || exit
done
```

| Contract | Result |
| --- | --- |
| Dataset | 9 passed, including eight inherited metadata-manifest checks. Rebuilt a real ledger-linked intake in shuffled order, kept the ledger unchanged, rejected source and evaluator tampering and derivation cycles, and required exact correction approval for a training target. |
| Leakage | 1 passed. Detected planted shared sources, evaluator-source exposure, derived ancestry, shared assertions, close text variants, altered materialized retrieval, and injected gold fields or outcome relations. |
| Perspective and address | 1 passed. Reused real POP positions and the Stage 2 transformation. Equivalent times produced identical artifacts and frozen predictions. Research-head hooks observed frame, transformation, and address chunks and the expected removals during ablations. Conflicting or missing candidate fields were masked consistently. The thirteen-field audit records retained unresolved values, and the predictor validator rejected private fields. Alternate-provider disagreement was a contract fixture. |
| Checkpoint 1 adapter | 3 passed. Preserved 16 legacy bitwise logit/router comparisons, 123 frozen state tensors, and 24 remapped permutations. The fresh prediction process accessed no evaluator file. |
| Readiness | Passed engineering audit with 0 of 600 independent test families, 0 of 75 per condition, and a false readiness status. Report SHA-256 `94ee76794cf389d14346c1b0f6b2b4dd6cd658fc4b25a382965cbff0426195b4`. |

The first perspective run exposed a shared mutable address dictionary
between records resolved from the same coordinates. Each record now holds
its own field dictionary. An intermediate leakage test had a syntax error,
corrected before the passing run. No Stage 3 parameters were trained.

| Other exact regression commands | Result |
| --- | --- |
| `PYTHONDONTWRITEBYTECODE=1 /tmp/pop-trident-probe-venv/bin/python tests/arlm_contact_contract.py` | 1 passed in 38.396 s. |
| `PYTHONDONTWRITEBYTECODE=1 /tmp/pop-trident-probe-venv/bin/python tests/arlm_positional_meaning.py` | 1 passed in 45.442 s. |
| `PYTHONDONTWRITEBYTECODE=1 /tmp/pop-trident-probe-venv/bin/python tests/model_maker_contract.py` | 1 passed in 41.589 s. Ordinary Model Maker training regression only. |
| `npm test && bash tests/address-cli.sh` | 3 passed, plus separate-process address CLI. |
| `/tmp/pop-python/bin/python tests/conductor_components.py` | Passed with Docker. |
| `/tmp/pop-python/bin/python tests/automind_interpreter_smoke.py` | Passed with the original interpreter. The standalone image rebuild was skipped. |

The Qwen GGUF contract passed all 4 checks in 35.841 s. The live mission
passed worker failure, correction, verification, and restart. The mission
is `run.jYUr3J/mission.json` under the evidence directory, SHA-256
`8504ec589af946bcfa57150156a4eb5ae1182db096189b05163a0ed7b73142f5`.
Both commands used the following exact runtime settings.

```sh
qwen() {
  env -u OPENAI_API_KEY -u OPENAI_BASE_URL \
    PYTHONPATH=/tmp/pop-local-wheel36 PYTHONDONTWRITEBYTECODE=1 \
    POP_MODEL_BACKEND=local POP_PYTHON=/tmp/pop-python/bin/python \
    POP_MODEL=Qwen2.5-Coder-3B-Instruct-Q4_K_M \
    POP_GGUF=/workspace/scratch/pop-models/qwen2.5-coder-3b-q4_k_m.gguf \
    POP_GGUF_SHA256=724fb256bec1ff062b2f65e4569e871ad2e95ab2a3989723d1769c54294730b7 \
    POP_MODEL_THREADS=2 POP_EVIDENCE_DIR=/workspace/scratch/pop-arlm-cp2 "$@"
}
qwen /tmp/pop-python/bin/python tests/local_model_contract.py
qwen bash tests/conductor-live.sh
```

## 2026-11-23 — ARLM metadata guard (execution pending)

Reviewed live `src/arlm_dataset.py`, `src/arlm_evaluation.py`, and `tests/arlm_dataset_contract.py` on `integration/automind-conductor`. Added `test_unknown_condition_quarantined_before_partitioning` and a `CONDITIONS` whitelist in `build_manifest`. Intended regression command: `python -m unittest tests/arlm_dataset_contract.py` (with the repository's required fixture environment). **Not executed:** `git ls-remote https://github.com/justappgrabbin/Automind-POP.git HEAD` failed with `Could not resolve host: github.com` in the local execution container. No passing test claim is made for these commits.

## 2026-11-23 — Identifier-quarantine regression (pending execution)

Committed source guard and `test_ambiguous_identifier_whitespace_quarantined`. The intended command is `python -m unittest discover -s tests -p arlm_dataset_contract.py -k LineageManifestContract -v` (Python 3.11). `.github/workflows/arlm-lineage.yml` also compiles the ARLM modules. The local `git ls-remote https://github.com/justappgrabbin/Automind-POP.git HEAD` failed with `Could not resolve host: github.com`. The GitHub Actions runs endpoint did not show a run for the new workflow at inspection time. **No test pass is claimed.**

## 2026-11-23 — GitHub-hosted lineage regression executed

GitHub Actions [run 45278661391](https://github.com/justappgrabbin/Automind-POP/actions/runs/45278661391), workflow `ARLM lineage contract`, head SHA `aeb75d8800be5cc6fa97da2285d4c606e37e1741`, event `push`, completed with `conclusion: success` (2026-11-23 22:20:14 UTC). The jobs API confirms success for `actions/checkout@v4`, `actions/setup-python@v5`, `Compile ARLM modules and dataset contract`, and `Run deterministic lineage manifest contracts`. The committed command is `python -m unittest discover -s tests -p arlm_dataset_contract.py -k LineageManifestContract -v`. The workflow ran against the commit introducing the workflow, which already included the unknown-condition and identifier-whitespace regressions. No individual unittest count or stdout was retrieved; no claim is made for other test classes or the live mission. This supersedes the earlier pending-execution note for these guards.

## 2026-11-23 — All-link-field whitespace regression

Source `14467739` and test `b24c6693` add `test_lineage_tokens_with_ambiguous_whitespace_quarantined`: six lineage fields × three malformed scalar/list forms. The existing `.github/workflows/arlm-lineage.yml` triggers on `src/arlm_*.py` and `tests/arlm_dataset_contract.py` changes, compiling ARLM modules and running `LineageManifestContract` under Python 3.11. **At commit time execution is pending; no pass claimed for this new test.** The earlier successful run 45278661391 predates these commits.

### Executed CI result for lineage token guard

GitHub Actions [run 45296213554](https://github.com/justappgrabbin/Automind-POP/actions/runs/45296213554), head `b24c6693a4c7ca16226c76c3e7178ddc099147d5`, completed successfully on 2026-11-24 00:19 UTC. Retrieved job 138117142028 logs: Python 3.11.18; compile step succeeded; `python -m unittest discover -s tests -p arlm_dataset_contract.py -k LineageManifestContract -v` ran **11 tests in 0.003s, OK**, including `test_lineage_tokens_with_ambiguous_whitespace_quarantined`. This verifies the new manifest guard only; ledger-backed intake and conductor restart were not run in this workflow.


## 2026-11-26 — Personal workspace CI evidence

New source + tests:
- `src/personal-core.mjs`: evidence capture, MYLIFE documents, source-derived Pocket Sage scoring, coaching tracks, goals.
- `web/index.html`: mobile-responsive visible controls and browser session/local-storage workflow.
- `src/workspace-server.mjs`: localhost HTTP server calls existing `src/runtime.mjs` missions; reads allowlisted original vendor source documents.
- `tests/personal-core.test.mjs` and `tests/workspace-server.test.mjs`: deterministic contracts.

Verified GitHub-hosted runs:
1. [45807945597](https://github.com/justappgrabbin/Automind-POP/actions/runs/45807945597): **success**, head 62c6bcb7504c09c86c772a89a03bc25f122713b8. Node test suite (including personal core) and existing integration jobs.
2. [45808572903](https://github.com/justappgrabbin/Automind-POP/actions/runs/45808572903): **success**, head 7a0b8c751a87a47ba9220c1eef4e6df4bb5ab30b. Node test suite (including workspace HTTP bridge and mission dispatch) and existing integration jobs.
3. [45808815585](https://github.com/justappgrabbin/Automind-POP/actions/runs/45808815585): **success**, head d311c41e80cece5a58aee51fb0c40372eb675a6c. Node suite adds original source loading and path traversal guards alongside the existing integration jobs.

These results establish tested computations, server routing, request restrictions and source-file availability. The browser has not been visually inspected in a live hosted environment. A real user identity/login service, end-to-end AI coach, complete MIMO interviewing, real external deployment, persistent cross-device state, and original AutoMind broad task orchestration in the web UI have not been validated as completed.

The test harness uses a stub runtime to isolate route correctness. Separate existing AutoMind runtime Node contracts test its actual address/perspective/position implementations. A combined real-runtime HTTP end-to-end test is still required. No live external hosting, human-design integration, or standalone product certification is implied.
