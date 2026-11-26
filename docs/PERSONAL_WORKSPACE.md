# AutoMind POP personal workspace — implemented slice

This is a cumulative addition to the original AutoMind POP computer, not a replacement for the original Agent, one-shot/stepwise planners, interpreter, POP, Biverse, Foundry, TRIDENT or ARLM. The address mission remains available and regression-tested.

## Run locally

Requires Node.js 22+, the repository checkout, and any runtime-specific prerequisites for the particular AutoMind mission (e.g. Python/Biverse for perspective requests).

```bash
node src/workspace-server.mjs
```

Open **http://127.0.0.1:8787** on the same computer.

The HTTP bridge binds only to 127.0.0.1 and only accepts three allowlisted original runtime missions. It does **not** provide Internet access, accounts, authentication, cloud sync, or remote phone access. Do not expose this bridge publicly without adding authentication, transport security, access controls and secure storage.

## Visible implemented functions

- **MIMO:** Source-guided prompts based on actual experiences, decisions, costs, counterexamples and user-authored personal values, with correction fields. This is an interview evidence collector, not yet a complete model-driven MIMO deep interview/report generator.
- **MYLIFE Vault:** Twelve persistent-in-browser, editable document categories, and a server route to load original licensed templates. One-click Markdown export of a selected document.
- **Pocket Sage:** A JavaScript adaptation of actual `Pocket-Sage/client/lib/decision-engine.ts` calculations: weighted expected utility, 3x asymmetric irreversible risk, cognitive load, log(1+N) optionality, original recommendation thresholds and confidence heuristic. The user supplies numeric assumptions. The original archive contained no obvious root LICENSE file; code was adapted for this authorized personal project, and its original source remains in the supplied archive rather than claimed to be imported verbatim.
- **Sage Coach:** Four original skill tracks (career, crisis, startup, spiritual) plus authenticated? **No:** no AI coach/session is running yet. Each original MIT skill method is available to read from the local server. Users can save track-specific notes.
- **Goals:** Add goals, set planned/active/complete status, and export/import the personal record.
- **AutoMind computer:** Address resolution, perspective location, and position comparison submit JSON to the preexisting `src/runtime.mjs` using the allowlisted `/api/mission` route, with original persistence and runtime verification. Other original functionality remains in the repository and will need accessible controls.

## Provenance and preservation

Original MIT sources stored in `vendor/personal/mimo`, `vendor/personal/mylife`, and `vendor/personal/sage-coach` with their LICENSE files. Origin repositories:
- https://github.com/Angel2518975237/mimo-skill
- https://github.com/yys5584/mylife-vault
- https://github.com/joyozhang333-lgtm/sage-coach

Source adaptation in `src/personal-core.mjs` is based on the user's supplied four ZIPs, including Pocket Sage's original TypeScript decision engine. No original archived sources have been removed.

## Data controls and limitations

Personal records start in memory only. Browser persistence is strictly opt-in; disable to clear the persisted local record. JSON export and import are available, along with explicit erase. No data is sent to an LLM by this interface. Local browser storage is not encrypted, not suitable for a shared or compromised device, and offers no cloud backup. The origin restriction on the local bridge is not a substitute for authentication.

## Verification

```bash
npm test
```

Tests: `tests/personal-core.test.mjs` (source module discovery, interview evidence, vault, formulas, probability errors, goal lifecycle, serialization), `tests/workspace-server.test.mjs` (HTML/module delivery, original runtime method dispatch, rejected arbitrary execution, cross-origin rejection, licensed template delivery and traversal protection). Existing `npm test` contracts also execute.

No end-to-end browser-based evidence, authenticated deployment, or complete AI interviewer/coach is claimed by these unit/integration tests.

## Still to integrate

- Adaptive MIMO dialogue and evidence-led original report delivery using an actual model, user approval and source playbooks.
- Twelve MYLIFE editable templates with explicit user-controlled reflection/review workflows and source preservation.
- Full Pocket Sage interface for multiple options, adjustable user weights, EVI, Bayes and other original engine methods.
- Real coaching orchestration rather than static instructions/notes.
- AutoMind original arbitrary problem intake, retrieval, planning/coding modes, interpreter and other accumulated capabilities accessible in browser.
- Server-backed encrypted, scoped and authenticated private personal storage if remote/multi-device access is needed.
- User-provided Biverse Human Design mesh integration following compatibility tests and user intent.
- Real browser automation and on-device screenshots.

Never equate these pending items with finished features.
