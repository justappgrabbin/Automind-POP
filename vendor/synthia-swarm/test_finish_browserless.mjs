import { LivingSwarm } from "./living.js"; import { OrganismSwarm } from "./organism_swarm.js"; import * as KL from "./klein_local.js";
import { finishApp, needsOf } from "./finish.js";
const S = new LivingSwarm({ seed: 9 }), D = ["Movement", "Evolution", "Being", "Design"];
for (let i = 0; i < 64; i++) S.add({ gate: 1 + i, line: 1 + i % 6, color: 1 + i % 6, tone: 1 + i % 6, base: 1 + i % 5, dimension: D[i % 4] }, "person", 0.25 + (i % 8) * 0.07, 0.25 + Math.floor(i / 8) * 0.07);
const O = new OrganismSwarm(S); KL.grow(S); S.link(0.11);
const files = [{ path: "post.js", text: "import { slugify } from './slug.js';\nexport function url(t) { return '/posts/' + slugify(t); }\n" },
  { path: "test.js", text: `import { slugify } from './slug.js';\nassert(JSON.stringify(slugify("Hello World")) === "\\"hello-world\\"");\nassert(JSON.stringify(slugify("Swarm Grows Up")) === "\\"swarm-grows-up\\"");\nassert(JSON.stringify(slugify("Big Red Dog")) === "\\"big-red-dog\\"");\n` }];
console.log(JSON.stringify(needsOf(files)));
const r = finishApp(O, files); console.log(JSON.stringify(r.map(x => ({ ...x, code: x.code?.slice(0, 80) }))));
console.log(r[0]?.ok ? "PASS" : "FAIL");
