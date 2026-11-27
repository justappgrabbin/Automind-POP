import assert from 'node:assert/strict';
import {LivingSwarm} from './living.js';
const addr=(gate,extra={})=>({gate,line:1,color:1,tone:1,base:1,dimension:'Being',side:'Personality',planetary:'Sun',...extra});
const S=new LivingSwarm({seed:3});
const a=S.add(addr(59),'item',.5,.5), b=S.add(addr(6,{side:'Design'}),'item',.51,.5);
S.link(); assert.equal(a.bonds[0],b.bonds[0]); assert.equal(a.bonds[0].product.op,'nand'); assert.equal(S.relationships.length,1); assert.equal(S.relationships[0].bond,a.bonds[0]);
b.broken=true; S.step(0,1); assert.equal(a.bonds.length,0); assert.equal(b.bonds.length,0); assert.equal(S.relationships.length,0);
function fixture(reverse) { const s=new LivingSwarm({seed:8}); for(let i=0;i<3;i++) s.add(addr(i+1),'item',.5+i*.02,.5); if(reverse){const f=s.units.filter.bind(s.units); s.units.filter=(...args)=>f(...args).reverse();} s.link(); return s.relationships.map(r=>[r.a,r.b,r.bond?.product?.bits]); }
assert.deepEqual(fixture(false),fixture(true));
console.log('PASS: shared NAND bond, broken bond cleanup, stable relationship enumeration');
