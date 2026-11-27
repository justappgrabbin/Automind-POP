// statespace.js — the semantic state space. Words bond like nucleotides instead of being strung by traversal.
//   WORD      = a token the Section 6 engine produced, carrying its own binding sites (gate, dimension, chain slot).
//   MESH      = weak bonds (like hydrogen bonds): availability. A word sitting in the network; breaks off easily.
//   NEURAL NET= strong bond: forms in a CHANNEL when both gates of that channel are present. Capability, stability.
//   ATO       = bloodstream: transport of activation along whatever bonds exist.
// Edge e = (u, v, d, l, q); q keeps strength, persistence, activation, regime, plasticity SEPARATE.
// A word's position in the space is learned from experience: where its activation actually went, per dimension.
import { PARTNERS } from "./address.js";
import { CHAINS } from "./lexicon.js";
import { DIM_NAMES } from "./dimensions.js";

const chainIndex = {};                                     // word -> [{dim, slot}]
for (const d of DIM_NAMES) [...CHAINS[d].nature, ...CHAINS[d].human].forEach((w, k) => (chainIndex[w.toLowerCase()] ??= []).push({ dim: d, slot: k }));

export const WEAK = { strength: 0.15, persistence: 1, decay: 0.12, plasticity: 0.5, regime: "mesh" };
export const STRONG = { strength: 0.9, persistence: 1, decay: 0.0, plasticity: 0.05, regime: "channel" };

export class StateSpace {
  constructor() { this.words = new Map(); this.edges = new Map(); this.t = 0; this.events = []; }

  /** A word arrives with a binding site. Same word from another gate adds a site, not a copy. */
  addWord(word, site) {
    const k = word.toLowerCase(), w = this.words.get(k) ?? { word, sites: [], chain: chainIndex[k] ?? [], activation: 0,
      position: Object.fromEntries(DIM_NAMES.map(d => [d, 0])) };
    if (!w.sites.some(s => s.gate === site.gate && s.dim === site.dim && s.agent === site.agent)) w.sites.push(site);
    this.words.set(k, w); return w;
  }

  /** Complementarity: which kind of bond two words can make, if any. */
  complement(a, b) {
    for (const s of a.sites) for (const r of b.sites) if (s.gate !== r.gate && PARTNERS[s.gate]?.has(r.gate))
      return { kind: "channel", d: s.dim, l: `${Math.min(s.gate, r.gate)}-${Math.max(s.gate, r.gate)}` };
    for (const c of a.chain) for (const e of b.chain) if (c.dim === e.dim && Math.abs(c.slot - e.slot) === 1)
      return { kind: "mesh", d: c.dim, l: "chain-adjacent" };
    for (const s of a.sites) for (const r of b.sites) if (s.agent === r.agent && s.dim === r.dim)
      return { kind: "mesh", d: s.dim, l: "same-sentence" };
    return null;
  }

  bond(a, b, c) {
    const key = [a.word, b.word].map(s => s.toLowerCase()).sort().join("|"), ex = this.edges.get(key);
    const proto = c.kind === "channel" ? STRONG : WEAK;
    if (ex) { if (c.kind === "channel" && ex.q.regime === "mesh") { Object.assign(ex.q, { ...STRONG, activation: ex.q.activation }); ex.l = c.l; ex.d = c.d;
                this.events.push({ t: this.t, type: "promote", key }); }
              ex.q.persistence = 1; return ex; }
    const e = { u: a.word, v: b.word, d: c.d, l: c.l, q: { strength: proto.strength, persistence: 1, activation: 0, regime: proto.regime, plasticity: proto.plasticity } };
    this.edges.set(key, e); this.events.push({ t: this.t, type: "bond", key, regime: proto.regime }); return e;
  }

  /** Take in an organism's current sentences: every token becomes a word with sites; complementary words bond. */
  ingest(org) {
    const fresh = [];
    org.agents.forEach((a, i) => { for (const d of DIM_NAMES) { const s = a.dims?.[d]?.function.sentence; if (!s || s.halted) continue;
      for (const tk of s.tokens) fresh.push(this.addWord(tk.word, { gate: a.address.gate, line: a.address.line, dim: d, agent: i, weight: tk.weight })); } });
    const W = [...this.words.values()];
    for (let i = 0; i < W.length; i++) for (let j = i + 1; j < W.length; j++) { const c = this.complement(W[i], W[j]); if (c) this.bond(W[i], W[j], c); }
    for (const w of new Set(fresh)) w.activation += 1;
    return this;
  }

  /** ATO transport + bond physics for one step. Weak bonds fade unless re-made; strong bonds hold. Hebbian growth. */
  step(dt = 1) {
    this.t += dt; const next = new Map([...this.words].map(([k, w]) => [k, w.activation * 0.9]));
    for (const [key, e] of this.edges) {
      const a = this.words.get(e.u.toLowerCase()), b = this.words.get(e.v.toLowerCase()), flow = e.q.strength * 0.1 * dt;
      next.set(e.u.toLowerCase(), next.get(e.u.toLowerCase()) + flow * b.activation);
      next.set(e.v.toLowerCase(), next.get(e.v.toLowerCase()) + flow * a.activation);
      e.q.activation = flow * (a.activation + b.activation);
      e.q.strength = Math.min(1, e.q.strength + e.q.plasticity * 0.01 * a.activation * b.activation);   // co-active -> stronger
      const decay = e.q.regime === "mesh" ? WEAK.decay : STRONG.decay; e.q.persistence -= decay * dt;
      if (e.q.persistence <= 0) { this.edges.delete(key); this.events.push({ t: this.t, type: "break", key }); }
      else for (const w of [a, b]) w.position[e.d] += e.q.activation;          // the word learns where it lives
    }
    for (const [k, v] of next) this.words.get(k).activation = v;
    return this;
  }

  /** Neural nets = connected components of strong (channel) bonds. Mesh = everything else that's attached. */
  formations() {
    const strong = [...this.edges.values()].filter(e => e.q.regime === "channel"), parent = {};
    const find = x => (parent[x] ??= x) === x ? x : (parent[x] = find(parent[x]));
    for (const e of strong) parent[find(e.u.toLowerCase())] = find(e.v.toLowerCase());
    const groups = {}; for (const e of strong) { const r = find(e.u.toLowerCase()); (groups[r] ??= { words: new Set(), channels: new Set() });
      groups[r].words.add(e.u); groups[r].words.add(e.v); groups[r].channels.add(e.l); }
    return { nets: Object.values(groups).map(g => ({ words: [...g.words], channels: [...g.channels] })),
             mesh: [...this.edges.values()].filter(e => e.q.regime === "mesh").length };
  }

  /** Nearest words by learned position (cosine over the five dimensions). */
  near(word, k = 5) {
    const w = this.words.get(word.toLowerCase()); if (!w) return [];
    const v = DIM_NAMES.map(d => w.position[d]), nv = Math.hypot(...v) || 1;
    return [...this.words.values()].filter(o => o !== w).map(o => { const u = DIM_NAMES.map(d => o.position[d]);
      return { word: o.word, sim: u.reduce((s, x, i) => s + x * v[i], 0) / ((Math.hypot(...u) || 1) * nv) }; })
      .sort((a, b) => b.sim - a.sim).slice(0, k);
  }
}
