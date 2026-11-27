// Finishing pass (Nov 22): bond computation merged back into v27, formations act on their own, cultures keep across reloads.
import { LivingSwarm } from "./living.js";
import { OrganismSwarm } from "./organism_swarm.js";
import * as KL from "./klein_local.js";
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? "  PASS " : "  FAIL ") + n); };
const mk = (seed) => { const S = new LivingSwarm({ seed }); for (let i = 0; i < 40; i++) S.add({ gate: 1 + (i * 7) % 64, line: 1 + i % 6, color: 1 + i % 6, tone: 1 + i % 6, base: 1 + i % 5,
  dimension: ["Movement", "Evolution", "Being", "Design"][i % 4] }, "person", 0.4 + (i % 7) * 0.03, 0.4 + Math.floor(i / 7) * 0.03); return S; };
const S = mk(3), O = new OrganismSwarm(S);
for (let t = 0; t < 60; t++) O.step();
ok("stepping alone no longer runs tools (they run only for a need now)", S.units.every(u => !u.output));
O.runFormations();
ok("bonds compute in the organism (products on units)", S.units.some(u => u.transforms.size > 0));
const runs = S.units.filter(u => u.output);
ok("runFormations is kept and still works when called", runs.length > 0);
ok("each run names its tool, kind and the units that made it", runs.every(u => u.output.tool && u.output.kind && u.output.units.length >= 1));
ok("a formation's result is the tool's own answer or its own reason", runs.every(u => u.output.ok || typeof u.output.reason === "string"));
const before = runs.length; O.runFormations();
ok("the same formation does not re-run for nothing", O.lastRuns.length < before || O.lastRuns.length === 0);
// cultures across a reload
for (const u of S.units.slice(0, 5)) KL.live(u, "attract", "part", "open", true);
const saved = JSON.parse(JSON.stringify(KL.exportCultures(S)));
const S2 = mk(3); KL.grow(S2); const n = KL.applyCultures(S2, saved);
ok("saved cultures go back to the same identities after reload", n >= 5 && S2.units[0].culture.lived === S.units[0].culture.lived);
KL.live(S2.units[1], "repel", "part", "lift", true); const lived = S2.units[1].culture.lived;
KL.applyCultures(S2, saved);
ok("a unit that has lived since is not overwritten", S2.units[1].culture.lived === lived);
console.log(`\n${pass} passed, ${fail} failed`); if (fail) process.exit(1);
