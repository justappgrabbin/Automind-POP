import { MessyWorld } from "./messy_world.js";
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? "ok  " : "FAIL") + " " + m); };
const S = { units: [
  { id: 0, kind: "person", address: { planetary: "Sun", dimension: "Movement", gate: 4, line: 1 }, bonds: [{ a: 0, b: 1, visible: true }] },
  { id: 1, kind: "mover", address: { planetary: "Moon", dimension: "Being", gate: 63, line: 2 }, bonds: [{ a: 0, b: 1, visible: true }], face: { name: "mean" } },
  { id: 2, kind: "item", address: { dimension: "Design", gate: 2, line: 4 }, bonds: [], broken: false }] };
const W = new MessyWorld(); W.tick(S);
ok(W.query({ s: "u0", p: "gate" })[0]?.o === 4 && W.query({ s: "u1", p: "face" })[0]?.o === "mean", "units are facts in MESSY (gate, face)");
ok(W.k.nodes.u0.meta.address.startsWith("Sun.Movement.4.1"), "address kept opaque in the user's order");
ok(W.query({ p: "bonded" }).length === 1, "visible bond asserted once");
S.units[0].bonds = []; S.units[1].bonds = []; W.tick(S);
ok(W.query({ p: "bonded" }).length === 0 && W.k.triples.some(t => t.p === "bonded" && !t.live), "broken bond NEGated, history kept");
// a rule group lives in the world: anyone on gate 4 'asks' (Formulization) — fires against the live network
W.k.addGroup("formulize", { rules: [{ when: [{ s: "?u", p: "gate", o: 4 }], then: [{ op: "SET", s: "?u", p: "asking", o: true }] }] });
const r = W.tick(S); ok(r.firings === 1 && W.query({ s: "u0", p: "asking" })[0]?.o === true, "a MESSY rule fires on the swarm's own facts");
const before = JSON.stringify(W.export()); const v = W.lookAhead(3); ok(JSON.stringify(W.export()) === before && v.simulated.clock === W.k.clock + 3, "look-ahead runs on a copy, world untouched");
S.units[0].bonds = [{ a: 0, b: 1, visible: true }]; S.units[1].bonds = [{ a: 0, b: 1, visible: true }]; W.tick(S);
ok(W.readWorld() > 0 && W.related("u0").some(([t]) => t === "u1"), "DISEMINER reads the world: u0 relates to u1");
console.log(`${pass}/${pass + fail}`); process.exit(fail ? 1 : 0);
