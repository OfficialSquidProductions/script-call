'use strict';
const crypto=require('node:crypto');
const SunCalc=require('suncalc');
const Availability=require('../web/availability.js');
const Days=require('../web/day-management.js');
const Records=require('../web/record-recovery.js');
const id=()=>crypto.randomUUID();
const clone=x=>JSON.parse(JSON.stringify(x));
const hash=x=>crypto.createHash('sha256').update(typeof x==='string'||Buffer.isBuffer(x)?x:JSON.stringify(x)).digest('hex');
const SHEET_FIELDS=['header','director','producer','upm','firstAD','secondAD','breakfast','shootingCall','scriptColor','scheduleColor','safety','walkies','departmentNotes','basecamp','hospitalNotes','parkingNotes','high','low','weatherIcon'];
const sheetDefaults=()=>Object.fromEntries(SHEET_FIELDS.map(k=>[k,k==='safety'?'SAFETY FIRST | NO SMOKING ON SET | CHECK IN WITH PRODUCTION':k==='weatherIcon'?'None':'']));
const ORDER=['logistics','schedule','cast','crew','notes','advance'];
const ID=/^[a-zA-Z0-9_.-]{1,100}$/;
const TIME=/^(?:[01]\d|2[0-3]):[0-5]\d$/;
const okDate=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number(x.slice(0,4))>=1900&&Number(x.slice(0,4))<=2100&&Number.isFinite(Date.parse(x+'T12:00Z'))&&new Date(x+'T12:00Z').toISOString().slice(0,10)===x;
const okZone=x=>{try{new Intl.DateTimeFormat('en',{timeZone:x}).format();return typeof x==='string'&&x.length>0;}catch{return false;}};
function guard(value,depth=0){
 if(depth>16)throw Error('Project nesting is too deep.');
 if(value===null||typeof value==='boolean')return;
 if(typeof value==='number'){if(!Number.isFinite(value))throw Error('Invalid numeric value.');return;}
 if(typeof value==='string'){if(value.length>100000)throw Error('A project field is too large.');return;}
 if(Array.isArray(value)){if(value.length>3000)throw Error('Too many project records.');value.forEach(x=>guard(x,depth+1));return;}
 if(!value||typeof value!=='object')throw Error('Invalid project value.');
 for(const [k,v] of Object.entries(value)){if(['__proto__','prototype','constructor'].includes(k))throw Error('Unsafe project key.');guard(v,depth+1);}
}
function records(list,label){
 if(!Array.isArray(list)||list.length>3000)throw Error('Invalid '+label+' list.');
 const ids=new Set();for(const r of list){if(!r||!ID.test(r.id)||ids.has(r.id))throw Error('Invalid or duplicate '+label+' ID.');ids.add(r.id);}return ids;
}
function validateProject(p){
 guard(p);Availability.validate(p);Records.validate(p);if(Buffer.byteLength(JSON.stringify(p))>10*1024*1024)throw Error('Project exceeds 10 MB.');
 if(p.schema!==1||!ID.test(p.id)||typeof p.title!=='string'||p.title.length>200||typeof p.company!=='string')throw Error('Unsupported or invalid project.');
 if(!p.defaults||['generalCall','zone','meal','wrap','primaryLocationId','notes'].some(k=>typeof p.defaults[k]!=='string'))throw Error('Missing production defaults.');
 const people=records(p.people,'person'),locations=records(p.locations,'location'),scenes=records(p.scenes,'scene');records(p.days,'day');if(p.deletedDays!==undefined)records(p.deletedDays,'deleted day');const allDays=[...p.days,...(p.deletedDays||[])];records(allDays,'day');
 for(const data of [p.sheetDefaults,...allDays.map(d=>d.sheetOverrides)])if(data){for(const [k,v] of Object.entries(data))if(!SHEET_FIELDS.includes(k)||typeof v!=='string')throw Error('Invalid call sheet field.');for(const k of ['breakfast','shootingCall'])if(data[k]&&!TIME.test(data[k]))throw Error('Invalid call sheet time.');for(const k of ['high','low'])if(data[k]&&!/^-?\d+(?:\.\d+)?$/.test(data[k]))throw Error('Enter a numeric temperature or leave it blank.');}
 for(const person of p.people){for(const k of ['diet','castNumber'])if(person[k]!==undefined&&typeof person[k]!=='string')throw Error('Invalid person detail.');for(const k of ['name','role','department','character','email','phone'])if(typeof person[k]!=='string')throw Error('Invalid person field: '+k);if(!['cast','crew'].includes(person.type))throw Error('Invalid person type.');}
 for(const loc of p.locations){for(const k of ['mapsUrl','parkingMapsUrl'])if(loc[k]!==undefined&&(typeof loc[k]!=='string'||loc[k].length>4096))throw Error('Invalid location map link.');for(const [k,max] of [['parkingLatitude',90],['parkingLongitude',180]])if(loc[k]!==undefined&&loc[k]!==null&&(!Number.isFinite(loc[k])||Math.abs(loc[k])>max))throw Error('Invalid parking coordinates.');for(const k of ['name','address','zone','parking','hospital','emergencyPhone'])if(typeof loc[k]!=='string')throw Error('Invalid location field: '+k);for(const [k,max] of [['latitude',90],['longitude',180]])if(loc[k]!==null&&(!Number.isFinite(loc[k])||Math.abs(loc[k])>max))throw Error('Invalid location coordinates.');}
 for(const s of p.scenes){for(const k of ['scriptDay','dayNight','notes'])if(s[k]!==undefined&&typeof s[k]!=='string')throw Error('Invalid scene detail.');if(typeof s.number!=='string'||typeof s.slug!=='string'||typeof s.synopsis!=='string'||!Number.isInteger(s.eighths)||s.eighths<0||s.eighths>8000||!Array.isArray(s.castIds)||s.castIds.some(v=>!people.has(v)))throw Error('Invalid scene data.');if(s.locationId&&!locations.has(s.locationId))throw Error('Scene refers to an unknown location.');}
 for(const d of allDays){
  if(typeof d.label!=='string'||typeof d.date!=='string'||typeof d.unit!=='string'||!d.overrides||!d.weather||!d.layout)throw Error('Invalid day.');
  if(!['manual','nws'].includes(d.weather.mode)||typeof d.weather.summary!=='string'||typeof d.weather.approved!=='boolean')throw Error('Invalid weather fields.');
  for(const k of Object.keys(d.overrides))if(!['generalCall','meal','wrap','primaryLocationId','zone','notes'].includes(k)||typeof d.overrides[k]!=='string')throw Error('Invalid day override.');
  for(const k of ['generalCall','meal','wrap'])if(d.overrides[k]&&!TIME.test(d.overrides[k]))throw Error('Use HH:MM for '+k+'.');
  records(d.schedule,'schedule item');records(d.calls,'call');
  for(const s of d.schedule){if(!['scene','meal','move','break','note'].includes(s.type)||typeof s.description!=='string'||typeof s.start!=='string'||(s.start&&!TIME.test(s.start))||!Number.isInteger(s.offset)||s.offset<0||s.offset>3||!Number.isFinite(s.duration)||s.duration<0||s.duration>1440)throw Error('Invalid schedule item.');if(s.type==='scene'&&!scenes.has(s.sceneId))throw Error('Schedule refers to an unknown scene.');}
  if(d.background){records(d.background,'background');for(const b of d.background)if(!['background','stand-in'].includes(b.type)||!Number.isInteger(b.quantity)||b.quantity<0||b.quantity>10000||['description','call','notes'].some(k=>typeof b[k]!=='string')||(b.call&&!TIME.test(b.call)))throw Error('Invalid background call.');}
  for(const call of d.calls){for(const k of ['status','block','wardrobe','loseAt'])if(call[k]!==undefined&&(typeof call[k]!=='string'||(['block','wardrobe','loseAt'].includes(k)&&call[k]&&!TIME.test(call[k]))))throw Error('Invalid cast detail.');if(!people.has(call.personId)||!Number.isInteger(call.offset)||call.offset<0||call.offset>3)throw Error('Call refers to an unknown person or day offset.');for(const k of ['call','pickup','makeup','ready'])if(typeof call[k]!=='string'||(call[k]&&!TIME.test(call[k])))throw Error('Invalid call time.');if(typeof call.notes!=='string')throw Error('Invalid call notes.');}
  if(new Set(d.calls.map(c=>c.personId)).size!==d.calls.length)throw Error('A person cannot have two calls on one day.');
  const l=d.layout;if(!['gcasper','compact','narrative','commercial'].includes(l.preset)||!['A4','Letter'].includes(l.paper)||!['24','12'].includes(l.clock)||!['C','F'].includes(l.temperature)||typeof l.mono!=='boolean'||typeof l.includeContacts!=='boolean')throw Error('Invalid layout choice.');
  if(!Array.isArray(l.order)||l.order.length!==ORDER.length||new Set(l.order).size!==ORDER.length||l.order.some(x=>!ORDER.includes(x)))throw Error('Invalid section order.');
  if(!Array.isArray(l.hidden)||l.hidden.some(x=>!ORDER.includes(x)||x==='logistics')||!Array.isArray(l.custom)||l.custom.length>20)throw Error('Invalid template sections.');
  if(l.sceneColors!==undefined&&typeof l.sceneColors!=='boolean')throw Error('Invalid scene color choice.');
  for(const c of l.custom)if(typeof c.title!=='string'||typeof c.text!=='string')throw Error('Invalid custom section.');
 }
 return p;
}
function defaultLayout(){return {preset:'gcasper',sceneColors:true,paper:'A4',clock:'24',temperature:'C',mono:false,includeContacts:false,order:ORDER.slice(),hidden:[],custom:[]};}
function newDay(p,date=Days.nextDayDate(p.days)){
 return {id:id(),label:'Day '+String(p.days.length+1).padStart(2,'0'),date,unit:'A',overrides:{},sheetOverrides:{},background:[],schedule:[],calls:[],weather:{mode:'manual',summary:'',approved:false},layout:p.days.length?clone(p.days.at(-1).layout):defaultLayout(),baseRevisionId:null};
}
function newProject(title='Untitled production'){
 const p={schema:1,id:id(),title,company:'',defaults:{generalCall:'07:00',meal:'12:30',wrap:'18:00',zone:Intl.DateTimeFormat().resolvedOptions().timeZone||'Etc/UTC',primaryLocationId:'',notes:''},sheetDefaults:sheetDefaults(),people:[],locations:[],scenes:[],days:[]};p.days.push(newDay(p));return p;
}
function localParts(ms,zone){const parts=new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(ms));return Object.fromEntries(parts.filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));}
function addDate(date,offset){if(!okDate(date))return '';return new Date(Date.parse(date+'T12:00Z')+offset*86400000).toISOString().slice(0,10);}
function candidates(date,time,zone){
 if(!okDate(date)||!TIME.test(time)||!okZone(zone))return [];
 const target=Date.parse(date+'T'+time+':00Z'),offsets=new Set();
 for(let h=-36;h<=36;h+=6){const ms=target+h*3600000,p=localParts(ms,zone);offsets.add(Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second)-ms);}
 return [...offsets].map(o=>target-o).filter(ms=>{const p=localParts(ms,zone);return Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second)===target;}).sort((a,b)=>a-b);
}
function weatherKey(d,loc,zone){return JSON.stringify([d.date,loc?.id,loc?.latitude,loc?.longitude,zone]);}
function solar(date,loc,zone){
 if(!okDate(date)||!okZone(zone)||!loc||loc.latitude===null||loc.longitude===null)return {status:'Enter coordinates and a valid date / timezone.'};
 const times=[];for(const off of [-1,0,1]){const x=addDate(date,off);for(const k of ['sunrise','sunset','dawn','dusk']){const v=SunCalc.getTimes(new Date(x+'T12:00Z'),loc.latitude,loc.longitude)[k];if(Number.isFinite(+v)){const p=localParts(+v,zone);if(`${p.year}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}`===date)times.push([k,v.toISOString()]);}}}
 const out={algorithm:'SunCalc 1.9.0',status:'Calculated offline',sunrise:null,sunset:null,dawn:null,dusk:null};for(const [k,v] of times)out[k]=v;
 if(!out.sunrise&&!out.sunset)out.status='No sunrise / sunset on this local date (polar conditions).';return out;
}
function resolve(p,dayId){
 const d=p.days.find(d=>d.id===dayId);if(!d)throw Error('Shooting day not found.');const values={...p.defaults,...d.overrides};
 const selected=p.locations.find(l=>l.id===values.primaryLocationId)||null,loc=selected&&!Records.deleted(p,'locations',selected.id)?selected:null;const zone=Object.hasOwn(d.overrides,'zone')?values.zone:selected?.zone||values.zone;
 const people=new Map(p.people.map(x=>[x.id,x])),scenes=new Map(p.scenes.map(x=>[x.id,x]));
 const weather=clone(d.weather);weather.stale=!!weather.key&&weather.key!==weatherKey(d,loc,zone)||weather.mode==='nws'&&Date.now()-Date.parse(weather.fetchedAt)>3600000;
 if(weather.stale)weather.approved=false;
 const activePeople=new Set(Records.active(p,'people').map(p=>p.id)),activeCalls=d.calls.filter(c=>activePeople.has(c.personId));
 const activeSchedule=d.schedule.filter(s=>s.type!=='scene'||!Records.deleted(p,'scenes',s.sceneId));
 const sceneCopy=s=>s?{...clone(s),castIds:s.castIds.filter(id=>activePeople.has(id))}:null;
 const calls=activeCalls.map(c=>({...clone(c),person:clone(people.get(c.personId)),call:c.call||values.generalCall,inherited:!c.call}));
 if(!d.layout.includeContacts)for(const c of calls){c.person.email='';c.person.phone='';}
 return {schema:1,importedFromProductionDesk:!!p.productionDesk,productionId:p.id,title:p.title,company:p.company,demo:!!p.demo,day:{...clone(d),calls:clone(activeCalls),schedule:clone(activeSchedule)},values:{...values,zone},location:clone(loc),schedule:activeSchedule.map(s=>({...clone(s),scene:s.type==='scene'?sceneCopy(scenes.get(s.sceneId)):null})),calls,weather,solar:solar(d.date,loc,zone),sheet:{...sheetDefaults(),...p.sheetDefaults,...d.sheetOverrides},dayNumber:p.days.indexOf(d)+1,totalDays:p.days.length,locations:clone(Records.active(p,'locations')),advanceSchedule:p.days[p.days.indexOf(d)+1]?.schedule.filter(s=>s.type==='scene'&&!Records.deleted(p,'scenes',s.sceneId)).map(s=>({...clone(s),scene:sceneCopy(scenes.get(s.sceneId))}))||[],advanceDay:p.days[p.days.indexOf(d)+1]?{label:p.days[p.days.indexOf(d)+1].label,date:p.days[p.days.indexOf(d)+1].date}:null,castNumbers:Object.fromEntries(p.people.filter(p=>p.type==='cast').map((p,i)=>[p.id,p.castNumber||String(i+1)])),resolvedAt:new Date().toISOString()};
}
function review(p,dayId){
 const r=resolve(p,dayId),errors=[],warnings=[];const {day:d,values:v,location:loc}=r;
 if(!p.title.trim())errors.push('Enter a production title.');if(!okDate(d.date))errors.push('Choose a valid shooting date.');if(!okZone(v.zone))errors.push('Choose a valid IANA timezone.');if(!TIME.test(v.generalCall))errors.push('Enter a general call in HH:MM.');
 if(!loc)errors.push(Records.deleted(p,'locations',v.primaryLocationId)?'The primary location is deleted. Restore it or explicitly choose another location. Stored timezone remains unchanged.':'Choose a primary location.');else {if(!loc.address.trim())errors.push('Enter the primary location address.');if(!loc.hospital.trim()||!loc.emergencyPhone.trim()||!loc.verified)errors.push('Review emergency facility details and mark them verified.');}
 const called=new Set(d.calls.map(c=>c.personId));for(const c of d.calls){const person=p.people.find(p=>p.id===c.personId);if(person?.type==='cast'&&!r.schedule.some(s=>s.scene?.castIds.includes(c.personId)))warnings.push('Cast called without a scheduled scene: '+person.name);const hour=Number((c.call||v.generalCall).slice(0,2));if(hour<4||hour>=23)warnings.push('Extreme personal call: '+person?.name);}
 for(const s of r.schedule)if(s.scene&&Records.deleted(p,'locations',s.scene.locationId))errors.push('Scheduled scene '+s.scene.number+' refers to a deleted location. Restore it or explicitly choose another location for the scene.');
 if(p.productionDesk){for(const c of r.calls.filter(c=>c.person.type==='cast'&&!c.person.name.trim()))warnings.push('Enter performer name for character: '+c.person.character);if(!r.calls.some(c=>c.person.type==='crew'))warnings.push('Crew details were not supplied by Production Desk. Enter and review called crew.');}
 if(!d.schedule.length)warnings.push('The daily schedule is empty.');if(!d.calls.length)warnings.push('No cast or crew have calls.');
 if(!r.weather.summary||!r.weather.approved||r.weather.stale)warnings.push('Weather is unavailable, stale, or not approved.');
 if(r.solar.status!=='Calculated offline')warnings.push(r.solar.status);
 const cast=new Set(r.schedule.flatMap(s=>s.scene?.castIds||[]));for(const personId of cast)if(!d.calls.some(c=>c.personId===personId))warnings.push('Missing cast call: '+p.people.find(a=>a.id===personId)?.name);
 for(const [label,time,offset=0] of [['General call',v.generalCall,0],...d.calls.flatMap(c=>[[p.people.find(p=>p.id===c.personId)?.name,c.call||v.generalCall,c.offset],...['pickup','makeup','ready'].map(k=>[p.people.find(p=>p.id===c.personId)?.name+' '+k,c[k],c.offset])]),...d.schedule.map(s=>['Schedule',s.start,s.offset])]){
  if(!time||!okDate(d.date)||!okZone(v.zone))continue;const options=candidates(addDate(d.date,offset),time,v.zone);if(!options.length)errors.push(label+': local time is skipped by daylight saving.');else if(options.length>1)errors.push(label+': local time repeats; change the time or timezone to disambiguate in this prototype.');
 }
 for(const c of d.calls){if(c.ready&&c.ready<(c.call||v.generalCall))warnings.push('Ready time precedes personal call: '+p.people.find(p=>p.id===c.personId)?.name);}
 warnings.push(...Availability.assessDay(p,d).filter(a=>a.status!=='available').map(a=>a.message));
 errors.push(...printErrors(r));
 if(p.demo)warnings.push('Fictional demo data. Not for use as an operational call sheet.');
 return {errors:[...new Set(errors)],warnings:[...new Set(warnings)]};
}
function printErrors(r){const errors=[];if(r.day.layout.preset==='gcasper'){for(const [k,value] of Object.entries(r.sheet||{}))if(!['departmentNotes','walkies'].includes(k)&&String(value).length>600)errors.push('A header or logistics field is too long to print safely. Shorten it or move details into Production notes.');for(const c of r.calls)if(c.notes.length>(c.person.type==='cast'?250:600))errors.push('A G-Casper call row is too long to print safely. Move lengthy text to Production notes.');for(const b of r.day.background||[])if(b.description.length>180||b.notes.length>250)errors.push('A background row is too long to print safely.');}for(const c of r.calls)if(c.person.name.length>180||c.person.role.length>180||c.notes.length>(r.day.layout.includeContacts?400:1200))errors.push('A call row is too long to print safely. Shorten the name/role or move lengthy call notes to Production notes.');for(const s of r.schedule)if((s.description||s.scene?.synopsis||'').length>2000)errors.push('A schedule row is too long to print safely. Move lengthy text to Production notes.');return [...new Set(errors)];}
function duplicateDay(p,dayId,date){const d=clone(p.days.find(d=>d.id===dayId));if(!d)throw Error('Day not found.');d.id=id();d.label='Day '+String(p.days.length+1).padStart(2,'0');d.date=date;d.baseRevisionId=null;d.lockedRevisionId=null;d.weather={mode:'manual',summary:'',approved:false};d.calls.forEach(c=>c.id=id());d.schedule.forEach(s=>s.id=id());p.days.push(d);return d;}
module.exports={id,clone,hash,guard,ORDER,SHEET_FIELDS,sheetDefaults,okDate,okZone,TIME,validateProject,newProject,newDay,defaultLayout,resolve,review,printErrors,solar,candidates,addDate,weatherKey,duplicateDay};
