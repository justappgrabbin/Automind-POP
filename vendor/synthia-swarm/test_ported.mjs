// Ported pieces (Nov 22): straight-on warp, GLB surface sampling, exploring, NAND bonds, need-driven tools with retry.
import * as W from "./warp.js"; import * as G from "./glb.js"; import * as R from "./relational.js";
import { Needs, act, formationsNow } from "./needs.js"; import { LivingSwarm, SETTINGS } from "./living.js"; import * as KL from "./klein_local.js";
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? "  PASS " : "  FAIL ") + n); };

console.log("warp (perspective_warper.py port)");
const H = W.homography([[0, 0], [10, 0], [10, 10], [0, 10]], [[2, 1], [12, 3], [11, 13], [1, 11]]);
ok("homography maps each corner exactly", [[0, 0, 2, 1], [10, 0, 12, 3], [10, 10, 11, 13], [0, 10, 1, 11]].every(([x, y, u, v]) => { const [a, b] = W.apply(H, x, y); return Math.abs(a - u) < 1e-9 && Math.abs(b - v) < 1e-9; }));
const Wd = 40, Hd = 40, img = new Uint8ClampedArray(Wd * Hd * 4); const quad = [[8, 5], [30, 9], [33, 32], [5, 28]];
const inside = (x, y) => { const c = (a, b) => (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]); return [0, 1, 2, 3].every(i => c(quad[i], quad[(i + 1) % 4]) >= 0); };
const px = []; for (let y = 0; y < Hd; y++) for (let x = 0; x < Wd; x++) { const i = (y * Wd + x) * 4; img[i + 3] = 255; if (inside(x, y)) { img[i] = 200; px.push([x, y]); } }
const cq = W.cornersOf(px);
ok("corners found from the part's pixels, in tl tr br bl order", cq[0][0] < cq[1][0] && cq[3][1] > cq[0][1] && cq[2][0] > cq[3][0]);
const out = W.warp(img, Wd, Hd, cq); let red = 0; for (let i = 0; i < out.w * out.h; i++) if (out.data[i * 4] > 150) red++;
ok("the skewed part comes out as a straight-on rectangle that is all part", red / (out.w * out.h) > 0.9);
ok("output size = longest sides, as the original", out.w >= 22 && out.h >= 22);

console.log("GLB (morphing-particle-swarm port, no Three.js)");
const pos = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]), idx = new Uint16Array([0, 1, 2, 0, 1, 3, 0, 2, 3, 1, 2, 3]);
const binBytes = new Uint8Array(pos.byteLength + idx.byteLength); binBytes.set(new Uint8Array(pos.buffer), 0); binBytes.set(new Uint8Array(idx.buffer), pos.byteLength);
const json = { asset: { version: "2.0" }, buffers: [{ byteLength: binBytes.length }], bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: pos.byteLength }, { buffer: 0, byteOffset: pos.byteLength, byteLength: idx.byteLength }],
  accessors: [{ bufferView: 0, componentType: 5126, count: 4, type: "VEC3" }, { bufferView: 1, componentType: 5123, count: 12, type: "SCALAR" }], meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }] };
let js = new TextEncoder().encode(JSON.stringify(json)); const pad = n => (4 - n % 4) % 4; js = Uint8Array.from([...js, ...Array(pad(js.length)).fill(32)]);
const bb = Uint8Array.from([...binBytes, ...Array(pad(binBytes.length)).fill(0)]), total = 12 + 8 + js.length + 8 + bb.length, glb = new DataView(new ArrayBuffer(total));
glb.setUint32(0, 0x46546c67, true); glb.setUint32(4, 2, true); glb.setUint32(8, total, true); glb.setUint32(12, js.length, true); glb.setUint32(16, 0x4e4f534a, true);
new Uint8Array(glb.buffer).set(js, 20); glb.setUint32(20 + js.length, bb.length, true); glb.setUint32(24 + js.length, 0x004e4942, true); new Uint8Array(glb.buffer).set(bb, 28 + js.length);
const tris = G.parseGLB(glb.buffer);
ok("a real .glb container is read: 4 triangles of a tetrahedron", tris.length === 4);
const pts = G.sampleSurface(tris, 500, 3), raw = G.sampleSurface(tris, 500, 3, false);
ok("500 points, every one on a face of the tetrahedron", pts.length === 500 && raw.every(q => q.some(v => Math.abs(v) < 1e-6) || Math.abs(q[0] + q[1] + q[2] - 1) < 1e-6));
ok("same model, same seed → same points", JSON.stringify(G.sampleSurface(tris, 20, 3)) === JSON.stringify(G.sampleSurface(tris, 20, 3)));
ok("projected targets land on screen", G.project(pts).every(t => t.x > 0 && t.x < 1 && t.y > 0 && t.y < 1));

