'use strict';
// Shared by the editor and Node tests. Dates affect presentation, never source IDs
// or the source schedule's array order. Equal dates retain that original order.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ShootingDays=factory();})(globalThis,()=>{
 const copy=x=>structuredClone(x);
 const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&s>='1900-01-01'&&s<='2100-12-31'&&Number.isFinite(Date.parse(s+'T12:00Z'))&&new Date(s+'T12:00Z').toISOString().slice(0,10)===s;
 const ordered=days=>days.map((day,index)=>({day,index})).sort((a,b)=>(validDate(a.day.date)?a.day.date:'9999').localeCompare(validDate(b.day.date)?b.day.date:'9999')||a.index-b.index).map(x=>x.day);
 // Appending follows production sequence, not sidebar calendar sorting or selection.
 function nextDayDate(days,today=new Date().toISOString().slice(0,10)){
  const previous=days.at(-1)?.date;if(!validDate(previous))return today;
  const date=new Date(previous+'T12:00Z');date.setUTCDate(date.getUTCDate()+1);const next=date.toISOString().slice(0,10);
  return validDate(next)?next:today;
 }
 function weeks(days){const groups=[];for(const d of ordered(days)){let key='undated',end='';if(validDate(d.date)){const ms=Date.parse(d.date+'T12:00Z'),offset=(new Date(ms).getUTCDay()+6)%7;key=new Date(ms-offset*86400000).toISOString().slice(0,10);end=new Date(ms+(6-offset)*86400000).toISOString().slice(0,10);}let g=groups.at(-1);if(g?.key!==key){g={key,end,days:[]};groups.push(g);}g.days.push(d);}return groups;}
 // Calendar cells use UTC noon so local timezones and DST never shift dates.
 function monthGrid(month){
  if(!/^\d{4}-\d{2}$/.test(month)||!validDate(month+'-01'))throw Error('Choose a valid calendar month.');
  const first=Date.parse(month+'-01T12:00Z'),offset=(new Date(first).getUTCDay()+6)%7;
  return Array.from({length:42},(_,i)=>new Date(first+(i-offset)*86400000).toISOString().slice(0,10));
 }
 function shiftMonth(month,delta){const d=new Date(month+'-01T12:00Z');d.setUTCMonth(d.getUTCMonth()+delta);const value=d.toISOString().slice(0,7);return validDate(value+'-01')?value:month;}
 function months(days){return [...new Set(ordered(days).filter(d=>validDate(d.date)).map(d=>d.date.slice(0,7)))];}
 function moveScene(p,{id,targetId,rowId,beforeId}){
  const source=p.days.find(d=>d.id===id),target=p.days.find(d=>d.id===targetId);
  if(!source||!target||source===target)throw Error('Choose a different shooting day.');
  if(source.lockedRevisionId||target.lockedRevisionId)throw Error('Start a new draft of the issued day before moving scenes.');
  const index=source.schedule.findIndex(row=>row.id===rowId&&row.type==='scene'),row=source.schedule[index];
  if(!row||!p.scenes.some(scene=>scene.id===row.sceneId)||p.recordTrash?.scenes?.some(entry=>entry.id===row.sceneId))throw Error('This scheduled scene is no longer available.');
  if(target.schedule.some(other=>other.id===rowId||other.type==='scene'&&other.sceneId===row.sceneId))throw Error('The destination already has this scene or schedule row.');
  const destination=beforeId?target.schedule.findIndex(other=>other.id===beforeId):target.schedule.length;
  if(destination<0)throw Error('The insertion point changed. Choose the destination again.');
  const inverse={kind:'scene',id:targetId,targetId:id,rowId,beforeId:source.schedule[index+1]?.id};
  source.schedule.splice(index,1);
  target.schedule.splice(destination,0,row);
  return inverse;
 }
 function apply(p,command){
  if(command.kind==='scene')return moveScene(p,command);
  const {kind,id}=command;const index=p.days.findIndex(d=>d.id===id);
  if(kind==='date'){
   if(index<0)throw Error('Shooting day not found.');if(!validDate(command.date)&&!(command.weather&&typeof command.date==='string'))throw Error('Choose a valid date between 1900 and 2100.');
   const d=p.days[index],inverse={kind,id,date:d.date,weather:copy(d.weather)};d.date=command.date;
   d.weather=command.weather?copy(command.weather):{...d.weather,approved:false};return inverse;
  }
  if(kind==='delete'){
   p.deletedDays||=[];
   if(index<0)throw Error('Shooting day not found.');const [d]=p.days.splice(index,1);p.deletedDays.push(d);return {kind:'restore',id,index};
  }
  if(kind==='restore'){
   if(index>=0)throw Error('A shooting day with this identity already exists.');const at=(p.deletedDays||[]).findIndex(d=>d.id===id);if(at<0)throw Error('Deleted shooting day not found.');
   const [d]=p.deletedDays.splice(at,1);p.days.splice(Math.max(0,Math.min(command.index??p.days.length,p.days.length)),0,d);return {kind:'delete',id};
  }
  throw Error('Unknown shooting day change.');
 }
 return {validDate,nextDayDate,ordered,weeks,monthGrid,shiftMonth,months,apply};
});
