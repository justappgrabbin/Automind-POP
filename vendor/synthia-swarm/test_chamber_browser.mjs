// Browser test of chamber.js + the fixed Sovereign page (needs a local server on :8766 and Chrome; run: node test_chamber_browser.mjs)
import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const p = await b.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => m.type() === "error" && errs.push(m.text()));
await p.goto("http://localhost:8766/sovereign/index.html"); await new Promise(r => setTimeout(r, 1500));
const R = await p.evaluate(async () => { const { Chamber } = await import("/chamber.js"); const C = new Chamber(), t = async (s, o) => C.run(s, { input: 64 }, o);
  return {
    normal: await t("return (args.input + 7) * 3;"),
    escapeGlobal: await t("return typeof (()=>{}).constructor('return globalThis')().document;"),
    reachParent: await t("try { return typeof parent } catch(e){ return 'blocked' }"),
    network: await t("return typeof fetch === 'function' ? 'fetch exists' : 'no fetch';"),
    fetchTry: await t("let r='?'; try { const x = new XMLHttpRequest(); x.open('GET','https://example.com',false); x.send(); r='GOT '+x.status } catch(e){ r='blocked: '+e.name } return r;"),
    loop: await t("while(true){}", { timeout: 300 }),
    afterLoop: await t("return 'still alive';"),
    builtinsUntouched: Object.isFrozen(Object) || Object.isFrozen(Array) ? "FROZEN" : "untouched" }; });
console.log(JSON.stringify(R, null, 1));
await p.click("#btnRun"); await new Promise(r => setTimeout(r, 1000)); console.log("page run:", await p.$eval("#runStatus", e => e.textContent), (await p.$eval("#runOut", e => e.textContent)).slice(0, 80));
await p.click('nav button[data-view="gen"]'); await p.click("#btnMutate"); await p.click("#btnSave"); await new Promise(r => setTimeout(r, 300));
console.log("memory:", await p.evaluate(() => { const r = JSON.parse(localStorage.getItem("sovereign-code-memory-v1")).at(-1); return { kind: r.payload.kind, stored: r.storedChars, source: r.sourceChars, recipe: r.payload.recipe }; }));
await p.click('[data-act="load"]'); await new Promise(r => setTimeout(r, 300));
console.log("ratio shown:", await p.$eval("#statRatio", e => e.textContent));
console.log("errors:", errs); await b.close();
