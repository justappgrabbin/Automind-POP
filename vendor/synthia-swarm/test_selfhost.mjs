// The organism grows itself from instructions; the second growth builds on the first.
import { rmSync, readFileSync, existsSync } from "node:fs"; import { execSync } from "node:child_process";
import { LivingSwarm } from "./living.js"; import { OrganismSwarm } from "./organism_swarm.js"; import * as KL from "./klein_local.js"; import { growSelf } from "./selfhost.js";
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? "  PASS " : "  FAIL ") + n); };
const dir = "/tmp/selftest_grown"; rmSync(dir, { recursive: true, force: true }); execSync(`mkdir -p ${dir} && git -C ${dir} init -q && git -C ${dir} config user.email o@o && git -C ${dir} config user.name organism`);
const S = new LivingSwarm({ seed: 9 }), D = ["Movement", "Evolution", "Being", "Design"];
for (let i = 0; i < 64; i++) S.add({ gate: 1 + i, line: 1 + i % 6, color: 1 + i % 6, tone: 1 + i % 6, base: 1 + i % 5, dimension: D[i % 4] }, "person", 0.25 + (i % 8) * 0.07, 0.25 + Math.floor(i / 8) * 0.07);
const O = new OrganismSwarm(S); KL.grow(S); S.link(0.11);
const opt = { dir, gate: ["node test_reading.mjs"] };
const a = growSelf(O, { name: "average", about: "the mean of numbers", params: [{ id: "values", type: "numbers" }], outType: "number",
  examples: [{ args: { values: [2, 4, 6] }, out: 4 }, { args: { values: [10, 0] }, out: 5 }] }, opt); console.log("   ", JSON.stringify(a));
ok("it grew average for itself, gated and committed", a.ok && a.committed && existsSync(`${dir}/average.js`));
const b = growSelf(O, { name: "shout", about: "uppercase it and add a mark", params: [{ id: "value", type: "text" }], outType: "text",
  examples: [{ args: { value: "hi" }, out: "HI!" }, { args: { value: "go now" }, out: "GO NOW!" }] }, opt); console.log("   ", JSON.stringify(b));
ok("shout: the '!' it needed was found by rule (not given)", b.ok && b.plan.includes("upper") && b.plan.includes("concat"));
const c = growSelf(O, { name: "lift", about: "average plus the largest", params: [{ id: "values", type: "numbers" }], outType: "number",
  examples: [{ args: { values: [2, 4, 6] }, out: 10 }, { args: { values: [1, 3] }, out: 5 }, { args: { values: [10, 20, 0] }, out: 30 }] }, opt); console.log("   ", JSON.stringify(c));
ok("growth compounds: lift was built from its own average (grown file or learned formation), and 18 checked it on an unseen example", c.ok && c.plan.some(p => p === "grown.average" || p.startsWith("formation.")) && c.plan.length <= 4);
const d = growSelf(O, { name: "average", about: "the mean of numbers", params: [{ id: "values", type: "numbers" }], outType: "number",
  examples: [{ args: { values: [3, 3] }, out: 3 }, { args: { values: [1, 2, 3] }, out: 2 }] }, opt);
ok("nothing overwritten: a second average is average.v2.js, the first kept", d.file === "average.v2.js" && existsSync(`${dir}/average.js`));
const e = growSelf(O, { name: "impossible", params: [{ id: "value", type: "text" }], outType: "number", examples: [{ args: { value: "a" }, out: 7 }, { args: { value: "b" }, out: -3 }] }, opt);
ok("an impossible instruction is refused and logged, nothing written", !e.ok && !existsSync(`${dir}/impossible.js`) && JSON.parse(readFileSync(`${dir}/log.json`)).some(l => l.name === "impossible" && !l.ok));
const commits = execSync(`git -C ${dir} log --oneline`).toString().trim().split("\n"); console.log(commits.map(l => "      " + l).join("\n"));
ok("every growth is a commit (history ready for GitHub)", commits.length === 4);
console.log(`\n${pass} passed, ${fail} failed`); if (fail) process.exit(1);
