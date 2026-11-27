// sandbox_bridge.js — hands abilities adopted from a repository (repo_abilities.js: async, chamber-only) to the
// organism's construction (morphogenesis.enter: synchronous op.run). v39 files are not changed.
// How: before the units construct, Movement units carry the outside abilities into the chamber over everything the
// host could produce (its materials for every case, then what the host's own operations make from them, a few layers
// deep). Every answer comes back from the chamber and is remembered. During construction the outside operation answers
// only from those chamber answers; anything never asked in the chamber is refused (it throws, and that path is dropped).
// The descendant module carries the ability's own source, because the grown app needs real code once the swarm leaves.
import { enter } from "./morphogenesis.js"; import { strip } from "./repo_abilities.js";
const key = a => JSON.stringify(a);
function combos(op, pool, cap) { const ps = Object.entries(op.inputs), out = [];
  (function rec(i, cur) { if (out.length >= cap) return; if (i === ps.length) return void out.push({ ...cur });
    for (const v of pool.get(ps[i][1]) ?? []) { cur[ps[i][0]] = v; rec(i + 1, cur); if (out.length >= cap) return; } })(0, {}); return out; }

export function asSync(ab) {
  const answers = new Map(), params = Object.keys(ab.inputs);
  const run = args => { const k = key(params.map(p => args[p])); if (!answers.has(k)) throw Error("not asked in the chamber"); return structuredClone(answers.get(k)); };
  run.toString = () => `(args) => {\n${strip(ab.source)}\nreturn ${ab.fnName}(${params.map(p => "args." + JSON.stringify(p).slice(1, -1)).map(p => p).join(", ")}); }`;
  return { id: ab.id, inputs: ab.inputs, output: ab.output, dimension: "Movement", sandboxed: true, run,
    ask: async list => { const k = key(list); if (!answers.has(k)) answers.set(k, await ab.call(list)); return answers.get(k); }, answers };
}

/** Prepare (async, chamber), then enter (the units construct as usual). */
export async function enterWithAbilities(O, host, abilities, { depth = 3, cap = 60, ...opt } = {}) {
  const outside = abilities.map(asSync), m = host.materials(), pool = new Map(), seen = new Set();
  const put = (t, v) => { const k = t + key(v); if (seen.has(k)) return false; seen.add(k); if (!pool.has(t)) pool.set(t, []); pool.get(t).push(v); return true; };
  for (const o of m.observations) put(o.type, o.value);
  for (const c of m.cases ?? []) for (const [id, v] of Object.entries(c.inputs)) { const o = m.observations.find(x => x.id === id); if (o) put(o.type, v); }
  let asked = 0, refused = 0;
  for (let d = 0; d < depth; d++) { const fresh = [];
    for (const op of [...m.primitives, ...outside]) for (const a of combos(op, pool, cap)) {
      try { const out = op.sandboxed ? await op.ask(Object.keys(op.inputs).map(p => a[p])) : (op.guard && !op.guard(a) ? undefined : op.run(structuredClone(a)));
        if (op.sandboxed) asked++; if (out !== undefined) fresh.push([op.output, out]); } catch { if (op.sandboxed) refused++; } }
    for (const [t, v] of fresh) put(t, v); }
  const real = host.materials; host.materials = () => { const x = real.call(host); return { ...x, primitives: [...x.primitives, ...outside] }; };
  try { const r = enter(O, host, opt); r.steps.unshift({ step: "chamber", abilities: outside.map(o => o.id), asked, refused }); return r; } finally { host.materials = real; }
}
