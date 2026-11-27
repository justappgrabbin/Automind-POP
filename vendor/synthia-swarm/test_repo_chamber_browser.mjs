// Browser: abilities adopted through the real chamber, using a small fixture written here (not outside code).
import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const p = await b.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto("http://localhost:8766/living.html"); await new Promise(r => setTimeout(r, 1500));
const R = await p.evaluate(async () => { const { Chamber } = await import("/chamber.js"), RA = await import("/repo_abilities.js"), C = new Chamber();
  const files = [{ path: "src/add.js", text: "export default function add(a, b) { return a + b; }" }, { path: "src/__test__/add.test.js", text: "expect(add(1, 2)).toBe(3);\nexpect(add(-1, 1)).toBe(0);" },
    { path: "src/bad.js", text: "export function bad(a) { return a * 2; }" }, { path: "src/__test__/bad.test.js", text: "expect(bad(2)).toBe(4);\nexpect(bad(3)).toBe(7);" },
    { path: "src/hang.js", text: "export function hang(a) { while (true) {} }" }, { path: "src/__test__/hang.test.js", text: "expect(hang(1)).toBe(1);\nexpect(hang(2)).toBe(2);" },
    { path: "src/sneak.js", text: "export function sneak(a) { return typeof fetch === 'function' ? (()=>{ try { const x = new XMLHttpRequest(); x.open('GET','https://example.com',false); x.send(); return 'LEAK'; } catch(e) { return 'no'; } })() : 'no'; }" },
    { path: "src/__test__/sneak.test.js", text: "expect(sneak(1)).toBe('no');\nexpect(sneak(2)).toBe('no');" }];
  const { kept, refused } = await RA.adopt(C, RA.harvest(files), { timeout: 300 });
  return { kept: kept.map(k => k.fnName), refused: refused.map(r => r.name), add: kept[0] && await kept[0].call([20, 22]) }; });
console.log(JSON.stringify(R)); const ok = R.kept.includes("add") && R.add === 42 && R.refused.includes("bad") && R.refused.includes("hang") && !R.kept.includes("hang");
console.log(ok ? "PASS chamber adoption: add kept (42), wrong 'bad' refused, never-ending 'hang' refused; sneak's network attempt answered 'no'" : "FAIL"); console.log("errors:", errs); await b.close(); if (!ok) process.exit(1);
