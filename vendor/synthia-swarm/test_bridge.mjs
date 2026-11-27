// An ability learned from a (fixture) repository is used by the UNITS to invent a function nobody wrote.
// Fixture code is written here; the chamber stand-in is node:vm with no globals (the browser uses chamber.js).
import vm from "node:vm"; import { LivingSwarm } from "./living.js"; import { OrganismSwarm } from "./organism_swarm.js";
import { softwareHost } from "./hosts.js"; import * as KL from "./klein_local.js"; import { harvest, adopt } from "./repo_abilities.js"; import { enterWithAbilities } from "./sandbox_bridge.js";
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? "  PASS " : "  FAIL ") + n); };
const chamber = { run: async (src, args) => { try { return { ok: true, result: JSON.parse(JSON.stringify(vm.runInNewContext(`(function(args){"use strict";\n${src}\n})`, Object.create(null), { timeout: 300 })(args))) }; } catch (e) { return { ok: false, error: String(e) }; } } };
const repo = [{ path: "src/mul.js", text: "export function mul(a, b) { return a * b; }" }, { path: "test/mul.test.js", text: "expect(mul(3, 4)).toBe(12);\nexpect(mul(-2, 5)).toBe(-10);" },
  { path: "src/off.js", text: "export function off(a) { return a + 1; }" }, { path: "test/off.test.js", text: "expect(off(1)).toBe(2);\nexpect(off(2)).toBe(4);" }];
const { kept, refused } = await adopt(chamber, harvest(repo));
ok("repo: mul adopted, wrong 'off' refused", kept.map(k => k.fnName).join() === "mul" && refused[0]?.name === "off");
const S = new LivingSwarm({ seed: 9 }), D = ["Movement", "Evolution", "Being", "Design"];
for (let i = 0; i < 64; i++) S.add({ gate: 1 + i, line: 1 + i % 6, color: 1 + i % 6, tone: 1 + i % 6, base: 1 + i % 5, dimension: D[i % 4] }, "person", 0.25 + (i % 8) * 0.07, 0.25 + Math.floor(i / 8) * 0.07);
const O = new OrganismSwarm(S); KL.grow(S); S.link(0.11);
const T = { number: x => typeof x === "number" };
// independent target: an invoice app missing total(price, qty, fee) = price*qty + fee. The host has only "add"; multiplying exists ONLY via the repo.
const mk = () => softwareHost({ name: "invoice", types: T,
  files: [{ path: "test.js", text: "import { total } from './total.js';\nassert(total(3, 4, 2) === 14);\nassert(total(5, 2, 1) === 11);\n" }],
  materials: [{ id: "price", type: "number", value: 3 }, { id: "qty", type: "number", value: 4 }, { id: "fee", type: "number", value: 2 }],
  operations: [{ id: "add", inputs: { a: "number", b: "number" }, output: "number", dimension: "Design", run: ({ a, b }) => a + b }],
  requirement: { name: "total", path: "total.js", params: ["price", "qty", "fee"], outType: "number", cases: [{ args: { price: 3, qty: 4, fee: 2 }, out: 14 }, { args: { price: 5, qty: 2, fee: 1 }, out: 11 }] } });
const without = await enterWithAbilities(O, mk(), []);
ok("without the repo ability nothing can build it", !without.ok || without.steps.find(s => s.step === "construct")?.found === false);
const host = mk(), r = await enterWithAbilities(O, host, kept), st = n => r.steps.filter(s => s.step === n).at(-1);
r.steps.forEach(s => console.log("     ", JSON.stringify(s).slice(0, 220)));
ok("abilities went into the chamber first", st("chamber").asked > 0);
ok("the UNITS constructed it", st("construct")?.by === "units");
ok("the plan uses the outside ability and the host's own add", st("construct").plan.includes("gh.mul") && st("construct").plan.includes("add"));
ok("a Movement unit carries the outside ability", st("construct").units.some(u => S.units[u?.unit ?? u]?.address.dimension === "Movement"));
ok("every case met", st("act+evaluate")?.casesMet === 2);
ok("grown app runs with the swarm gone (descendant carries mul's source)", st("extract")?.checkWithSwarmGone === 1);
console.log((host.app.files.find(f => f.path === "total.js")?.text ?? "").split("\n").map(l => "      | " + l).join("\n"));
console.log(`\n${pass} passed, ${fail} failed`); if (fail) process.exit(1);
