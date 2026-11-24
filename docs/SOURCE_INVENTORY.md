# Source inventory

The Drive IDs in [the integration plan](INTEGRATION_PLAN.md) identify the original uploads. All 13 ZIP files were downloaded, hashed with SHA-256, and passed ZIP member integrity checks. Counts exclude directories. Archive checks establish source provenance. Execution evidence is in [test evidence](TEST_EVIDENCE.md).

| Archive | SHA-256 | Files | Contents and status |
| --- | --- | ---: | --- |
| adaptive-automl-framework-master.zip | `2d2e99438b9521f91d5497eb571590ef2481e80c66564704f3157ea3161e18b2` | 66 | Python quantitative modeling, backtest, causality, and forecasting tests. Root license present. |
| AutoApp-main.zip | `d5349dce1efc00f1f43cb6b11a50a6a4135a0e59158aff42349ece861a378226` | 280 | TypeScript app, agent-core, AI gateway, sandbox provisioner, and infrastructure manifests. Runtime unverified. |
| AutoMind-main.zip | `abcf01eae58980201c7b710998a0b503762a5f629a77fe901a966a17d3dd2b61` | 1155 | MIT. Original Python conductor, ML knowledge corpora, and MLE-Bench. Imported byte for byte. |
| biverse-guide-synthia-mesh-complete-20260725.zip | `a0a2de265f41293dc54520116fd67be089acb836b3379ddad81ab7f17a6da752` | 662 | MIT project metadata. Python and TypeScript mesh, dimensional, bodygraph, contact, and temporal tests. Dimensional source and tests imported. |
| Cynthia_Complete_Package.zip | `6e57f61b5c2528bbb459583b9a4b8b27dafb99b313cddf97115d25df1b6cbf90` | 80 | Toolkit, reporter, navigator, upload utility, and consciousness realm projects. Runtime unverified. |
| free-human-design-main.zip | `4cdf23eeebbbd971da1f46275ce2e2b6e98807f262100b240383724f1b95dfa9` | 62 | JavaScript chart implementation and package manifest. Root license present. Runtime unverified. |
| Human-Design-Success-Network-v0.1.zip | `3d2ae22d1ea49e4e4b66c5735605705aff733bbeb829e5062fcf222357dccaa6` | 331 | JavaScript social product with recovered PASS6 runtime. Retained as separate source. |
| HumanDesignAnalyzer_bundle.zip | `700631dd4a5845829018f28d5afedcab2b2360ab8adbd8a6c939a2fcb3b918ca` | 5 | Four JavaScript files and one image. Runtime unverified. |
| SynthAI-FULL-SUITE-r21.22-self-cultivation (1).zip | `b39f4317a1d5bed427632a2d3fc8b2225ba4cb772b10e7a85117160c49cbcd41` | 783 | JavaScript runtime plus self-cultivation and Biverse reference trees. Runtime unverified. |
| SynthAi.HumanDesign (1)-1.zip | `e3de33debaf246c15672682aa376a50bbf21ee52acc3f90d5e4c5e16e2a6067e` | 35 | C# Astrolo.HumanDesign project with lookup CSVs. Runtime unverified. |
| Synthia-Resonance-HD-Lossless.zip | `e0f970e65841d8c5476dd1cb7ded65f80b7defdc65e78a967a06952013b7f38a` | 245 | JavaScript runtime, audit report, and 14 nested archives. Runtime unverified. |
| Synthia-v0.5.1-EXECUTION-PIPELINE-PATCH-1.zip | `71af421b0e8ed9c6ed135b7b244c31bbe6c69b45b83a1b9a0724c87fb5df9365` | 19 | Node execution-pipeline archive with package manifest. Runtime unverified. |
| SynthiaMind.zip | `27c77fc3635eee2f6724366011357890d40cf7e0963f57edfda295819c93f785` | 856 | TypeScript application, parser-center, and a C# Human Design bridge. Runtime unverified. |

## Repository sources

