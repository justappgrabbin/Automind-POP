// research.js + repo_abilities.js, offline parts (network calls are the user's to test on their phone/computer).
import * as R from "./research.js"; import * as RA from "./repo_abilities.js";
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? "  PASS " : "  FAIL ") + n); };
const atom = `<feed><entry><id>http://arxiv.org/abs/2610.31900v1</id><title>Distributed Swarm Morphogenesis with
 Neural Cellular Automata</title><summary>Robot swarms assemble target shapes using local sensing.</summary></entry>
<entry><id>http://arxiv.org/abs/2504.17192v5</id><title>Paper2Code</title><summary>Code generation from papers &amp; plans.</summary></entry></feed>`;
const P = R.parseArxiv(atom);
ok("arXiv Atom entries parsed (title, text, link)", P.length === 2 && P[0].title === "Distributed Swarm Morphogenesis with Neural Cellular Automata" && P[1].text.includes("&") && P[0].url.includes("2610.31900"));
const C = new R.Corpus([...P, { title: "Badalov thesis", text: "swarm formation recognition gossip averaging local features" }, { title: "cooking", text: "bread flour water salt" }]);
const s = C.search("swarm formation");
ok("BM25 ranks what it has read: swarm papers first, unrelated never", s[0].title === "Badalov thesis" && !s.some(d => d.title === "cooking"));
ok("corpus round-trips for saving", new R.Corpus(C.export()).search("bread")[0].title === "cooking");
const files = [{ path: "src/add.js", text: "export default function add(a, b) { return a + b; }" },
  { path: "src/__test__/add.test.js", text: "import add from '../add';\nexpect(add(1, 2)).toBe(3);\nexpect(add(-1, 1)).toBe(0);" },
  { path: "lib/words.mjs", text: "export function shout(s) { return s.toUpperCase() + '!'; }" },
  { path: "test/words.test.mjs", text: "import { shout } from '../lib/words.mjs';\nassert.equal(shout('hi'), 'HI!');\nassert.strictEqual(shout('ok'), 'OK!');" },
  { path: "src/uses.js", text: "import x from './x';\nexport function needsOther(a) { return x(a); }" },
  { path: "src/__test__/uses.test.js", text: "expect(needsOther(1)).toBe(2);" }];
const H = RA.harvest(files);
ok("functions harvested with their own tests' examples (expect…toBe and assert.equal)", H.length === 2 && H.find(f => f.name === "add").examples.length === 2 && H.find(f => f.name === "shout").examples.length === 2);
ok("modules that import other code are left out (not self-contained)", !H.some(f => f.name === "needsOther"));
ok("exports stripped for the chamber", !/export/.test(RA.strip(files[0].text)));
console.log(`\n${pass} passed, ${fail} failed`); if (fail) process.exit(1);
