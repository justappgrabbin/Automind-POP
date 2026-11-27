// The picture grows from what settled (Advertiser/Joiner, no neural net).
import { LivingSwarm, SETTINGS } from "./living.js";
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? "  PASS " : "  FAIL ") + n); };
const w = 30, h = 20, gray = new Float32Array(w * h).fill(0.95);
for (let y = 4; y < 16; y++) for (let x = 8; x < 22; x++) gray[y * w + x] = 0.35;            // a darker block on light
const S = new LivingSwarm({ seed: 2 }), DIMS = ["Movement", "Evolution", "Being", "Design"];
for (let i = 0; i < 650; i++) S.add({ gate: 1 + i % 64, line: 1 + i % 6, dimension: DIMS[i < 450 ? 0 : 1 + (i % 3)] }, "person", 0.2 + (i % 26) * 0.024, 0.2 + Math.floor(i / 26) * 0.024);   // as formPicture makes them: enough of each band
const img = S.picture(gray, w, h);
ok("only one unit has settled at the start (no plan handed down)", S.units.filter(u => u.target).length === 1);
const offered0 = S.grow.offered.size;
ok("the settled unit offers its neighbouring squares", offered0 >= 1 && offered0 <= 4);
let t = 0, t0 = Date.now(); while (t < 400 && S.grow.offered.size) { S.step(1); t++; }
const settled = S.units.filter(u => u.target);
console.log(`    ${t} steps, ${settled.length} settled of ${w * h} squares, ${Date.now() - t0} ms`);
ok("the picture grew outward until no square was left on offer", S.grow.offered.size === 0 && settled.length > 0.9 * w * h);
const cells = settled.map(u => u.target.cell);
ok("one unit per square", new Set(cells).size === cells.length);
ok("every settled unit sits on a square its dimension can hold (BHANTUGH layers unchanged)", settled.every(u => img.layers[Math.max(0, DIMS.indexOf(u.address.dimension))][u.target.cell]));
ok("only squares the picture has were ever filled (no false positives)", settled.every(u => img.layers[0][u.target.cell]));
SETTINGS.GROW = false; const S2 = new LivingSwarm({ seed: 2 }); for (let i = 0; i < 50; i++) S2.add({ gate: 1 + i, line: 1, dimension: "Movement" }, "person"); S2.picture(gray, w, h);
ok("the from-above way is kept and still works when GROW is off", S2.units.every(u => u.target) && !S2.grow); SETTINGS.GROW = true;
console.log(`\n${pass} passed, ${fail} failed`); if (fail) process.exit(1);
