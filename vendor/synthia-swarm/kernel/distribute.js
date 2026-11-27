// distribute.js — 3-2-1: how many particles a hexagram is made of.
//
// User, Nov 24: a hexagram has three bigrams (line pairs 1-4, 2-5, 3-6). Particles per bigram depend on
// the center the gate belongs to:
//   1 per bigram  — directive: G (user), Throat ("the mouth?" — user's guess), Heart/Ego and Solar Plexus
//                   (user earlier named Solar Plexus, G and Heart as the Heart's three positions of self)
//   2 per bigram  — Mind: Head, Ajna (user)
//   3 per bigram  — Body: Sacral, Spleen, Root (user, "im guessing")
// So a hexagram is 3, 6 or 9 particles. Gate -> center comes from v61's existing address.js table.
//
// What the particles on one bigram are (MY reading, correct it):
//   1 -> one particle holding the whole pair (placed on the lower line, carries both line bits)
//   2 -> one particle per line of the pair
//   3 -> the two line particles + their emergent third: Klein's ATO of the two (*ab), not a copy of either

import { WHEEL, WHEEL_START, CENTER } from "../address.js";
import { makeParticle } from "./particle.js";
import { xnor } from "./klein4.js";

export const PARTS_PER_BIGRAM = { G: 1, Throat: 1, Heart: 1, SolarPlexus: 1, Head: 2, Ajna: 2, Sacral: 3, Spleen: 3, Root: 3 };
export const PARTS_SOURCE = { G: "user", Throat: "user's guess", Heart: "user (Heart positions of self)",
  SolarPlexus: "user (Heart positions of self)", Head: "user", Ajna: "user", Sacral: "user's guess", Spleen: "user's guess", Root: "user's guess" };
export const BIGRAMS = [[1, 4], [2, 5], [3, 6]];

const lineLongitude = (gate, line, k) => {
  const start = WHEEL_START + WHEEL.indexOf(gate) * 5.625, slot = 5.625 / 6;
  return (start + (line - 1) * slot + slot * (0.08 + 0.84 * ((k * 0.381966) % 1)) + 360) % 360;   // k spreads color/tone/base, always inside the line
};

/** Build the particles of ONE hexagram instance. `hex` = instance id; `body` = planet index for the dressing. */
export function hexagramParticles(gate, hex, nextId, body = 0) {
  const center = CENTER[gate], n = PARTS_PER_BIGRAM[center];
  const out = [];
  BIGRAMS.forEach(([a, b], bi) => {
    const tag = (p, role) => Object.assign(p, { hex, bigram: bi + 1, role, center, partsPerBigram: n });
    if (n === 1) {
      const p = tag(makeParticle(nextId(), lineLongitude(gate, a, bi), { body }), "pair");
      p.pairBits = [p.form[a - 1], p.form[b - 1]]; out.push(p);
    } else {
      const A = tag(makeParticle(nextId(), lineLongitude(gate, a, bi), { body }), "lower");
      const B = tag(makeParticle(nextId(), lineLongitude(gate, b, bi), { body }), "upper");
      out.push(A, B);
      if (n === 3) {
        const J = tag(makeParticle(nextId(), lineLongitude(gate, a, bi + 3), { body }), "joint");
        J.sound = xnor(A.sound, B.sound); J.meaning = xnor(A.meaning, B.meaning);   // emergent third of the pair
        J.jointOf = [A.id, B.id]; out.push(J);
      }
    }
  });
  return out;
}

/** Distribute a swarm: one hexagram instance per entry of `gates`, planets cycling for the dressing. */
export function distributeSwarm(gates) {
  let id = 0; const nextId = () => ++id;
  return gates.flatMap((g, h) => hexagramParticles(g, h + 1, nextId, h % 13));
}
