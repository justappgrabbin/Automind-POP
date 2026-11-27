// organism.js — ONE self-organizing relational swarm. Agents keep identity, position, context,
// relationships and learned state; the semantic layer expresses that same state and its
// interaction outcomes feed back into the relational state the trained model reads.
import { addressOf, formatAddress, DIMENSIONS, hdType, TYPES, PARTNERS } from "./address.js";
import { buildGraph, SwarmModel, PRIMARY_NAMES } from "./swarm_model.js";
import { maskFromKingWen } from "./kingwen.js";
import { describe, changingLines, changeLine } from "./hexagram.js";
import { express } from "./expression.js";
import { sentence } from "./lexicon.js";
import { layers as dimensionLayers } from "./dimensions.js";
import { StateSpace } from "./statespace.js";

// Two aspects per dimension: FUNCTION (what it can do/say) and VISUAL (how it shows). Identity is not an
// aspect: it is the Who, Space reading the other four (agent.who).
// Swarm features <-> contextual dimensions (user's own definitions; Burgess link types):
// Reach=Movement (available transitions, LEADS TO), Closeness=Evolution (actual traversal, NEAR),
// Size=Being (current occupancy, CONTAINS), Gaps=Design (persistent geometry, EXPRESSES),
// Perspective=Space (interplay of the four, the Who).
export const DIM_OF_FEATURE = { Reach: "Movement", Closeness: "Evolution", Size: "Being", Gaps: "Design", Perspective: "Space" };
const FEATURE_OF_DIM = Object.fromEntries(Object.entries(DIM_OF_FEATURE).map(([f, d]) => [d, PRIMARY_NAMES.indexOf(f)]));
const popcount = m => { let c = 0; while (m) { c += m & 1; m >>>= 1; } return c; };
export const ACTIONS = ["strengthen", "weaken", "attune", "hold"];

/** Register = which of the four fields the activation speaks through (byte bits 6-7). */
export function registerFor(addr) { return (addr.side === "Design" ? 2 : 0) + (addr.color <= 3 ? 0 : 1); }
// Design side -> Heart/Body fields, Personality side -> Mind/Movement; inward colors (1-3) vs outward (4-6)

export function createAgent(id, bodyIndex, lon, asc) {
  const address = addressOf(bodyIndex, lon, asc), identityMask = maskFromKingWen(address.gate);
  return { id, address, addressString: formatAddress(address), identityMask,     // identity never overwritten
    targetMask: identityMask, previousMask: identityMask, register: registerFor(address),
    smoothedLines: [0, 1, 2, 3, 4, 5].map(i => (identityMask >>> i) & 1), dims: null, learned: null, history: [] };
}

/** Frame-rate-independent smoothing toward the discrete target. */
export function interpolate(agent, dt, speed = 6) {
  const alpha = 1 - Math.exp(-speed * dt);
  for (let i = 0; i < 6; i++) agent.smoothedLines[i] += (((agent.targetMask >>> i) & 1) - agent.smoothedLines[i]) * alpha;
  return agent.smoothedLines;
}

/** Relational state between two agents; neither agent's own state is touched. */
export function relate(a, b) {
  const difference = a.targetMask ^ b.targetMask, shared = a.targetMask & b.targetMask, combined = a.targetMask | b.targetMask;
  return { between: [a.id, b.id], difference: describe(difference), shared: describe(shared), combined: describe(combined),
           key: `${popcount(difference)}:${popcount(shared)}` };
}

