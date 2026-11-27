// Dialogue transport only. A teacher supplies lessons and proposed observable goals;
// the existing organism owns all construction, action, evaluation and retention.
import { initialGameState, engineActions } from './gameenginex_morph.js';
const visible = ({position,velocity,drives}) => ({position,velocity,drives});
const fields = Object.keys(visible(initialGameState())).flatMap(k=>Object.keys(initialGameState()[k]).map(p=>`${k}.${p}`));
function parse(text) {
  const s=String(text).trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
  const x=JSON.parse(s);
  if(!x || typeof x.lesson!=='string'||!x.lesson.trim()||x.lesson.length>2000||Object.keys(x).some(k=>!['lesson','constraints'].includes(k))) throw Error('Expected lesson and observable constraints only');
  if(!Array.isArray(x.constraints)||!x.constraints.length||x.constraints.length>8) throw Error('No measurable objective');
  for(const c of x.constraints){if(!Array.isArray(c.path)||!fields.includes(c.path.join('.'))||c.path.length!==2||Object.keys(c).length!==2||!['equals','minimum','maximum'].some(k=>Object.hasOwn(c,k)&&typeof c[k]==='number'&&Number.isFinite(c[k])))throw Error('Invalid observable constraint');}
  return x;
}
export async function teachMission({instruction, teacher, habitat, onEvent=()=>{}, signal, maxTurns=3, initial=initialGameState()}) {
  if(typeof instruction!=='string'||!instruction.trim()||!teacher||!habitat)throw Error('Instruction, teacher and existing habitat required');
  const events=[];const emit=e=>{events.push(e);onEvent(e);};
  const stopped=()=>signal?.aborted;
  let goal=null, feedback=null;
  for(let i=0;i<Math.min(5,Math.max(1,maxTurns));i++){
    if(stopped())return {status:'stopped',events};
    const prompt=`You are a teacher, not an executor. The learner chooses its own operations. User request: ${JSON.stringify(instruction)}. Observable initial state: ${JSON.stringify(visible(initial))}. Available operation types: ${[...new Set(engineActions().map(a=>a.type))].join(', ')}. Observable paths: ${fields.join(', ')}. ${goal?'Fixed objective (do not change): '+JSON.stringify(goal)+'.':'Translate the request into measurable numeric state constraints only if it is supported by these observations.'} ${feedback?'Last observation: '+JSON.stringify(feedback):''} Reply with ONLY JSON: {"lesson":"short conceptual instruction, no action sequence or code","constraints":[{"path":["state field","component"],"equals":0}]}. Use equals, minimum or maximum. If unsupported, say so in the lesson and return an empty constraints array. Do not claim execution. `;
    emit({kind:'asking',turn:i+1});
    let proposal,raw;
    try {raw=await teacher(prompt);}catch(e){emit({kind:'teacher-unavailable',turn:i+1,error:String(e.message)});return {status:'teacher-unavailable',goal,events};}
    if(stopped())return {status:'stopped',events};
    try {emit({kind:'teacher',turn:i+1,text:String(raw)});proposal=parse(raw);}catch(e){feedback={error:String(e.message)};emit({kind:'rejected',turn:i+1,...feedback});continue;}
    if(goal&&JSON.stringify(proposal.constraints)!==JSON.stringify(goal)){feedback={error:'Teacher attempted to change the established objective'};emit({kind:'rejected',turn:i+1,...feedback});continue;}
    goal??=proposal.constraints;
    // The model cannot supply actions, code, initial state, checks or a plan.
    const read=habitat.teach(proposal.lesson);emit({kind:'read',turn:i+1,lines:read.lines,gaps:read.gaps.length});
    try {const r=habitat.develop({name:instruction.slice(0,160),cases:[{initial,constraints:goal}]});feedback={integrated:r.integrated,learnerQuestions:read.gaps.slice(0,3).map(g=>g.line),steps:r.steps.map(s=>({step:s.step,reason:s.reason,by:s.by,casesMet:s.casesMet,checkWithSwarmGone:s.checkWithSwarmGone})),outcomes:r.results?.map(x=>({passed:x.passed,state:visible(x.state)}))};emit({kind:'observation',turn:i+1,...feedback});
      if(r.integrated&&r.results?.every(x=>x.passed))return {status:'proposed-objective-met',goal,events};
      if(r.steps.some(s=>s.step==='nothing-needed'))return {status:'already-satisfied',goal,events};
    }catch(e){feedback={error:String(e.message)};emit({kind:'error',turn:i+1,...feedback});}
  }
  return {status:'unresolved',goal,events};
}
