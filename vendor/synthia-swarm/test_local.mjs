// test_local.mjs — Klein inside each unit.  node synthia/test_local.mjs
import { LivingSwarm } from "./living.js";
import * as K from "./klein_local.js";
import { SwarmKlein } from "./klein_bridge.js";

let pass = 0, fail = 0;
const ok = (n, c, i = "") => { if (c) { pass++; console.log("  PASS", n); } else { fail++; console.log("  FAIL", n, i); } };

console.log("29. Klein inside each unit: instinct shared, culture its own, rules travel by contact");
ok("ATO: A:B::C:D with D = C xor (A xor B)", K.ato([1,0,1,0],[1,1,0,0],[0,0,1,1]).join("") === "0101");
ok("ATO: same A and C gives back B", K.ato([1,0,1,1],[0,1,1,0],[1,0,1,1]).join("") === "0110");

// a row of bonded units, plus one unit alone far away
const S = new LivingSwarm({ seed: 3 });
for (let i = 0; i < 12; i++) S.add({ gate: 1 + i, line: 1 + i % 6, color: 1, tone: 1, base: 1, dimension: "Being" }, "item", 0.05 + i * 0.07, 0.5);   // a row: each touches only the next
const far = S.add({ gate: 50, line: 2, color: 1, tone: 1, base: 1, dimension: "Being" }, "item", 0.5, 0.95);
S.link(0.1); K.grow(S);
const toucher = S.units[0];
ok("units start with no culture", S.units.every(u => u.culture.rules.length === 0));
ok("left units are bonded, far unit is not", toucher.bonds.length > 0 && far.bonds.length === 0);

const first = K.touchLocal(S, 0, "upright");
ok("with nothing learned the unit uses its own program", first.from === "program");
ok("the experience lands only in the touched unit", toucher.culture.rules.length === 1 && S.units.filter(u => u.culture.rules.length).length === 1);
for (let i = 0; i < 4; i++) K.touchLocal(S, 0, "upright");
ok("repeated experience strengthens its own rule", toucher.culture.rules[0].frequency >= 5);
ok("its own links: touch can lead to the result (DISEMINER walk)", K.canLeadTo(toucher, "touch", first.result));

const nb = S.units[toucher.bonds[0].a === 0 ? toucher.bonds[0].b : toucher.bonds[0].a];
const before = K.expect(S, nb, "touch", "upright");
ok("a bonded neighbour can answer by instinct before any gossip", before?.from === "instinct" && before.via === 0);
ok("instinct answer = ATO of the neighbour's result through the two addresses", before.result === K.instinct(nb, toucher, first.result));

K.gossip(S, 4);
ok("after gossip the neighbour holds the rule in its own culture", K.expect(S, nb, "touch", "upright")?.from === "culture");
const direct = new Set(toucher.bonds.map(e => e.a === 0 ? e.b : e.a));
ok("rules reach further than one hop through repeated contact", S.units.some(u => u !== toucher && !direct.has(u.id) && u.culture.rules.length));
ok("the unbonded unit learned nothing (contact only, no broadcast)", far.culture.rules.length === 0 && K.expect(S, far, "touch", "upright") === null);
ok("each received rule is read through the receiver's own instinct", S.units.filter(u => u !== toucher && u.culture.rules.length)
  .every(u => u.culture.rules.every(r => K.ACTIONS.includes(r.rhs[2]))));

const c = K.consensus(S, "touch", "upright");
ok("consensus is only measured (voters counted, nothing changed)", c.voters > 1 && c.share > 0 && c.share <= 1);

// failure teaches: a unit told its result did not work weakens that rule
const fRule = () => toucher.culture.rules.find(r => r.rhs[2] === first.result).frequency;
const f0 = fRule(); K.touchLocal(S, 0, "upright", () => false);
ok("a failed result weakens the unit's own rule", fRule() < f0);

const quiet = K.consensus(S, "touch", "wide");
ok("an unlived situation has no settled answer", quiet.voters === 0);

// unused rules fade in received culture, lived experience stays
const g = S.units.find(u => u !== toucher && u.culture.rules.some(r => r.sourceContext !== "lived"));
const r0 = g.culture.rules.find(r => r.sourceContext !== "lived").frequency;
for (const u of S.units) u.bonds = [];               // contact cut: nothing new arrives
K.gossip(S, 5);
const r1 = g.culture.rules.find(r => r.sourceContext !== "lived")?.frequency ?? 0;
ok("received rules fade without contact", r1 < r0);
ok("lived experience is never forgotten", toucher.culture.rules.some(r => r.sourceContext === "lived"));

const bridge = new SwarmKlein(); bridge.import(K.cultureOf(toucher));
ok("a unit's culture can be handed to the recording bridge", bridge.stats().rules >= 1);

console.log("30. Lines: the dimension is the hexagram; particles carry 1 to 6 lines, never 0");
ok("same gate, different dimension = different lines", K.linesOf({ gate: 2, dimension: "Movement" }).join("") !== K.linesOf({ gate: 2, dimension: "Being" }).join(""));
ok("Movement reads King Wen: gate 1 = six solid lines", K.linesOf({ gate: 1, dimension: "Movement" }).join("") === "111111");
ok("Being reads Fuxi: position 1 = Kun, six broken lines", K.linesOf({ gate: 1, dimension: "Being" }).join("") === "000000");
ok("depth gives 1 to 6 lines from the bottom", [1,2,4,6].every(d => K.linesOf({ gate: 3, dimension: "Movement", depth: d }).length === d)
  && K.linesOf({ gate: 3, dimension: "Movement", depth: 2 }).join("") === K.linesOf({ gate: 3, dimension: "Movement" }).slice(0, 2).join(""));
