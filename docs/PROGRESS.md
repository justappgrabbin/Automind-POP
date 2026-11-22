# Implementation checkpoint

- The original AutoMind source, ML knowledge corpus, tests and benchmark configuration are preserved under `vendor/automind`, with the pristine extraction in commit `2d938b3`.
- POP computes YNIV addresses through SynthAi's ProcessFabric, records provider routing, verifies execution-spine addresses, and persists downstream consumption receipts.
- POP runs Biverse's original perspective engine for weighted observations and explicit clarity over Movement, Evolution, Being, Design, and Space.
- The [conductor runner](../src/conductor.py) invokes the original `Agent.step()` and supplies POP's isolated Python capability as the agent's interpreter. POP feeds worker exceptions and rejected submissions back as original `ExecutionResult` values. The original one-shot coder and search policy drive retries.
- M2 began with a persisted comparison of the Kimi and Foundry mappings at the same tropical position. The recorded sample has different gate assignments.
- A real worker component run verified container execution, controlled exception detection, incorrect CSV rejection, successful CSV consumption, and original development state restoration in a new Python process. The supplied candidates were trusted test programs.

See [test evidence](TEST_EVIDENCE.md) and [source inventory](SOURCE_INVENTORY.md).

## Local model checkpoint

AutoMind's existing query boundary can now invoke a checksum-pinned GGUF in
process using llama.cpp. Qwen passed the real text and structured-output
probes. TinyLlama passed the structured probe and gave a contradictory
plain-text answer. The local conductor stores the model identity, inference
settings, candidate source, model inputs and outputs, and worker receipts.

The original planner, coder, and improver inherit a POP address prompt
profile through their existing prompt hooks. It describes the actual worker
and input shape so the agent can generate candidates for the isolated runtime.
Their original search, generation, retry, verification and trajectory methods
remain the execution path.

## Accepted local mission

The pinned Qwen Q4 model generated the address plan, produced a candidate
that raised a real worker exception, corrected it from the traceback, and
passed the original verifier and independent POP CSV consumer. The conductor
restored the same model identity in a fresh process, produced a verified
improvement node linked to its draft, and matched the checkpoint on a third
read. Running with a different context limit refused resume. See
[model and execution evidence](TEST_EVIDENCE.md#local-quantized-inference).

The next architectural change needs user approval. It starts with the
bounded TRIDENT Model Maker contract below.

## Proposed Model Maker change for review

Files proposed for the next change are `vendor/trident/PROVENANCE.md`,
`vendor/trident/training_core.py`, `vendor/trident/source/model.py`,
`vendor/trident/source/semantic_language_maker.py`, `src/model_maker.py`,
`src/model_registry.py`, `src/model-maker-requirements.txt`,
`tests/model_maker_contract.py`, and the README and existing evidence records.

Reuse the original TRIDENT training and checkpoint path. A validated user
design and hardware budget produce a versioned construction specification.
An approved, provenance-tagged corpus can produce a trained revision. A
separate holdout and head-specific acceptance result qualify that revision
for a declared role. Registry activation and rollback check weight digests
and runtime compatibility and retain the agent's existing trajectory.

The first contract should exercise actual parameter changes, checkpoint
reload, CPU generation, one existing specialist head, held-out evaluation,
rejection of incompatible activation, and registry restoration in a fresh
process. Corpus privacy, unsafe or mismatched checkpoint formats, and a
training budget overrun are concrete risks. Contact-derived records and
quantized specialist promotion need their own evidence before qualification.

## Implemented Model Maker slice

The approved TRIDENT slice is implemented in [Model Maker](../src/model_maker.py)
and [registry](../src/model_registry.py). The CLI turns a design and CPU budget
into a stable model identity and construction specification. A run trains from
the last registered revision, evaluates against disjoint held-out prompts,
and records a head-specific qualification. Activation and rollback verify
the registered artifact hashes and PyTorch version. Original AutoMind
trajectories and the Qwen conductor remain the execution baseline.

The next architecture review should establish the language-contact record and
approval interface for converting a verified experience into a future training
example. That requires inspection of the original contact and cultivation
ledgers, with ATO provenance and the existing relational address retained.

## ARLM Stage 1

The [ARLM CLI](../src/arlm_cli.py) publishes an atomic seven-component
manifest with a Biverse graph snapshot and an encounter revision. The
original donor executes on a private graph copy. A verified observation
makes that graph visible at publication. Rejected observations retain their
trace and leave the previous graph in use. Fresh processes check artifact and
model compatibility, replay duplicate encounter IDs, and recover the active
revision. Rollback adds an activation record and retains all historical
revisions.

The lexical fixture test exercised contact, public address projection,
independent verification, training approval, atomic failure and retry,
and correction and rollback. Exported JSONL entered real TRIDENT training
with a matching corpus digest. Corrections supersede earlier interpretations
for export. The accumulated graph remains a record of lexical observations.

Stage 2 requires separate approval. Its first review must specify how
concept-driven semantic addresses, typed graph relations, perspective
transformations, and context-dependent ATO operations enter TRIDENT
representations, training, and inference.

## ARLM Stage 2

Stage 2 branches from `718ef4fc607c05d2aeb3d67645582b51630980cb`. It adds
private typed evidence indexing, reproducible contextual resolution and
re-observation, and checkpoint-pinned TRIDENT input and computation artifacts.
Evidence, interpretation, and activation remain distinguishable. Experiment 1
and regression results are in `TEST_EVIDENCE.md`.

The next action is a Stage 3 architectural review for direct neural conditioning
on semantic addresses and perspective transformations, with independently
defined holdout tasks and model revision qualification. Stage 3 requires
separate approval.

## ARLM Stage 3 Checkpoint 1

Implemented the outcome-blind artifact builder, private evaluator schema,
frozen checkpoint preview, permutation controls, and independent evaluation
preregistration against `6faf759a95fbb698f7a2097d1d03f5cd452517f2`.
The adapter has no operational qualification. Its preview leaves the ARLM
activation journal untouched.

The next action is to review the evidence and obtain separate approval before
training, qualification, or activation. Independent dataset intake and the
pretraining corpus audit remain open.

## ARLM Stage 3 Checkpoint 2

The earlier remote metadata-only checkpoint at `8aaebc1` is retained in Git
history. Its lineage manifest and eight original checks are integrated here.

Implemented verified-ledger dataset materialization, private target and
address views, correction approval, lineage and retrieval audits, and the
v2 frozen preview. The preregistration file was preserved byte for byte.
The readiness fixture reports zero independent qualification families.

Next action is independent source and evaluator intake against the frozen
protocol. Neural training, qualification, and activation require separate
approval. See the Checkpoint 2 test evidence and blockers.
