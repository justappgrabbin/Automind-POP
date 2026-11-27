import assert from 'node:assert/strict';
import {readTeacherSettings,writeTeacherSettings,teacherAllowed,serialTeacher} from './teacher_settings.js';
const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
assert.deepEqual(readTeacherSettings(storage),{mode:'both',instruction:''});
writeTeacherSettings(storage,{mode:'instruction',instruction:'learn to move'});
assert.deepEqual(readTeacherSettings(storage),{mode:'instruction',instruction:'learn to move'});
writeTeacherSettings(storage,{mode:'both',instruction:'new instruction'});assert.equal(readTeacherSettings(storage).instruction,'new instruction');
for(const mode of ['place','instruction','both'])for(const trigger of ['place','instruction']){assert.equal(teacherAllowed(true,mode,trigger),mode==='both'||mode===trigger);assert.equal(teacherAllowed(false,mode,trigger),false);}
let active=0,calls=[];const teach=serialTeacher(async p=>{assert.equal(active++,0);calls.push(p);await Promise.resolve();active--;return p;});
const a=teach('place'),b=teach('user');assert.deepEqual(await Promise.all([a,b]),['place','user']);assert.deepEqual(calls,['place','user']);
const abort=new AbortController();abort.abort();await assert.rejects(teach('stopped',abort.signal),/Stopped/);assert.equal(await teach('next'),'next');assert.deepEqual(calls,['place','user','next']);
console.log('PASS: persistent editable instructions, independent modes, teacher off, serialized transport, cancellation and reuse');
