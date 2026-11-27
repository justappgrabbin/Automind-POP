// fpgrowth.js — finds what keeps showing up together, and rules "when these are present, that usually helps".
// Pure-JS port of FP-Growth + association rules from chen0040/java-frequent-pattern-mining
// (MIT License, Copyright (c) 2017 Xianshun Chen). Transactions are arrays of strings (ops in a successful formation,
// features of a place, bonds in a cluster ...). No neural net; results are plain, inspectable item sets.
export function fpGrowth(transactions, minSupport = 2) {
  const count = new Map(); for (const t of transactions) for (const i of new Set(t)) count.set(i, (count.get(i) ?? 0) + 1);
  const order = i => -(count.get(i) ?? 0), keep = t => [...new Set(t)].filter(i => count.get(i) >= minSupport).sort((a, b) => order(a) - order(b) || (a < b ? -1 : 1));
  const root = { item: null, n: 0, kids: new Map(), parent: null }, heads = new Map();
  const insert = (node, items, n) => { for (const it of items) { let k = node.kids.get(it); if (!k) { k = { item: it, n: 0, kids: new Map(), parent: node }; node.kids.set(it, k); (heads.get(it) ?? heads.set(it, []).get(it)).push(k); } k.n += n; node = k; } };
  for (const t of transactions) insert(root, keep(t), 1);
  const out = [];
  const mine = (heads, suffix) => {
    for (const [item, nodes] of heads) {
      const sup = nodes.reduce((a, n) => a + n.n, 0); if (sup < minSupport) continue;
      const set = [item, ...suffix]; out.push({ items: set, support: sup });
      const cond = []; for (const n of nodes) { const path = []; for (let p = n.parent; p && p.item !== null; p = p.parent) path.unshift(p.item); if (path.length) cond.push([path, n.n]); }
      const c = new Map(); for (const [p, n] of cond) for (const i of p) c.set(i, (c.get(i) ?? 0) + n);
      const r2 = { item: null, kids: new Map() }, h2 = new Map();
      for (const [p, n] of cond) { let node = r2; for (const it of p.filter(i => c.get(i) >= minSupport)) { let k = node.kids.get(it); if (!k) { k = { item: it, n: 0, kids: new Map(), parent: node }; node.kids.set(it, k); (h2.get(it) ?? h2.set(it, []).get(it)).push(k); } k.n += n; node = k; } }
      if (h2.size) mine(h2, set);
    }
  };
  mine(heads, []); return out;
}
/** association rules X -> Y with confidence = support(X∪Y)/support(X) */
export function rules(itemsets, minConfidence = 0.6) {
  const sup = new Map(itemsets.map(s => [[...s.items].sort().join("|"), s.support])), out = [];
  for (const s of itemsets) { if (s.items.length < 2) continue;
    for (const y of s.items) { const x = s.items.filter(i => i !== y), sx = sup.get([...x].sort().join("|")); if (!sx) continue;
      const conf = s.support / sx; if (conf >= minConfidence) out.push({ if: x, then: y, confidence: conf, support: s.support }); } }
  return out.sort((a, b) => b.confidence - a.confidence || b.support - a.support);
}
