import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const p = await b.newPage(), errs = []; p.on("pageerror", e => { if (!/blob:null/.test(e.message)) errs.push(e.message); });
await p.goto("http://127.0.0.1:8901/living.html?date=1973-03-17&time=02:58&zone=America/Chicago"); await new Promise(r => setTimeout(r, 10000));
const st = await p.$eval("#bstat", e => e.textContent); console.log(st);
const u = await p.evaluate(() => { const f = {}; for (const x of __S.units) f[x.address.field ?? (x.latent ? "latent" : "?")] = (f[x.address.field ?? (x.latent ? "latent" : "?")] ?? 0) + 1; return { n: __S.units.length, f }; });
console.log(JSON.stringify(u)); console.log("errors", errs);
console.log(u.f.Movement === 26 && u.f.Design === 26 && u.f.Being === 26 && u.f.Evolution === 26 && /four charts/.test(st) && !errs.length ? "PASS" : "FAIL"); await b.close();
