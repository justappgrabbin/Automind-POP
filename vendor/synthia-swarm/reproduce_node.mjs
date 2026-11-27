// reproduce_node.mjs — writes the child the request planned: a copy of the lean swarm + its genome + its look.
// Never overwrites: children go to grown/children/child-N. Usage: node reproduce_node.mjs "build another you" "extra instructions"
import fs from "node:fs"; import path from "node:path"; import { planChild, lookCSS } from "./reproduce.js";
const here = path.dirname(new URL(import.meta.url).pathname);

export function buildAnother({ request = "build another you", extra = "", shelf = [], units = [], leanDir = path.join(here, "../lean/synthia") } = {}) {
  const forms = JSON.parse(fs.readFileSync(path.join(here, "form_particles.json"), "utf8"));
  const fj = JSON.parse(fs.readFileSync(path.join(here, "faces_functions.json"), "utf8")), functions = fj.functions ?? fj;
  let does = {}; try { does = JSON.parse(fs.readFileSync(path.join(here, "grown/faces_does.json"), "utf8")); } catch {}
  const { steps, genome } = planChild({ request, extra, shelf, functions, does, units, forms });
  const root = path.join(here, "grown/children"); fs.mkdirSync(root, { recursive: true });
  let n = 1; while (fs.existsSync(path.join(root, "child-" + n))) n++;
  const dir = path.join(root, "child-" + n);
  fs.cpSync(fs.existsSync(leanDir) ? leanDir : here, dir, { recursive: true, filter: s => !/node_modules|grown\/children/.test(s) });
  fs.writeFileSync(path.join(dir, "genome.json"), JSON.stringify(genome, null, 1));
  fs.writeFileSync(path.join(dir, "look.css"), lookCSS(genome.look));
  const page = path.join(dir, "living.html"); let html = fs.readFileSync(page, "utf8");
  html = html.replace("</head>", `<link rel="stylesheet" href="./look.css"><meta name="synthia-genome" content="./genome.json"></head>`);
  fs.writeFileSync(page, html);
  return { dir, steps, genome };
}
if (process.argv[1] === new URL(import.meta.url).pathname) { const r = buildAnother({ request: process.argv[2] ?? "build another you", extra: process.argv[3] ?? "" });
  console.log(r.dir); for (const s of r.steps) console.log(JSON.stringify(s).slice(0, 300)); }
