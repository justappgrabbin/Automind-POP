// test_organism.mjs — the assembled swarm: every piece running on the same units.  node synthia/test_organism.mjs
import fs from "node:fs";
import { LivingSwarm } from "./living.js";
import { OrganismSwarm, loadRecognizer, OPERATOR_BY_LEADER, OPERATORS } from "./organism_swarm.js";
let pass = 0, fail = 0; const ok = (n, c, i = "") => { if (c) { pass++; console.log("  PASS", n); } else { fail++; console.log("  FAIL", n, i); } };
const read = p => fs.promises.readFile(new URL("./" + p, import.meta.url), "utf8");

console.log("34. One swarm, all the pieces on the same units");
const S = new LivingSwarm({ seed: 11 });
const dims = ["Movement", "Evolution", "Being", "Design"];
for (let i = 0; i < 24; i++) S.add({ gate: 1 + (i * 7) % 64, line: 1 + i % 6, color: 1, tone: 1, base: 1, dimension: dims[i % 4],
  zodiac: 1 + i % 12, degree: (i * 13) % 30 }, "person", 0.3 + (i % 6) * 0.07, 0.3 + Math.floor(i / 6) * 0.07);
const O = new OrganismSwarm(S, { recognizer: await loadRecognizer(read) });

ok("all 16 Boolean functions are available to bonds", OPERATORS.length === 16 && OPERATORS.includes("nand") && OPERATORS.includes("xnor"));
ok("the bond operator is chosen by the leading dimension (all xnor until set)", Object.values(OPERATOR_BY_LEADER).every(o => o === "xnor"));
for (let i = 0; i < 20; i++) O.step();
const bonded = S.units.flatMap(u => u.bonds).filter(e => e.relation);
ok("bonds carry a real Boolean relation of the two units' lines", bonded.length > 0 && bonded.every(e => e.relation.op === "xnor" && e.relation.bits.every(b => b === 0 || b === 1)));
ok("every whole-hexagram unit knows its Klein tool and kind", S.units.filter(u => u.lines?.length === 6).every(u => u.ability && u.ability.tool && u.ability.kind));

ok("without a focus nobody takes part", S.units.every(u => (u.focusWeight ?? 0) === 0));
O.setFocus({ gate: S.units[0].address.gate, line: 1 }); O.step();
const w = S.units.map(u => u.focusWeight);
ok("with a focus, participation varies by each unit's own angle (not one value for all)", new Set(w.map(x => x.toFixed(3))).size > 3 && Math.max(...w) <= 1 && Math.min(...w) >= 0);
ok("each unit relates to the focus through its own dimension's link type", S.units.filter(u => u.address.dimension === "Being").every(u => u.focusRelation === "containment")
  && S.units.filter(u => u.address.dimension === "Movement").every(u => u.focusRelation === "cooperation"));
const f2 = await O.setFocusFrom("Innovation ordering limitation acceptance");
ok("morphology can set the focus from words (gate 60)", f2.status === "resolved" && f2.address.gate === 60);
const f3 = await O.setFocusFrom("qwzx plorb");
ok("words morphology cannot resolve give no focus (nothing invented)", f3.status === "unresolved");

// Klein culture still travels by contact inside the assembled swarm
const KL = await import("./klein_local.js");
O.setFocus({ gate: S.units[0].address.gate });
const t = KL.touchLocal(S, 0, "part"); for (let i = 0; i < 40; i++) O.step();
ok("a touch is decided by the unit and its rule spreads to bonded units", t.unit === 0 && S.units.filter(u => u.culture.rules.length).length > 1);

// function side: a formation pooling lines runs a real Klein tool
const ids = S.units.filter(u => u.lines?.length === 6).slice(0, 1).map(u => u.id);
const run = O.runFormation(ids, { transform: "mirror" });
ok("a formation runs the tool its lines give it (real result or honest refusal)", typeof run.ok === "boolean" && run.tool);

// building function that no unit had: discovered from primitives, kept as a reusable cluster
const built = O.build([{ id: "content", type: "records", value: [{ label: "One" }, { label: "Two" }] },
  { id: "template", type: "template", value: { tag: "p", text: "{label}" } }, { id: "layout", type: "layout", value: { axis: "column", columns: 1 } }],
  { type: "artifact" });
ok("the swarm builds a page artifact it had no recipe for, and keeps the way it did it", built.result?.value?.nodes?.length === 2 && built.clusters.length >= 1, JSON.stringify(built.status));

// taking in an app
const n0 = S.units.length;
const intake = O.takeIn([{ path: "index.html", text: '<script type="module" src="./app.js"></script><button id="go">Go</button>' },
  { path: "app.js", text: 'document.getElementById("go").onclick = () => run();\nexport function run(){}' }]);
ok("files come in as units of the same swarm, with what links to what", S.units.length === n0 + 2 && intake.channels.length >= 1
  && S.units[intake.units[0]].fileLinks?.some(l => l.to === intake.units[1]), JSON.stringify(intake.channels).slice(0, 120));
ok("what is only half-linked is reported as a gap", Array.isArray(intake.gaps));

// recognition with the trained model, read locally by every unit
const rec = O.recognize();
ok("every unit predicts the formation from its own neighbourhood (trained Badalov model)", rec && rec.labels.length === S.units.filter(u => !u.broken).length && rec.labels.every(l => typeof l === "string"));

console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
