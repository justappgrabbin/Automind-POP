// health.js — the swarm's PAIN SIGNAL. A condition, not a fixer: it never says what to build, only where a place hurts
// and how much. Any place gives these signs off on its own; nobody has to describe the place first.
// A place = { files: [{path, text}] } and/or { probe(): {ok, signs:[...]}} for places that are not code (a world, a page).
// Signs read from files (no setup):
//   syntax   — the file cannot even be parsed
//   missing  — an import points at a file that is not there, or at a name that file never exports
//   unknown  — something is called that nothing defines, imports, or the language provides
//   broken   — loading the file throws
//   promise  — the place's own assert says it should do something and it does not
// health = 1 / (1 + weighted pain). 1 = nothing hurts. Each sign carries WHERE (file, name) so units can orient to it.
import { runHost } from "./lifecycle.js";

const W = { syntax: 3, missing: 2, broken: 2, unknown: 1, promise: 1, other: 1 };
const BUILTIN = new Set(("if for while switch catch function return typeof new await async assert console Math JSON Object Array " +
  "String Number Boolean Date Map Set Promise Error parseInt parseFloat isNaN setTimeout clearTimeout fetch require super " +
  "structuredClone Symbol RegExp BigInt").split(" "));

const strip = t => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "").replace(/(["'`])(?:\\.|(?!\1)[^\\])*\1/g, '""');
const resolve = (from, rel) => { const p = from.split("/").slice(0, -1); for (const s of rel.split("/")) s === ".." ? p.pop() : s !== "." && p.push(s); return p.join("/"); };

function fileSigns(f, files) {
  const signs = [], src = strip(f.text);
  const body = f.text.replace(/import\s*\{[^}]*\}\s*from\s*['"][^'"]+['"];?/g, "").replace(/export\s+(?=function|const|let|class)/g, "");
  try { new Function(body); } catch (e) { if (e instanceof SyntaxError) signs.push({ kind: "syntax", file: f.path, name: e.message }); }
  const known = new Set(BUILTIN);
  for (const m of f.text.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) {
    const target = resolve(f.path, m[2]), names = m[1].split(",").map(s => s.trim().split(/\s+as\s+/).pop()).filter(Boolean);
    names.forEach(n => known.add(n));
    const tf = files.find(x => x.path === target);
    if (!tf) { if (m[2].startsWith(".")) signs.push({ kind: "missing", file: f.path, name: m[2] }); continue; }
    for (const n of m[1].split(",").map(s => s.trim().split(/\s+as\s+/)[0]).filter(Boolean))
      if (!new RegExp(`export\\s+(?:async\\s+)?(?:function|const|let|class)\\s+${n}\\b`).test(tf.text)) signs.push({ kind: "missing", file: f.path, name: n });
  }
  for (const m of src.matchAll(/(?:function|const|let|var|class)\s+([\w$]+)/g)) known.add(m[1]);
  for (const m of src.matchAll(/\(([^()]*)\)\s*(?:=>|\{)/g)) m[1].split(",").forEach(p => known.add(p.trim().replace(/=.*/, "")));
  for (const m of src.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g))
    if (!known.has(m[1]) && !signs.some(s => s.name === m[1])) signs.push({ kind: "unknown", file: f.path, name: m[1] });
  return signs;
}

export function readHealth(place) {
  const files = place.files ?? [], signs = files.flatMap(f => fileSigns(f, files));
  if (files.length && !signs.some(s => s.kind === "syntax")) {
    const r = runHost(files);
    r.failures.forEach(x => signs.push({ kind: "promise", file: x.in, name: "assert" }));
    if (r.error && !/missing module/.test(r.error) && !signs.some(s => r.error.includes(s.name))) signs.push({ kind: "broken", file: "?", name: r.error });
  }
  if (place.probe) { const p = place.probe(); (p.signs ?? []).forEach(s => signs.push({ kind: s.kind ?? "other", file: s.where ?? "world", name: s.name ?? String(s) })); }
  const pain = signs.reduce((a, s) => a + (W[s.kind] ?? 1), 0);
  return { health: 1 / (1 + pain), pain, signs, where: [...new Set(signs.map(s => s.file))] };
}

/** Did a change help? The only judgment the swarm gets: better, worse, or same — and where the pain moved. */
export function compareHealth(before, after) {
  const key = s => s.kind + "|" + s.file + "|" + s.name, b = new Set(before.signs.map(key)), a = new Set(after.signs.map(key));
  return { delta: after.health - before.health, healed: [...b].filter(k => !a.has(k)), new: [...a].filter(k => !b.has(k)) };
}
