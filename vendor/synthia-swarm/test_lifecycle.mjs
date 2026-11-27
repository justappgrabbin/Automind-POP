// The whole lifecycle, every step checked.
import * as L from "./lifecycle.js";
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? "  PASS " : "  FAIL ") + n); };
const hostA = [
  { path: "app.js", text: "import { xor } from './logic.js';\nexport function parity3(a, b, c) { return xor(xor(a, b), c); }\n" },
  { path: "test.js", text: "import { parity3 } from './app.js';\nimport { xor } from './logic.js';\nassert(xor(0,0) === 0);\nassert(xor(0,1) === 1);\nassert(xor(1,0) === 1);\nassert(xor(1,1) === 0);\nassert(parity3(1,1,1) === 1);\n" },
];
const lib = { entries: {} };
ok("enter: the host does not run as it is (logic.js is missing)", !L.runHost(hostA).ok);
const r = L.lifecycle(hostA, lib, Array.from({ length: 8 }, (_, i) => ({ id: i })));
const s = n => r.report.steps.find(x => x.step === n);
console.log("   ", r.report.steps.map(x => x.step).join(" → "));
ok("observe + discover: xor is the missing function, with 4 cases", s("discover").missing[0] === "xor/2 (4 cases)");
ok("experiment: an arrangement of NAND units was found by trying", s("experiment").found && s("experiment").tried > 1);
ok("construct: XOR took 4 NAND units (the known minimum)", r.library.entries[Object.keys(r.library.entries)[0]].solution.gates.length === 4);
ok("clone: a new standalone file was grown into the host", r.host.some(f => f.path === "logic.js") && /NAND/.test(r.host.find(f => f.path === "logic.js").text));
ok("integrate: the host now runs and all its asserts pass", s("integrate").hostRuns && s("integrate").failures === 0);
ok("extract: the host runs with no swarm attached and no swarm code inside it", s("extract").hostRunsWithoutSwarm && !s("extract").swarmCodeInHost);
ok("learn: the working arrangement is kept", Object.keys(lib.entries).length === 1);
const hostB = [ { path: "main.js", text: "import { differs } from './util/bits.js';\nexport const x = 1;\n" },
  { path: "spec.js", text: "import { differs } from './util/bits.js';\nassert(differs(1,1) === 0);\nassert(differs(1,0) === 1);\nassert(differs(0,1) === 1);\nassert(differs(0,0) === 0);\n" } ];
const r2 = L.lifecycle(hostB, lib, []);
ok("reuse: a new host needing the same function (other name, other path) gets it from what was learned, no search", r2.report.steps.some(x => x.step === "reuse") && !r2.report.steps.some(x => x.step === "experiment") && r2.ok && r2.host.some(f => f.path === "util/bits.js"));
const hostC = [{ path: "t.js", text: "import { nand3 } from './g.js';\nassert(nand3(1,1,1) === 0);\nassert(nand3(1,1,0) === 1);\nassert(nand3(0,0,0) === 1);\nassert(nand3(1,0,1) === 1);\n" }];
const r3 = L.lifecycle(hostC, lib, []);
ok("a 3-input function is constructed too", r3.ok);
const hostD = [{ path: "t.js", text: "assert(magic(1) === 1);\nassert(magic(1) === 0);\n" }];
const r4 = L.lifecycle(hostD, lib, []);
ok("an impossible need is reported as failed, not faked", !r4.ok && r4.report.steps.some(x => x.step === "fail"));
const hostE = [{ path: "p.js", text: "import { odd3 } from './o.js';\n" + [[0,0,0,0],[0,0,1,1],[0,1,0,1],[0,1,1,0],[1,0,0,1],[1,0,1,0],[1,1,0,0],[1,1,1,1]].map(([a,b,c,o]) => `assert(odd3(${a},${b},${c}) === ${o});`).join("\n") }];
const noLib = L.experiment(L.discover(L.observe(hostE))[0], 6, {});
ok("3-input parity cannot be built from 6 plain NAND units (it needs more)", !noLib.gates);
const r5 = L.lifecycle(hostE, lib, []);
const st = r5.report.steps.find(x => x.step === "experiment");
ok("…but with the learned XOR as one unit it is built from 2 units, and runs in the host", r5.ok && lib.entries[Object.keys(lib.entries).find(k => lib.entries[k].name === "odd3")].solution.gates.length === 2);
ok("the new arrangement records what it was built from", lib.entries[Object.keys(lib.entries).find(k => lib.entries[k].name === "odd3")].builtFrom.includes("xor"));
ok("the grown file stands alone (the learned unit is written inside it)", /function __xor/.test(r5.host.find(f => f.path === "o.js").text));
console.log(`\n${pass} passed, ${fail} failed`); if (fail) process.exit(1);
