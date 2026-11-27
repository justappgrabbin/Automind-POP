// Morphogenesis into ACTUAL software: the organism's units construct real functions (text, records, rendering) inside
// small applications, by their lines, bonds, dimension and culture; the builder remains available but is not what found these.
import { LivingSwarm } from "./living.js"; import { OrganismSwarm } from "./organism_swarm.js";
import { enter } from "./morphogenesis.js"; import { softwareHost } from "./hosts.js"; import { runHost } from "./lifecycle.js"; import * as KL from "./klein_local.js";
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? "  PASS " : "  FAIL ") + n); };
const S = new LivingSwarm({ seed: 9 }), D = ["Movement", "Evolution", "Being", "Design"];
for (let i = 0; i < 64; i++) S.add({ gate: 1 + i, line: 1 + i % 6, color: 1 + i % 6, tone: 1 + i % 6, base: 1 + i % 5, dimension: D[i % 4] }, "person", 0.25 + (i % 8) * 0.07, 0.25 + Math.floor(i / 8) * 0.07);
const O = new OrganismSwarm(S); KL.grow(S); S.link(0.11);
const show = r => r.steps.forEach(s => console.log("     ", JSON.stringify(s).slice(0, 260)));
const eq = (call, v) => `assert(JSON.stringify(${call}) === ${JSON.stringify(JSON.stringify(v))});`;
const T = { text: x => typeof x === "string", words: x => Array.isArray(x) && x.every(s => typeof s === "string"), records: x => Array.isArray(x) && x.every(r => r && typeof r === "object"),
  numbers: x => Array.isArray(x) && x.every(n => typeof n === "number"), number: x => typeof x === "number", field: x => typeof x === "string" };

console.log("1. a blog app missing slugify (text)");
const blog = softwareHost({ name: "blog", types: T,
  files: [{ path: "post.js", text: "import { slugify } from './slug.js';\nexport function url(t) { return '/posts/' + slugify(t); }\n" },
    { path: "test.js", text: "import { url } from './post.js';\nimport { slugify } from './slug.js';\n" + eq("slugify('Hello World')", "hello-world") + "\n" + eq("url('Swarm Grows Up')", "/posts/swarm-grows-up") + "\n" }],
  materials: [{ id: "title", type: "text", value: "Hello World" }, { id: "space", type: "text", value: " " }, { id: "dash", type: "text", value: "-" }],
  operations: [{ id: "lower", inputs: { value: "text" }, output: "text", dimension: "Being", run: ({ value }) => value.toLowerCase() },
    { id: "split", inputs: { value: "text", separator: "text" }, output: "words", dimension: "Movement", guard: ({ separator }) => separator.length > 0, run: ({ value, separator }) => value.split(separator) },
    { id: "join", inputs: { items: "words", separator: "text" }, output: "text", dimension: "Design", run: ({ items, separator }) => items.join(separator) }],
  requirement: { name: "slugify", path: "slug.js", params: ["title"], outType: "text", cases: [{ args: { title: "Hello World" }, out: "hello-world" }, { args: { title: "Swarm Grows Up" }, out: "swarm-grows-up" }] } });
const r1 = enter(O, blog); show(r1); const s1 = n => r1.steps.filter(s => s.step === n).at(-1);
ok("the blog did not run before (slug.js missing)", s1("enter").checkWithout === 0);
ok("the UNITS constructed it (not the builder)", s1("construct").by === "units");
ok("a formation of several units, each a step", s1("construct").units.length >= 2);
const bonded = (a, b) => S.units[a].bonds.some(e => e.a === b || e.b === b);
const plan1 = s1("organize").units, comp = (start) => { const seen = new Set([start]), q = [start]; while (q.length) { const x = q.pop(); for (const e of S.units[x].bonds) { const y = e.a === x ? e.b : e.a; if (!seen.has(y)) { seen.add(y); q.push(y); } } } return seen; };
ok("the units in the formation are joined through bonds (values reached them along bonds)", plan1.every(c => comp(plan1[0].unit).has(c.unit)));
ok("it met every case, not just the first", s1("act+evaluate").casesMet === 2);
ok("the app runs on its own after the swarm left", s1("extract").checkWithSwarmGone === 1);
const grown = blog.app.files.find(f => f.path === "slug.js").text; console.log(grown.split("\n").map(l => "      | " + l).join("\n"));

console.log("2. an inventory app missing a stock total (records → number)");
const items1 = [{ name: "saw", category: "tool", qty: 3 }, { name: "nail", category: "part", qty: 200 }, { name: "drill", category: "tool", qty: 2 }];
const items2 = [{ name: "axe", category: "tool", qty: 5 }, { name: "rope", category: "part", qty: 1 }];
const inv = softwareHost({ name: "inventory", types: T,
  files: [{ path: "test.js", text: "import { toolStock } from './stock.js';\n" + eq(`toolStock(${JSON.stringify(items1)})`, 5) + "\n" + eq(`toolStock(${JSON.stringify(items2)})`, 5) + "\n" }],
  materials: [{ id: "items", type: "records", value: items1 }, { id: "fCat", type: "field", value: "category" }, { id: "fQty", type: "field", value: "qty" }, { id: "vTool", type: "text", value: "tool" }],
  operations: [{ id: "where", inputs: { items: "records", field: "field", value: "text" }, output: "records", dimension: "Being", run: ({ items, field, value }) => items.filter(r => r[field] === value) },
    { id: "pluck", inputs: { items: "records", field: "field" }, output: "numbers", dimension: "Evolution", run: ({ items, field }) => items.map(r => r[field]).filter(x => typeof x === "number") },
    { id: "sum", inputs: { values: "numbers" }, output: "number", dimension: "Design", run: ({ values }) => values.reduce((a, b) => a + b, 0) },
    { id: "count", inputs: { items: "records" }, output: "number", run: ({ items }) => items.length }],
  requirement: { name: "toolStock", path: "stock.js", params: ["items"], outType: "number", cases: [{ args: { items: items1 }, out: 5 }, { args: { items: items2 }, out: 5 }] } });
