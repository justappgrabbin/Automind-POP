// hostworld.js — a small HOST simulation for testing morphogenesis. It knows nothing about the swarm.
// A grid world with ground, sky, walls, temperature and time; systems run each tick; anything inside it can paint cells.
// A host declares what it wants only as a CHECK on its own state (a number 0..1), never as instructions.
import { applyBoolean } from "./codex3/synthia-dual-swarm/core/boolean-state.js";

export class World {
  constructor({ w = 40, h = 30, temperature = 10, name = "world" } = {}) {
    this.w = w; this.h = h; this.temperature = temperature; this.name = name; this.t = 0;
    this.cells = Array.from({ length: w * h }, () => [20, 30, 60]);            // sky
    for (let x = 0; x < w; x++) this.cells[(h - 1) * w + x] = [90, 70, 40];   // ground row
    this.systems = []; this.particles = []; this.checks = []; this.passages = new Map();
  }
  setPassage(x, y, state, openState) {
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x >= this.w || y < 0 || y >= this.h - 1) {
      throw Error("Passage must occupy a traversable grid cell");
    }
    // Validate and copy both vectors so changing a caller's array does not mutate a world trial.
    applyBoolean("xnor", Array.from(state), Array.from(openState));
    this.passages.set(y * this.w + x, { state: [...state], openState: [...openState] });
  }
  updatePassage(x, y, state) {
    const passage = this.passages.get(y * this.w + x);
    if (!passage) throw Error("No passage at this cell");
    this.setPassage(x, y, state, passage.openState);
  }
  solid(x, y) {
    if (y >= this.h - 1 || x < 0 || x >= this.w) return true;
    const passage = this.passages.get(y * this.w + x);
    return (passage && !applyBoolean("xnor", passage.state, passage.openState).every(Boolean))
      || this.particles.some(p => p.stopped && p.x === x && p.y === y);
  }
  paint(x, y, rgb) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.cells[y * this.w + x] = rgb; }
  step() { this.t++; for (const s of this.systems) s.tick(this); }
  run(n) { for (let i = 0; i < n; i++) this.step(); return this; }
  /** A copy with the same state and systems, so a trial can be run without touching the real host. */
  fork() { const c = new World({ w: this.w, h: this.h, temperature: this.temperature, name: this.name });
    c.cells = this.cells.map(x => [...x]);
    c.passages = new Map([...this.passages].map(([cell, passage]) => [cell, structuredClone(passage)])); c.t = this.t; c.checks = this.checks; c.systems = this.systems.map(s => s.copy ? s.copy() : s); return c; }
  score() { return this.checks.length ? Math.min(...this.checks.map(c => c.measure(this))) : 1; }
}
