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
