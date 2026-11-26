import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createWorkspaceServer} from '../src/workspace-server.mjs';
async function withServer(fn){
 const requests=[];
 const server=createWorkspaceServer({runtimeFactory:async()=>({resolve:async input=>{requests.push(['resolve',input]);return {capability:'resolve_address',input};},perspective:async input=>{requests.push(['perspective',input]);return {capability:'locate_perspective',input};},comparePosition:async input=>{requests.push(['comparePosition',input]);return {capability:'compare_position',input};}})});
 server.listen(0,'127.0.0.1');await once(server,'listening');const url='http://127.0.0.1:'+server.address().port;
 try{await fn(url,requests);}finally{await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
}
test('real web files and original runtime capability directory are served locally',async()=>withServer(async url=>{
 const page=await fetch(url+'/');assert.equal(page.status,200);assert.match(await page.text(),/AutoMind/);
 const core=await fetch(url+'/src/personal-core.mjs');assert.equal(core.status,200);assert.match(await core.text(),/evaluateAction/);
 const catalog=await (await fetch(url+'/api/capabilities')).json();assert.deepEqual(catalog.capabilities,['resolve-address','locate-perspective','compare-position']);
}));
test('browser mission routes to correct original runtime method',async()=>withServer(async(url,requests)=>{
 const res=await fetch(url+'/api/mission',{method:'POST',headers:{'content-type':'application/json','origin':url},body:JSON.stringify({capability:'locate-perspective',input:{expressions:{q:'hello'}}})});
 assert.equal(res.status,200);const result=await res.json();assert.equal(result.result.capability,'locate_perspective');assert.equal(requests.length,1);assert.equal(requests[0][0],'perspective');
}));
test('refuses arbitrary commands and disallowed cross-origin requests',async()=>withServer(async url=>{
 const options={method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({capability:'execute-code',input:{code:'rm -rf /'}})};
 const denied=await fetch(url+'/api/mission',options);assert.equal(denied.status,400);
 const cross=await fetch(url+'/api/mission',{...options,headers:{origin:'https://untrusted.example'}});assert.equal(cross.status,403);
}));

test('licensed personal source routes return real templates and reject traversal',async()=>withServer(async url=>{
 const compass=await fetch(url+'/api/personal-source?group=vault&name=life_compass');
 assert.equal(compass.status,200);assert.match(await compass.text(),/{{5년_한_줄}}/);
 const coach=await fetch(url+'/api/personal-source?group=coach&name=startup');
 assert.equal(coach.status,200);assert.match(await coach.text(),/startup|创业|精益|产品/i);
 const invalid=await fetch(url+'/api/personal-source?group=vault&name=..%2F..%2Fsecret');
 assert.equal(invalid.status,400);
}));

test('real HTTP runtime verifies address, rejects invalid input, and restores state after restart',async t=>{
 const {mkdtemp,rm}=await import('node:fs/promises');
 const {tmpdir}=await import('node:os');
 const {join}=await import('node:path');
 const {openRuntime}=await import('../src/runtime.mjs');
 const dir=await mkdtemp(join(tmpdir(),'pop-http-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const statePath=join(dir,'state.json');
 const input={micro:{gate:41,line:4,color:2,tone:5,base:3},macro:{planet:0,dimension:0,zodiac:0,house:0},emergent:{degree:1,minute:0,second:0,arcSecond:0}};
 async function session(fn){
  const server=createWorkspaceServer({statePath});server.listen(0,'127.0.0.1');await once(server,'listening');
  const url='http://127.0.0.1:'+server.address().port;
  try{await fn(async input=>{const response=await fetch(url+'/api/mission',{method:'POST',headers:{'content-type':'application/json','origin':url},body:JSON.stringify({capability:'resolve-address',input})});return {status:response.status,body:await response.json()};});}
  finally{await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
 }
 let first;
 await session(async run=>{const result=await run(input);assert.equal(result.status,200);first=result.body.result;assert.equal(first.address.gate,42);assert.equal(first.receipt.consumer,'canonical-address-verifier');const invalid=await run({...input,micro:{...input.micro,gate:64}});assert.equal(invalid.status,400);});
 assert.deepEqual((await openRuntime(statePath)).latest(),first);
 await session(async run=>{const result=await run({...input,micro:{...input.micro,gate:42}});assert.equal(result.status,200);assert.equal(result.body.result.address.gate,43);assert.notEqual(result.body.result.id,first.id);assert.deepEqual((await openRuntime(statePath)).latest(),result.body.result);});
});
