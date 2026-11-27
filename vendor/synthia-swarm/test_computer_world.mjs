import { ComputerWorld } from "./computer_world.js"; import { loadVocabulary } from "./vocabulary.js";
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? "ok  " : "FAIL") + " " + m); };
await loadVocabulary();
const S = { units: [
  { id: 0, kind: "person", address: { gate: 4 }, bonds: [{ a: 0, b: 1, visible: true }], face: { name: "mean" } },
  { id: 1, kind: "mover", address: { gate: 63 }, bonds: [{ a: 0, b: 1, visible: true }] },
  { id: 2, kind: "item", address: { gate: 4 }, bonds: [] }] };
const W = new ComputerWorld(); W.sync(S);
const st = W.stats(); ok(st.live === 5, `facts told into the real MESSY network (${st.live} live)`);
const t = W.narrate(); console.log("     AutoNovel: " + t); ok(/person 0/i.test(t) && /mover 1/i.test(t), "AutoNovel narrates the swarm");
ok(W.narrate() === "", "nothing new → nothing said");
S.units[0].bonds = []; S.units[1].bonds = []; W.sync(S); const neg = W.kc.m.out.flatMap(b => b.entries).filter(e => e.neg); ok(W.stats().live === 4 && neg.length === 1 && neg[0].r === "TOUCH", "broken bond negated in MESSY (on its change stack; AutoNovel does not narrate negations)"); W.narrate();
const a = W.analogy("U0", "G4", "U1"); console.log("     U0 : G4 :: U1 : ?", JSON.stringify(a?.answer)); ok(Array.isArray(a?.answer) && a.features.every(f => /^(AT|WEAR|TOUCH):/.test(f)), "ATO answers from live facts only");
console.log(`${pass}/${pass + fail}`); process.exit(fail ? 1 : 0);
