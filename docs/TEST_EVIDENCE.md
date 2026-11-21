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
