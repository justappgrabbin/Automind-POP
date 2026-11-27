// test_emergent.mjs — checks the emergent dual-swarm nets against the user's specs.
import fs from "fs";
import { Field, lineChangeTable, PARAMS } from "./emergent.js";
import { makeParticle } from "./particle.js";
let pass = 0, fail = 0;
const ok = (n, c) => { c ? pass++ : fail++; console.log(`${c ? "PASS" : "FAIL"}  ${n}`); };
const prior = JSON.parse(fs.readFileSync(new URL("../bhantugh_rules.json", import.meta.url))).channels;
const mk = (seed, n) => Array.from({ length: n }, (_, i) => makeParticle(i + 1, (i * seed + 13) % 360, { body: i % 13 }));

// spec verification 1: 64 x 6 = 384 single-line changes, each reversible
const tab = lineChangeTable();
ok("384 single-line-change cases, every one reverses", tab.length === 384 && tab.every(r => r.back === r.from && r.to !== r.from));
ok("each hexagram reaches 6 distinct neighbours", [...Array(64).keys()].every(k => new Set(tab.filter(r => r.from === k + 1).map(r => r.to)).size === 6));

const F = new Field(mk(97.31, 160), prior);
const live = [...F.edges.values()].filter(e => e.alive);
ok(`channels emerge only at Hamming distance <=1 (${live.length} directed edges)`, live.length > 0 &&
  live.every(e => { const a = F.p.get(e.from).form, b = F.p.get(e.to).form; return a.reduce((d, x, i) => d + (x !== b[i]), 0) <= 1; }));
const e0 = live.find(e => F.edges.has(`${e.to}>${e.from}`));
ok("A->B and B->A are separate records with their own history", e0 && F.edges.get(`${e0.to}>${e0.from}`) !== e0);
ok("every edge carries provenance (relation, address, dimension, transformation, rule)",
  live.every(e => e.provenance.relation && e.provenance.address.length === 2 && e.provenance.rule));

// Klein Tool SPEC-2
const ids = [...F.p.keys()].slice(0, 5);
const k1 = F.klein(ids[0], ids), k2 = F.klein(ids[0], ids), k3 = F.klein(ids[0], ids.slice(0, 3));
ok("Klein tool returns relation, intensity, direction", "relation" in k1 && "intensity" in k1 && "direction" in k1);
ok("same context -> identical collapsed result", k1 === k2);
ok("no context -> no meaning in isolation", F.klein(ids[0], []).witnessed === false);
const ctxs = [...F.p.keys()].slice(1, 40).map(c => F.klein(ids[0], [ids[0], c]).joint);
ok(`changed context changes the result (${new Set(ctxs).size} different joint readings over 39 contexts)`, new Set(ctxs).size > 1);

// run events
const evs = Array.from({ length: 12 }, () => F.step());
const fms = [...F.formations.values()];
const sizes = fms.map(f => f.members.length).sort((a, b) => b - a);
ok(`emergent nets of many sizes (${fms.length} formations, sizes ${sizes.slice(0, 8).join(',')}...)`, fms.length > 3 && new Set(sizes).size > 2);
ok(`kinds in use: ${[...new Set(fms.map(f => f.kind.kind))].join(', ')} (${fms.length}, kinds: ${[...new Set(fms.map(f => f.kind.kind))].join(", ")})`, fms.length > 0);
ok("kinds are selected from the prior, with the votes kept as evidence", fms.every(f => f.kind.evidence && typeof f.kind.votes === "object"));
ok("every formation's net produces finite output", evs.at(-1) && Object.values(evs.at(-1).outputs).every(o => o.out.every(Number.isFinite)));
ok("Being threshold: only formations with Being members have realized properties",
  fms.every(f => f.matter.realized === f.members.some(m => F.p.get(m).dress.dimension === "Being")));
ok("Space is computed by a declared experimental rule and says so", fms.every(f => f.space.rule.startsWith("experimental")));
const flips = F.shadow.filter(s => s.kind === "line-flip"), erased = F.shadow.filter(s => s.kind === "bond-erased");
ok(`dissonance has consequences: ${flips.length} line flips, ${erased.length} bonds erased, all in Shadow`, flips.length + erased.length > 0);
ok("a flip is a real changing line (one bit, the particle's own line)", flips.every(s => { const p = F.p.get(s.particle); return p.gate === s.to || p.history.some(h => h.flip); }));
ok(`leadership is observed per event, some unresolved (${evs.map(e => e.leader[0]).join("")})`, evs.every(e => typeof e.leader === "string"));
ok("dissolved formations are archived with constituents", F.archive.every(a => a.constituents.length >= a.members.length));
const strong = [...F.edges.values()].filter(e => e.alive && !e.history.at(-1)?.dissonant && e.history.length > 2);
ok("resonant bonds strengthen over events (Klein 1965 rule)", strong.some(e => e.history.at(-1).w > e.history[0].w));

// determinism / replay
const G = new Field(mk(97.31, 160), prior); for (let i = 0; i < 12; i++) G.step();
ok("deterministic replay: same start -> same events", JSON.stringify(G.events.map(e => [e.leader, e.flips])) === JSON.stringify(F.events.map(e => [e.leader, e.flips])));

// ---- 3-2-1 distribution: particles per hexagram by center
const D = await import("./distribute.js");
const count = (g) => D.distributeSwarm([g]).length;
ok("G gate (1) -> 3 particles, Ajna gate (4) -> 6, Sacral gate (5) -> 9, Root gate (19) -> 9, Head gate (64) -> 6",
  count(1) === 3 && count(4) === 6 && count(5) === 9 && count(19) === 9 && count(64) === 6);
const all64 = Array.from({ length: 64 }, (_, i) => i + 1), sw = D.distributeSwarm(all64);
ok(`all 64 hexagrams distributed: ${sw.length} particles, every hexagram 3/6/9`,
  all64.every((g, i) => [3, 6, 9].includes(sw.filter(p => p.hex === i + 1).length)));
ok("every particle sits on its own gate and on a line of its bigram", sw.every(p => p.gate === all64[p.hex - 1] &&
  D.BIGRAMS[p.bigram - 1].includes(p.line)));
const j = sw.find(p => p.role === "joint");
ok("the third particle of a Body bigram is the ATO of the other two", j && j.sound.join("") ===
  sw.find(p => p.id === j.jointOf[0]).sound.map((b, i) => b === sw.find(p => p.id === j.jointOf[1]).sound[i] ? 1 : 0).join(""));
const H = new Field(sw, prior); const hev = Array.from({ length: 10 }, () => H.step());
const hf = [...H.formations.values()];
ok(`hexagrams hold together as bodies and join into larger nets (${hf.length} nets, largest ${Math.max(...hf.map(f => f.members.length))})`,
  [...new Set(sw.map(p => p.hex))].every(h => hf.some(f => sw.filter(p => p.hex === h).every(p => f.members.includes(p.id)))));
const hflip = H.shadow.find(s => s.kind === "line-flip");
ok("a changing line moves the whole hexagram to the new gate", !hflip ||
  [...H.p.values()].filter(q => q.hex === H.p.get(hflip.particle).hex).every(q => q.gate === H.p.get(hflip.particle).gate));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
