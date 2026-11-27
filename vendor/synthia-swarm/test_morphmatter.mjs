import { gather, dispersion, bistable, energy } from "./morphmatter.js";
let pass = 0, n = 0; const ok = (c, m) => { n++; if (c) pass++; console.log(c ? "ok  " : "FAIL", m); };
let seed = 7; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const U = Array.from({ length: 20 }, () => ({ x: rand() * 2, y: rand() * 2, theta: rand() * 6.283 }));
const d0 = dispersion(U); for (let t = 0; t < 20000; t++) gather(U, { rand }); const d1 = dispersion(U);
ok(d1 < d0 * 0.5, `one-bit gathering: spread ${d0.toFixed(2)} -> ${d1.toFixed(2)}`);
U.slice(0, 6).forEach(u => { u.x += 1.5; });   // break off part of the formation
const d2 = dispersion(U); for (let t = 0; t < 20000; t++) gather(U, { rand }); const d3 = dispersion(U);
ok(d3 < d2 * 0.6, `re-forms after a break: ${d2.toFixed(2)} -> ${d3.toFixed(2)}`);
const W = 8, bonds = []; for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (x < W - 1) bonds.push([i, i + 1]); if (y < W - 1) bonds.push([i, i + W]); }
const s = Array.from({ length: W * W }, () => (rand() < 0.5 ? 1 : -1)), e0 = energy(s, bonds);
bistable(s, bonds, { T: 0.3, sweeps: 300, rand }); const stag = s.reduce((a, v, i) => a + v * (((i % W) + Math.floor(i / W)) % 2 ? 1 : -1), 0) / s.length;
ok(Math.abs(stag) > 0.8, `bistable units settle into the alternating pattern (order ${stag.toFixed(2)}, energy ${e0} -> ${energy(s, bonds)})`);
const field = s.map((_, i) => (i % W < W / 2 ? 6 : 0)); bistable(s, bonds, { field, T: 0.3, sweeps: 300, rand });
const left = s.filter((v, i) => i % W < W / 2).every(v => v === 1);
ok(left, "a local field reprograms just that region (left half all +1, right half keeps its pattern)");
console.log(`${pass}/${n}`);
