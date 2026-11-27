// Harvests FORM particles (the foreground half of the dual swarm) from uploaded pages — parse-only, nothing run.
// Not whole pages: the reusable parts a page's look is made of.
//   tokens:     colors (with how often used), font stacks, corner radii, shadows, gradients, spacing values
//   components: each CSS rule's selector + declarations, grouped by what it styles (button, card, input, panel, chip, grid…)
//   layouts:    grid/flex containers (grid-template-columns/rows, flex direction, gap)
//   motion:     transitions, animations, @keyframes
// Every particle keeps where it came from.
const fs = require("fs"), path = require("path"), out = process.argv.at(-1), roots = process.argv.slice(2, -1);
const css = []; const walk = d => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name);
  if (f.isDirectory()) { if (!/node_modules|\.git|^dist$|^build$|^vendor$/.test(f.name)) walk(p); continue; }
  if (!/\.(html?|css)$/.test(f.name) || fs.statSync(p).size > 600000) continue; let t = fs.readFileSync(p, "utf8");
  if (/\.html?$/.test(f.name)) t = [...t.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join("\n");
  if (t.trim()) css.push({ from: p.replace(/^\/(tmp|home\/claude\/w27)\/[^/]+\//, ""), t }); } };
roots.forEach(walk);
const tokens = { colors: {}, fonts: {}, radii: {}, shadows: {}, gradients: {}, spacing: {} }, components = [], layouts = [], motion = [], seen = new Set();
const bump = (o, k, from) => { k = k.trim(); if (!k) return; (o[k] ??= { n: 0, from: new Set() }).n++; o[k].from.add(from.split("/")[0]); };
const KIND = [["button", /\bbutton\b|\.btn\b/], ["input", /\binput\b|textarea|select\b/], ["card", /card|panel|tile/], ["chip", /chip|pill|badge|tag\b/],
  ["header", /header|\.top\b|navbar|\bnav\b/], ["tray", /tray|dock|footer/], ["modal", /modal|window|dialog|overlay/], ["grid", /grid/], ["list", /\blist\b|\blog\b|row/], ["text", /\bh[1-6]\b|title|label|meta|muted/]];
for (const { from, t } of css) {
  for (const m of t.matchAll(/@keyframes\s+([\w-]+)\s*\{((?:[^{}]*\{[^{}]*\})*[^{}]*)\}/g)) motion.push({ name: m[1], keyframes: m[2].replace(/\s+/g, " ").trim().slice(0, 600), from });
  for (const m of t.replace(/@keyframes[\s\S]*?\}\s*\}/g, "").matchAll(/([^{}@]+)\{([^{}]*)\}/g)) {
    const sel = m[1].trim().replace(/\s+/g, " "), body = m[2].trim(); if (!sel || !body || sel.length > 200) continue;
    for (const c of body.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g) ?? []) bump(tokens.colors, c.toLowerCase().replace(/\s+/g, ""), from);
    for (const [prop, o] of [["font-family", tokens.fonts], ["border-radius", tokens.radii], ["box-shadow", tokens.shadows], ["gap", tokens.spacing], ["padding", tokens.spacing]]) { const v = body.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`)); if (v) bump(o, v[1], from); }
    for (const g of body.match(/(?:linear|radial|conic)-gradient\((?:[^()]|\([^)]*\))*\)/g) ?? []) bump(tokens.gradients, g, from);
    for (const mm of body.matchAll(/(?:transition|animation)\s*:\s*([^;]+)/g)) motion.push({ selector: sel, rule: mm[0], from });
    const decl = body.replace(/\s+/g, " "), key = sel + "|" + decl; if (seen.has(key)) continue; seen.add(key);
    if (/display\s*:\s*(grid|flex)/.test(body)) layouts.push({ selector: sel, css: decl, from });
    const kind = KIND.find(([, re]) => re.test(sel))?.[0]; if (kind) components.push({ kind, selector: sel, css: decl, from });
  }
}
const top = (o, n) => Object.entries(o).sort((a, b) => b[1].n - a[1].n).slice(0, n).map(([v, s]) => ({ value: v, uses: s.n, pages: s.from.size }));
const res = { made: "harvest_forms.cjs (parse only)", sources: css.length,
  tokens: { colors: top(tokens.colors, 300), fonts: top(tokens.fonts, 60), radii: top(tokens.radii, 60), shadows: top(tokens.shadows, 80), gradients: top(tokens.gradients, 120), spacing: top(tokens.spacing, 80) },
  components, layouts, motion: motion.slice(0, 800) };
fs.writeFileSync(out, JSON.stringify(res, null, 1));
const kinds = {}; components.forEach(c => kinds[c.kind] = (kinds[c.kind] ?? 0) + 1);
console.log(JSON.stringify({ pagesWithStyle: css.length, colors: Object.keys(tokens.colors).length, fonts: Object.keys(tokens.fonts).length, gradients: Object.keys(tokens.gradients).length, components: components.length, kinds, layouts: layouts.length, motion: motion.length }));
