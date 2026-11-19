'use strict';
const D=require('../../core/domain.cjs');
function calendarFixture(){
 const p=D.newProject('Synthetic Calendar Moves');
 p.defaults.zone='Etc/UTC';
 p.defaults.generalCall='08:00';
 p.timeDisplayClock='12';
 const cast={id:'synthetic-cast',name:'Ari Example',type:'cast',character:'ARI',role:'Cast',department:'Cast',email:'ari@example.invalid',phone:''};
 const crew={...cast,id:'synthetic-crew',name:'Cameron Example',type:'crew',character:'',role:'Camera',department:'Camera',email:'camera@example.invalid'};
 const onCall={...cast,id:'synthetic-oc',name:'Casey Example',character:'CASEY',email:'casey@example.invalid'};
 p.people.push(cast,crew,onCall);
 p.scenes=['Moving scene','Destination scene','Quiet scene','Other unit scene'].map((slug,i)=>({id:'cal-scene-'+i,number:String(i+1),slug,eighths:8,synopsis:'Synthetic scene',locationId:'',castIds:i===2?[]:[cast.id,onCall.id],durationMinutes:60,shots:[]}));
 const days=[['cal-a','Day 01','2026-11-02','A'],['cal-b','Day 02','2026-11-04','A'],['cal-c','Day 02 Splinter','2026-11-04','B'],['cal-d','Day 03','2026-12-09','B']].map(([id,label,date,unit])=>({...D.newDay(p,date),id,label,date,unit}));
 const row=(i,start)=>({id:'cal-row-'+i,sourceId:'synthetic-source-'+i,sceneId:p.scenes[i].id,type:'scene',start,duration:60,offset:0,description:'',notes:'Synthetic edit '+i});
 const call=(who,day,start,loseAt='')=>({id:'cal-call-'+who.id+'-'+day,personId:who.id,call:start,loseAt,offset:0,notes:'Preserved personal call',pickup:'',makeup:'',ready:''});
 days[0].schedule=[row(0,'10:30'),row(2,'13:00')];
 days[0].calls=[call(cast,'a','09:00','11:30'),{...call(crew,'a',''),callBasis:'crew'},call(onCall,'a','09:00')];
 days[0].weather={mode:'manual',summary:'Synthetic weather',approved:true};
 days[1].schedule=[row(1,'10:00')];
 days[1].calls=[call(cast,'b','09:00','11:00'),call(onCall,'b','09:00')];
 days[2].schedule=[row(3,'10:45')];
 days[2].calls=[call(cast,'c','10:00','12:00'),call(onCall,'c','09:00')];
 p.days=days;
 p.availability={schema:1,byPerson:{[cast.id]:{'2026-11-04':{state:'unavailable',windows:[]}},[crew.id]:{'2026-11-04':{state:'windows',windows:[{start:'10:00',end:'13:00',nextDay:false}]}},[onCall.id]:{'2026-11-04':{state:'on-call',windows:[]}}}};
 return p;
}
module.exports={calendarFixture};
