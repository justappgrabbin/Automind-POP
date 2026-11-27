// living.html in Chrome with the real chamber; faces_functions.json is swapped for test functions (harvested code not run here).
import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const p = await b.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.setRequestInterception(true);
p.on("request", r => r.url().endsWith("faces_functions.json") ? r.respond({ contentType: "application/json", body: JSON.stringify([
  { id: "m", name: "mean", params: ["values"], code: "function mean(values){return values.reduce((a,b)=>a+b,0)/values.length}" },
  { id: "u", name: "shout", params: ["text"], code: "function shout(text){return String(text).toUpperCase()}" },
  { id: "x", name: "boom", params: ["n"], code: "function boom(n){throw Error('no')}" },
  { id: "l", name: "spin", params: ["n"], code: "function spin(n){while(true){}}" }]) }) : r.continue());
await p.goto("http://localhost:8766/living.html"); await new Promise(r => setTimeout(r, 25000));
const R = await p.evaluate(() => ({ tries: __FA.tries, placed: __FA.placement(), worn: __S.units.filter(u => u.face).length, units: __S.units.length,
  bar: document.getElementById("faces").textContent, world: document.getElementById("world").textContent, blue: __S.units.filter(u => u.blue?.line).map(u => u.address.gate + "." + u.address.line + " " + u.blue.line.name) }));
console.log(JSON.stringify(R, null, 1), "\nerrors:", errs); await b.close();
