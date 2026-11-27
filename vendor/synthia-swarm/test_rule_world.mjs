import { RuleWorld } from "./rule_world.js";
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? "ok  " : "FAIL") + " " + m); };
const W = await RuleWorld.ready();
const U = (id, x, y, a, face) => ({ id, x, y, health: 1, bonds: [], face, address: { side: "Personality", planetary: "Sun", line: 1, color: 1, tone: 1, base: 1, arc: 50, ...a } });
// 1 same colour, touching → crosses; the face is shared to the one without
let S = { units: [U(0, .5, .5, { gate: 18, color: 3 }, { id: "m", name: "mean" }), U(1, .52, .5, { gate: 40, color: 3 })] };
W.tick(S); ok(S.units[1].face?.name === "mean" && S.units[1].face.caught, "same colour touching: face travels (tagged caught)");
// 2 different colour (not ±3), different line, tone → no cross → wear
S = { units: [U(0, .5, .5, { gate: 1, color: 1, line: 1, tone: 1 }), U(1, .51, .5, { gate: 2, color: 2, line: 2, tone: 2, base: 3 })] };
W.tick(S); ok(S.units[0].health < 1 && W.stats.worn > 0, "no match: both wear");
// 3 transference crosses but blind spot
S = { units: [U(0, .5, .5, { gate: 5, color: 1, line: 1 }, { id: "x", name: "f" }), U(1, .51, .5, { gate: 9, color: 4, line: 2, tone: 2, base: 3 })] };
W.tick(S); ok(S.units[1].face?.blindSpot === true, "transference: crosses, marked blind spot");
// 4 Design and Personality don't meet except through a Linknode
S = { units: [U(0, .5, .5, { gate: 20, color: 2 }, { id: "y", name: "g" }), U(1, .51, .5, { gate: 21, color: 2, side: "Design" })] };
W.tick(S); ok(!S.units[1].face, "Personality ↔ Design without a Linknode: no exchange");
S.units[1].address.planetary = "North Node"; W.tick(S); ok(S.units[1].face?.name === "g", "…through the Design North Node (Linknode): exchange happens");
// 5 channel 59-6 is a deal: both must give
S = { units: [U(0, .5, .5, { gate: 59, color: 6 }, { id: "a", name: "A" }), U(1, .51, .5, { gate: 6, color: 6 }, { id: "b", name: "B" })] };
W.tick(S); ok(S.units[0].face.name === "B" && S.units[1].face.name === "A", "59-6 (Communal): a deal — faces swap");
// 6 channel partners drift together even when not touching
S = { units: [U(0, .2, .5, { gate: 18 }), U(1, .8, .5, { gate: 58 })] }; const d0 = .6; W.tick(S); ok(Math.abs(S.units[1].x - S.units[0].x) < d0, "18 and 58 (a channel) are drawn together");
// 7 mood
const m = W.moodOf({ id: 0 }); ok(typeof m === "number" && m >= 0 && m <= 1, `mood tracked per unit (unit 0: ${m?.toFixed(2)})`);
console.log(`${pass}/${pass + fail}`); process.exit(fail ? 1 : 0);
