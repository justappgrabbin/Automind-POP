import fs from "fs"; import { setGateEngineData } from "./gate_engine.js"; import { readPOP, oppOf } from "./opp.js";
setGateEngineData(JSON.parse(fs.readFileSync("vocabulary.json")), JSON.parse(fs.readFileSync("bhantugh_rules.json")));
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? "  PASS " : "  FAIL ") + n); };
const U = Array.from({ length: 64 }, (_, i) => ({ address: { gate: i + 1, line: 1 + i % 6, field: "Being" }, x: 0.5 + 0.03 * Math.cos(i), y: 0.5 + 0.03 * Math.sin(i), charge: (i % 3) - 1 }));
let p = readPOP(U); for (const u of U) { u.x += 0.01; } p = readPOP(U);   // everyone moves the same way
ok("every unit has an OPP", U.every(u => u.opp?.orientation && u.opp.position && u.opp.perception));
ok("all moving one way → alignment ≈ 1", p.orientation.alignment > 0.99);
ok("all 64 gates → no kind of doing missing", p.position.missing.length === 0);
const few = U.slice(0, 2).map(u => ({ ...u, opp: null })); const q = readPOP(few);
ok("two units → kinds of doing reported missing", q.position.missing.length >= 6);
const far = [{ address: { gate: 1, line: 1 }, x: 0, y: 0 }, { address: { gate: 2, line: 1 }, x: 1, y: 1 }]; const r = readPOP(far);
ok("units out of reach of each other are blind", r.perception.blind === 2);
console.log("  ", JSON.stringify(p).slice(0, 300)); console.log(`\n${pass} passed, ${fail} failed`);
