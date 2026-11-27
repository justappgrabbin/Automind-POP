import { fourCharts, toUTC } from "./charts.js";
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? "  PASS " : "  FAIL ") + n); };
// Published report (scribd 660607469): born 17 Mar 1973 02:58 Lake Elmo, Minnesota; Design date 20 Dec 1972 10:04 (local); Profile 5/1
const r = fourCharts({ date: "1973-03-17", time: "02:58", zone: "America/Chicago" });
const B = r.charts.Being.addresses, g = (a) => `${a.gate}.${a.line}`;
console.log("utc", r.utc, "design", r.designUtc, "Sun", g(B[0]), "Earth", g(B[1]), "dSun", g(B[13]), "dEarth", g(B[14]));
ok("Design moment = published 20 Dec 1972 10:04 (UTC) within 2 min", Math.abs(new Date(r.designUtc) - Date.parse("1972-12-20T10:04:00Z")) < 120e3);
ok("published Design Sun 10.1 / Earth 15.1", g(B[13]) === "10.1" && g(B[14]) === "15.1");
ok("published Personality Earth 6.5", g(B[1]) === "6.5");
ok("Profile 5/1: Personality Sun line 5", B[0].line === 5);
ok("Profile 5/1: Design Sun line 1", B[13].line === 1);
ok("four charts", Object.keys(r.charts).sort().join() === "Being,Design,Evolution,Movement");
ok("sidereal is tropical minus Lahiri (~23.5° in 1973)", Math.abs(((r.charts.Being.lons[0] - r.charts.Evolution.lons[0]) + 360) % 360 - 23.5) < 0.3);
ok("draconic Sun = Sun minus its node", r.charts.Movement.lons[0] !== r.charts.Design.lons[0]);
ok("zone: 1973-03-17 02:58 Chicago (CST) is 08:58Z", r.utc.startsWith("1973-03-17T08:58"));
const C = r.charts, P0 = (x => ((x % 360) + 360) % 360);
ok("Draconic Design side measured from the Personality node", Math.abs(P0(C.Being.lons[13] - C.Movement.lons[13]) - P0(C.Being.lons[0] - C.Movement.lons[0])) < 1e-6);
console.log(`\n${pass} passed, ${fail} failed`);
