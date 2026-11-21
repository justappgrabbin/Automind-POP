# Implementation checkpoint

- The original AutoMind source, ML knowledge corpus, tests and benchmark configuration are preserved under `vendor/automind`, with the pristine extraction in commit `2d938b3`.
- POP computes YNIV addresses through SynthAi's ProcessFabric, records provider routing, verifies execution-spine addresses, and persists downstream consumption receipts.
- POP runs Biverse's original perspective engine for weighted observations and explicit clarity over Movement, Evolution, Being, Design, and Space.
- The [conductor runner](../src/conductor.py) invokes the original `Agent.step()` and supplies POP's isolated Python capability as the agent's interpreter. POP feeds worker exceptions and rejected submissions back as original `ExecutionResult` values. The original one-shot coder and search policy drive retries.
- A real worker component run verified container execution, controlled exception detection, incorrect CSV rejection, successful CSV consumption, and original development state restoration in a new Python process. The supplied candidates were trusted test programs.

See [test evidence](TEST_EVIDENCE.md) and [source inventory](SOURCE_INVENTORY.md).

## Exact next action

Configure `POP_MODEL` and `OPENAI_API_KEY` for a tool-capable OpenAI-compatible chat completions endpoint. Set `OPENAI_BASE_URL` for a non-default endpoint. Run `POP_PYTHON=python bash tests/conductor-live.sh` with the worker image and documented dependencies. The acceptance command invokes the original planner, uses a real worker failure as feedback to the coder, resumes `Agent.step()` in a second process, and checks the persisted lineage and verified receipt.

After that run, record the live model and evidence, then move to the M2 positional and Human Design provider comparison in [the integration plan](INTEGRATION_PLAN.md).
