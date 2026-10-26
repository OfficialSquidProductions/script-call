'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./availability.js'));else root.LunchTiming=factory(root.Availability);})(globalThis,Calendar=>{
 const valid=x=>typeof x==='string'&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(x);
 function resolve(p,d){
  const automatic=d.lunchMode==='auto';
  if(!automatic)return {time:Object.hasOwn(d.overrides,'meal')?d.overrides.meal:p.defaults.meal,offset:d.mealOffset||0,automatic:false};
  const call=Object.hasOwn(d.overrides,'generalCall')?d.overrides.generalCall:p.defaults.generalCall;
  if(!valid(call))return {time:'',offset:0,automatic:true};
  const zone=Calendar.dayZone(p,d);
  if(Calendar.dateOK(d.date)&&Calendar.zoneOK(zone)){
   const start=Calendar.epoch(d.date,call,zone);
   if(start===null)return {time:'',offset:0,automatic:true,reason:'Crew call is skipped or repeated by daylight saving; review it or enter a manual lunch.'};
   const result=Calendar.parts(start+6*3600000,zone);
   return {time:result.time,offset:result.date===d.date?0:1,automatic:true};
  }
  const [h,m]=call.split(':').map(Number),total=h*60+m+360;
  return {time:String(Math.floor(total/60)%24).padStart(2,'0')+':'+String(total%60).padStart(2,'0'),offset:Math.floor(total/1440),automatic:true,reason:'Clock estimate only: set a valid shoot date and timezone to account for daylight saving.'};
 }
 function manual(d,time,offset){if(time&&!valid(time))throw Error('Use a valid lunch time.');if(offset!==undefined){if(!Number.isInteger(offset)||offset<0||offset>1)throw Error('Use a valid lunch date.');d.mealOffset=offset;}d.overrides.meal=time;d.lunchMode='manual';}
 function automatic(d){d.lunchMode='auto';delete d.overrides.meal;delete d.mealOffset;}
 return {resolve,manual,automatic};
});
