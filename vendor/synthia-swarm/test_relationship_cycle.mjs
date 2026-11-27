import assert from 'node:assert/strict';
import {LivingSwarm} from './living.js';
import {RuleWorld} from './rule_world.js';
import {OrganismSwarm} from './organism_swarm.js';
import {ComputerWorld} from './computer_world.js';
import {MessyWorld} from './messy_world.js';
const addr=(gate,extra={})=>({gate,line:1,color:1,tone:1,base:1,dimension:'Being',side:'Personality',planetary:'Sun',...extra});
const S=new LivingSwarm({seed:3}), R=await RuleWorld.ready(), C=new ComputerWorld(), M=new MessyWorld();
const a=S.add(addr(59),'item',.5,.5), b=S.add(addr(6,{side:'Design'}),'item',.51,.5); a.face={id:'a',name:'A'}; b.face={id:'b',name:'B'};
const O=new OrganismSwarm(S,{ruleWorld:R,computerWorld:C,messyWorld:M});
S.link(); assert.equal(a.bonds[0],b.bonds[0]); assert.equal(a.bonds[0].product.op,'nand');
O.step({elapsedMs:249}); assert.equal(R.stats.contacts,0); a.x=.5; a.y=.5; b.x=.51; b.y=.5; O.step({elapsedMs:1}); assert.equal(R.stats.contacts,1); assert.equal(a.face.name,'B'); assert.equal(b.face.name,'A'); assert.equal(S.relationships.length,1); assert.ok(S.relationships[0].resonance.crosses); assert.ok(C.facts.has('touch:0:1')); assert.equal(M.bonds.size,1);
O.step({elapsedMs:0}); assert.equal(R.stats.contacts,1); b.broken=true; O.step({elapsedMs:1}); assert.equal(a.bonds.length,0); assert.equal(b.bonds.length,0); assert.equal(C.facts.has('touch:0:1'),false); assert.equal(M.bonds.size,0);
const T=new LivingSwarm(); T.add(addr(18),'item',.1,.1); T.add(addr(58),'item',.9,.9); T.ruleWorld=await RuleWorld.ready(); T.step(0,250); assert.equal(T.relationships[0].bond,null); assert.equal(T.relationships[0].resonance,null); assert.ok(T.relationships[0].channel); assert.equal(T.ruleWorld.stats.channelPulls,1);
console.log('relationship cycle passed');
// Candidate enumeration reversal: preserve stable unit IDs, reverse only the filtered search order.
function fixture(reverse) { const s=new LivingSwarm({seed:8}); for(let i=0;i<3;i++) s.add(addr(i+1),'item',.5+i*.02,.5); if(reverse){const f=s.units.filter.bind(s.units); s.units.filter=(...args)=>f(...args).reverse();} s.link(); return s.relationships.map(r=>[r.a,r.b,r.bond?.product?.bits]); }
assert.deepEqual(fixture(false),fixture(true));
const Q=new LivingSwarm(); Q.add(addr(1),'item',.5,.5); Q.add(addr(2),'item',.51,.5); Q.grow={}; Q.ruleWorld=await RuleWorld.ready(); Q.link(null,{ruleWorld:Q.ruleWorld}); assert.equal(Q.relationships[0].bond,null); assert.ok(Q.relationships[0].resonance); Q.grow=null; Q.units[1].x=.65; Q.link(null,{ruleWorld:Q.ruleWorld}); assert.ok(Q.relationships[0].bond); assert.equal(Q.relationships[0].resonance,null);
console.log('enumeration, contact-only and bond-only passed');
