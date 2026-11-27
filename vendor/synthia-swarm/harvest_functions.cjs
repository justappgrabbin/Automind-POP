// Pulls SELF-CONTAINED functions out of uploaded code by parsing only (nothing is run). A function is kept when every
// name it uses is its own (params/locals) or a plain JS built-in — so it can live on its own as a particle's face.
// TS/TSX/JSX is transpiled to JS text first (typescript transpileModule = parsing, no execution).
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const acorn = require("/tmp/harv/node_modules/acorn"), walk = require("/tmp/harv/node_modules/acorn-walk"), ts = require("/tmp/harv/node_modules/typescript");
const BUILTINS = new Set("Math JSON Number String Boolean Array Object Map Set WeakMap WeakSet Date RegExp Error TypeError RangeError Symbol BigInt parseInt parseFloat isNaN isFinite Infinity NaN undefined console Promise Uint8Array Int8Array Uint16Array Int16Array Uint32Array Int32Array Float32Array Float64Array Uint8ClampedArray ArrayBuffer DataView TextEncoder TextDecoder encodeURIComponent decodeURIComponent encodeURI decodeURI escape unescape structuredClone arguments this globalThis queueMicrotask setTimeout clearTimeout Reflect Proxy Intl atob btoa".split(" "));
const IMPURE = /\b(fetch|XMLHttpRequest|document|window|localStorage|indexedDB|navigator|require|process|eval|Function|import\(|WebSocket|Worker|alert)\b/;
const files = [], roots = process.argv.slice(2, -1), out = process.argv.at(-1);
const walkDir = d => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name);
  if (f.isDirectory()) { if (!/node_modules|\.git|dist|build|vendor/.test(f.name)) walkDir(p); }
  else if (/\.(m?js|cjs|jsx|tsx?|html)$/.test(f.name) && !/\.min\.|\.d\.ts$|\.test\.|\.spec\./.test(f.name) && fs.statSync(p).size < 600000) files.push(p); } };
roots.forEach(walkDir);
function jsOf(p) { let t = fs.readFileSync(p, "utf8");
  if (p.endsWith(".html")) t = [...t.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).join("\n;\n");
  if (/\.(tsx?|jsx)$/.test(p)) t = ts.transpileModule(t, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React } }).outputText;
  return t; }
const found = [], seen = new Set(); let parsed = 0, failed = 0;
for (const p of files) {
  let src, ast; try { src = jsOf(p); ast = acorn.parse(src, { ecmaVersion: "latest", sourceType: "module", allowHashBang: true, allowReturnOutsideFunction: true, allowImportExportEverywhere: true }); parsed++; } catch { failed++; continue; }
  const candidates = [];
  walk.ancestor(ast, {
    FunctionDeclaration(n) { if (n.id) candidates.push({ name: n.id.name, node: n }); },
    VariableDeclarator(n) { if (n.id.type === "Identifier" && n.init && /FunctionExpression|ArrowFunctionExpression/.test(n.init.type)) candidates.push({ name: n.id.name, node: n.init, decl: n }); },
    MethodDefinition(n) { if (n.key.type === "Identifier" && n.kind === "method") candidates.push({ name: n.key.name, node: n.value, method: true }); },   // class methods too (static or not): kept only if they never touch `this`
    Property(n) { if (n.key.type === "Identifier" && n.value && /FunctionExpression|ArrowFunctionExpression/.test(n.value.type)) candidates.push({ name: n.key.name, node: n.value, method: true }); } });   // object-literal methods
  for (const c of candidates) {
    const fn = c.node, body = src.slice(fn.start, fn.end); if (body.length < 40 || body.length > 6000) continue;
    if (IMPURE.test(body) || /\bthis\b/.test(body) || /\bawait\b|\byield\b/.test(body)) continue;
    // free identifiers: everything referenced minus params, locals, own name, builtins
    const declared = new Set([c.name]), used = new Set();
    walk.full(fn, n => { if (n.type === "Identifier") used.add(n.name);
      if (/Function/.test(n.type)) for (const pr of n.params) walk.full(pr, q => { if (q.type === "Identifier") declared.add(q.name); });
      if (n.type === "VariableDeclarator") walk.full(n.id, q => { if (q.type === "Identifier") declared.add(q.name); });
      if (n.type === "FunctionDeclaration" && n.id) declared.add(n.id.name);
      if (n.type === "CatchClause" && n.param) walk.full(n.param, q => { if (q.type === "Identifier") declared.add(q.name); });
      if (n.type === "ClassDeclaration" && n.id) declared.add(n.id.name); });
    // property names / object keys show up as Identifiers too: drop identifiers that only appear after a dot or as keys
    const props = new Set(); walk.full(fn, n => { if (n.type === "MemberExpression" && !n.computed && n.property.type === "Identifier") props.add(n.property.name);
      if (n.type === "Property" && !n.computed && n.key.type === "Identifier" && !n.shorthand) props.add(n.key.name); if (n.type === "MethodDefinition" || n.type === "PropertyDefinition") props.add(n.key.name); });
    const free = [...used].filter(x => !declared.has(x) && !BUILTINS.has(x) && !(props.has(x) && !new RegExp(`(^|[^.\\w])${x}\\b(?!\\s*:)`).test(body.replace(/\.\s*\w+/g, ""))));
    if (free.length) continue;
    const code = c.method ? `function ${c.name}${body.replace(/^function\s*\w*/, "")}` : fn.type === "FunctionDeclaration" ? body : `const ${c.name} = ${body};`;
    const norm = code.replace(/\s+/g, " "), h = crypto.createHash("sha1").update(norm).digest("hex").slice(0, 12); if (seen.has(h)) continue; seen.add(h);
    const lead = src.slice(Math.max(0, (c.decl ?? fn).start - 300), (c.decl ?? fn).start).match(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)\s*$/);
    found.push({ id: h, name: c.name, params: fn.params.map(q => src.slice(q.start, q.end)), code, doc: lead ? lead[0].replace(/[\/*]/g, " ").replace(/\s+/g, " ").trim().slice(0, 200) : "",
      from: p.replace(/^\/tmp\/(cap\d?|hands)\//, "").replace(/^[0-9a-f]{8}-/, ""), lines: code.split("\n").length }); }
}
fs.writeFileSync(out, JSON.stringify(found, null, 1));
console.log(JSON.stringify({ files: files.length, parsed, failed, selfContainedFunctions: found.length }));
const by = {}; for (const f of found) { const k = f.from.split("/")[0]; by[k] = (by[k] ?? 0) + 1; } console.log(by);
