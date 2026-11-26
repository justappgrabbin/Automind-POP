// AutoMind POP personal-workspace computational core.
// MIMO method: mimo-skill-main/SKILL.md and references/interview-playbook.md.
// MYLIFE structure: mylife-vault-main/templates/*.md.
// Pocket Sage calculation: Pocket-Sage/client/lib/decision-engine.ts (adapted to plain JS).
// Sage Coach tracks: sage-coach-main/skills/*/SKILL.md.
// These are locally inspectable computation/collection primitives; no unverified AI inferences.
export const PERSONAL_MODULES = Object.freeze([
 {id:'mimo',name:'MIMO discovery',source:'mimo-skill-main',purpose:'Evidence-led self-understanding'},
 {id:'mylife',name:'MYLIFE Vault',source:'mylife-vault-main',purpose:'Personal records and plans'},
 {id:'pocket-sage',name:'Pocket Sage',source:'Pocket-Sage',purpose:'Transparent decision scoring'},
 {id:'sage-coach',name:'Sage Coach',source:'sage-coach-main',purpose:'Developmental coaching tracks'}
]);
export const VAULT_DOCUMENTS=Object.freeze(['philosophy','self_profile','life_os','life_compass','roadmap','career_style','love_style','investment_style','relationship_protocol','side_project_strategy','saju','zodiac']);
export const COACH_TRACKS=Object.freeze({
 career:{name:'Career transition',stages:['See Clearly','Explore','Prototype','Decide','Leap']},
 crisis:{name:'Crisis companion',stages:['Holding','Grounding','Seeing','Rising']},
 startup:{name:'Startup mentor',stages:['Product','Cognition','Execution','Mental Strength']},
 spiritual:{name:'Spiritual guide',stages:['Scattered Mind','Settling','Focused','Bodhicitta','Emptiness View']}
});
export const DEFAULT_WEIGHTS=Object.freeze({monetary:.35,time:.25,leverage:.25,stress:.15,riskTolerance:.6,cognitiveLoad:.8,optionality:.4});
export const MIMO_PROMPTS=Object.freeze([
 'Describe a real turning point. What choices did you actually have?',
 'What did you decide and what did that choice cost you?',
 'Looking back, what were you protecting, and how do you feel about the decision now?',
 'Describe another concrete choice, preferably one in a different situation.',
 'What did you choose, give up, and learn from that second experience?',
 'Is there a time you chose differently or a counterexample to your emerging pattern?',
 'What life do you want to build, and which principles are worth a real cost to protect?'
]);
const finite=(x,name)=>{if(typeof x!=='number'||!Number.isFinite(x))throw new TypeError(name+' must be a finite number');return x;};
const probability=(x,name)=>{finite(x,name);if(x<0||x>1)throw new RangeError(name+' must be in [0,1]');return x;};
export function createPersonalRecord(){return {schema:'automind.personal.v1',version:1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),consented:false,displayName:'',mimo:{answers:[],selfManual:{values:[],direction:'',coreTension:'',userCorrections:''}},vault:Object.fromEntries(VAULT_DOCUMENTS.map(k=>[k,''])),decisions:[],coachSessions:[],goals:[]};}
export function validateRecord(record){if(!record||record.schema!=='automind.personal.v1'||!Array.isArray(record.mimo?.answers)||!record.vault||!Array.isArray(record.decisions)||!Array.isArray(record.goals))throw new TypeError('Unsupported personal record');return record;}
export function writeAnswer(record,index,answer){validateRecord(record);if(!Number.isInteger(index)||index<0||index>=MIMO_PROMPTS.length)throw new RangeError('Unknown MIMO prompt');if(typeof answer!=='string')throw new TypeError('Answer must be text');const next=structuredClone(record);next.mimo.answers[index]=answer;next.updatedAt=new Date().toISOString();return next;}
export function updateDocument(record,name,content){validateRecord(record);if(!VAULT_DOCUMENTS.includes(name)||typeof content!=='string')throw new TypeError('Unsupported MYLIFE document');const next=structuredClone(record);next.vault[name]=content;next.updatedAt=new Date().toISOString();return next;}
export function updateSelfManual(record,patch){validateRecord(record);const allowed=['values','direction','coreTension','userCorrections'];if(!patch||Object.keys(patch).some(k=>!allowed.includes(k)))throw new TypeError('Invalid self-manual change');const next=structuredClone(record);for(const [key,val] of Object.entries(patch)){if(key==='values'?!Array.isArray(val)||!val.every(v=>typeof v==='string'):typeof val!=='string')throw new TypeError('Invalid manual field: '+key);next.mimo.selfManual[key]=val;}next.updatedAt=new Date().toISOString();return next;}
export function evaluateAction(action,weights=DEFAULT_WEIGHTS){
 if(!action||!Array.isArray(action.outcomes)||!action.outcomes.length||!Array.isArray(action.failureModes))throw new TypeError('Action needs outcomes and failure modes');
 for(const [k,v] of Object.entries(weights))finite(v,'weight '+k);
 let expectedValue=0;
 for(const o of action.outcomes){probability(o.probability,'outcome probability');expectedValue+=o.probability*(weights.monetary*finite(o.monetaryImpact,'monetaryImpact')+weights.time*finite(o.timeDelta,'timeDelta')+weights.leverage*finite(o.leverageCreated,'leverageCreated')+weights.stress*finite(o.stressReduction,'stressReduction'));}
 const totalP=action.outcomes.reduce((s,o)=>s+o.probability,0);
 if(totalP>1.000001)throw new RangeError('Combined outcome probabilities exceed 1');
 let risk=0,irreversibleRisk=0;
 for(const f of action.failureModes){probability(f.probability,'failure probability');finite(f.downsideMagnitude,'downsideMagnitude');if(f.downsideMagnitude<0)throw new RangeError('downsideMagnitude must be nonnegative');risk+=f.probability*f.downsideMagnitude*(f.isReversible?1:3);if(!f.isReversible)irreversibleRisk+=f.probability*f.downsideMagnitude;}
 const cognitiveLoad=.4*probability(action.informationRequired,'informationRequired')+.35*finite(action.stateSwitches,'stateSwitches')/10+.25*probability(action.emotionalVolatility,'emotionalVolatility');
 if(action.stateSwitches<0||action.futureOptionsCreated<0)throw new RangeError('Counts must be nonnegative');
 const optionality=Math.log(1+finite(action.futureOptionsCreated,'futureOptionsCreated'));
 const masterScore=expectedValue-weights.riskTolerance*risk-weights.cognitiveLoad*cognitiveLoad+weights.optionality*optionality;
 const reversible=irreversibleRisk<.1;
 // Preserve original Pocket Sage threshold ordering, including its "abort" catch-all.
 let recommendation='abort',explanation='Risk or cost outweighs expected value. Not worth pursuing.';
 if(masterScore>.7&&reversible){recommendation='proceed';explanation='High value, manageable risk, reversible. Move forward.';}
 else if(masterScore>.3&&!reversible){recommendation='prepare';explanation='Good potential, but irreversible elements. Stage carefully.';}
 else if(masterScore>0&&masterScore<=.3){recommendation='reconsider';explanation='Marginal value. Worth exploring alternatives first.';}
 const maxProbability=Math.max(...action.outcomes.map(o=>o.probability));
 return {actionId:action.id,expectedValue,risk,cognitiveLoad,optionality,masterScore,recommendation,explanation,confidenceLevel:maxProbability>.7?.9:maxProbability>.5?.7:.5,assumptions:{outcomeProbabilitySum:totalP,irreversibleRisk,reversibilityGate:reversible}};
}
export function evaluateOptions(actions,weights=DEFAULT_WEIGHTS){if(!Array.isArray(actions)||!actions.length)throw new TypeError('Provide an action');return actions.map(a=>evaluateAction(a,weights)).sort((a,b)=>b.masterScore-a.masterScore);}
export function addDecision(record,action,result){validateRecord(record);const next=structuredClone(record);next.decisions.push({at:new Date().toISOString(),action,result});next.updatedAt=new Date().toISOString();return next;}
export function addGoal(record,text){validateRecord(record);if(typeof text!=='string'||!text.trim())throw new TypeError('Goal required');const next=structuredClone(record);next.goals.push({id:globalThis.crypto?.randomUUID?.()??String(Date.now()),text:text.trim(),status:'planned'});next.updatedAt=new Date().toISOString();return next;}
export function markGoal(record,id,status){validateRecord(record);if(!['planned','active','complete'].includes(status))throw new RangeError('Unknown status');const next=structuredClone(record);const goal=next.goals.find(x=>x.id===id);if(!goal)throw new RangeError('Unknown goal');goal.status=status;next.updatedAt=new Date().toISOString();return next;}
