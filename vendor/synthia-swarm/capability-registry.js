// Read-only discovery interface over the existing swarm. Never invokes harvested code.
import { TOOLBOX } from './toolbox.js';
export class CapabilityRegistry {
  constructor(faces, index){this.faces=faces;this.index=index;}
  summary(){const f=this.faces;return {harvested:f?.list.length??0,observed:Object.keys(f?.does??{}).filter(id=>f.byId.has(id)).length,earned:new Set(Object.keys(f?.record??{}).flatMap(g=>f.earned(+g).map(x=>x.face.id))).size,signatures:Object.keys(f?.repertoire()??{}).length,tools:TOOLBOX.length,files:this.index.originalFiles};}
  provide(inputs,output){return this.faces?.provide(inputs,output)??[];}
  search(query='',kind='faces'){
    const f=this.faces, words=query.toLowerCase().trim().split(/\s+/).filter(Boolean);let rows=[];
    if(['faces','learned','earned'].includes(kind)){
      const gates=new Map();for(const g of Object.keys(f?.record??{}))for(const x of f.earned(+g)){if(!gates.has(x.face.id))gates.set(x.face.id,[]);gates.get(x.face.id).push(+g);}
      rows=(f?.list??[]).map(x=>{const sig=Object.keys(f.does[x.id]??{}),earned=gates.get(x.id)??[];return {id:x.id,name:x.name,source:x.from??'',detail:[`(${(x.params??[]).join(', ')})`,x.doc??'',...sig,earned.length?`Gates: ${earned.sort((a,b)=>a-b).join(', ')}`:''].filter(Boolean).join(' · '),status:earned.length?'Earned on gate':sig.length?'Observed result':'Harvested / unobserved',observed:sig.length>0,earned:earned.length>0};}).filter(x=>kind==='faces'||(kind==='learned'?x.observed:x.earned));
    } else if(kind==='tools')rows=TOOLBOX.map(x=>({id:x.id,name:x.id,source:'toolbox.js',detail:`${x.dimension} · ${Object.values(x.inputs).join(', ')} → ${x.output} · ${x.about}`,status:'Defined builder primitive'}));
    else rows=this.index.files.filter(x=>kind==='files'||x.module).map(x=>({id:x.path,name:x.name,source:x.path,detail:x.group,status:x.status}));
    return rows.filter(x=>words.every(w=>`${x.name} ${x.source} ${x.detail} ${x.status} ${x.id}`.toLowerCase().includes(w)));
  }
}
