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
