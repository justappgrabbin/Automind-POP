import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const p = await b.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.setRequestInterception(true);
p.on("request", r => r.url().endsWith("faces_functions.json") ? r.respond({ contentType: "application/json", body: JSON.stringify([{ id: "m", name: "mean", params: ["values"], code: "function mean(values){return values.reduce((a,b)=>a+b,0)/values.length}" }]) }) : r.continue());
await p.goto("http://localhost:8766/living.html"); await new Promise(r => setTimeout(r, 12000));
await p.click("#tellme"); const story = await p.$eval("#story", e => e.textContent);
console.log(await p.$eval("#cwstat", e => e.textContent)); console.log("story:", story.slice(0, 500)); console.log("errors:", errs); await b.close();
