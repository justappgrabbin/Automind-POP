// Local-only, additive HTTP bridge for the real AutoMind POP runtime and personal workspace.
// No cloud authentication is implied. External hosting requires an authenticated reverse proxy.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {openRuntime} from './runtime.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const assets=new Map([['/',{file:'web/index.html',type:'text/html; charset=utf-8'}],['/web/index.html',{file:'web/index.html',type:'text/html; charset=utf-8'}],['/src/personal-core.mjs',{file:'src/personal-core.mjs',type:'text/javascript; charset=utf-8'}]]);
const actions=Object.freeze({'resolve-address':'resolve','locate-perspective':'perspective','compare-position':'comparePosition'});
const errorBody=error=>JSON.stringify({ok:false,error:error.message});
export function createWorkspaceServer({statePath=resolve(root,'.automind-pop.local-state.json'),runtimeFactory=openRuntime}={}){
 let runtimePromise;
 const getRuntime=()=>runtimePromise??=runtimeFactory(statePath);
 return createServer(async(req,res)=>{
  const respond=(code,body,type='application/json; charset=utf-8')=>{res.writeHead(code,{'content-type':type,'cache-control':'no-store','x-content-type-options':'nosniff','content-security-policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; base-uri 'none'"});res.end(body);};
  try{
   const path=new URL(req.url,'http://localhost').pathname;
   if(req.method==='GET'&&assets.has(path)){const a=assets.get(path);const data=await readFile(resolve(root,a.file));respond(200,data,a.type);return;}
   if(req.method==='GET'&&path==='/api/capabilities'){respond(200,JSON.stringify({ok:true,capabilities:Object.keys(actions),personal:['mimo','mylife','pocket-sage','sage-coach'],mode:'local-only'}));return;}
   if(req.method==='POST'&&path==='/api/mission'){
    const origin=req.headers.origin;
    if(origin&&origin!==`http://127.0.0.1:${res.socket.localPort}`&&origin!==`http://localhost:${res.socket.localPort}`){respond(403,errorBody(new Error('Cross-origin requests are disabled')));return;}
    let body='',size=0;
    for await(const part of req){size+=part.length;if(size>32768){respond(413,errorBody(new Error('Request too large')));return;}body+=part.toString('utf8');}
    const payload=JSON.parse(body);
    if(!payload||typeof payload!=='object'||Array.isArray(payload)||!Object.hasOwn(actions,payload.capability)||!payload.input||typeof payload.input!=='object'||Array.isArray(payload.input)){respond(400,errorBody(new TypeError('Expected {capability, input}')));return;}
    const runtime=await getRuntime(),result=await runtime[actions[payload.capability]](payload.input);
    respond(200,JSON.stringify({ok:true,result}));return;
   }
   respond(404,errorBody(new Error('Not found')));
  }catch(error){respond(error instanceof SyntaxError||error instanceof TypeError||error instanceof RangeError?400:500,errorBody(error));}
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT||8787),server=createWorkspaceServer({statePath:process.env.AUTOMIND_STATE_PATH||undefined});
 if(!Number.isInteger(port)||port<0||port>65535)throw new RangeError('PORT must be 0-65535');
 server.listen(port,'127.0.0.1',()=>{console.log('AutoMind POP personal workspace: http://127.0.0.1:'+server.address().port);});
}
