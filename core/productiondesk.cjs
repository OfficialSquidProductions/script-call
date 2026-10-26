'use strict';
// Production Desk portable project v1. Data only: never extract or follow paths.
const D=require('./domain.cjs'),{validateUSS}=require('./productiondesk-validator.cjs');
const FORMAT='org.squidproductions.productiondesk.project',MAX_BYTES=25*1024*1024;
const text=x=>typeof x==='string'?x:'',same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const fail=m=>{throw Error('Production Desk: '+m);};
function inspect(v,depth=0){
 if(depth>20)fail('nesting exceeds 20 levels.');
 if(v===null||typeof v==='boolean')return;
 if(typeof v==='number'){if(!Number.isFinite(v))fail('invalid number.');return;}
 if(typeof v==='string'){if(v.length>MAX_BYTES)fail('field exceeds size limit.');return;}
 if(Array.isArray(v)){if(v.length>3000)fail('more than 3000 records in a list.');v.forEach(x=>inspect(x,depth+1));return;}
 if(!v||typeof v!=='object')fail('invalid data.');
 for(const [k,x] of Object.entries(v)){if(['__proto__','prototype','constructor'].includes(k))fail('unsafe object key.');inspect(x,depth+1);}
}
function records(a,label){
 if(!Array.isArray(a))fail('missing '+label+'.');const ids=new Set();
 for(const x of a){if(!x||typeof x!=='object'||typeof x.id!=='string'||!/^[a-zA-Z0-9_.-]{1,100}$/.test(x.id)||ids.has(x.id))fail('invalid or duplicate '+label+' ID.');ids.add(x.id);}return ids;
}
function filename(x){if(x!==undefined&&x!==null&&(typeof x!=='string'||x.includes('..')||/[\\/\x00-\x1f:]/.test(x)))fail('unsafe attachment filename.');}
function read(bytes){
 if(!Buffer.isBuffer(bytes))bytes=Buffer.from(bytes);if(!bytes.length||bytes.length>MAX_BYTES)fail('choose a nonempty file under 25 MB.');
 let v;try{v=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{fail('invalid UTF-8 JSON.');}inspect(v);
 if(v?.format!==FORMAT||v.formatVersion!==1)fail('unsupported format or format version (requires version 1).');
 const w=v.workspace;if(w?.version!==1||!Array.isArray(w.projects)||w.projects.length!==1)fail('requires workspace version 1 and exactly one production.');
 const p=w.projects[0];validateUSS(p);records([p],'production');if(w.activeProject!==p.id)fail('invalid active production.');
 const categories=records(p.categories,'category'),elements=records(p.elements,'element'),scenes=records(p.breakdowns,'breakdown'),calendars=records(p.calendars,'calendar');records(p.stripboards,'scenario');records(p._shots||[],'shot');
 if(typeof (p.project||p.name)!=='string'||(p.project||p.name).length>200)fail('invalid production title.');
 for(const c of p.categories)if(!Number.isInteger(c.ucid)||typeof c.name!=='string')fail('invalid category.');
 for(const e of p.elements){if(!categories.has(e.category)||typeof e.name!=='string'||!Array.isArray(e.linkedElements)||e.linkedElements.some(id=>!elements.has(id)))fail('invalid element relationship.');}
 for(const b of p.breakdowns){if(!['scene','banner'].includes(b.type)||!Array.isArray(b.elements)||b.elements.some(id=>!elements.has(id))||(b.pages!==null&&(!Number.isFinite(b.pages)||b.pages<0||b.pages>1000))||(b.duration!==null&&(!Number.isFinite(b.duration)||b.duration<0||b.duration>86400000)))fail('invalid scene or element relationship.');}
 for(const s of p._shots||[])if(!scenes.has(s.sceneId)||p.breakdowns.find(b=>b.id===s.sceneId).type!=='scene')fail('shot refers to an unknown scene.');
 for(const c of p.calendars){if(!Array.isArray(c.daysOff)||c.daysOff.some(n=>!Number.isInteger(n)||n<0||n>6)||new Set(c.daysOff).size===7)fail('invalid calendar days off.');records(c.events,'calendar event');for(const e of c.events)if(typeof e.date!=='string'||!D.okDate(e.date.slice(0,10)))fail('invalid calendar date.');}
 for(const s of p.stripboards){if(!calendars.has(s.calendar))fail('scenario has an unknown calendar.');records(s.boards,'board');for(const b of s.boards){if(!Array.isArray(b.breakdownIds))fail('invalid stripboard.');const seen=new Set();for(const group of b.breakdownIds){if(Array.isArray(group)&&group.some(Array.isArray))fail('invalid day nesting.');for(const id of Array.isArray(group)?group:[group]){if(!scenes.has(id)||seen.has(id)&&p.breakdowns.find(x=>x.id===id).type==='scene')fail('unknown or duplicate scheduled scene.');seen.add(id);}}}}
 filename(p._sourceScript?.filename);filename(p._scriptFilename);
 const documents=w._pdfDocuments;if(!documents||Array.isArray(documents)||typeof documents!=='object')fail('missing PDF attachment dictionary.');
 const wanted=new Set((p._linedScript?.documents||[]).map(d=>d.sha256));
 if(wanted.size!==Object.keys(documents).length||[...wanted].some(h=>!Object.hasOwn(documents,h)))fail('missing original PDF attachment.');
 for(const doc of p._linedScript?.documents||[])filename(doc.filename);
 for(const [sha,b64] of Object.entries(documents)){if(!/^[a-f0-9]{64}$/.test(sha)||typeof b64!=='string'||!b64||b64.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(b64))fail('invalid PDF attachment.');const data=Buffer.from(b64,'base64');if(D.hash(data)!==sha||data.subarray(0,5).toString()!=='%PDF-')fail('PDF checksum mismatch.');}
 return {source:p,hash:D.hash(bytes),attachmentHashes:[...wanted],bytes:bytes.length};
}
function map(parsed,scenarioId){
 const p=parsed.source,scenario=p.stripboards.find(s=>s.id===scenarioId)||(!scenarioId?p.stripboards[0]:null);if(!scenario)fail('choose an existing schedule scenario.');
 const cats=new Map(p.categories.map(c=>[c.id,c])),el=new Map(p.elements.map(e=>[e.id,e])),breakdowns=new Map(p.breakdowns.map(b=>[b.id,b]));
 const values=(b,n)=>b.elements.map(id=>el.get(id)).filter(e=>cats.get(e.category).ucid===n),value=(b,n)=>values(b,n).map(e=>e.name).join(', ');
 const out=D.newProject(p.project||p.name);out.sourceId=p.id;out.title=p.project||p.name;out.company=text(p.company);out.demo=!!p._demo;
 // None of these operational values exists in the v1 model; never infer calls
 // from shot-list start settings or invent a timezone from an address.
 out.defaults={generalCall:'',meal:'',wrap:'',zone:'',primaryLocationId:'',notes:[p.description,p._importNotes].filter(Boolean).join('\n\n')};
 out.sheetDefaults={...D.sheetDefaults(),safety:'',scriptColor:text(p.scriptColor),scheduleColor:text(p.schedColor)};
 out.people=p.elements.filter(e=>cats.get(e.category).ucid===100).map(e=>({id:e.id,sourceId:e.id,type:'cast',name:'',character:e.name,role:'Cast',department:'Cast',castNumber:text(e.elementId),phone:'',email:''}));
 out.locations=p.elements.filter(e=>cats.get(e.category).ucid===6).map(e=>({id:e.id,sourceId:e.id,name:e.name,address:'',latitude:null,longitude:null,zone:'',parking:'',hospital:'',emergencyPhone:'',verified:false}));
 out.scenes=p.breakdowns.filter(b=>b.type==='scene').map(b=>{
  const notes=[text(b.comments),...p.categories.filter(c=>[104,123,124].includes(c.ucid)).map(c=>{const names=values(b,c.ucid).map(e=>e.name);return names.length?c.name+': '+names.join(', '):'';})].filter(Boolean).join('\n');
  return {id:b.id,sourceId:b.id,number:String(b.scene??''),slug:[value(b,1)+'.',value(b,0),value(b,2)?'— '+value(b,2):''].filter(Boolean).join(' '),synopsis:text(b.description),eighths:Math.round(b.pages*8),durationMinutes:b.duration/60000,castIds:values(b,100).map(e=>e.id),locationId:values(b,6)[0]?.id||'',script:text(b._scriptText),scriptDay:value(b,3),dayNight:value(b,2),notes,props:values(b,104).map(e=>e.name),breakdownElements:b.elements.map(id=>({...el.get(id),categoryName:cats.get(el.get(id).category).name,ucid:cats.get(el.get(id).category).ucid})),shots:(p._shots||[]).filter(s=>s.sceneId===b.id).map(s=>({...s,sourceId:s.id,number:String(b.scene??'')+s.number}))};
 });
 const cal=p.calendars.find(c=>c.id===scenario.calendar),board=scenario.boards.find(b=>b.name==='stripboard')||scenario.boards[0];
 let date=cal.events.find(e=>e.type==='start')?.date.slice(0,10)||'',index=0;
 const off=new Set(cal.events.filter(e=>e.type==='dayOff').map(e=>e.date.slice(0,10)));
 out.days=[];const outside=[];
 for(const group of board?.breakdownIds||[]){if(!Array.isArray(group)){outside.push(group);continue;}if(date){let limit=0;while(cal.daysOff.includes(new Date(date+'T12:00Z').getUTCDay())||off.has(date)){date=D.addDate(date,1);if(++limit>3660)fail('calendar cannot resolve a shooting date.');}if(!D.okDate(date))fail('shooting date is outside supported 1900–2100.');}
  const d=D.newDay({...out,days:[]},date);d.id='pd-'+D.hash(scenario.id+':'+board.id+':'+index).slice(0,32);d.sourceId=d.id;d.label='Day '+String(++index).padStart(2,'0');d.sourceScenarioId=scenario.id;d.sourceDayIndex=index-1;d.unit='';
  const occurrences=new Map();d.schedule=group.map(id=>{const b=breakdowns.get(id),occurrence=occurrences.get(id)||0;occurrences.set(id,occurrence+1);return {id:'pd-'+D.hash(d.id+':'+id+':'+occurrence).slice(0,32),sourceId:id,type:b.type==='scene'?'scene':/^MEAL/i.test(b.bannerText)?'meal':'note',sceneId:b.type==='scene'?id:'',description:b.type==='scene'?'':text(b.bannerText),start:'',offset:0,duration:b.duration/60000};});
  const ds=out.scenes.filter(s=>group.includes(s.id)),people=new Set(ds.flatMap(s=>s.castIds));d.unit=[...new Set(ds.map(s=>value(breakdowns.get(s.id),4)).filter(Boolean))].join(', ');
  d.overrides={primaryLocationId:ds.find(s=>s.locationId)?.locationId||''};d.calls=out.people.filter(e=>people.has(e.id)).map(e=>({id:'pd-'+D.hash(d.id+':'+e.id).slice(0,32),sourceId:e.id,personId:e.id,call:'',pickup:'',makeup:'',ready:'',offset:0,notes:''}));
  d.weather={mode:'manual',summary:'Unavailable — enter and review weather.',approved:false};out.days.push(d);if(date)date=D.addDate(date,1);
 }
 if(!out.days.length){out.days.push(D.newDay({...out,days:[]},''));out.days[0].unit='';}
 out.defaults.primaryLocationId=out.days[0].overrides.primaryLocationId||'';
 const scheduled=new Set(out.days.flatMap(d=>d.schedule.filter(s=>s.type==='scene').map(s=>s.sceneId)));
 const warnings=['Performer names, crew, contacts, call/preparation times, weather, timezone and verified location/emergency details are absent from the Production Desk v1 model. Enter them before issue.','Shot-list start time is a shot estimate setting and is not a crew call.','PDF originals and editable lined-script marks are validated but not imported into Call Sheet. Source model and annotation metadata are retained; keep the .productiondesk file.','Day IDs derive from scenario, board and day position because v1 day groups have no IDs. Review regrouped or inserted days on reimport.'];
 if(out.scenes.some(s=>s.eighths/8!==breakdowns.get(s.id).pages))warnings.push('Fractional page values were rounded to the nearest eighth; exact source values are retained.');
 if(!date)warnings.push('Calendar has no start date. Shooting dates remain blank.');
 if(outside.length)warnings.push(outside.length+' strips outside day groups are retained in the source model, not assigned to daily sheets.');
 const unscheduled=out.scenes.filter(s=>!scheduled.has(s.id)).map(s=>s.number);if(unscheduled.length)warnings.push('Unscheduled scenes: '+unscheduled.join(', ')+'. Retained in Production data.');
 const model=D.clone(p); // all categories, availability, scenarios, calendars, notes and extensions
 const baseline=D.clone(out);delete baseline.id;
 out.productionDesk={format:FORMAT,formatVersion:1,sourceId:p.id,scenarioId:scenario.id,hash:parsed.hash,importedAt:new Date().toISOString(),attachmentHashes:parsed.attachmentHashes,model,baseline};
 D.validateProject(out);
 return {project:out,warnings,summary:{title:out.title,sourceId:p.id,scenario:scenario.name,scenes:out.scenes.length,cast:out.people.length,shots:out.scenes.flatMap(s=>s.shots).length,days:out.days.map(d=>({id:d.id,date:d.date,scenes:d.schedule.filter(s=>s.type==='scene').map(s=>out.scenes.find(x=>x.id===s.sceneId).number)})),unscheduled},scenarios:p.stripboards.map(s=>({id:s.id,name:s.name}))};
}
// Three-way merge. Source changes apply only where the local value still equals
// the previous imported value. Local additions/removals/order and issued days win.
function merge(current,incoming){
 if(current.productionDesk?.sourceId!==incoming.productionDesk.sourceId||current.productionDesk.scenarioId!==incoming.productionDesk.scenarioId)fail('reimport must target the same linked production and scenario.');
 const conflicts=[],old=current.productionDesk.baseline;
 function walk(local,before,next,path){
  if(Array.isArray(next)&&Array.isArray(before)&&Array.isArray(local)&&[...next,...before,...local].every(x=>x&&typeof x.id==='string')){
   const bm=new Map(before.map(x=>[x.id,x])),nm=new Map(next.map(x=>[x.id,x])),lm=new Map(local.map(x=>[x.id,x]));
   const orderUnchanged=same(local.map(x=>x.id),before.map(x=>x.id));
   let order=orderUnchanged?[...next.map(x=>x.id),...local.filter(x=>!nm.has(x.id)).map(x=>x.id)]:[...local.map(x=>x.id),...next.filter(x=>!bm.has(x.id)&&!lm.has(x.id)).map(x=>x.id)];
   return order.filter(id=>lm.has(id)||!bm.has(id)).map(id=>{const l=lm.get(id),b=bm.get(id),n=nm.get(id);const entity=path==='production.people'?'people':path==='production.locations'?'locations':path==='production.scenes'?'scenes':null;if(l&&entity&&require('../web/record-recovery.js').deleted(current,entity,id)){if(!same(b,n))conflicts.push(path+' '+id+': deleted record retained for recovery');return l;}if(l?.lockedRevisionId){if(!same(b,n))conflicts.push(path+' '+id+': issued day preserved');return l;}if(!n){conflicts.push(path+' '+id+': removed at source; local record retained');return l;}if(!b)return l||D.clone(n);return walk(l,b,n,path+'.'+id);});
  }
  if(same(local,before))return D.clone(next);
  if(same(local,next)||same(before,next))return local;
  if(next&&before&&local&&!Array.isArray(next)&&typeof next==='object'&&typeof before==='object'&&typeof local==='object'){
   const result={...local};for(const key of Object.keys(next))result[key]=walk(local[key],before[key],next[key],path+'.'+key);return result;
  }
  conflicts.push(path+': local edit preserved');return local;
 }
 const target=D.clone(incoming.productionDesk.baseline);
 // A new importer default must not switch an existing legacy day's lunch mode.
 for(const next of target.days){const local=current.days.find(d=>d.id===next.id);if(local&&local.lunchMode===undefined)delete next.lunchMode;}
 const output=walk(D.clone(current),old,target,'production');
 output.id=current.id;output.productionDesk=D.clone(incoming.productionDesk);D.validateProject(output);return {project:output,conflicts:[...new Set(conflicts)]};
}
function preview(store,parsed,scenarioId,targetId){
 const result=map(parsed,scenarioId),matches=store.list().map(x=>store.get(x.id)).filter(x=>x.project.productionDesk?.sourceId===result.project.sourceId&&x.project.productionDesk.scenarioId===result.project.productionDesk.scenarioId);
 let target=targetId?matches.find(x=>x.project.id===targetId):matches.length===1?matches[0]:null;
 if(targetId&&!target)fail('linked target no longer exists.');
 if(matches.length>1&&!target)fail('multiple linked copies exist; choose the target production first.');
 if(target){const m=merge(target.project,result.project);result.project=m.project;result.conflicts=m.conflicts;result.targetId=target.project.id;result.version=target.version;result.duplicate=target.project.productionDesk.hash===parsed.hash;}
 else result.conflicts=[];
 return result;
}
function commit(store,preview){
 // Revalidate before taking any write action; a single SQLite transaction makes
 // the import all-or-nothing and the pre-import backup is independently usable.
 D.validateProject(preview.project);if(preview.targetId&&store.get(preview.targetId).version!==preview.version)fail('production changed since preview. Preview again.');
 if(preview.duplicate)return {...store.get(preview.targetId),duplicate:true};
 const backup=store.backup();store.db.exec('BEGIN IMMEDIATE');try{const r=preview.targetId?store.save(preview.project,preview.version):store.create(preview.project);store.db.exec('COMMIT');return {...r,importBackup:backup};}catch(e){store.db.exec('ROLLBACK');throw e;}
}
module.exports={FORMAT,MAX_BYTES,read,map,merge,preview,commit};
