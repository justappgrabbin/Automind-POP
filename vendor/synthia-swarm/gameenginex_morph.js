// Native GameEngineX capabilities for Claude's Little Miracles. No task recipes.
// The host describes state, available operations and an externally supplied success condition.
// The existing organism's enter() owns construction, selection, cloning and extraction.
import { GameGANSimulator } from './vendor/gameenginex/gamegan-simulator.js';
import { enter, morphBuilder } from './morphogenesis.js';
import { matches, runPlan } from './unitbuild.js';
import { readFile } from './reading.js';
import * as KL from './klein_local.js';
const copy = x => structuredClone(x);
const normalize = s => { const {timestamp,...state}=copy(s); return state; };
export const initialGameState = () => normalize(new GameGANSimulator().getState());
const finite = n => typeof n === 'number' && Number.isFinite(n);
const stateType = s => !!s && ['position','velocity'].every(k=>['x','y','z'].every(a=>finite(s[k]?.[a]))) && ['hunger','rest','social','creation','exploration'].every(k=>finite(s.drives?.[k])) && ['hiddenState','cellState'].every(k=>Array.isArray(s[k])&&s[k].length===256&&s[k].every(finite));
const ACTIONS = ['move','interact','rest','create','socialize','meditate','evolve']; // existing engine API, not a task
export const engineActions = () => [...ACTIONS.filter(type=>type!=='move').map(type=>({type})),...['x','y','z'].flatMap(axis=>[-1,1].map(sign=>({type:'move',direction:{x:0,y:0,z:0,[axis]:sign},intensity:1})))];
const validateAction = a => a && Object.keys(a).every(k=>['type','direction','intensity','element'].includes(k)) && (a.intensity===undefined||finite(a.intensity)) && (a.element===undefined||finite(a.element)) && (a.direction===undefined||a.type==='move') && ACTIONS.includes(a.type) && (a.type !== 'move' || ['x','y','z'].every(k=>finite(a.direction?.[k])&&Math.abs(a.direction[k])<=1));
const key = (a,dt) => 'gx.step.'+a.type+(a.direction?'.'+['x','y','z'].map(k=>a.direction[k]).join('_'):'')+'.'+Array.from(JSON.stringify([dt,a.intensity??null,a.element??null]),c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join('');
const stepState = (state,action,dt) => { const sim=new GameGANSimulator();sim.setState(copy(state));return normalize(sim.step(copy(action),dt)); };
const primitives = (actions,dt) => actions.map(action=>({id:key(action,dt),dimension:'Movement',inputs:{state:'gxState'},output:'gxState',run:({state})=>stepState(state,action,dt)}));
const validate=(t,v)=>{if(t==='gxState'&&!stateType(v))throw Error('Invalid GameEngineX state');};
const checkedCases = cases => { if(!Array.isArray(cases)||!cases.length||cases.length>8)throw Error('Provide 1–8 independent initial states and goal constraints');return cases.map(c=>{const state=normalize({...initialGameState(),...copy(c.initial??{}),position:{...initialGameState().position,...c.initial?.position},velocity:{...initialGameState().velocity,...c.initial?.velocity},drives:{...initialGameState().drives,...c.initial?.drives}});if(!stateType(state))throw Error('Invalid initial state');if(!Array.isArray(c.constraints)||!c.constraints.length||c.constraints.some(k=>!Array.isArray(k.path)||!k.path.length||!['equals','minimum','maximum','includes'].some(p=>Object.hasOwn(k,p))))throw Error('Supply explicit state constraints');return {state,constraints:copy(c.constraints)};});};
// Flatten learned composite operations into a portable plan tree, not a closure over the live swarm.
function portable(plan, output, registry, available, stack=new Set()) {
  const ops={};for(const s of plan){if(available.has(s.op))continue;if(stack.has(s.op))throw Error('Recursive formation');const p=registry.get(s.op);if(!p?.formation)throw Error('Nonportable operation '+s.op);ops[s.op]=portable(p.formation.plan,p.formation.output,registry,available,new Set([...stack,s.op]));}return {plan:copy(plan),output,ops};
}
export function executeGameDescendant(record,state,trace=[]) {
  const base=new Map(primitives(record.actions,record.dt).map(p=>[p.id,{...p,run:args=>{const after=p.run(args);trace.push({op:p.id,before:copy(args.state),after:copy(after)});return after;}}]));
  function run(tree,inputs){const ops=new Map(base);for(const [id,sub] of Object.entries(tree.ops))ops.set(id,{id,output:'gxState',run:args=>run(sub,args)});return runPlan(tree.plan,tree.output,ops,validate,inputs);}
  return run(record.tree,{[record.input]:copy(state)});
}
export class GameEngineMorph {
  constructor(organism,klein,messy){this.O=organism;this.klein=klein;this.messy=messy;this.records=[];}
  teach(text){return readFile(this.O.S,{path:'gameenginex-lesson.txt',text});}
  develop({name='GameEngineX',cases,actions=engineActions(),dt=1/3}={}) {
    if(!finite(dt)||dt<=0||dt>1||!Array.isArray(actions)||!actions.length||actions.length>24||!actions.every(validateAction)||new Set(actions.map(a=>key(a,dt))).size!==actions.length)throw Error('Invalid engine action catalogue or timestep');
    const C=checkedCases(cases), P=primitives(actions,dt), available=new Set(P.map(p=>p.id));let record=null, results=null;
    const host={name,kind:'gameenginex',enough:1,check:()=>C.every(c=>matches(c.state,c.constraints))?1:0,
      materials:()=>({types:{gxState:stateType},observations:[{id:'state',type:'gxState',value:C[0].state}],primitives:P,need:name,goal:{type:'gxState',constraints:C[0].constraints},cases:C.map(c=>({inputs:{state:c.state},goal:{type:'gxState',constraints:c.constraints}}))}),
      descend:({formation,builder,rename})=>({label:name+' formation',standalone:true,record:{version:1,name,actions:copy(actions),dt,input:rename('state'),tree:portable(formation.plan,formation.output,builder.registry,available)}}),
      integrate:d=>{record=d.record;},checkAlone:()=>{if(!record)return 0;results=C.map(c=>{const trace=[];const state=executeGameDescendant(record,c.state,trace);return {state,trace,passed:matches(state,c.constraints)};});return results.every(r=>r.passed)?1:0;}};
    const result=enter(this.O,host);if(!result.ok||!record||!results?.every(r=>r.passed))return {ok:result.ok,steps:result.steps,integrated:false};
    record.cluster=result.cluster;record.memory=copy(this.O.morphMemory.formations.at(-1));record.bound=copy(C[0].state);this.records.push(record);KL.grow(this.O.S);const carry=result.steps.find(s=>s.step==='organize')?.units??[];
    // Record only executed, verified descendant transitions; teacher text cannot cause a world transition.
    for(const [i,r] of results.entries())for(const [j,t] of r.trace.entries()){
      const unit=this.O.S.units.find(u=>u.id===carry.find(c=>(c.op??c.primitive)===t.op)?.unit);const id=`gx:${this.records.length}:${i}:${j}`;
      for(const field of ['position','velocity','drives'])for(const [k,v] of Object.entries(t.after[field])){if(v===t.before[field][k])continue;const outcome=field+'.'+k+':'+(v>t.before[field][k]?'increase':'decrease');if(unit)KL.live(unit,t.op,'gxState',outcome,true);this.klein?.learn([t.op,'gxState',outcome]);this.messy?.k.set(id,field+'.'+k,v);}
      this.messy?.k.set(id,'operation',t.op);if(unit)this.messy?.k.set(id,'unit',unit.id);
    }
    this.messy?.readWorld();return {ok:true,integrated:true,steps:result.steps,record,results};
  }
  export(){return copy(this.records);}
  import(records){if(!Array.isArray(records))throw Error('Invalid descendant archive');const B=morphBuilder(this.O);if(!B.types.has('gxState'))B.registerType('gxState',stateType);for(const r of records){if(r.version!==1||!r.cluster||!r.tree||!stateType(r.bound))throw Error('Invalid formation record');for(const p of primitives(r.actions,r.dt))B.register(p);if(!B.registry.has(r.cluster))B.register({id:r.cluster,inputs:{[r.input]:'gxState'},output:'gxState',cost:.5,formation:{plan:r.tree.plan,output:r.tree.output,bound:{[r.input]:r.bound}},run:args=>executeGameDescendant(r,args[r.input])});if(r.memory&&!this.O.morphMemory.formations.some(f=>f.formation===r.cluster))this.O.morphMemory.formations.push(copy(r.memory));}this.records=copy(records);}
}
