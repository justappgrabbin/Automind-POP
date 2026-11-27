// qlearn.js — learning from consequences, no neural net. Pure-JS port of the core of chen0040/java-reinforcement-learning
// (MIT License, Copyright (c) 2017 Xianshun Chen): QLearner.update, SARSA, epsilon-greedy and softmax action selection.
// Tables are keyed by STRINGS (a state is whatever the swarm can perceive locally: a place fingerprint key, a unit's
// address, a bond's kind), so many small learners can live on units and bonds — no central learner is required.
// Q(s,a) <- Q(s,a) + alpha * (r + gamma * max_a' Q(s',a') - Q(s,a))          (Q-learning)
// Q(s,a) <- Q(s,a) + alpha * (r + gamma * Q(s',a') - Q(s,a))                 (SARSA: a' is the action actually taken)
export class QTable {
  constructor({ alpha = 0.3, gamma = 0.8, initialQ = 0, seed = 1 } = {}) { Object.assign(this, { alpha, gamma, initialQ, q: {}, visits: {} }); this.rand = mulberry(seed); }
  get(s, a) { return this.q[s]?.[a] ?? this.initialQ; }
  set(s, a, v) { (this.q[s] ??= {})[a] = v; (this.visits[s] ??= {})[a] = ((this.visits[s][a]) ?? 0) + 1; }
  best(s, actions) { const m = Math.max(...actions.map(a => this.get(s, a))), top = actions.filter(a => this.get(s, a) === m); return top[Math.floor(this.rand() * top.length)]; }   // ties broken at random (as the Java original)
  maxQ(s, actions) { return actions?.length ? Math.max(...actions.map(a => this.get(s, a))) : Math.max(this.initialQ, ...Object.values(this.q[s] ?? {})); }
  update(s, a, r, s2 = null, next = null) { const fut = s2 == null ? 0 : this.maxQ(s2, next); this.set(s, a, this.get(s, a) + this.alpha * (r + this.gamma * fut - this.get(s, a))); }
  updateSarsa(s, a, r, s2, a2) { const fut = s2 == null ? 0 : this.get(s2, a2); this.set(s, a, this.get(s, a) + this.alpha * (r + this.gamma * fut - this.get(s, a))); }
  epsilonGreedy(s, actions, eps = 0.1) { return this.rand() < eps ? actions[Math.floor(this.rand() * actions.length)] : this.best(s, actions); }
  softmax(s, actions, temp = 1) { const w = actions.map(a => Math.exp(this.get(s, a) / temp)), t = w.reduce((x, y) => x + y, 0); let r = this.rand() * t; for (let i = 0; i < actions.length; i++) if ((r -= w[i]) <= 0) return actions[i]; return actions.at(-1); }
  /** rank actions by learned value (ties keep given order) — how a learner nudges construction without deciding it */
  rank(s, actions) { return actions.map((a, i) => [a, this.get(s, a), i]).sort((x, y) => y[1] - x[1] || x[2] - y[2]).map(x => x[0]); }
  toJSON() { return { alpha: this.alpha, gamma: this.gamma, initialQ: this.initialQ, q: this.q, visits: this.visits }; }
  static fromJSON(o) { const t = new QTable(o); t.q = o.q ?? {}; t.visits = o.visits ?? {}; return t; }
}
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
