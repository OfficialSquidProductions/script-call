'use strict';
// Production Desk MIT-licensed v1 model validator, unchanged from film-native.js.
// Source snapshot: ../production-desk; see THIRD_PARTY_NOTICES.md.
function validateUSS(p) {
  const fail=message=>{throw Error(message);},object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
  if(!object(p))fail('USS must contain a universalScheduleStandard object.');
  for(const key of ['id','created','name','source','ussVersion'])if(typeof p[key]!=='string'||!p[key])fail('Missing USS string: '+key);
  if(p.ussVersion!=='1.0.0')fail('This app supports USS 1.0.0. This file uses '+p.ussVersion);
  if(p._sourceScript!=null&&(!object(p._sourceScript)||typeof p._sourceScript.filename!=='string'||typeof p._sourceScript.text!=='string'||new TextEncoder().encode(p._sourceScript.text).length>40*1024*1024))fail('Invalid embedded source script.');
  const collections=['breakdowns','categories','elements','stripboards','calendars'];
  for(const key of collections){if(!(key in p)&&['stripboards','calendars'].includes(key))p[key]=[];if(!Array.isArray(p[key]))fail('USS '+key+' must be an array.');}
  const all=new Set();
  function checkID(o){if(!object(o)||typeof o.id!=='string'||!o.id)fail('Every USS object requires a string id.');if(all.has(o.id))fail('Duplicate USS id: '+o.id);all.add(o.id);}
  checkID(p);collections.forEach(key=>p[key].forEach(checkID));
  const cats=new Set(p.categories.map(c=>c.id)),elements=new Set(p.elements.map(e=>e.id)),breakdowns=new Set(p.breakdowns.map(b=>b.id)),calendars=new Set(p.calendars.map(c=>c.id));
  for(const c of p.categories)if(!Number.isInteger(c.ucid)||typeof c.name!=='string')fail('Categories require a name and integer ucid.');
  for(const e of p.elements)if(!cats.has(e.category)||typeof e.name!=='string')fail('Element has an invalid category or name.');
  for(const b of p.breakdowns){
    if(!['scene','banner'].includes(b.type)||!Array.isArray(b.elements))fail('Invalid breakdown type or elements.');
    if(b.elements.some(e=>!elements.has(e)))fail('Breakdown references an unknown element.');
    if(b._stripColor!=null&&(typeof b._stripColor!=='string'||!/^#[0-9a-fA-F]{6}$/.test(b._stripColor)))fail('Strip color must be a six-digit hex color or null.');
    for(const key of ['pages','duration'])if(b[key]!=null&&(typeof b[key]!=='number'||!Number.isFinite(b[key])||b[key]<0))fail('Breakdown '+key+' must be a nonnegative number or null.');
  }
  for(const c of [...p.calendars,...p.elements]){
    const days=c.daysOff??[];
    if(!Array.isArray(days)||days.some(d=>!Number.isInteger(d)||d<0||d>6)||new Set(days).size!==days.length)fail('daysOff must contain distinct weekdays from 0 through 6.');
    const events=c.events??[];if(!Array.isArray(events))fail('Events must be an array.');
    for(const event of events){checkID(event);if(!['start','dayOff','event'].includes(event.type))fail('Unknown calendar event type.');if(typeof event.date!=='string'||!/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(event.date)||!Number.isFinite(Date.parse(event.date)))fail('Invalid event date.');const day=event.date.slice(0,10);if(new Date(day+'T12:00:00Z').toISOString().slice(0,10)!==day)fail('Invalid event date.');}
  }
  for(const s of p.stripboards){
    if(s.calendar!=null&&!calendars.has(s.calendar))fail('Stripboard references an unknown calendar.');
    if(!Array.isArray(s.boards))fail('Stripboard boards must be an array.');
    const seen=[];
    for(const b of s.boards){checkID(b);if(!Array.isArray(b.breakdownIds))fail('Board breakdownIds must be an array.');for(const group of b.breakdownIds){const ids=Array.isArray(group)?group:[group];if(ids.some(x=>typeof x!=='string'||!breakdowns.has(x)))fail('Board references an unknown breakdown.');seen.push(...ids);}}
    if(seen.length!==new Set(seen).size||seen.length!==breakdowns.size||[...breakdowns].some(id=>!seen.includes(id)))fail('Each scenario must contain every breakdown exactly once across its boards.');
  }
  const shots=p._shots??[],sceneIDs=new Set(p.breakdowns.filter(b=>b.type==='scene').map(b=>b.id)),numbers=new Set();
  if(!Array.isArray(shots))fail('Shot list must be an array.');
  for(const shot of shots){
    checkID(shot);if(!sceneIDs.has(shot.sceneId))fail('Shot references an unknown scene.');
    for(const key of ['number','description','size','movement','camera','lens','equipment','notes','circleTake'])if(typeof shot[key]!=='string')fail('Shot '+key+' must be text.');
    const number=shot.number.trim();if(!number||number.length>24)fail('Shot number must contain 1 through 24 characters.');
    const pair=JSON.stringify([shot.sceneId,number.toLowerCase()]);if(numbers.has(pair))fail('Duplicate shot number in the same scene.');numbers.add(pair);
    if(!['Planned','Ready','Rolling','Done','Omitted'].includes(shot.status))fail('Unknown shot status.');
    if(!['Essential','Preferred','Optional'].includes(shot.priority))fail('Unknown shot priority.');
    for(const [key,max] of [['setupMinutes',1440],['shootMinutes',1440],['actualMinutes',10080],['takes',10000]]){if(key==='actualMinutes'&&shot[key]===null)continue;if(!Number.isInteger(shot[key])||shot[key]<0||shot[key]>max)fail('Shot '+key+' must be a whole number from 0 through '+max+'.');}
  }
  const settings=p._shotSettings??{startTime:'07:00'};if(!object(settings)||typeof settings.startTime!=='string'||!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(settings.startTime))fail('Shot start time must use HH:MM.');
  return p;
}

module.exports={validateUSS};
