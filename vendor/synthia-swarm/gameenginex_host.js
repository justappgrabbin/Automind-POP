// GameEngineX is an environment for the existing swarm, not a new swarm.
import {GameGANSimulator} from './vendor/gameenginex/gamegan-simulator.js';
import {World} from './hostworld.js';
import * as KL from './klein_local.js';
import {readFile} from './reading.js';
export class GameEngineHost {
  constructor(swarm, klein, messy) { this.swarm=swarm;this.klein=klein;this.messy=messy;this.world=new World({w:12,h:6,name:'GameEngineX habitat'});this.objects=new Map();this.agents=new Map();this.receipts=[];KL.grow(swarm); }
  passage(id,x,z){if(this.objects.has(id))throw Error('Duplicate object');this.world.setPassage(x,z,[false],[true]);this.objects.set(id,{id,kind:'door',x,z});return this.observe(id);}
  observe(id){const o=this.objects.get(id);if(!o)throw Error('Unknown object');return {...o,state:this.world.solid(o.x,o.z)?'closed':'open'};}
  agent(unit){if(!unit||unit.broken||unit.latent)throw Error('An active swarm unit is required');if(!this.agents.has(unit.id))this.agents.set(unit.id,new GameGANSimulator());return this.agents.get(unit.id);}
  place(unit,x,z){this.agent(unit).setState({position:{x,y:0,z},velocity:{x:0,y:0,z:0}});}
  teach(text){return readFile(this.swarm,{path:'teacher-lesson.txt',text});} // language only; no world mutation
  actions(id){this.observe(id);return ['interact'];} // host's affordances; not a goal solver
  execute(unit,id,action){const o=this.observe(id),sim=this.agent(unit),p=sim.getState().position;
    if(!this.actions(id).includes(action))throw Error('Unsupported action');if(Math.abs(p.x-o.x)+Math.abs(p.z-o.z)>1.01)throw Error('Target out of reach');
    sim.setState({velocity:{x:0,y:0,z:0}});sim.step({type:action,target:id},1/60);
    // GameGAN supplies agent dynamics. Native Synthia passage supplies the physical affordance.
    if(o.state==='closed')this.world.updatePassage(o.x,o.z,[true]);
    const after=this.observe(id),result=after.state;KL.grow(this.swarm);KL.live(unit,action,o.kind,result,result==='open');this.klein.learn([action,o.kind,result]);
    this.messy.k.set(id,'kind',o.kind);this.messy.k.set(id,'state',result);this.messy.k.set('u'+unit.id,'lastAction',action);this.messy.k.set('u'+unit.id,'actedOn',id);this.messy.readWorld();
    const receipt={unit:unit.id,id,action,before:o.state,after:result};this.receipts.push(receipt);return receipt;}
  achieve(unit,id,goal){const o=this.observe(id);if(o.state===goal)return {status:'already'};KL.grow(this.swarm);
    const candidates=this.actions(id).filter(a=>KL.expect(this.swarm,unit,a,o.kind)?.result===goal||this.klein.suggest(a,o.kind)===goal);
    if(!candidates.length)return {status:'needs-teaching'};const receipt=this.execute(unit,id,candidates[0]);return {status:receipt.after===goal?'achieved':'failed',receipt};}
  move(unit,dx,dz){if(Math.abs(dx)+Math.abs(dz)!==1)throw Error('Use a cardinal unit direction');const sim=this.agent(unit),before=sim.getState();const after=sim.step({type:'move',direction:{x:dx,y:0,z:dz},intensity:1},1/3);const x=Math.round(after.position.x),z=Math.round(after.position.z);
    if(z<0||this.world.solid(x,z)){sim.setState({...before,velocity:{x:0,y:0,z:0}});return 'blocked';}return 'moved';}
}
