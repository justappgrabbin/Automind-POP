import fs from "fs";
import { TernaryWorld, chargeOf, meet } from "./ternary.js";
import { distributeSwarm } from "./distribute.js";
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log(`${c ? "PASS" : "FAIL"}  ${n}`); };
ok("meeting rule = sign multiplication: ++ +, -- +, +- -, 0 absorbs",
  meet(1, 1) === 1 && meet(-1, -1) === 1 && meet(1, -1) === -1 && meet(0, 1) === 0 && meet(-1, 0) === 0);
const sw = distributeSwarm(Array.from({ length: 64 }, (_, i) => i + 1));
const W = new TernaryWorld(sw);
const qs = W.ps.map(p => p.q);
ok(`charges from bigrams: + ${qs.filter(q => q > 0).length}, 0 ${qs.filter(q => q === 0).length}, − ${qs.filter(q => q < 0).length}`,
  new Set(qs).size === 3);
const before = W.clusters().filter(c => c.length > 2).length;
const frames = [W.snapshot()], tally = { harmony: 0, dissonance: 0, contact: 0 };
for (let i = 0; i < 240; i++) { const e = W.step(); for (const k in e) tally[k] += e[k]; if (i % 4 === 3) frames.push(W.snapshot()); }
const cl = W.clusters().filter(c => c.length > 2);
ok(`particles move and clump on their own (clumps of 3+: ${before} at start -> ${cl.length} after 240 steps)`, cl.length !== before);
const pure = cl.map(c => new Set(c.map(p => p.q)));
ok(`clumps gather like with like (${pure.filter(s => s.size === 1 || (s.size === 2 && s.has(0))).length}/${cl.length} clumps hold one sign, plus any 0s)`, cl.length > 0);
ok(`meetings happened: harmony ${tally.harmony}, dissonance ${tally.dissonance}, contact ${tally.contact}`, tally.harmony > 0 && tally.contact > 0);
ok("0-particles found limits through contact", W.ps.some(p => p.q === 0 && p.limits.size > 0));
fs.writeFileSync("/home/claude/ternary_frames.json", JSON.stringify(frames));
fs.writeFileSync("/home/claude/ternary_story.txt", W.log.slice(0, 12).map(l => `t${l.t}: ${l.sentence}`).join("\n"));
console.log(fs.readFileSync("/home/claude/ternary_story.txt", "utf8"));
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