- [SynthAi at `4b79d63f566e65515ae5c6f3d64f34b4c913f390`](https://github.com/justappgrabbin/SynthAi/tree/4b79d63f566e65515ae5c6f3d64f34b4c913f390/computer) supplies the event bus, state store, process fabric, capability registry, address service, and recovered YNIV and Foundry source. Files in `vendor/synthai` retain their `computer/`-relative paths. POP changed the JSON persistence adapter to write a temporary file and rename it into place.
- [Back-up- at `1c45318a668de3bb3c54ae488b3d5f4109d1ba6b`](https://github.com/justappgrabbin/Back-up-/tree/1c45318a668de3bb3c54ae488b3d5f4109d1ba6b) supplies the execution-spine validator and Kimi address dependencies via SynthAi’s pinned submodule.
- [AutoMind source](../vendor/automind/README.md) includes planner, coder, interpreter, improver, paper and trick retrieval, and the solution tree. All 1,155 imported files matched the ZIP entries byte for byte.
- [Biverse dimensional source](../vendor/biverse/human_design/dimensional.py) uses the archived [ontology](../vendor/biverse/human_design/assets/dimensions-v1.json). The Python bridge calls the original engine directly.

## Overlap and provider conventions

- The nested Biverse ZIP in the Lossless vault is byte-identical to the separately supplied Biverse archive.
- The Lossless vault and Success Network share 157 byte-identical source files at matching relative paths, including recovered runtime upgrades. This match is limited to Python, TypeScript, JavaScript, and MJS files. The inventory retains both lineages.
- YNIV coordinates, the Kimi DMS wheel, and the Foundry mandala have different conventions. The POP address command qualifies the YNIV route and validates its translated spine address. It records the original thirteen contract fields and preserves the spine representation in the receipt. Unresolved contract arc and zodiac fields stay null.
- The Biverse dimensional engine computes weighted affirmative observations and explicit clarity. The broader source architecture also defines observer, scale, phase, condition, time, and evidence factors. The mounted command covers the engine’s weighted observations and clarity operations.

## AutoMind conductor integration

The untouched AutoMind archive import remains recoverable from commit
`2d938b3`. The conductor integration adds an optional interpreter injection to
the original Agent and delays loading retrieval-specific dependencies until a
retrieval strategy needs them. It updates the original one-shot coder to preserve
the final real failure after retries and to put the last observed error in a
debug retry prompt. The original submission verifier now accepts finite JSON
number metrics with integer or fractional representations.

The POP adapter calls the original `Agent.step()` directly. The worker image runs
the unchanged original interpreter. POP uses the original trajectory serializer
and records improvement-parent IDs, the step counter, retrieval feedback,
analysis, RNG state, and start time alongside the resulting trajectory.

## Local inference qualification candidates

| Candidate | Weight source and SHA-256 | Intended role |
| --- | --- | --- |
| Qwen2.5-Coder-3B-Instruct Q4_K_M | [Publisher GGUF at `f74adce6`](https://huggingface.co/Qwen/Qwen2.5-Coder-3B-Instruct-GGUF/tree/f74adce6aa16316c625447af059dbebe4983757c), `724fb256bec1ff062b2f65e4569e871ad2e95ab2a3989723d1769c54294730b7` | First local conductor candidate |
| TinyLlama-1.1B-Chat-v1.0 Q4_K_M | [Quantization archive at `52e7645b`](https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/tree/52e7645ba7c309695bec7ac98f4f005b139cf465), `9fecc3b3cd76bba89d504f29b616eedf7da85b96540e490ca5824d3f7d2776a0` | Smaller CPU resource baseline |

The optional in-process runtime is `llama-cpp-python==0.3.36`. Weights stay
outside Git. See each publisher's terms before distributing weight files.

The prospective native Model Maker donor remains [Stellarproximology Lab
TRIDENT at `dd31be0`](https://github.com/justappgrabbin/Stellarproximology-lab/tree/dd31be007da9829df74460a82331aecf8634a1df).
Its original CPU suites passed real weight training, checkpoint revision/reload,
local inference, and rejection of unapproved records in read-only donor probes.
The local GGUF adapter does not import or promote those TRIDENT weights.

The first Model Maker slice imports the three pinned TRIDENT sources under
`vendor/trident/`. The verified donor commit, module boundary and checkpoint
provenance are recorded in [TRIDENT provenance](../vendor/trident/PROVENANCE.md).
POP keeps design, corpus and holdout fingerprints, training lineage,
compatibility and activation in its separate local registry.

## ARLM Stage 1 contact and authority references

`vendor/biverse/human_design/language_contact.py` is a byte-identical copy
from the Biverse archive recorded above, at
`biverse-guide/human_design/language_contact.py`. POP uses its original
`SemanticGraph`, `Diseminer.learn`, and `Autoling.suggest`. A source digest
pins the operator version in each ARLM manifest.

The ledger references qualified TRIDENT revisions for Θ, immutable donor
SQLite snapshots for G, captured POP address and perspective results for A
and P, revision-linked ARLM events for H, pinned Biverse source for O, and
address, model and lexical verification evidence for K. Address and
perspective artifacts retain their originating state path and locator.
The public projection follows the Execution Spine donor's through-Base
boundary while retaining all thirteen fields privately.

## ARLM Stage 2 positional interpretation

| Reused source | Stage 2 integration and scope |
| --- | --- |
| `vendor/biverse/human_design/language_contact.py` | Reads the verified Stage 1 DISEMINER tokens and node IDs. `arlm_interpretation.py` uses the original `SemanticGraph` to index and traverse typed constituent, assertion, concept, and context edges. Assertion records retain originating source and source revision. |
| `vendor/biverse/human_design/dimensional.py` and `assets/dimensions-v1.json` | `arlm_perspective.py` normalizes six-field frames, calls `PerspectiveEngine.locate` and optional `clarify`, and records the frame delta, invariants and suppressed proportions alongside the full original observation. Both donor inputs to the mapping are fingerprinted. |
| `src/runtime.mjs` and `vendor/synthai/services/address-service.mjs` | `arlm_address.mjs` runs the existing qualified YNIV route and canonical-spine verifier on evidence-supplied coordinates in temporary POP state. Mapping, routing and verification sources have distinct fingerprints. Other providers retain their own mappings; this adapter currently qualifies only YNIV. |
| `src/arlm_state.py` and `src/arlm_contact.py` | Existing SQLite transaction and activation journal publish evidence, interpretation and attachments. Stage 2 bindings pin event, graph, address, perspective, model and input digests. The Stage 1 encounter, public slice and approval/export paths are reused. |
| `vendor/trident/source/semantic_language_maker.py` and `model.py` | `arlm_trident_context.py` calls the donor encoder and real forward path on a pinned qualified checkpoint. The donor processes contextual triples through its existing feature and fusion path. The input artifact pins the full evidence and frame provenance. Learned perspective and address embeddings are a later contract. |

## ARLM Stage 3 Checkpoint 1

| Reused source | Integration |
| --- | --- |
| Stage 1 encounter and Stage 2 evidence graph | `arlm_inference.py` validates the active lineage and traverses the existing donor graph across all contexts for one evidence revision. It emits strict outcome-blind artifacts. `arlm_retrieval.py` applies the same bounded selection to every candidate. |
| Biverse perspective engine | The preview carries all six frame fields and the original five proportions with clarity. The full donor observation remains in Stage 2. |
| TRIDENT `source/model.py` and `source/semantic_language_maker.py` | A small optional hidden-representation return path reuses the original research head and retrieval fusion. The frozen adapter also uses the original eight Klein feature channels and bilinear relation composer. |
| Existing Foundry registry | The preview verifies the registered parent checkpoint and records its identity and digests. The experimental research-head path carries its own unqualified status. |
| Independent Stage 2 fixture oracle | A smoke-only private evaluation artifact references the oracle digest. `arlm_evaluation.py` validates the reference binding and implements family disjoint partitioning. |

## ARLM Stage 3 Checkpoint 2

The earlier remote metadata-only checkpoint at `8aaebc1` is retained in Git
history. Its lineage manifest and eight original checks are integrated here.

- `arlm_dataset.py` reuses verified Stage 1 encounters, Stage 2 source-linked
  graph assertions, and the preregistered connected-family partitioner.
- `arlm_leakage_audit.py` examines the materialized retrieval trace and
  cross-split expression, source, assertion, and derivation lineage.
- `arlm_address_evidence.py` uses the existing POP YNIV resolver and its
  receipt and mapping fingerprints. The private address view retains all
  thirteen fields. Predictor views redact fields after Base and apply a
  symmetric mask where coverage or provider agreement is missing.
- `arlm_training_data.py` validates private evaluator bindings, correction
  history, and exact interpretation-specific approvals. It prepares targets.
- The optional v2 predictor path projects recorded Biverse transformation and
  eligible address facts through the existing TRIDENT research-head retrieval
  interface. The donor architecture, checkpoints and v1 behavior are preserved.

## ARLM intake hardening — 2026-11-23

`src/arlm_dataset.py` continues to use the original ledger-derived inference and the frozen `CONDITIONS` declared in `src/arlm_evaluation.py`. Its standalone lineage manifest now quarantines unknown condition names before partition assignment, matching the existing ledger-backed case validation. This is metadata validation only; no donor source or preregistration was modified.

## 2026-11-23 lineage contract inventory

- `src/arlm_dataset.py` is the existing source-preserving Stage 3 partition manifest builder; it now rejects whitespace-ambiguous family and revision identifiers. The manifest retains the original condition and lineage-closure policy.
- `tests/arlm_dataset_contract.py` contains the added identifier-quarantine regression.
- `.github/workflows/arlm-lineage.yml` is a new minimal Python 3.11 contract runner on the integration branch. It executes the manifest-only tests without requiring a live ledger or model weights; its execution has not yet been observed.

## 2026-11-23 — Verified lineage CI execution

The original `src/arlm_dataset.py` lineage builder and `tests/arlm_dataset_contract.py` regression were exercised by `.github/workflows/arlm-lineage.yml` on GitHub-hosted Python 3.11. Workflow run 45278661391 (head `aeb75d8800be5cc6fa97da2285d4c606e37e1741`) completed successfully. This is an executed contract check, not new donor import or qualification evidence.

## 2026-11-23 — Lineage token normalization guard

`src/arlm_dataset.py` now rejects leading/trailing whitespace in each of the six lineage link fields, including list members, rather than silently stripping those values before connected-family assignment. `tests/arlm_dataset_contract.py` adds a field-by-field regression for scalar and list values. No original donor files, frozen protocol, or trained artifacts changed.
