import { GameGANSimulator } from './gamegan-simulator.mjs';
import { ProgressiveCodonScene } from './codon-resonance-gamegan.mjs';
import { UnifiedCognitiveEngine } from './unified-cognitive-engine.mjs';
export class GameEngineXBridge {
 constructor({swarm=()=>null,klein=()=>null,onLearn=()=>{}}={}) {this.swarm=swarm;this.klein=klein;this.onLearn=onLearn;this.sim=new GameGANSimulator();this.oracleEngine=new UnifiedCognitiveEngine('Synthia sandbox');this.scene=new ProgressiveCodonScene();this.events=[];}
 snapshot(){const units=this.swarm()?.units??[];return {units:units.length,active:units.filter(u=>!u.latent&&!u.broken).length,gates:[...new Set(units.filter(u=>!u.latent&&!u.broken).map(u=>u.address?.gate).filter(g=>Number.isInteger(g)&&g>=1&&g<=64))].sort((a,b)=>a-b)};}
 sync(){const s=this.snapshot();this.scene.reset();for(const gate of s.gates)this.scene.addCodon(gate);return {...s,codons:this.scene.elements.length,bridges:this.scene.resonanceOverlays.length};}
 step(action='autonomous',{learn=false}={}){const a=action==='autonomous'?this.sim.autonomousAction():{type:action,...(action==='move'?{direction:{x:1,y:0,z:0}}:{})};if(!['move','interact','rest','create','socialize','meditate','evolve'].includes(a.type))throw Error('Unknown action');const before=structuredClone(this.sim.getState()),after=this.sim.step(a,1),changes=Object.keys(after.drives).filter(k=>Math.abs(after.drives[k]-before.drives[k])>1e-9).map(k=>`${k}-${after.drives[k]>before.drives[k]?'up':'down'}`);const event={action:a.type,changes,position:after.position,drives:after.drives,learned:false};const k=this.klein();if(learn&&k){k.learn([`gamex:${a.type}`,'gamex:simulation',`gamex:${changes.join('+')||'unchanged'}`]);event.learned=true;this.onLearn();}this.events.push(event);if(this.events.length>100)this.events.shift();return event;}
 oracle(question){return this.oracleEngine.oracle(question);}
 reset(){this.sim.reset();this.events=[];}
}
