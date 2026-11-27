// placememory.js — the swarm's memory of PLACES it has been, and what it BECAME there.
// Not a gap-filler log: an entry records the role the swarm took (anything — an app, a world piece, a paper's method,
// a character), what it did, and whether the place got healthier. Gap-filling is just one role among many.
// Conditions only: memory never tells the swarm what to be; it offers "places like this one, and what worked there".
//
// fingerprint(place)  -> bag of features the place gives off on its own (file kinds, names, words, pain kinds, probe words)
// recall(mem, place)  -> past entries ranked by similarity, each with role / acts / delta
// remember(mem, place, {role, acts, before, after}) -> adds an entry (kept whether it helped or not; delta says which)
// ask(mem, place, health, teacher) -> OPTIONAL teacher (e.g. TinyLlama). Its ideas are only suggestions: they come back
//   as {role, acts} candidates tagged source:"teacher". The swarm must try them (chamber) and only remember() decides
//   what stays — through the health delta. A teacher idea that did not help is remembered as not helping.
// Persistence: toJSON / fromJSON (browser: localStorage; network: share entries, the pool grows from every drop).
import { readHealth } from "./health.js";

const words = t => (t.toLowerCase().match(/[a-z]{3,}/g) ?? []);
export function fingerprint(place) {
  const f = new Map(), add = (k, w = 1) => f.set(k, (f.get(k) ?? 0) + w);
  for (const file of place.files ?? []) {
    add("ext:" + (file.path.split(".").pop() || "none"));
    file.path.split(/[\/._-]/).filter(Boolean).forEach(p => add("name:" + p.toLowerCase(), 2));
    for (const m of file.text.matchAll(/(?:function|class|const|let)\s+([\w$]+)/g)) words(m[1].replace(/([a-z])([A-Z])/g, "$1 $2")).forEach(w => add("word:" + w));
    if (/document\.|window\./.test(file.text)) add("trait:dom", 3);
    if (/canvas|requestAnimationFrame/.test(file.text)) add("trait:visual", 3);
    if (/assert\(/.test(file.text)) add("trait:promises", 2);
  }
  for (const w of words(place.about ?? "")) add("word:" + w, 2);
  if (place.probe) for (const s of place.probe().signs ?? []) words(String(s.name ?? s)).forEach(w => add("world:" + w, 2));
  for (const s of (place.health ?? readHealth(place)).signs) add("pain:" + s.kind, 2);
  return Object.fromEntries(f);
}

export function similarity(a, b) {          // weighted Jaccard
  let lo = 0, hi = 0;
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { const x = a[k] ?? 0, y = b[k] ?? 0; lo += Math.min(x, y); hi += Math.max(x, y); }
  return hi ? lo / hi : 0;
}

export const newMemory = () => ({ entries: [] });

export function remember(mem, place, { role, acts = [], before, after, source = "swarm" }) {
  const e = { fp: fingerprint(place), role, acts, source, delta: (after?.health ?? 0) - (before?.health ?? 0), t: Date.now() };
  mem.entries.push(e); return e;
}

export function recall(mem, place, k = 5) {
  const fp = fingerprint(place);
  return mem.entries.map(e => ({ ...e, sim: similarity(fp, e.fp) })).filter(e => e.sim > 0)
    .sort((a, b) => (b.sim * (1 + Math.max(0, b.delta))) - (a.sim * (1 + Math.max(0, a.delta)))).slice(0, k);
}

/** Has the swarm met places like this enough to stand alone? (sim of best helpful match) */
export const familiarity = (mem, place) => Math.max(0, ...recall(mem, place).filter(e => e.delta > 0).map(e => e.sim));

/** Ask an optional teacher ONLY when the place is unfamiliar. teacher(prompt) -> Promise<string>. */
export async function ask(mem, place, health, teacher, { threshold = 0.35 } = {}) {
  if (!teacher || familiarity(mem, place) >= threshold) return [];
  const fp = fingerprint(place), top = Object.entries(fp).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([k]) => k).join(", ");
  const pains = health.signs.slice(0, 8).map(s => `${s.kind} ${s.name} in ${s.file}`).join("; ") || "none";
  const prompt = `A swarm has been dropped into a place. Features: ${top}. Pain: ${pains}.\n` +
    `List up to 3 things the swarm could BE here (any role, not only a fixer). One per line as: role | action, action`;
  let text = ""; try { text = await teacher(prompt); } catch { return []; }
  return text.split("\n").map(l => l.replace(/^[\s\d.\-*]+/, "")).filter(l => l.includes("|")).slice(0, 3)
    .map(l => { const [role, a] = l.split("|"); return { role: role.trim(), acts: a.split(",").map(s => s.trim()).filter(Boolean), source: "teacher" }; });
}

export const toJSON = mem => JSON.stringify(mem);
export const fromJSON = s => { try { const m = JSON.parse(s); return m?.entries ? m : newMemory(); } catch { return newMemory(); } };

/** Optional TinyLlama teacher for the browser, loaded only on first use (large download; never in the slim path).
 *  Uses transformers.js from a CDN. Model id is a parameter; the default is an assumption — check it exists before relying on it. */
//  Quantized by default. Files checked on the Hub (Xenova/TinyLlama-1.1B-Chat-v1.0/onnx): model_q4f16 713.7 MB (needs WebGPU),
//  model_q4 909.6 MB (works on plain WASM/CPU), full model 4.4 GB (never used here).
export function tinyLlamaTeacher({ model = "Xenova/TinyLlama-1.1B-Chat-v1.0", cdn = "https://cdn.jsdelivr.net/npm/@huggingface/transformers", dtype } = {}) {
  let gen = null;
  return async prompt => {
    if (!gen) { const { pipeline } = await import(cdn); const gpu = typeof navigator !== "undefined" && !!navigator.gpu;
      gen = await pipeline("text-generation", model, gpu ? { dtype: dtype ?? "q4f16", device: "webgpu" } : { dtype: dtype ?? "q4" }); }
    const out = await gen(prompt, { max_new_tokens: 120 });
    return String(out?.[0]?.generated_text ?? "").slice(prompt.length);
  };
}
