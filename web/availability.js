'use strict';
// The editor and main process share this calendar/interval logic. No browser-local
// timezone, network service or imported source identity is used as an assumption.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Availability=factory();})(globalThis,()=>{
 const Records=typeof module==='object'&&module.exports?require('./record-recovery.js'):globalThis.RecordRecovery;
 const DAY=86400000,MINUTE=60000,ID=/^[a-zA-Z0-9_.-]{1,100}$/,TIME=/^(?:[01]\d|2[0-3]):[0-5]\d$/;
 const copy=x=>JSON.parse(JSON.stringify(x)),dateOK=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&s>='1900-01-01'&&s<='2100-12-31'&&Number.isFinite(Date.parse(s+'T12:00Z'))&&new Date(s+'T12:00Z').toISOString().slice(0,10)===s;
 const addDate=(s,n)=>new Date(Date.parse(s+'T12:00Z')+n*DAY).toISOString().slice(0,10);
 const formatters=new Map(),epochCache=new Map();
 function zoneOK(zone){try{formatter(zone);return typeof zone==='string'&&!!zone;}catch{return false;}}
 function formatter(zone){if(typeof zone!=='string'||!zone)throw Error('Timezone required');if(!formatters.has(zone)){if(formatters.size>128)formatters.clear();formatters.set(zone,new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}));}return formatters.get(zone);}
 function parts(ms,zone){const p=Object.fromEntries(formatter(zone).formatToParts(new Date(ms)).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));return {date:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`,second:p.second,serial:Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second)};}
 function epoch(date,time,zone){
  if(!dateOK(date)||!TIME.test(time)||!zoneOK(zone))return null;const key=zone+'|'+date+'|'+time;if(epochCache.has(key))return epochCache.get(key);
  const target=Date.parse(date+'T'+time+':00Z'),offsets=new Set();for(let h=-36;h<=36;h+=6){const ms=target+h*3600000;offsets.add(parts(ms,zone).serial-ms);}
  const matches=[...offsets].map(o=>target-o).filter(ms=>parts(ms,zone).serial===target),value=matches.length===1?matches[0]:null;if(epochCache.size>4096)epochCache.clear();epochCache.set(key,value);return value;
 }
 function validateRecord(record){
  if(!record||typeof record!=='object'||Array.isArray(record)||!['unknown','all-day','on-call','unavailable','windows'].includes(record.state)||!Array.isArray(record.windows)||record.windows.length>12||Object.keys(record).some(k=>!['state','windows'].includes(k)))throw Error('Invalid availability entry.');
  if(record.state==='windows'&&!record.windows.length||record.state!=='windows'&&record.windows.length)throw Error('Enter at least one time window, or choose another availability state.');
  for(const w of record.windows){if(!w||Object.keys(w).some(k=>!['start','end','nextDay'].includes(k))||!TIME.test(w.start)||!TIME.test(w.end)||typeof w.nextDay!=='boolean'||!w.nextDay&&w.end<=w.start||w.nextDay&&w.end>w.start)throw Error('Availability windows must be positive and no longer than 24 hours. Use next day for an overnight end.');}
  return record;
 }
 function validate(project){const a=project.availability;if(a===undefined)return;if(!a||a.schema!==1||!a.byPerson||typeof a.byPerson!=='object'||Array.isArray(a.byPerson)||Object.keys(a).some(k=>!['schema','byPerson'].includes(k))||Object.keys(a.byPerson).length>3000)throw Error('Invalid availability register.');
  // Orphaned person IDs are retained for recovery, never reassigned by row index.
  for(const [id,dates] of Object.entries(a.byPerson)){if(!ID.test(id)||!dates||typeof dates!=='object'||Array.isArray(dates)||Object.keys(dates).length>3000)throw Error('Invalid person availability.');for(const [date,record] of Object.entries(dates)){if(!dateOK(date))throw Error('Invalid availability date.');validateRecord(record);}}
 }
 const record=(project,id,date)=>project.availability?.byPerson?.[id]?.[date]||{state:'unknown',windows:[]};
 const hasData=p=>Object.values(p.availability?.byPerson||{}).some(d=>Object.keys(d).length);
 function set(project,id,date,value){if(typeof id!=='string'||!ID.test(id)||['__proto__','prototype','constructor'].includes(id)||!dateOK(date))throw Error('Choose a valid person and date.');if(value!==null)validateRecord(value);const before=project.availability?.byPerson?.[id]?.[date];project.availability||={schema:1,byPerson:{}};project.availability.byPerson[id]||={};if(!value||value.state==='unknown')delete project.availability.byPerson[id][date];else project.availability.byPerson[id][date]=copy(value);return before?copy(before):null;}
 function summary(r){return r.state==='on-call'?'O/C — On Call (available, not on set)':r.state==='all-day'?'All day':r.state==='unavailable'?'Unavailable':r.state==='unknown'?'Unknown / not entered':'Restricted · '+r.windows.map(w=>`${w.start}–${w.end}${w.nextDay?' (+1 day)':''}`).join(', ');}
 function dayZone(p,d){const v={...p.defaults,...d.overrides},loc=p.locations.find(l=>l.id===v.primaryLocationId);return Object.hasOwn(d.overrides,'zone')?v.zone:loc?.zone||v.zone;}
 function duty(p,d,person){
  const zone=dayZone(p,d),call=d.calls.find(c=>c.personId===person.id),reasons=[],starts=[],ends=[],sceneMap=new Map(p.scenes.map(s=>[s.id,s]));let scheduled=false;
  if(!dateOK(d.date)||!zoneOK(zone))return {reasons:['Set a valid shooting date and shooting-day timezone.'],start:null,end:null,zone};
  const date=addDate(d.date,call?.offset||0),callTime=call?(call.call||({...p.defaults,...d.overrides}).generalCall):'';let callStart=null;
  function addStart(date,time){if(!time)return null;const ms=epoch(date,time,zone);if(ms===null)reasons.push('A local time is skipped or repeated by daylight saving; review it.');else starts.push(ms);return ms;}
  if(call){if(TIME.test(callTime)){callStart=addStart(date,callTime);for(const k of ['pickup','makeup','wardrobe','block','ready'])if(call[k])addStart(date,call[k]);}else reasons.push('Call time not entered.');}else reasons.push('Personal call not entered; timed scene assignments are still checked.');
  for(const s of d.schedule){if(person.type==='crew'&&call?.loseAt)continue;if(person.type==='cast'&&!(s.type==='scene'&&sceneMap.get(s.sceneId)?.castIds.includes(person.id)))continue;if(!s.start){if(s.type==='scene')reasons.push('A scheduled scene has no start time.');continue;}const start=person.type==='crew'&&callStart!==null?epoch(addDate(d.date,s.offset||0),s.start,zone):addStart(addDate(d.date,s.offset||0),s.start);if(start===null)reasons.push('A scheduled local time is skipped or repeated by daylight saving.');if(start!==null){if(s.type==='scene'&&s.duration===0)reasons.push('A scheduled scene has zero/unknown duration; review its end time.');ends.push(start+s.duration*MINUTE);scheduled=true;}}
  // Crew release is explicit when supplied; otherwise their duty includes the
  // estimated wrap and all timed work. Cast includes all assigned scene work.

  const endTime=call?.loseAt||((person.type==='crew'||!scheduled)?({...p.defaults,...d.overrides}).wrap:'');
  if(endTime&&callStart!==null){let endDate=date;if(endTime<callTime)endDate=addDate(endDate,1);const end=epoch(endDate,endTime,zone);if(end===null)reasons.push('Release/wrap time is skipped or repeated by daylight saving.');else ends.push(end);}
  if(!starts.length)return {start:null,end:null,reasons:[...new Set([...reasons,'No usable call or scheduled time.'])],zone};
  const start=Math.min(...starts);let end=ends.length?Math.max(...ends,start):start;if(!ends.length)reasons.push('Release/end time not entered; only the start can be checked.');
  return {start,end,reasons:[...new Set(reasons)],zone,point:end===start};
 }
 function mergeIntervals(intervals){const out=[];for(const [a,b] of intervals.sort((x,y)=>x[0]-y[0])){if(out.length&&a<=out.at(-1)[1])out.at(-1)[1]=Math.max(b,out.at(-1)[1]);else out.push([a,b]);}return out;}
 function covered(start,end,intervals){let at=start;for(const [a,b] of mergeIntervals(intervals)){if(b<=at)continue;if(a>at)return false;at=Math.max(at,b);if(at>=end)return true;}return false;}
 function allowed(p,id,date,zone){const r=record(p,id,date),previous=record(p,id,addDate(date,-1)),intervals=[];let uncertain=false;
  const carry=previous.state==='windows'?previous.windows.filter(w=>w.nextDay):[],label=summary(r)+(r.state!=='unavailable'&&carry.length?'; carry-in from '+addDate(date,-1)+': '+summary({state:'windows',windows:carry}):'');
  const restricted=r.state==='windows'||r.state==='unknown'&&carry.length>0;
  const begin=epoch(date,'00:00',zone),finish=epoch(addDate(date,1),'00:00',zone);if(begin===null||finish===null)return {r,label,restricted,intervals,uncertain:true,begin,finish};
  if(r.state==='unavailable')return {r,label,restricted,intervals,uncertain:false,begin,finish};
  if(r.state==='all-day'||r.state==='on-call')intervals.push([begin,finish]);
  for(const [entry,on] of [[previous,addDate(date,-1)],[r,date]])if(entry.state==='windows')for(const w of entry.windows){if(on!==date&&!w.nextDay)continue;const a=epoch(on,w.start,zone),b=epoch(w.nextDay?addDate(on,1):on,w.end,zone);if(a===null||b===null){uncertain=true;continue;}if(b>begin&&a<finish)intervals.push([Math.max(a,begin),Math.min(b,finish)]);}
  return {r,label,restricted,intervals,uncertain,begin,finish};
 }
 function stamp(ms,zone){const p=parts(ms,zone);return p.date+' '+p.time+(p.second!=='00'?':'+p.second:'');}
 function assess(p,d,person){const zone=p.defaults.zone,range=duty(p,d,person),name=person.name||person.character||('Unnamed '+person.type),conflicts=[],onCallDates=[],restrictedDates=[],unknown=[...range.reasons];
  if(!zoneOK(zone))unknown.push('Set the production default timezone before checking availability.');
  if(range.start===null||!zoneOK(zone))return {personId:person.id,name,status:'unknown',conflicts,unknown,message:`${name}: availability unknown. ${[...new Set(unknown)].join(' ')}`,range};
  let date=parts(range.start,zone).date;const last=parts(range.end===range.start?range.end:range.end-1,zone).date;
  for(let count=0;date<=last&&count<8;date=addDate(date,1),count++){
   const a=allowed(p,person.id,date,zone);if(a.begin===null||a.finish===null){unknown.push(date+': ambiguous local midnight.');continue;}
   if(a.r.state==='on-call')onCallDates.push(date);if(a.restricted)restrictedDates.push(date);
   const start=Math.max(range.start,a.begin),end=Math.min(range.point?range.start+1:range.end,a.finish);if(covered(start,end,a.intervals))continue;
   if(a.r.state==='unknown'||a.uncertain)unknown.push(date+(a.uncertain?': an availability boundary is skipped or repeated by daylight saving; review the time.':': availability not entered.'));else conflicts.push({date,start,end,allowed:a.label});
  }
  const assigned=`${stamp(range.start,zone)}${range.point?'':' → '+stamp(range.end,zone)} (${zone})`,status=conflicts.length?'conflict':unknown.length?'unknown':'available';
  const message=conflicts.length?`${name}: outside recorded availability. Assigned ${assigned}. ${conflicts.map(c=>c.allowed==='Unavailable'?`${c.date}: Unavailable all day.`:`${c.date}: allowed ${c.allowed}.`).join(' ')}${unknown.length?' Some remaining times are unknown.':''}`:status==='unknown'?`${name}: availability unknown. Assigned ${assigned}. ${[...new Set(unknown)].join(' ')}`:`${name}: available for ${assigned}.`;
  return {personId:person.id,name,status,conflicts,onCallDates,restrictedDates,unknown:[...new Set(unknown)],message:message+(restrictedDates.length?' Restricted time windows on '+restrictedDates.join(', ')+'.':'')+(onCallDates.length?' O/C — On Call (available, not on set) on '+onCallDates.join(', ')+'. Attendance and call times are unchanged.':''),range};
 }
 function assessDay(p,d){if(!d)return [];const ids=new Set(d.calls.map(c=>c.personId));for(const s of d.schedule)if(s.type==='scene')p.scenes.find(sc=>sc.id===s.sceneId)?.castIds.forEach(id=>ids.add(id));return p.people.filter(person=>ids.has(person.id)&&!Records.deleted(p,'people',person.id)).map(person=>assess(p,d,person));}
 function span(p){const dates=p.days.map(d=>d.date).filter(dateOK),zone=p.defaults.zone;
  if(zoneOK(zone))for(const d of p.days){if(!dateOK(d.date))continue;const localZone=dayZone(p,d);if(!zoneOK(localZone))continue;const values={...p.defaults,...d.overrides};
   const include=ms=>{if(ms!==null)dates.push(parts(ms,zone).date);};
   for(const s of d.schedule){const start=epoch(addDate(d.date,s.offset||0),s.start,localZone);include(start);if(start!==null)include(start+s.duration*MINUTE);}
   for(const c of d.calls.filter(c=>!Records.deleted(p,'people',c.personId))){const on=addDate(d.date,c.offset||0),time=c.call||values.generalCall,start=epoch(on,time,localZone);include(start);const end=c.loseAt||values.wrap;if(start!==null&&TIME.test(end))include(epoch(end<time?addDate(on,1):on,end,localZone));}
  }
  if(!dates.length)for(const [id,days] of Object.entries(p.availability?.byPerson||{}))if(!Records.deleted(p,'people',id))dates.push(...Object.keys(days).filter(dateOK));dates.sort();const today=zoneOK(zone)?parts(Date.now(),zone).date:new Date().toISOString().slice(0,10);return {start:dates[0]||today,end:dates.at(-1)||today};
 }

 const hasOnCall=p=>Object.values(p.availability?.byPerson||{}).some(d=>Object.values(d).some(r=>r.state==='on-call'));
 return {hasOnCall,dateOK,addDate,zoneOK,epoch,parts,validate,validateRecord,record,set,summary,hasData,dayZone,duty,assess,assessDay,span};
});