console.log("NAND on every bond");
ok("bonds use NAND by default", R.BOND_MODE.value === "nand");
const AND = (a, b) => R.chainNand([R.chainNand([a, b]), "1111"].map((v, i) => v));   // (a⊼b)⊼1 = a∧b
ok("chained NAND builds AND", R.chainNand([R.chainNand(["1100", "1010"]), "1111"]) === "1000");
ok("chained NAND builds NOT", R.chainNand(["1100", "1111"]) === "0011");

console.log("exploring (boid memory-avoidance port)");
{ const S = new LivingSwarm({ seed: 1 }); const u = S.add({ gate: 5, line: 1 }, "person", 0.5, 0.5);
  u.trail = Array.from({ length: 20 }, () => ({ x: 0.49, y: 0.5, t: -1 })); const x0 = u.x; S.step(1);
  ok("a free unit steers away from where it has just been", u.x > x0); }

console.log("tools run only for a need");
const S = new LivingSwarm({ seed: 5 });
for (let i = 0; i < 90; i++) S.add({ gate: 1 + (i * 11) % 64, line: 1 + i % 6, color: 1 + i % 6, tone: 1 + i % 6, base: 1 + i % 5, dimension: ["Movement", "Evolution", "Being", "Design"][i % 4] }, "person", 0.3 + (i % 10) * 0.04, 0.3 + Math.floor(i / 10) * 0.04);
KL.grow(S); S.link(0.06);
const N = new Needs();
ok("no need → nothing runs", act(S, N).length === 0 && S.units.every(u => !u.output));
const forms = formationsNow(S); const tools = new Set(forms.map(f => f.tool));
N.raise("understand-file", "a.js", { name: "a.js", text: "import x from 'y';\nexport function go(){ fetch('u'); }" });
ok("the same gap is one need, not two", N.raise("understand-file", "a.js", {}) === null && N.open.length === 1);
let rounds = 0; while (N.open.length && rounds < 5) { act(S, N); rounds++; }
const need = N.closed[0] ?? N.open[0];
console.log("    formations' tools available:", [...tools].join(", "), "· attempts:", need.attempts.map(a => `${a.tool}:${a.closes}`).join(" "));
ok("only tools that can answer this need were tried", need.attempts.every(a => ["morph-mir", "computational-grammar-coder", "diseminer"].includes(a.tool)));
ok("a tool is never tried twice on the same need (retry goes elsewhere)", new Set(need.attempts.map(a => a.tool)).size === need.attempts.length);
if (tools.has("morph-mir")) {
  ok("morph-mir closed the need and said what the file does", N.closed.length === 1 && need.attempts.at(-1).tool === "morph-mir");
  ok("the result is kept as a rule with raised confidence", N.rules["understand-file"]["morph-mir"].confidence > 0.5 && N.rules["understand-file"]["morph-mir"].success === 1);
} else ok("without a morph-mir formation the need stays open (honest)", N.open.length === 1);
{ const N2 = new Needs(); const n = N2.raise("understand-file", "b", {}); N2.record(n, "diseminer", false, { reason: "x" });
  ok("a failed try lowers that tool's confidence and the next candidate is different", N2.rules["understand-file"]["diseminer"].confidence < 0.5 && N2.candidates(n)[0] !== "diseminer");
  N2.record(n, "morph-mir", true, {}); ok("a second try that closes the gap is marked as a retry", n.attempts[1].retry && N2.closed.length === 1); }
console.log(`\n${pass} passed, ${fail} failed`); if (fail) process.exit(1);
