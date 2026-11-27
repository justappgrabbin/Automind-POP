// Node test of faces.js with a stub chamber (my own test functions only; harvested code is never run here).
import { Faces, argsFor, bodyOf } from "./faces.js"; import { loadVocabulary, dress } from "./vocabulary.js";
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? "ok  " : "FAIL") + " " + m); };
const list = [
  { id: "m", name: "mean", params: ["values"], code: "function mean(values){return values.reduce((a,b)=>a+b,0)/values.length}" },
  { id: "u", name: "shout", params: ["text"], code: "function shout(text){return text.toUpperCase()}" },
  { id: "x", name: "boom", params: ["n"], code: "function boom(n){throw Error('no')}" }];
const stub = { run: async (src, args) => { try { return { ok: true, result: JSON.parse(JSON.stringify(new Function("args", src)(args) ?? null)) }; } catch (e) { return { ok: false, error: e.message }; } } };
await loadVocabulary(); const u = { id: 0, x: .2, y: .4, address: { gate: 4, line: 1, color: 2, tone: 3, base: 1, dimension: "Being" }, four: { area: ["a"], chainWords: ["Being"] } };
dress(u); ok(u.blue?.line?.name === "Folly" && /perfect timing/.test(u.blue.line.exalted_short), "unit 4.1 wears Blue I Ching line Folly with its success/failure text");
ok(Array.isArray(argsFor(u, list[0]).values) && typeof argsFor(u, list[1]).text === "string" && typeof argsFor(u, list[2]).n === "number", "params mapped by name to the unit's own material");
ok(bodyOf(list[0]).includes('return (mean)(args["values"])'), "chamber body calls the face with its params");
const F = new Faces(list, stub);
for (let i = 0; i < 4; i++) { await F.tryOn(u, list[0]); await F.tryOn(u, list[2]); }
ok(F.earned(4).map(e => e.face.name).join() === "mean", "gate 4 earned mean (works), not boom (throws)");
ok(u.face?.name === "mean" && u.face.earned, "the unit wears the earned face");
ok(JSON.stringify(F.placement()) === JSON.stringify({ 4: [{ name: "mean", ok: 4, tries: 4 }] }), "placement = what was earned, nothing else");
const G = new Faces(list, stub, JSON.parse(JSON.stringify(F.export()))); ok(G.earned(4).length === 1, "record survives save/load");
let pickedEarned = 0; for (let i = 0; i < 100; i++) if (G.pick(u).name === "mean") pickedEarned++; ok(pickedEarned > 55, `units of gate 4 reach for their earned face first (${pickedEarned}/100)`);
const S = { units: [u, { id: 1, broken: true, address: { gate: 2 } }] }; await G.tick(S); ok(G.tries === 1 && G.last.unit === 0, "tick tries a live unit only");
const need = G.provide(["numbers"], "number"); ok(need[0]?.face.name === "mean" && need[0].examples.length > 0, "asked for numbers->number, the swarm provides mean (seen doing it, with examples)");
ok(G.provide(["yesno"], "texts").length === 0, "nothing seen doing yesno->texts → nothing offered (no guessing)");
console.log(`${pass}/${pass + fail}`); process.exit(fail ? 1 : 0);
