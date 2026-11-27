// Persistent trigger preferences and a single shared teacher transport.
export const TEACHER_SETTINGS_KEY='synthia-teacher-settings';
const modes=new Set(['place','instruction','both']);
export function readTeacherSettings(storage){
  let s={};try{s=JSON.parse(storage.getItem(TEACHER_SETTINGS_KEY)||'{}')||{};}catch{}
  return {mode:modes.has(s.mode)?s.mode:'both',instruction:typeof s.instruction==='string'?s.instruction:''};
}
export function writeTeacherSettings(storage,settings){
  const s={mode:modes.has(settings.mode)?settings.mode:'both',instruction:String(settings.instruction??'')};
  storage.setItem(TEACHER_SETTINGS_KEY,JSON.stringify(s));return s;
}
export function teacherAllowed(enabled,mode,trigger){return !!enabled&&(trigger==='place'||trigger==='instruction')&&(mode==='both'||mode===trigger);}
// Avoid concurrent calls to a lazily loaded model. A stopped caller is skipped before inference.
export function serialTeacher(teacher){let tail=Promise.resolve();return (prompt,signal)=>{const job=tail.then(()=>{if(signal?.aborted)throw Error('Stopped before teacher inference');return teacher(prompt);});tail=job.catch(()=>{});return job;};}
