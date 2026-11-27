// cluster321.js — particles cluster like hexagrams, 3-2-1.
//
// Translation of the user's "321" onto a hexagram (MY reading, correct it):
//   6 line-particles of one gate
//   -> 3 PAIRS   lines 1-4, 2-5, 3-6 (the line-harmony pairs already in v61's rule book)
//   -> 2 TRIGRAMS lower 1-3 (inward), upper 4-6 (outward)
//   -> 1 HEXAGRAM
// Each pair holds two line bits, so a pair IS an element of Klein's Boolean Klein-4 group
// (00, 01, 10, 11); a hexagram is three Klein-4 elements, and the relation between any two pairs
// is one of the three flips (k4Relation). Clusters are partial when lines are missing or when a
// particle has pitch 0, so sizes and kinds vary: pair, trigram, hexagram.
//
// A cluster's own vectors are the ATO fold of its members' vectors (emergent, not averaged).

import { fold, k4Relation, str } from "./klein4.js";
import { canCouple } from "./particle.js";

export const PAIRS = [[1, 4], [2, 5], [3, 6]];
export const TRIGRAMS = { lower: [1, 2, 3], upper: [4, 5, 6] };

function emergent(members) {
  return {
    form: str(fold(members.map(m => m.form))),
    sound: str(fold(members.map(m => m.sound))),
    meaning: str(fold(members.map(m => m.meaning))),
  };
}

/** Build every cluster the particles can actually form. Each slot (gate,line) takes the first
 *  coupling-capable particle that arrives; others at the same slot stay free (they are still there). */
export function clusterAll(particles) {
  const byGate = new Map();
  const free = [];
  for (const p of particles) {
    if (!canCouple(p)) { free.push(p); continue; }
    const slots = byGate.get(p.gate) ?? byGate.set(p.gate, {}).get(p.gate);
    if (slots[p.line]) free.push(p); else slots[p.line] = p;
  }
  const pairs = [], trigrams = [], hexagrams = [];
  for (const [gate, slots] of byGate) {
    for (const [a, b] of PAIRS) if (slots[a] && slots[b]) {
      const m = [slots[a], slots[b]];
      pairs.push({ kind: "pair", gate, lines: [a, b], members: m.map(x => x.id),
        k4: `${slots[a].yang}${slots[b].yang}`, ...emergent(m) });
    }
    for (const [side, ls] of Object.entries(TRIGRAMS)) if (ls.every(l => slots[l])) {
      const m = ls.map(l => slots[l]);
      trigrams.push({ kind: "trigram", gate, side, lines: ls, members: m.map(x => x.id), ...emergent(m) });
    }
    if ([1, 2, 3, 4, 5, 6].every(l => slots[l])) {
      const m = [1, 2, 3, 4, 5, 6].map(l => slots[l]);
      const k4 = PAIRS.map(([a, b]) => `${slots[a].yang}${slots[b].yang}`);
      hexagrams.push({ kind: "hexagram", gate, members: m.map(x => x.id), k4,
        pairRelations: [k4Relation(k4[0], k4[1]), k4Relation(k4[1], k4[2]), k4Relation(k4[0], k4[2])],
        ...emergent(m) });
    }
  }
  return { pairs, trigrams, hexagrams, free };
}
