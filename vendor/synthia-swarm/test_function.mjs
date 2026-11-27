// test_function.mjs — the function side runs the user's 16 Klein tools.  node synthia/test_function.mjs
import * as F from "./function_side.js";
import { maskFromKingWen } from "./kingwen.js";
let pass = 0, fail = 0; const ok = (n, c, i = "") => { if (c) { pass++; console.log("  PASS", n); } else { fail++; console.log("  FAIL", n, i); } };
const L = g => Array.from({ length: 6 }, (_, i) => (maskFromKingWen(g) >>> i) & 1);
console.log("33. 16 Klein tools in the 16 core hexagrams; outer lines = 4 kinds");
ok("there are exactly 16 cores", F.CORES.length === 16 && F.CORES.join() === "1,2,23,24,27,28,37,38,39,40,43,44,53,54,63,64");
const by = new Map(); for (let g = 1; g <= 64; g++) { const c = F.coreGate(L(g)); by.set(c, [...(by.get(c) ?? []), g]); }
ok("each core is shared by exactly 4 hexagrams", [...by.values()].every(v => v.length === 4));
ok("the 4 hexagrams of a core differ only in lines 1 and 6, and cover all 4 kinds",
  [...by.values()].every(gs => new Set(gs.map(g => F.kindOf(L(g)))).size === 4 && new Set(gs.map(g => L(g).slice(1, 5).join(""))).size === 1));
ok("all 16 tools get a different core", new Set(F.PAIRING.map(p => p.core)).size === 16 && F.PAIRING.length === 16);
ok("a tool keeps its own repo gate's core when it is free", F.PAIRING.filter(p => p.byOwnGate).every(p => F.coreGate(L(p.repoGate)) === p.core));
ok("the I Ching grammar sits in its own gate's core (61 -> 27)", F.PAIRING.find(p => p.tool === "iching-grammar").core === 27);
const qian = L(1);
ok("Qian's core is Qian; its outer lines 1,1 = video", F.abilityOf(qian).core === 1 && F.abilityOf(qian).kind === "video");
ok("fewer than six lines: no tool on its own", F.abilityOf([1, 0]) === null && F.runAbility([1, 0, 1]).ok === false);
ok("particles pool their lines into a whole hexagram", F.formationLines([{ lines: [1] }, { lines: [0, 1] }, { lines: [1, 0, 0] }]).join("") === "101100"
  && F.formationLines([{ lines: [1, 0] }]) === null);
const g61 = by.get(27).find(g => F.kindOf(L(g)) === "semantic");
const r = F.runAbility(L(g61), { transform: "core" });
ok("a real tool runs: the I Ching grammar computes the core of its own hexagram", r.ok && r.tool === "iching-grammar" && r.output.transformed.lines.join("") === F.coreLines(L(g61)).join(""));
ok("a tool that needs input it was not given says so (no fake output)", (() => { const x = F.runAbility(L(F.PAIRING.find(p => p.tool === "autonovel").viaGate)); return x.ok === false && !!x.reason; })());
const p = F.promise([1, 1, 0, 1], [1, 0, 0, 1]);
ok("promise bond: only the overlap passes (AND)", p.effective.join("") === "1001" && p.kept);
ok("nothing in common = no binding", F.promise([1, 0], [0, 1]).kept === false);
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
