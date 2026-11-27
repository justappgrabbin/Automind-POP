import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const p = await b.newPage(), errs = []; p.on("pageerror", e => { if (!/blob:null/.test(e.message)) errs.push(e.message); });   /* failed trials inside the sealed chamber are expected */
await p.goto("http://127.0.0.1:8901/living.html"); await new Promise(r => setTimeout(r, 10000));
const inp = await p.$("#any"); await inp.uploadFile("/tmp/app/post.js", "/tmp/app/test.js"); await new Promise(r => setTimeout(r, 30000));
const life = await p.$eval("#life", e => e.textContent); console.log(life.slice(-400)); console.log("errors", errs);
console.log(/slugify: built by/.test(life) && !errs.length ? "PASS" : "FAIL"); await b.close();
