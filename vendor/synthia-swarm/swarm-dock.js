// UI adapter only: read the current swarm, never construct surrogate units.
const $ = id => document.getElementById(id);
export const unitState = u => u.broken ? 'broken' : u.latent ? 'latent' : 'active';
export const unitField = u => u.address?.field || u.address?.dimension || 'Unassigned';
export function filterUnits(units, query='', state='all', field='all') {
  const q=query.toLowerCase().trim();
  return units.filter(u => (state==='all'||unitState(u)===state) && (field==='all'||unitField(u)===field) && (!q || [u.id,`#${u.id}`,`gate ${u.address?.gate}`,`${u.address?.gate}.${u.address?.line}`,unitField(u),u.address?.dimension,u.kind,u.face?.name,u.ability?.tool,u.sentence].some(v=>String(v??'').toLowerCase().includes(q))));
}
export function counts(units){const c={active:0,latent:0,broken:0};for(const u of units)c[unitState(u)]++;return c;}
function install(){
  let page=0, selected=null, last='', fieldsKey='';const size=24;
  const live=()=>window.__S?.units ?? [];
  const panel=$('panel-minions');
  const buttons=[...document.querySelectorAll('.swarm-dock [data-panel]')];
  for(const button of buttons)button.addEventListener('click',()=>{if(button.dataset.panel==='minions'){last='';render();}if(matchMedia('(max-width:780px)').matches){(button.dataset.panel==='live'?document.querySelector('.studio-stage'):document.querySelector('.studio-console')).scrollIntoView({block:'start',behavior:'auto'});}});
  function detail(u){const a=u.address??{};return [`${unitField(u)} · ${u.kind} · ${unitState(u)}`,`Dimension ${a.dimension??'—'} · Planet ${a.planetary??'—'} · Zodiac ${a.zodiac??'—'}`,`Gate ${a.gate??'—'} · Line ${a.line??'—'} · Color ${a.color??'—'} · Tone ${a.tone??'—'} · Base ${a.base??'—'}`,`Degree ${a.degree??'—'} · Minute ${a.minute??'—'} · Second ${a.second??'—'} · Arc-sec ${a.arc??'—'} · House ${a.house??'—'}`,`Health ${Number.isFinite(u.health)?Math.round(u.health*100)+'%':'—'} · ${u.bonds?.length??0} bonds`,u.face?.name?`Face: ${u.face.name}${u.face.earned?' (earned)':' (trying)'}`:'No face worn',u.ability?.tool?`Ability: ${u.ability.tool}`:'',u.sentence??''].filter(Boolean).join('\n');}
  function showSelected(){const u=live().find(v=>v.id===selected);$('minion-selected').hidden=!u;if(!u)return;$('minion-selected-title').textContent=`Unit #${u.id} · Gate ${u.address?.gate??'—'}.${u.address?.line??'—'}`;$('minion-selected-detail').textContent=detail(u);$('minion-focus').disabled=!!u.broken||typeof window.__focusMinion!=='function';$('minion-view').disabled=!!u.broken||typeof window.__inspectMinion!=='function';}
  function render(){const units=live(), c=counts(units);$('dock-light').dataset.live=String(!!window.__S&&units.length>0);$('dock-status').textContent=units.length?`${units.length.toLocaleString()} units · ${window.__S.leader} leads`:'Starting living swarm…';if(panel.hidden)return;
    $('minion-summary').textContent=`${units.length.toLocaleString()} total · ${c.active.toLocaleString()} active · ${c.latent.toLocaleString()} latent · ${c.broken.toLocaleString()} broken off`;
    const fields=[...new Set(units.map(unitField))].sort(), key=JSON.stringify(fields);if(key!==fieldsKey){const prior=$('minion-field').value;$('minion-field').replaceChildren(new Option('All fields','all'),...fields.map(f=>new Option(f,f)));$('minion-field').value=fields.includes(prior)?prior:'all';fieldsKey=key;}
    const rows=filterUnits(units,$('minion-search').value,$('minion-state').value,$('minion-field').value), max=Math.max(0,Math.ceil(rows.length/size)-1);page=Math.min(max,Math.max(0,page));const visible=rows.slice(page*size,(page+1)*size);$('minion-count').textContent=`${rows.length.toLocaleString()} matching units`;$('minion-page').textContent=`${page+1} / ${max+1}`;$('minion-prev').disabled=page===0;$('minion-next').disabled=page===max;showSelected();
    const sig=JSON.stringify(visible.map(u=>[u.id,u.address?.gate,u.address?.line,unitField(u),unitState(u),u.kind,selected===u.id]));if(sig===last)return;last=sig;
    $('minion-list').replaceChildren(...visible.map(u=>{const b=document.createElement('button'),title=document.createElement('strong'),sub=document.createElement('small'),st=document.createElement('small');b.type='button';b.setAttribute('aria-pressed',String(selected===u.id));title.textContent=`Gate ${u.address?.gate??'—'}.${u.address?.line??'—'}`;sub.textContent=`#${u.id} · ${unitField(u)}`;st.textContent=`${unitState(u)} · ${u.kind}`;b.append(title,sub,st);b.addEventListener('click',()=>{selected=u.id;$('minion-action').textContent='';render();});return b;}));
  }
  for(const id of ['minion-search','minion-state','minion-field'])$(id).addEventListener(id==='minion-search'?'input':'change',()=>{page=0;last='';render();});$('minion-prev').onclick=()=>{page--;render();};$('minion-next').onclick=()=>{page++;render();};
  $('minion-view').onclick=()=>{try{if(window.__inspectMinion?.(selected)){document.querySelector('.studio-stage').scrollIntoView({block:'start'});$('minion-action').textContent='Unit inspected in living field; no touch executed.';}else $('minion-action').textContent='Unit unavailable.';}catch(e){$('minion-action').textContent=e.message;}};
  $('minion-focus').onclick=()=>{try{const f=window.__focusMinion?.(selected);$('minion-action').textContent=f?.status==='resolved'?`Focus set to ${f.longitude.toFixed(2)}°.`:'No resolvable placement for this unit.';}catch(e){$('minion-action').textContent=e.message;}};
  render();setInterval(render,1500);
}
if(typeof document!=='undefined')install();
