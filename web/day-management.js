'use strict';
// Shared by the editor and Node tests. Dates affect presentation, never source IDs
// or the source schedule's array order. Equal dates retain that original order.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ShootingDays=factory();})(globalThis,()=>{
 const copy=x=>JSON.parse(JSON.stringify(x));
 const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&s>='1900-01-01'&&s<='2100-12-31'&&Number.isFinite(Date.parse(s+'T12:00Z'))&&new Date(s+'T12:00Z').toISOString().slice(0,10)===s;
 const ordered=days=>days.map((day,index)=>({day,index})).sort((a,b)=>(validDate(a.day.date)?a.day.date:'9999').localeCompare(validDate(b.day.date)?b.day.date:'9999')||a.index-b.index).map(x=>x.day);
 function weeks(days){const groups=[];for(const d of ordered(days)){let key='undated',end='';if(validDate(d.date)){const ms=Date.parse(d.date+'T12:00Z'),offset=(new Date(ms).getUTCDay()+6)%7;key=new Date(ms-offset*86400000).toISOString().slice(0,10);end=new Date(ms+(6-offset)*86400000).toISOString().slice(0,10);}let g=groups.at(-1);if(g?.key!==key){g={key,end,days:[]};groups.push(g);}g.days.push(d);}return groups;}
 function apply(p,command){
  const {kind,id}=command;const index=p.days.findIndex(d=>d.id===id);p.deletedDays||=[];
  if(kind==='date'){
   if(index<0)throw Error('Shooting day not found.');if(!validDate(command.date)&&!(command.weather&&typeof command.date==='string'))throw Error('Choose a valid date between 1900 and 2100.');
   const d=p.days[index],inverse={kind,id,date:d.date,weather:copy(d.weather)};d.date=command.date;
   d.weather=command.weather?copy(command.weather):{...d.weather,approved:false};return inverse;
  }
  if(kind==='delete'){
   if(index<0)throw Error('Shooting day not found.');const [d]=p.days.splice(index,1);p.deletedDays.push(d);return {kind:'restore',id,index};
  }
  if(kind==='restore'){
   if(index>=0)throw Error('A shooting day with this identity already exists.');const at=p.deletedDays.findIndex(d=>d.id===id);if(at<0)throw Error('Deleted shooting day not found.');
   const [d]=p.deletedDays.splice(at,1);p.days.splice(Math.max(0,Math.min(command.index??p.days.length,p.days.length)),0,d);return {kind:'delete',id};
  }
  throw Error('Unknown shooting day change.');
 }
 return {validDate,ordered,weeks,apply};
});