export class Organism {
  constructor(bundle, { radius = 8, seed = 1 } = {}) {
    this.model = new SwarmModel(bundle); this.radius = radius; this.listeners = []; this.t = 0;
    this.Q = {}; this.log = []; this.relations = new Map(); this.eps = 0.2; this.lr = 0.3;
    this.rand = (() => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); })();
  }
  on(fn) { this.listeners.push(fn); }                                   // renderer observes, never controls
  emit(ev) { for (const f of this.listeners) f(ev, this); }

  /** Load a chart: 26 longitudes (13 Personality + 13 Design), optional ascendant. */
  loadChart(lons, asc = null) {
    this.agents = lons.map((lon, i) => createAgent(i, i, lon, asc));
    const g = buildGraph(this.agents.map(a => a.address), this.radius); this.A = g.A; this.D = g.D; this.W = g.W;
    this.baseW = g.W.map(r => r.slice()); this.gates = this.agents.map(a => a.address.gate);
    this.trueType = hdType(this.gates); this.think(); this.emit({ type: "load" }); return this;
  }

  /** Run the trained swarm; write both aspects of every dimension into each agent. */
  think() {
    const prev = this.agents.map(a => a.dims);
    const { five, X } = this.model.inputs(this.A, this.D, this.gates), out = this.model.forward(this.W, X);
    this.out = out; this.inputsX = X;
    this.agents.forEach((a, i) => {
      a.learned = { embedding: out.embedding[i], probs: out.probs[i], pred: TYPES[out.pred[i]] };
      // E = I(B, R, P): expression from being (own value), relationships (weighted neighbor values), position (local embedding norm)
      const nb = this.W[i].map((w, j) => [w, j]).filter(([w]) => w > 0), ws = nb.reduce((s, [w]) => s + w, 0) || 1;
      const pos = Math.hypot(...out.local[i]) / (1 + Math.hypot(...out.local[i]));
      a.dims = Object.fromEntries(DIMENSIONS.map(D => {
        const k = FEATURE_OF_DIM[D.name], B = five[i][k], R = nb.reduce((s, [w, j]) => s + w * five[j][k], 0) / ws;
        const E = Math.tanh(0.5 * B + 0.5 * R) * (0.5 + pos);
        const was = prev[i]?.[D.name]?.expression?.value ?? E;
        const ad = a.address, fn = { feature: PRIMARY_NAMES[k], value: B, address: a.addressString,
          // FUNCTION: what this activation can say/do in this dimension — the Section 6 sentence, base set by the dimension
          sentence: sentence({ gate: ad.gate, line: ad.line, color: ad.color, tone: ad.tone, base: DIMENSIONS.indexOf(D) + 1 }),
          reaches: [...PARTNERS[ad.gate]].filter(p => this.gates.includes(p)) };
        const vis = { value: E, relational: R, position: pos, activity: E - was };   // VISUAL: sound -> color -> shape drive
        return [D.name, { wh: D.wh, function: fn, visual: vis,
                          identity: fn, expression: vis }];   // old names kept as aliases (nothing removed)
      }));
      // IDENTITY = the Who = Space reading the interplay of the other four (not a separate aspect)
      const four = ["Movement", "Evolution", "Being", "Design"].map(n => a.dims[n]);
      a.who = { dimension: "Space", interplay: four.map(d => d.function.value * d.visual.value),
                coherence: four.reduce((s, d) => s + d.function.value * d.visual.value, 0) / 4,
                sentence: a.dims.Space.function.sentence };
    });
    return out;
  }
  consensus() {                                                        // fraction agreeing with the majority, and majority
    const c = {}; for (const p of this.out.pred) c[p] = (c[p] || 0) + 1;
    const [maj, n] = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
    return { agree: n / this.agents.length, majority: TYPES[+maj], correct: +maj === this.trueType };
  }

  /** Advance continuous expression; sound, color, geometry from the same state, sound first. */
  tick(dt) { this.t += dt; for (const a of this.agents) { interpolate(a, dt); a.expression = express(a.smoothedLines, a.register); }
    this.emit({ type: "tick", dt }); }

  /** Choose an action from semantic information (relational pattern) via the learned policy. */
  choose(key) {
    const q = (this.Q[key] ??= Object.fromEntries(ACTIONS.map(x => [x, 0])));
    if (this.rand() < this.eps) return ACTIONS[Math.floor(this.rand() * ACTIONS.length)];
    return ACTIONS.reduce((b, x) => (q[x] > q[b] ? x : b), ACTIONS[0]);
  }

  /** One interaction between linked agents i,j: observe -> relate -> act -> outcome -> learn -> feed back. */
  interact(i, j) {
    if (!this.A[i][j]) throw new Error("agents not linked");
    const a = this.agents[i], b = this.agents[j], rel = relate(a, b), before = this.consensus();
    const action = this.choose(rel.key);
    if (action === "strengthen") this.W[i][j] = this.W[j][i] = Math.min(1, this.W[i][j] * 1.25);
    if (action === "weaken") this.W[i][j] = this.W[j][i] = Math.max(0.05, this.W[i][j] * 0.8);
    if (action === "attune") {                                         // one changing line toward the partner
      const diffLines = changingLines(a.targetMask, b.targetMask).lines;
      if (diffLines.length) { a.previousMask = a.targetMask; a.targetMask = changeLine(a.targetMask, diffLines[0]); } }
    this.think(); const after = this.consensus();
    const reward = (after.agree - before.agree) + 0.5 * ((+after.correct) - (+before.correct));
    const q = this.Q[rel.key]; q[action] += this.lr * (reward - q[action]);                 // learning
    const key = `${Math.min(i, j)}-${Math.max(i, j)}`, R = this.relations.get(key) ?? { history: [] };
    R.state = rel; R.history.push({ t: this.t, action, reward }); this.relations.set(key, R);
    const rec = { t: this.t, i, j, key: rel.key, action, before, after, reward, W: this.W[i][j] };
    this.log.push(rec); a.history.push(rec); b.history.push(rec); this.emit({ type: "interact", rec, rel });
    return rec;
  }

  /** Let the swarm self-organize for n interactions over random links. */
  live(n) { const pairs = []; for (let i = 0; i < this.agents.length; i++) for (let j = i + 1; j < this.agents.length; j++) if (this.A[i][j]) pairs.push([i, j]);
    for (let k = 0; k < n; k++) { const [i, j] = pairs[Math.floor(this.rand() * pairs.length)]; this.interact(i, j); this.tick(1 / 30); } }

  /** Take in text: every character (BHANTUGH-encoded, original kept) becomes a semantic event delivered
   *  to the agent that shares the most lines with it; that agent's expressed state moves to it. */
  hear(encoded) {
    const events = encoded.chars.map(c => {
      const m = c.G_geometry.hexagram.mask; let best = 0, bs = -1;
      this.agents.forEach((a, k) => { const s = 6 - popcount(a.targetMask ^ m); if (s > bs) { bs = s; best = k; } });
      const a = this.agents[best]; a.previousMask = a.targetMask; a.targetMask = m;
      a.register = c.G_geometry.hexagram.register;
      return { position: c.position, char: c.original, agent: best, mask: m, kingWen: c.G_geometry.hexagram.kingWen };
    });
    this.emit({ type: "hear", events }); return events;
  }

  /** The swarm five dimensions deep: each layer in its own order, with its own relations, implementation, expression. */
  layers(leading = this.leading ?? "Movement") { this.leading = leading; return dimensionLayers(this.agents, leading); }
  /** Hand the lead to another dimension (Design and Space re-order themselves to it). */
  lead(dim) { this.leading = dim; this.emit({ type: "lead", dim }); return this.layers(dim); }

  /** Semantic state space: words from the current sentences bond (mesh weak, channel strong); ATO moves activation. */
  digest(steps = 1) { this.space ??= new StateSpace(); this.space.ingest(this);
    for (let k = 0; k < steps; k++) this.space.step(); this.emit({ type: "digest", space: this.space }); return this.space; }

  /** Training buffer for the Python learner: inputs, adapted weights, outcomes. */
  exportExperience() { return { gates: this.gates, trueType: this.trueType, X: this.inputsX, W: this.W, log: this.log, Q: this.Q,
    words: this.space ? [...this.space.words.values()].map(w => ({ word: w.word, position: w.position, sites: w.sites.length })) : [],
    bonds: this.space ? [...this.space.edges.values()] : [] }; }
}
