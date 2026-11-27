# Synthia / Claude's Little Miracles — Swarm OS donor checkpoint

## Authority and scope
AutoMind remains the conductor. This feature branch is based on integration/automind-conductor at 9a69208a54f79671f358de8d0bdd8933282bae99. The Synthia source is a distinct, working computational donor, not a replacement conductor. No changes to main, existing AutoMind source, its addressing, or its existing UI.

Source inputs: synthia_v64_swarm_os_gameenginex.zip and Synthia_GameEngineX_teacher_settings.zip (user-supplied conversation archives). Earlier archive: 821 files; newer archive: 1064 files; 495 common paths, three shared files with differing content; 326 earlier-only paths, 569 newer-only paths. The newer morphogenesis.js fixes the case constraint check (matches()). The living.html is a three-way merge retaining the OS dock and native GameEngineX/teacher controls. Original archive copies remain outside this public repository.

The 127 selected source files under vendor/synthia-swarm are the actual source, not stubs; every file's Git blob SHA was compared to the local source SHA before committing. They include the original native organism, morphogenesis and unit construction, GameEngineX host and formation export/import, the teacher preference/dialogue modules, Klein/MESSY dependencies, the dock and registry source, and the selected test dependency closure. The full research collection, nested Git histories, archives, and unselected assets are not published. Vendor licensing/provenance review is still required before general redistribution.

## Test evidence
Node local execution on the merged source (2026-11-26, Pacific):
- node test_gameenginex_morph.mjs: native units constructed a two-step formation, checked two cases, independently executed a serialized descendant in a third state, then imported and recalled it in a fresh organism.
- node test_gameenginex_host.mjs: unknown goal stopped; text alone did not execute; demonstrated action and transfer to unseen door; Klein/MESSY receipts and restored memory.
- node test_teacher_settings.mjs: persistent instructions, independent modes, off switch, serialization, cancellation and reuse.
- node test_teacher_dialogue.mjs: rejected teacher action recipe, retries and verified formation, unavailable teacher stops, changed objective rejected. Teacher was a test double, not actual inference.
- node test_swarm_dock.mjs: 25 assertions, live unit objects and static wiring.
- node gameenginex/test_bridge.mjs: 13 bridge assertions.
- node test_morphogenesis.mjs: 11 passed, zero failed; world and application hosts, transfer, independent descendant.
- node test_capability_registry.mjs: 10/10 in full local merged archive. The large harvested inventory assets and this test are not included in the selected GitHub runtime closure.

The first seven commands were separately rerun successfully on the selected 127-file closure. To reproduce:
```sh
cd vendor/synthia-swarm
for t in test_gameenginex_morph.mjs test_gameenginex_host.mjs test_teacher_settings.mjs test_teacher_dialogue.mjs test_swarm_dock.mjs gameenginex/test_bridge.mjs test_morphogenesis.mjs; do node "$t" || exit 1; done
```

## Remaining integration
This is a computational donor checkpoint, not a finished AutoMind feature. The selected browser shell source requires additional omitted assets and browser validation before it can be launched as the full OS. The actual TinyLlama inference, AutoMind conductor-to-swarm dispatch, user-facing navigation, independent consumption receipt, and restart persistence across the combined computer remain unverified. Preserve AutoMind's original mission machinery and use its existing provider qualification and execution boundaries to connect the swarm. Require externally supplied goals, verified execution, explicit learning receipts, and export/import of formations; teacher text must not directly execute. Keep the user's exact 13-position address order and one-substrate dimensional model. Do not claim that this branch completes the entire system or merge to main without review.
