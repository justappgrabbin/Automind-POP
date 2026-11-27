import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const p = await b.newPage(), errs = []; p.on("pageerror", e => { if (!/blob:null/.test(e.message)) errs.push(e.message); });
await p.goto("http://127.0.0.1:8901/living.html?date=1973-03-17&time=02:58&zone=America/Chicago"); await new Promise(r => setTimeout(r, 12000));
const k = await p.$eval("#kern", e => e.textContent); console.log(k);
const s = await p.evaluate(() => __KB.sentence(__S.units[0])); console.log(s);
console.log("errors", errs); console.log(/kernel: \d+ nets/.test(k) && s.length > 20 && !errs.length ? "PASS" : "FAIL"); await b.close();