ok("depth 0 is raised to 1 (never zero lines)", K.linesOf({ gate: 3, depth: 0 }).length === 1);
ok("lines can be carried directly", K.linesOf({ lines: [1, 0] }).join("") === "10");
let threw = false; try { K.linesOf({ lines: [1, 0, 1, 1, 0, 1, 1] }); } catch { threw = true; }
ok("more than six lines is refused", threw);
const D = new LivingSwarm({ seed: 5 });
const place = D.add({ planetary: 1, dimension: "Being" }, "item", 0.5, 0.5);                   // no gate, no lines
const one = D.add({ planetary: 1, dimension: "Being", lines: [1] }, "item", 0.55, 0.5);          // one line
const pair = D.add({ planetary: 1, dimension: "Being", gate: 3, depth: 2 }, "item", 0.6, 0.5);  // a line pair
const whole = D.add({ planetary: 1, dimension: "Being", gate: 3, line: 2, color: 1, tone: 1, base: 1 }, "item", 0.65, 0.5);
D.link(0.1); K.grow(D);
ok("a unit with no gate and no lines is listed as not a particle", K.notParticles(D).join() === String(place.id));
ok("particles carry 1, 2 and 6 lines", one.lines.length === 1 && pair.lines.length === 2 && whole.lines.length === 6);
ok("analogy only over lines both carry", K.sharedWidth(one, whole) === 1 && K.sharedWidth(pair, whole) === 2 && K.sharedWidth(whole, whole) === 4);
ok("every instinct result is a real instruction at any depth", [one, pair, whole].every(x => [one, pair, whole].every(y => K.ACTIONS.every(a => K.ACTIONS.includes(K.instinct(x, y, a))))));
for (let i = 0; i < 3; i++) K.touchLocal(D, whole.id, "upright"); K.gossip(D, 3);
ok("one-line and two-line particles join the culture by contact", one.culture.rules.length > 0 && pair.culture.rules.length > 0);
ok("the non-particle takes no part", place.culture.rules.length === 0);
threw = false; try { K.touchLocal(D, place.id, "upright"); } catch { threw = true; }
ok("a non-particle cannot decide a touch", threw);

console.log("31. Changing lines and the circle");
{
  const L = K.linesOf({ gate: 1, dimension: "Movement" });               // Qian 111111
  const c = K.changeLine(L, 1, "Movement");
  ok("a changing line flips yang to yin", c.lines.join("") === "011111");
  ok("Qian with line 1 changing becomes Gou (King Wen 44) in Movement", c.gate === 44);
  ok("the same change read in Being lands on that order's place", K.changeLine(L, 1, "Being").gate === K.changeLine(L, 1, "Being").gate && K.changeLine(L, 1, "Being").gate !== 44);
  ok("changing it back returns the start", K.changeLine(c.lines, 1, "Movement").gate === 1);
  ok("a two-line particle changes only what it carries", K.changeLine([1, 0], 2).lines.join("") === "11" && K.changeLine([1, 0], 2).gate === null);
  let t = false; try { K.changeLine([1, 0], 3); } catch { t = true; }
  ok("a line it does not carry cannot change", t);
  const P = d => ({ address: { dimension: d } });
  ok("Being leads to Movement, Movement to Space, Space to Design, Design to Evolution, Evolution to Being",
    K.leadsTo(P("Being"), P("Movement")) && K.leadsTo(P("Movement"), P("Space")) && K.leadsTo(P("Space"), P("Design")) && K.leadsTo(P("Design"), P("Evolution")) && K.leadsTo(P("Evolution"), P("Being")));
  ok("leading is one way round, not a ranking", !K.leadsTo(P("Movement"), P("Being")));
}

console.log("32. Each dimension splits its six lines its own way");
{
  const L = [1, 0, 1, 1, 0, 0];
  ok("Movement: a line, a pair, a trigram (1+2+3)", JSON.stringify(K.splitLines(L, "Movement")) === "[[1],[0,1],[1,0,0]]");
  ok("Evolution: two trigrams (3+3)", JSON.stringify(K.splitLines(L, "Evolution")) === "[[1,0,1],[1,0,0]]");
  ok("Being: three pairs (2+2+2)", JSON.stringify(K.splitLines(L, "Being")) === "[[1,0],[1,1],[0,0]]");
  ok("every split adds back to six", ["Movement", "Evolution", "Being"].every(d => K.splitLines(L, d).flat().join("") === L.join("")));
  ok("particles per hexagram: 3, 2, 3", K.particlesPerHexagram("Movement") === 3 && K.particlesPerHexagram("Evolution") === 2 && K.particlesPerHexagram("Being") === 3);
  ok("Space has no split of its own: it starts from Evolution", JSON.stringify(K.splitLines(L, "Space")) === JSON.stringify(K.splitLines(L, "Evolution")));
  ok("Space follows whichever dimension leads", JSON.stringify(K.splitLines(L, "Space", "Being")) === JSON.stringify(K.splitLines(L, "Being"))
    && K.particlesPerHexagram("Space", "Movement") === 3);
  ok("Design splits like Movement (both King Wen)", JSON.stringify(K.splitLines(L, "Design")) === JSON.stringify(K.splitLines(L, "Movement")));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
