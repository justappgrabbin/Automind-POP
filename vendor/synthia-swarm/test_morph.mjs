// The swarm becomes a host's missing function, from the host's own check only. Nothing about the effect is in the swarm.
import { World } from "./hostworld.js"; import * as M from "./morph.js"; import { LivingSwarm } from "./living.js";
import { readFileSync } from "node:fs";
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? "  PASS " : "  FAIL ") + n); };
const bright = c => (c[0] + c[1] + c[2]) / 3 > 200, reddish = c => c[0] > 150 && c[1] < 90 && c[2] < 90;
// --- HOST A (written as a host would write it; the swarm never sees this code, only the number it returns) ---
const A = new World({ name: "cold-valley", temperature: -5 });
A.checks.push({ measure: W => { let n = 0; for (let x = 0; x < W.w; x++) if (bright(W.cells[(W.h - 1) * W.w + x])) n++; return W.temperature < 0 ? n / W.w : 1; } });
const S = new LivingSwarm({ seed: 3 }); for (let i = 0; i < 40; i++) S.add({ gate: 1 + i, line: 1 + i % 6, dimension: "Movement" }, "person");
const lib = { formations: [] };
const r = M.morphInto(A, S, lib);
const st = n => r.steps.find(x => x.step === n);
for (const x of r.steps) console.log("    ", JSON.stringify(x));
ok("enter: the host's own check fails without the swarm", st("enter").scoreWithout < 0.5);
ok("morph: the units found a behaviour that meets the host's check, by trying", st("morph").bestScore >= 0.9 && st("morph").tried > 1);
ok("clone + integrate: the clones are now one of the host's systems", st("integrate").systems === 1);
ok("extract: with the original units gone the host still meets its check", st("extract").scoreWithSwarmGone >= 0.9 && !st("extract").clonesReferToSwarm);
ok("the original units are free again (no role left)", S.units.every(u => !u.role));
ok("learn: the formation is kept with where and under what conditions", lib.formations.length === 1 && lib.formations[0].learnedIn === "cold-valley");
ok("nothing about the effect is written in the swarm's code", !/snow|weather|white|winter|frost/i.test(readFileSync("./morph.js", "utf8")));
// --- HOST B: a different need. Reuse is tried first; if it doesn't fit, the units find something else ---
const B = new World({ name: "red-wall", temperature: 20 });
B.checks.push({ measure: W => { let n = 0; for (let y = 0; y < W.h - 1; y++) if (reddish(W.cells[y * W.w])) n++; return n / (W.h - 1); } });
const r2 = M.morphInto(B, S, lib);
ok("host B: what was learned is tried first", r2.steps[1].step === "reuse-try");
ok("host B: it did not fit, so the units became something else that does", r2.ok && JSON.stringify(r2.steps.find(x => x.step === "morph").behaviour) !== JSON.stringify(lib.formations[0].behaviour));
// --- HOST C: same need as A in a different world: solved from experience with no search ---
const C = new World({ name: "high-pass", w: 30, h: 24, temperature: -12 });
C.checks.push(A.checks[0]);
const r3 = M.morphInto(C, S, lib); const m3 = r3.steps.find(x => x.step === "morph");
ok("host C: the same need elsewhere is met from experience on the first try", r3.ok && m3.reused === "cold-valley" && m3.tried === 1);
console.log(`\n${pass} passed, ${fail} failed`); if (fail) process.exit(1);
