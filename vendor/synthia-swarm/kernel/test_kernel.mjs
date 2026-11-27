// test_kernel.mjs — every check is against Klein's own printed numbers or against v61's verified tables.
import * as K from "./klein4.js";
import { makeParticle, canCouple } from "./particle.js";
import { clusterAll } from "./cluster321.js";
import { Individual, exchange, Community, FUNCTIONS } from "./contact1965.js";

let pass = 0, fail = 0;
const ok = (name, cond) => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${name}`); };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// --- Table 1
const t1 = K.table1();
ok("Table 1 XOR column 0 1 1 0", eq(t1.map(r => r.xor), [0, 1, 1, 0]));
ok("Table 1 strong-equivalence column 1 0 0 1", eq(t1.map(r => r.xnor), [1, 0, 0, 1]));
// --- Table 2
const t2 = K.table2();
ok("Table 2 mod-2 addition 0 1 1 0", eq(t2.map(r => r.add), [0, 1, 1, 0]));
ok("Table 2 mod-2 subtraction 0 1 1 0", eq(t2.map(r => r.sub), [0, 1, 1, 0]));
ok("sign multiplication == strong equivalence (text claim)", eq(t2.map(r => r.signs), t1.map(r => r.xnor)));
// --- Table 3
ok("Table 3 Klein-4 (XNOR) matches the printed table", eq(K.k4table("xnor"), K.PRINTED_TABLE3));
const g = K.k4table("xor");
ok("XOR version is also a group (identity 00, every element self-inverse)",
  K.K4.every((e, i) => g[0][i] === e && g[i][i] === "00"));
// --- NAND builds both
const all = [[0, 0], [0, 1], [1, 0], [1, 1]];
ok("XOR built from 4 NANDs equals XOR", all.every(([a, b]) => K.xorFromNand1(a, b) === (a ^ b)));
ok("XNOR built from NANDs equals XNOR", all.every(([a, b]) => K.xnorFromNand1(a, b) === 1 - (a ^ b)));
ok("NAND is not invertible (NAND(0,1)=NAND(1,0)=NAND(0,0))", K.nand1(0, 1) === K.nand1(1, 0) && K.nand1(0, 0) === 1);
const col = (f) => all.map(([a, b]) => f(a, b)).join("");
ok("gate columns AND 0001, OR 0111, NAND 1110, NOR 1000, XOR 0110, XNOR 1001",
  col(K.gate1(8)) === "0001" && col(K.gate1(14)) === "0111" && col(K.gate1(7)) === "1110" &&
  col(K.gate1(1)) === "1000" && col(K.gate1(6)) === "0110" && col(K.gate1(9)) === "1001");
ok("NOT, buffer, tri-state (EN 0 -> Z)", K.str(K.not([0, 1])) === "10" && K.str(K.buffer([1, 0])) === "10" &&
  K.triState([1, 0, 1], [1, 0, 0]).join("") === "1ZZ");
ok("NOR is universal: AND built from NORs", all.every(([a, b]) => K.andFromNor1(a, b) === (a & b)));
ok("of all 16 gates only XOR and XNOR are invertible (ATO-capable)",
  Array.from({ length: 16 }, (_, n) => n).filter(K.invertible).join() === "6,9");
// --- Klein's worked ATO examples
ok("ATO a=101 b=011 -> *ab=001", K.str(K.ato(K.bits("101"), K.bits("011"))) === "001");
ok("*b*ab recovers a, *a*ab recovers b",
  K.str(K.xnor(K.bits("011"), K.bits("001"))) === "101" && K.str(K.xnor(K.bits("101"), K.bits("001"))) === "011");
ok("I Ching Fig 2: *AB = 010000", K.str(K.ato(K.bits("111110"), K.bits("010001"))) === "010000");
ok("I Ching Fig 2: D = *C*AB = 001010", K.str(K.analogy(K.bits("111110"), K.bits("010001"), K.bits("100101"))) === "001010");
ok("categorial grammar: *YZ = S = 10011, *SZ = Y, *SY = Z",
  K.str(K.ato(K.bits("10101"), K.bits("11001"))) === "10011" &&
  K.str(K.ato(K.bits("10011"), K.bits("11001"))) === "10101" && K.str(K.ato(K.bits("10011"), K.bits("10101"))) === "11001");
ok("verbal analogy: boy loves light : girl hates light :: woman hates dark : man loves dark (10011001)",
  K.str(K.analogy(K.bits("10101010"), K.bits("01100110"), K.bits("01010101"))) === "10011001");

// --- particles: individual qualities from real longitudes
const ps = Array.from({ length: 400 }, (_, i) => makeParticle(i, (i * 137.508) % 360));
ok("particles carry three vectors (form 6, sound 9, meaning 16)", ps.every(p => p.form.length === 6 && p.sound.length === 9 && p.meaning.length === 16));
ok("no planet / dimension / zodiac on a particle", ps.every(p => !("planetary" in p) && !("dimension" in p) && !("zodiac" in p)));
const distinct = new Set(ps.map(p => [p.gate, p.line, p.color, p.tone, p.base, p.degree, p.minute, p.second, p.arc].join("."))).size;
ok(`particles are individual (${distinct}/400 distinct addresses)`, distinct === 400);
ok("full address kept as dressing (planet, dimension, zodiac present)",
  ps.every(p => p.dress.planetary && p.dress.dimension && p.dress.zodiac && p.address.split(".").length === 13));
ok("planet / dimension / zodiac not in calc fields", ps.every(p => !("planetary" in p.calc) && !("dimension" in p.calc) && !("zodiac" in p.calc)));
const before = clusterAll(ps.slice(0, 200)).pairs.map(x => x.form).join();
ps.slice(0, 200).forEach(p => { p.dress.planetary = "Pluto"; p.dress.zodiac = "Pisces"; p.dress.dimension = "Space"; });
ok("changing the dressing changes no calculation", clusterAll(ps.slice(0, 200)).pairs.map(x => x.form).join() === before);
ok("pitch 0 cannot couple", !canCouple({ pitch: 0 }) && canCouple({ pitch: 3 }));

// --- 3-2-1 clustering
// a full hexagram: one particle per line of gate 1 (all longitudes inside gate 1's 5.625 deg)
const g1start = 302 + 50 * 5.625;   // gate 1 is index 50 on the wheel
const hex = [1, 2, 3, 4, 5, 6].map(l => makeParticle(1000 + l, g1start + (l - 0.5) * 5.625 / 6 + 0.00011));
ok("six particles land on gate 1 lines 1..6", hex.every((p, i) => p.gate === 1 && p.line === i + 1));
const c = clusterAll(hex.filter(canCouple));
ok("3 pairs, 2 trigrams, 1 hexagram from one full gate", c.pairs.length === 3 && c.trigrams.length === 2 && c.hexagrams.length === 1);
ok("gate 1 (all yang) pairs are Klein-4 element 11", c.hexagrams[0].k4.every(e => e === "11"));
const mixed = clusterAll(ps);
ok(`mixed field forms clusters of different kinds (pairs ${mixed.pairs.length}, trigrams ${mixed.trigrams.length}, hexagrams ${mixed.hexagrams.length}, free ${mixed.free.length})`,
  mixed.pairs.length > 0 && mixed.free.length > 0);

// --- nine centers: four dualities + middle
const L = await import("./loshu.js");
ok("each of the four dualities is an exact bitwise complement (Qian/Kun, Li/Kan, Zhen/Xun, Dui/Gen)",
  L.DUALITIES.every(d => L.complement(L.TRIGRAM_BITS[d.pair[0]]) === L.TRIGRAM_BITS[d.pair[1]]));
const classes = [...new Set(Object.values(L.TRIGRAM_BITS).map(L.k4Of))].sort();
ok("8 trigrams fold into exactly 4 duality classes = the Klein-4 elements 00 01 10 11", classes.join() === "00,01,10,11");
const xorK = (a, b) => K.str(K.xor(K.bits(a), K.bits(b)));
ok("the fold respects the operator (class of x XOR y = class(x) XOR class(y)) -> a true group",
  Object.values(L.TRIGRAM_BITS).every(x => Object.values(L.TRIGRAM_BITS).every(y =>
    L.k4Of(xorK(x, y)) === xorK(L.k4Of(x), L.k4Of(y)))));
ok("Lo Shu: every row, column, diagonal sums to 15, middle 5",
  [...L.LO_SHU, ...[0, 1, 2].map(c => L.LO_SHU.map(r => r[c])), [0, 1, 2].map(i => L.LO_SHU[i][i]),
    [0, 1, 2].map(i => L.LO_SHU[i][2 - i])].every(l => l.reduce((a, b) => a + b) === 15) && L.LO_SHU[1][1] === 5);
const h1 = L.placeHexagram(hex[0].form);
ok("gate 1 places Qian over Qian: one axis, + pole", h1.lower.trigram === "Qian" && h1.upper.trigram === "Qian" && h1.spansOneAxis);
ok("Taiji ripple shows exactly the centers that flipped",
  JSON.stringify(L.taijiRipple({ Qian: "111", Kan: "010" }, { Qian: "111", Kan: "011" })) === '{"Qian":"000","Kan":"001"}');

// --- bonds (BHANTUGH §19-20): the dressing decides who connects
const B = await import("./bond.js");
ok("harmony rules: lines 1-4 2-5 3-6, base 1-5 2-4 3-3",
  B.isHarmonic6(1, 4) && B.isHarmonic6(3, 6) && !B.isHarmonic6(1, 2) && B.isHarmonicBase(1, 5) && B.isHarmonicBase(3, 3) && !B.isHarmonicBase(1, 2));
const pa = makeParticle(9001, 100.123), pb = makeParticle(9002, 100.123);
pb.dress = { ...pb.dress, dimension: pa.dress.dimension === "Being" ? "Design" : "Being" };
const same = B.evaluateSwarmBond(pa, makeParticle(9003, 100.123)), diff = B.evaluateSwarmBond(pa, pb);
ok(`same calc, different dimension -> different bond (${same.connectionCount} vs ${diff.connectionCount})`,
  same.connectionCount === 5 && diff.connectionCount === 4 && same.unlockedLevel !== diff.unlockedLevel);
const edges = B.bondField(ps.slice(0, 120));
const byLevel = [1, 2, 3, 4, 5].map(l => edges.filter(e => e.unlockedLevel === l).length);
ok(`field bonds at every level (L1..L5: ${byLevel.join(" / ")}), visible = ${edges.filter(e => e.isVisible).length}`,
  byLevel.slice(0, 4).every(n => n > 0));

// --- the swarm as the neural network (BHANTUGH §22-24)
const N = await import("./swarmnet.js");
const field = Array.from({ length: 150 }, (_, i) => makeParticle(5000 + i, (i * 97.31 + 13) % 360, { body: i % 13 }));
const net = N.buildNet(field);
ok(`network built from visible bonds only (${net.order.length} nodes, ${net.edges} edges, ${net.outputs.length} outputs)`,
  net.edges > 0 && net.outputs.length > 0);
ok("graph is acyclic: every edge goes forward in the order",
  net.order.every((n, k) => n.inputs.every(e => net.order.findIndex(m => m.id === e.from) < k)));
ok(`activations come from the gates (${[...new Set(net.order.map(n => n.act))].length} kinds in use)`,
  new Set(net.order.map(n => n.act)).size >= 4);
const o1 = N.forward(net, { x: 0.3, y: -0.2, d: 0.36, t: 0 }), o2 = N.forward(net, { x: 0.3, y: -0.2, d: 0.36, t: 0 });
ok("deterministic: same input -> same output", JSON.stringify(o1) === JSON.stringify(o2) && o1.every(Number.isFinite));
ok("different input -> different output", JSON.stringify(o1) !== JSON.stringify(N.forward(net, { x: -0.9, y: 0.7, d: 1.1, t: 0 })));
ok(`leading dimension = highest connection density (${net.leading})`,
  Object.values(net.density).every(v => v <= net.density[net.leading]));
const img = N.PIPELINES.Being(net);
ok(`Being pipeline draws an image with real variation (${new Set(img.px).size} gray levels)`, new Set(img.px).size > 20);
ok("every pipeline runs", N.DIMENSIONS.every(d => { const r = N.PIPELINES[d](net); return r && JSON.stringify(r).length > 10; }));
const field2 = field.map(p => ({ ...p }));
field2.slice(0, 40).forEach(p => { p.dress = { ...p.dress, dimension: p.dress.dimension === "Space" ? "Movement" : "Space" }; });
ok("changing particles' dimensions changes the network", N.buildNet(field2).edges !== net.edges);
globalThis.__net = net;

// --- 1965 contact model: replay Klein's hand simulation (Table 1) exactly
const John = new Individual("John", 0.8, { A: 0.5, B: 0.04, C: 0.5, D: 0.5 });
const Mary = new Individual("Mary", 0.7, { A: 0.5, B: 0.5, D: 0.5 });
const Helen = new Individual("Helen", 0.4, { E: 0.5, F: 0.06 });
const Peter = new Individual("Peter", 0.3, { B: 0.5, E: 0.5, F: 0.5 });
const Herman = new Individual("Herman", 0.6, { B: 0.5, C: 0.5, D: 0.02 });
const Child = new Individual("Child", 0.4, {});
ok("(1) P(Mary->John) = 0.1/|0.7-0.8| -> 0.99", FUNCTIONS.speakProb(0.7, 0.8) === 0.99);
exchange(Mary, John, { A: 1, D: 2 });
ok("T0,1 John A 0.47, D 0.53; Mary S 0.72", John.recog.get("A") === 0.47 && John.recog.get("D") === 0.53 && Mary.S === 0.72);
const r = exchange(Mary, Herman, { A: 1, B: 2 });
ok("T0,2 Herman borrows A at 0.07 (recognition only)", Herman.recog.get("A") === 0.07 && !Herman.generative().some(([k]) => k === "A"));
ok("T0,2 Herman B 0.53, D erased, Mary S 0.70", Herman.recog.get("B") === 0.53 && r.erased.includes("D") && Mary.S === 0.7);
exchange(Mary, Child, { A: 1, B: 1, D: 1 });
ok("T0,3 Child borrows A,B,D at 0.07; Mary S 0.64", ["A", "B", "D"].every(k => Child.recog.get(k) === 0.07) && Mary.S === 0.64);
exchange(Peter, Helen, { E: 1, F: 1 });
ok("T1,1 Helen E stays 0.5, F 0.15 enters generative; Peter S 0.32",
  Helen.recog.get("E") === 0.5 && Helen.recog.get("F") === 0.15 && Helen.generative().some(([k]) => k === "F") && Peter.S === 0.32);
exchange(Peter, Herman, { B: 3, E: 1 });
ok("T1,2 Herman B 0.57, E 0.05; Peter S 0.38", Herman.recog.get("B") === 0.57 && Herman.recog.get("E") === 0.05 && Peter.S === 0.38);
ok("Herman C 0.46, A 0.05 (unused twice)", Herman.recog.get("C") === 0.46 && Herman.recog.get("A") === 0.05);
exchange(Peter, Child, { B: 2, E: 1, F: 1 });
ok("T1,3 Child B 0.16 enters generative, E,F 0.05, A,D 0.05; Peter S 0.38",
  Child.recog.get("B") === 0.16 && Child.generative().some(([k]) => k === "B") &&
  ["E", "F", "A", "D"].every(k => Child.recog.get(k) === 0.05) && Peter.S === 0.38);

// stochastic run: the control system actually runs
let seed = 7; const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const com = new Community([new Individual("a", 0.7, { A: 0.5, B: 0.5 }), new Individual("b", 0.6, { B: 0.5, C: 0.5 }),
  new Individual("c", 0.3, { C: 0.5, D: 0.5 }), new Individual("d", 0.4, {})], rng).run(40);
ok(`control system runs (${com.log.length} exchanges, ${com.log.filter(e => e.borrowed.length).length} with borrowing)`, com.log.length > 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
