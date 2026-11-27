import assert from 'node:assert/strict';
import fs from 'node:fs';
import { LivingSwarm } from './living.js';
import { counts, filterUnits, unitField, unitState } from './swarm-dock.js';
const S=new LivingSwarm();
for(let gate=1;gate<=64;gate++){
  const u=S.add({gate,line:1,color:1,tone:1,base:1,dimension:gate%2?'Being':'Movement'},'item');
  if(gate>20)u.latent=true;
}
S.units[0].broken=true; S.units[1].face={name:'Gaussian'};
const original=S.units.slice();
assert.deepEqual(counts(S.units),{active:19,latent:44,broken:1});
assert.equal(filterUnits(S.units,'','latent').length,44);
assert.equal(filterUnits(S.units,'','active','Movement').length,10);
assert.equal(filterUnits(S.units,'gaussian')[0],S.units[1]);
assert.equal(filterUnits(S.units,'gate 64')[0],S.units[63]);
assert.equal(unitField(S.units[1]),'Movement');
assert.equal(unitState(S.units[0]),'broken');
assert.equal(filterUnits(S.units,'','broken')[0],S.units[0]);
assert.equal(filterUnits(S.units,'unfindable').length,0);
assert.deepEqual(S.units,original);
const html=fs.readFileSync(new URL('./living.html',import.meta.url),'utf8');
for(const id of ['live','minions','learn','connect','birth','inventory']){
  assert(html.includes(`data-panel="${id}"`));assert(html.includes(`id="panel-${id}"`));
}
assert(html.includes('selectLivingUnit(u, true)'));
assert(html.includes('if (inspectOnly) armed = null'));
assert(html.includes('document.getElementById("focus").click()'));
console.log('Swarm dock: 25 assertions passed (real LivingSwarm objects; static interface wiring).');