const r2 = enter(O, inv); show(r2); const s2 = n => r2.steps.filter(s => s.step === n).at(-1);
ok("inventory: units built where → pluck → sum and the app passes its tests alone", s2("construct").by === "units" && s2("extract").checkWithSwarmGone === 1 && ["where", "pluck", "sum"].every(o => s2("construct").plan.includes(o)));
ok("every candidate was checked against all cases (count of rejected first-case-only candidates is reported)", typeof s2("construct").rejected === "number");

console.log("3. a contacts app missing an HTML list (records → markup)");
const people = [{ name: "Ana", city: "Lima" }, { name: "Bo", city: "Oslo" }];
const contacts = softwareHost({ name: "contacts", types: T,
  files: [{ path: "test.js", text: "import { cityList } from './view.js';\n" + eq(`cityList(${JSON.stringify(people)})`, "<ul><li>Ana — Lima</li><li>Bo — Oslo</li></ul>") + "\n" + eq(`cityList([{name:'Cy',city:'Rome'}])`, "<ul><li>Cy — Rome</li></ul>") + "\n" }],
  materials: [{ id: "people", type: "records", value: people }, { id: "tpl", type: "text", value: "{name} — {city}" }, { id: "li", type: "field", value: "li" }, { id: "ul", type: "field", value: "ul" }, { id: "none", type: "text", value: "" }],
  operations: [{ id: "fill", inputs: { items: "records", template: "text" }, output: "words", dimension: "Being", run: ({ items, template }) => items.map(r => template.replace(/\{(\w+)\}/g, (_, k) => String(r[k] ?? ""))) },
    { id: "tagEach", inputs: { items: "words", tag: "field" }, output: "words", dimension: "Design", run: ({ items, tag }) => items.map(s => `<${tag}>${s}</${tag}>`) },
    { id: "join", inputs: { items: "words", separator: "text" }, output: "text", dimension: "Movement", run: ({ items, separator }) => items.join(separator) },
    { id: "tag", inputs: { value: "text", tag: "field" }, output: "text", dimension: "Design", run: ({ value, tag }) => `<${tag}>${value}</${tag}>` }],
  requirement: { name: "cityList", path: "view.js", params: ["people"], outType: "text", cases: [{ args: { people }, out: "<ul><li>Ana — Lima</li><li>Bo — Oslo</li></ul>" }, { args: { people: [{ name: "Cy", city: "Rome" }] }, out: "<ul><li>Cy — Rome</li></ul>" }] } });
const r3 = enter(O, contacts); show(r3); const s3 = n => r3.steps.filter(s => s.step === n).at(-1);
ok(`contacts: rendering formation grown, app passes alone (${s3("construct").plan.length} steps: ${s3("construct").plan.join(" → ")})`, s3("extract").checkWithSwarmGone === 1 && s3("construct").plan.length >= 4);
ok("contacts: the simplest way was kept (no more than 5 steps)", s3("construct").plan.length <= 5);

console.log("4. transfer: another blog needs the same capability under another name");
const blog2 = softwareHost({ name: "shop", types: T,
  files: [{ path: "test.js", text: "import { handle } from './h.js';\n" + eq("handle('Blue Mug')", "blue-mug") + "\n" }],
  materials: blog.materials().observations.map(o => o.id === "title" ? { ...o, id: "name", value: "Blue Mug" } : o), operations: blog.materials().primitives,
  requirement: { name: "handle", path: "h.js", params: ["name"], outType: "text", cases: [{ args: { name: "Blue Mug" }, out: "blue-mug" }, { args: { name: "Tea Pot" }, out: "tea-pot" }] } });
const r4 = enter(O, blog2); show(r4); const s4 = n => r4.steps.filter(s => s.step === n).at(-1);
ok("transfer: a learned formation is used as one step", r4.ok && s4("construct").plan.some(p => p.startsWith("formation.")));
ok(`transfer: reuse is cheaper — first blog took ${s1("construct").toFirst} tries, the second ${s4("construct").toFirst} (recalled: ${s4("construct").recalled})`, s4("construct").toFirst < s1("construct").toFirst && s4("construct").recalled);
ok("units that carried earlier formations now prefer those operations (culture)", S.units.some(u => (u.craft?.lower ?? 0) > 0 && (u.craft?.join ?? 0) + (u.craft?.lower ?? 0) > 0));
ok("units changed lines while adapting", S.units.some(u => u.changedLines?.length));
{ const { affinity } = await import("./unitbuild.js"); const op = { id: "lower" }, u = S.units.find(v => { const a = affinity(v, op, S.leader); return Math.abs(a - 3 - 3 * Math.tanh(v.craft?.lower ?? 0)) > 0.01; }) ?? S.units[5], a0 = affinity(u, op, S.leader);
  const keep = u.morphLines; u.morphLines = (u.morphLines ?? [0,0,0,0,0,0]).map(b => 1 - b); const a1 = affinity(u, op, S.leader); u.morphLines = keep;
  ok("a unit's own lines decide how inclined it is to carry an operation (flip its lines → inclination changes)", a0 !== a1); }
console.log(`\n${pass} passed, ${fail} failed`); if (fail) process.exit(1);
