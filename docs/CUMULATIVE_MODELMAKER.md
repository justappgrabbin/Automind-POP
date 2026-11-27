# Cumulative Model Maker integration

Base: integration/synthia-swarm-os at 484bf7f3f1b05f11e6aa3c167813d78a9a593a81. Existing files must remain unchanged during source intake. Original AutoMind tree copied from main at d4e7a3ed34ea65300ca279c8c7fdabbcb803bcaf into vendor/automind-original, alongside the existing adapted conductor. Research archives 01, 02, 03, 04, 06 carried across by original Git blob IDs. Archive 05 not located.

This is a source preservation checkpoint, not runtime integration or a finished release. Next: inspect the supplied model-building packages, verify provenance/licensing and screen private runtime data before transferring to this public repository. Add compatible loaders and training adapters to existing TRIDENT, not a replacement. Keep existing CLI, registry, UI and tests. Chitra and Drishya require their own inference architecture and weight validation. Do not claim runtime or Android success without tests.

## 2026-11-27 external toolkit intake
- Public upstream sources pinned to the exact commit IDs embedded in the supplied Drive ZIPs: Train LLM From Scratch (MIT) bdd480a518094ca834e05ab32131dc126b522d3d; Semantic Model Generator (Apache-2.0 with accompanying legal notices) 8c011a3a4e53b3319d3c4c0109404285878a70f9.
- Added an external launcher to the existing TRIDENT CLI; native commands unchanged. The launcher dispatches actual upstream scripts in separate processes, preserving their imports. It does not yet unify external checkpoint revisions with the TRIDENT registry or expose them in the mobile UI.
- Dandelion, Cynthia Morph Modelmaker and Model Weaver original ZIPs remain in Drive; they include private runtime databases or Git history and were not published to this public repository. Their source integration remains open; preserve originals and transfer only reviewed source/assets or use a private repository/local workspace.
- Local environment inspection: PyTorch 2.10.0 CPU available; actual upstream factory import failed with ModuleNotFoundError: jaxtyping. Installation attempt failed (no distribution available in this environment). No model inference or training completion claimed. External checkpoints must be trusted: upstream checkpoint loader uses torch.load(weights_only=False). Semantic UI requires Snowflake configuration for its backend.
- Chitra and Drishya model weights remain separate downloads, not included in this commit; visual model loaders remain open.

### Commands
```sh
git submodule update --init --recursive
python -m pip install -e 'vendor/train-llm-from-scratch[ui,train]'
python src/model_maker.py ./workspace external llm report --preset tiny
python src/model_maker.py ./workspace external llm chat --ckpt /absolute/path/to/trusted.pt --prompt 'Hello' --device cpu
```
External commands operate on upstream paths, not the native TRIDENT workspace registry. Supply absolute paths when referring to files outside the upstream directory.
