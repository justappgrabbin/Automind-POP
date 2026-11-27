// morphmatter.js — two physical primitives for the swarm's BODY side of morphing. Local rules only; no unit computes a plan.
//
// 1) gather — self-organised aggregation with ONE BIT of sight (Gauci et al. 2014, Int. J. Robotics Research 33(8)).
//    Port of SOPSLab/SwarmAggregation aggregation.py (MIT License, Copyright (c) 2021 SOPSLab), line-of-sight sensor:
//    each unit looks straight ahead; if it sees another unit it spins in place, otherwise it circles about a point
//    90° counter-clockwise of its heading. Overlaps are pushed apart. Nothing else — no memory, no maths — yet units gather.
//    Use: pulling scattered units into one formation, or re-forming after a break (repair).
//
// 2) bistable — units that hold one of two states and flip by their neighbours (Ising-like "programmable matter":
//    Hanakata, Plummer & Nelson, PRL 128, 075902 (2022); Plummer, Hanakata & Nelson, PRMaterials 6, 115203 (2022) —
//    bistable units in a sheet, coupled antiferromagnetically; curvature acts as an external field that reprograms them).
//    That repository has no license file, so NO code was taken from it — this is the published model written fresh:
//    E = J Σ_bonds s_i s_j − Σ_i h_i s_i, Metropolis flips at temperature T. Change h locally and the pattern rewrites
//    itself through the neighbours — a shape held as a pattern of local states, reprogrammable by a field.
export function gather(units, { R = 0.1445, r = 0.037, m = 0.152, w0 = -0.75, w1 = -5.02, step = 0.005, noise = 0, rand = Math.random } = {}) {
  const N = units.length, K = m / (2 * step * step), F = units.map(() => [0, 0]);
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
    const dx = units[i].x - units[j].x, dy = units[i].y - units[j].y, d = Math.hypot(dx, dy) || 1e-9;
    if (d <= 2 * r) { const f = K * (2 * r - d) / d; F[i][0] += dx * f; F[i][1] += dy * f; F[j][0] -= dx * f; F[j][1] -= dy * f; } }
  const sees = i => { const u = units[i], sx = u.x + r * Math.cos(u.theta), sy = u.y + r * Math.sin(u.theta), c = Math.cos(u.theta), s = Math.sin(u.theta);
    for (let j = 0; j < N; j++) { if (j === i) continue; const dx = units[j].x - sx, dy = units[j].y - sy, d = Math.hypot(dx, dy);
      if (d <= r) return true; const dot = dx * c + dy * s; if (dot > 0 && r * r + dot * dot >= d * d) return true; }
    return false; };
  const seen = units.map((_, i) => (rand() < noise) !== sees(i));
  units.forEach((u, i) => {
    if (seen[i]) u.theta = (u.theta + w1 * step + 2 * Math.PI) % (2 * Math.PI);
    else { const ca = u.theta + Math.PI / 2, cx = u.x + R * Math.cos(ca), cy = u.y + R * Math.sin(ca), a = ca + Math.PI + w0 * step;
      u.x = cx + R * Math.cos(a); u.y = cy + R * Math.sin(a); u.theta = (u.theta + w0 * step + 2 * Math.PI) % (2 * Math.PI); }
    u.x += F[i][0] / m * step * step; u.y += F[i][1] / m * step * step; u.sawOther = seen[i];
  });
  return units;
}
/** how gathered: mean distance to the centre (smaller = tighter formation) */
export const dispersion = units => { const cx = units.reduce((a, u) => a + u.x, 0) / units.length, cy = units.reduce((a, u) => a + u.y, 0) / units.length;
  return units.reduce((a, u) => a + Math.hypot(u.x - cx, u.y - cy), 0) / units.length; };

/** one sweep of bistable flips. states: array of ±1; bonds: [[i,j],...]; field: h per unit (or number). */
export function bistable(states, bonds, { J = 1, field = 0, T = 0.5, sweeps = 1, rand = Math.random } = {}) {
  const nb = states.map(() => []); for (const [i, j] of bonds) { nb[i].push(j); nb[j].push(i); }
  const h = i => (typeof field === "number" ? field : field[i] ?? 0);
  for (let s = 0; s < sweeps; s++) for (let k = 0; k < states.length; k++) {
    const i = Math.floor(rand() * states.length), local = nb[i].reduce((a, j) => a + states[j], 0);
    const dE = -2 * states[i] * (J * local - h(i));          // energy change if s_i flips
    if (dE <= 0 || rand() < Math.exp(-dE / T)) states[i] = -states[i];
  }
  return states;
}
export const energy = (states, bonds, { J = 1, field = 0 } = {}) =>
  bonds.reduce((a, [i, j]) => a + J * states[i] * states[j], 0) - states.reduce((a, s, i) => a + (typeof field === "number" ? field : field[i] ?? 0) * s, 0);
