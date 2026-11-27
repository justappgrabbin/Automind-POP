import { readHealth, compareHealth } from "./health.js";
const broken = { files: [
 { path: "app/main.js", text: `import { add } from "./math.js";\nimport { slug } from "./text.js";\nexport function run(){ return add(1,2) + slug("A") + mystery(); }\nassert(add(2,2)===4);` },
 { path: "app/math.js", text: `export function add(a,b){ return a+b; }` } ] };
const h1 = readHealth(broken); console.log(h1.health.toFixed(3), h1.signs);
const fixed = { files: [ { path: "app/main.js", text: `import { add } from "./math.js";\nexport function run(){ return add(1,2); }\nassert(add(2,2)===4);` }, broken.files[1] ] };
const h2 = readHealth(fixed); console.log(h2.health, compareHealth(h1,h2));
const world = { probe: () => ({ signs: [{ kind: "other", where: "plaza", name: "nobody can reach the market" }] }) };
console.log(readHealth(world).health);
