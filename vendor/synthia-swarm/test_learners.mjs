import { QTable } from "./qlearn.js"; import { fpGrowth, rules } from "./fpgrowth.js";
let pass = 0, n = 0; const ok = (c, m) => { n++; if (c) pass++; console.log(c ? "ok " : "FAIL", m); };
// 1. Q-learning finds the rewarding action on a 5-cell corridor (reward at the right end)
const q = new QTable({ alpha: 0.5, gamma: 0.9, seed: 3 }), A = ["L", "R"];
for (let ep = 0; ep < 200; ep++) { let s = 0; for (let k = 0; k < 20 && s < 4; k++) { const a = q.epsilonGreedy(String(s), A, 0.3), s2 = Math.max(0, Math.min(4, s + (a === "R" ? 1 : -1))); q.update(String(s), a, s2 === 4 ? 1 : 0, s2 === 4 ? null : String(s2), A); s = s2; } }
ok([0, 1, 2, 3].every(s => q.best(String(s), A) === "R"), "Q-learning: goes right in every cell");
ok(q.get("3", "R") > q.get("0", "R"), "Q-learning: value grows toward the reward");
const q2 = QTable.fromJSON(JSON.parse(JSON.stringify(q))); ok(q2.best("2", A) === "R", "Q table survives save/load");
// 2. FP-Growth on the textbook example (Han et al.): {f,c,a,m,p} etc.
const T = [["f","a","c","d","g","i","m","p"],["a","b","c","f","l","m","o"],["b","f","h","j","o"],["b","c","k","s","p"],["a","f","c","e","l","p","m","n"]];
const F = fpGrowth(T, 3), key = s => [...s.items].sort().join("");
ok(F.some(s => key(s) === "acfm" && s.support === 3), "FP-Growth: finds {f,c,a,m} with support 3");
ok(F.some(s => key(s) === "cp" && s.support === 3) && !F.some(s => key(s) === "bf" ), "FP-Growth: {c,p}=3, drops {b,f}");
const R = rules(F, 1); ok(R.some(r => r.then === "c" && r.if.join("") === "m"), "rules: m -> c with confidence 1");
console.log(`${pass}/${n}`);
