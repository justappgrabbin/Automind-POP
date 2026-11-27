import { LivingSwarm } from "./living.js"; import { KernelBridge } from "./kernel_bridge.js"; import { fourCharts } from "./charts.js";
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? "  PASS " : "  FAIL ") + n); };
const S = new LivingSwarm({ seed: 3 }); const C = fourCharts({ date: "1973-03-17", time: "02:58", zone: "America/Chicago" });
for (const c of Object.values(C.charts)) c.addresses.forEach(a => S.add(a, "item"));
const have = new Set(S.units.map(u => u.address.gate)); for (let g = 1; g <= 64; g++) if (!have.has(g)) { const u = S.add({ gate: g, line: 1 + g % 6, color: 1, tone: 1, base: 1, dimension: "Being" }, "item"); u.latent = true; }
const K = new KernelBridge(S); ok("every unit has a kernel particle and a charge", S.units.every(u => u.kp && [-1, 0, 1].includes(u.charge)));
const births = S.units.map(u => u.address.gate).join();
let r; for (let i = 0; i < 400; i++) r = K.step(); console.log(r, "meetings", K.meetAll(0.2));
ok("nets formed on the live units", r.formations > 0);
ok("birth addresses never overwritten", S.units.map(u => u.address.gate).join() === births);
ok("flips (if any) land on u.current, not the birth address", K.flips === 0 || S.units.some(u => u.current));
const s = K.sentence(S.units[0]); console.log("   ", s.slice(0, 200)); ok("a unit's address reads as a sentence", s.length > 20);
console.log(`\n${pass} passed, ${fail} failed`);
