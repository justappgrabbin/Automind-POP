import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const p = await b.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto("http://localhost:8766/living.html"); await new Promise(r => setTimeout(r, 1500));
const R = await p.evaluate(async () => {
  const { Chamber } = await import("/chamber.js"), RA = await import("/repo_abilities.js"), { enterWithAbilities } = await import("/sandbox_bridge.js");
  const { LivingSwarm } = await import("/living.js"), { OrganismSwarm } = await import("/organism_swarm.js"), { softwareHost } = await import("/hosts.js"), KL = await import("/klein_local.js");
  const { kept } = await RA.adopt(new Chamber(), RA.harvest([{ path: "src/mul.js", text: "export function mul(a, b) { return a * b; }" }, { path: "test/mul.test.js", text: "expect(mul(3, 4)).toBe(12);\nexpect(mul(-2, 5)).toBe(-10);" }]));
  const S = new LivingSwarm({ seed: 9 }), D = ["Movement", "Evolution", "Being", "Design"];
  for (let i = 0; i < 64; i++) S.add({ gate: 1 + i, line: 1 + i % 6, color: 1 + i % 6, tone: 1 + i % 6, base: 1 + i % 5, dimension: D[i % 4] }, "person", 0.25 + (i % 8) * 0.07, 0.25 + Math.floor(i / 8) * 0.07);
  const O = new OrganismSwarm(S); KL.grow(S); S.link(0.11);
  const host = softwareHost({ name: "invoice", types: { number: x => typeof x === "number" }, files: [{ path: "test.js", text: "import { total } from './total.js';\nassert(total(3, 4, 2) === 14);\nassert(total(5, 2, 1) === 11);\n" }],
    materials: [{ id: "price", type: "number", value: 3 }, { id: "qty", type: "number", value: 4 }, { id: "fee", type: "number", value: 2 }],
    operations: [{ id: "add", inputs: { a: "number", b: "number" }, output: "number", dimension: "Design", run: ({ a, b }) => a + b }],
    requirement: { name: "total", path: "total.js", params: ["price", "qty", "fee"], outType: "number", cases: [{ args: { price: 3, qty: 4, fee: 2 }, out: 14 }, { args: { price: 5, qty: 2, fee: 1 }, out: 11 }] } });
  const r = await enterWithAbilities(O, host, kept), st = n => r.steps.filter(s => s.step === n).at(-1);
  return { chamber: st("chamber"), by: st("construct")?.by, plan: st("construct")?.plan, cases: st("act+evaluate")?.casesMet, alone: st("extract")?.checkWithSwarmGone }; });
console.log(JSON.stringify(R), errs); await b.close();
