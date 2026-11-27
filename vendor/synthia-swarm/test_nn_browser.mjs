import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const p = await b.newPage(), errs = []; p.on("pageerror", e => { if (!/blob:null/.test(e.message)) errs.push(e.message); });
await p.goto("http://127.0.0.1:8901/living.html?date=1973-03-17&time=02:58&zone=America/Chicago"); await new Promise(r => setTimeout(r, 9000));
const t = await p.$eval("#nn", e => e.textContent); console.log(t); const u = await p.evaluate(() => __S.units.find(u => u.nn)?.nn); console.log(JSON.stringify(u));
console.log("errors", errs); console.log(/Being: reads as/.test(t) && u && !errs.length ? "PASS" : "FAIL"); await b.close();
