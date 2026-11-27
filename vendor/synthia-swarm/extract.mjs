// Reads the repo's test files as TEXT ONLY (never runs them) and pulls out literal examples:
//   expect(fn(LIT, ...)).toEqual(LIT)    and    const x = LIT; const expected = LIT; ... fn(x)
// Literals are parsed with JSON.parse after small normalising (single quotes, trailing commas) — no eval.
import { readFileSync, writeFileSync } from "fs"; import { dirname, basename } from "path"; import { execFileSync } from "child_process";
const lit = s => { try { return JSON.parse(s.trim().replace(/'/g, '"').replace(/,\s*([\]}])/g, "$1").replace(/([{,]\s*)([A-Za-z_]\w*)\s*:/g, '$1"$2":')); } catch { return undefined; } };
const splitArgs = s => { const a = []; let d = 0, q = null, cur = ""; for (const ch of s) { if (q) { cur += ch; if (ch === q) q = null; continue; } if (ch === '"' || ch === "'") q = ch; if ("[{(".includes(ch)) d++; if ("]})".includes(ch)) d--; if (ch === "," && !d) { a.push(cur); cur = ""; } else cur += ch; } if (cur.trim()) a.push(cur); return a; };
const out = [];
for (const t of execFileSync("find", [process.argv[2], "-name", "*.test.ts", "-not", "-path", "*/node_modules/*"]).toString().trim().split("\n")) {
  const src = readFileSync(t, "utf8"), m = src.match(/import\s*\{([^}]*)\}\s*from/); if (!m) continue;
  for (const name of m[1].split(",").map(s => s.trim()).filter(Boolean)) {
    const cases = [];
    for (const blk of src.split(/\bit\(|\btest\(/).slice(1)) {
      const vars = {}; for (const v of blk.matchAll(/const\s+(\w+)\s*(?::[^=]+)?=\s*([^;\n]+);?/g)) { const x = lit(v[2]); if (x !== undefined) vars[v[1]] = x; }
      const val = s => (s.trim() in vars ? vars[s.trim()] : lit(s));
      const call = blk.match(new RegExp(`\\b${name}\\(([^;]*?)\\)\\s*\\)?\\s*\\.?(?:toEqual|toBe|toStrictEqual)?\\(?([^;\\n]*?)\\)?;`));
      const e = blk.match(new RegExp(`expect\\(\\s*${name}\\((.*?)\\)\\s*\\)\\.(?:toEqual|toBe|toStrictEqual)\\((.*?)\\);`));
      const c = blk.match(new RegExp(`=\\s*${name}\\((.*?)\\);`)), ex = blk.match(/expect\(\s*\w+\s*\)\.(?:toEqual|toBe|toStrictEqual)\((.*?)\);/);
      let args, res;
      if (e) { args = splitArgs(e[1]).map(val); res = val(e[2]); }
      else if (c && ex) { args = splitArgs(c[1]).map(val); res = val(ex[1]); }
      if (args && res !== undefined && args.every(a => a !== undefined)) cases.push({ args, out: res });
    }
    if (cases.length) out.push({ problem: basename(dirname(t)), name, cases });
  }
}
writeFileSync("cases.json", JSON.stringify(out)); console.log(out.map(p => `${p.problem} ${p.name}: ${p.cases.length} examples, ${JSON.stringify(p.cases[0]).slice(0, 70)}`).join("\n"));
