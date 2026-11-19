'use strict';
const D=require('../../core/domain.cjs');
const Records=require('../../web/record-recovery.js');
function emailFixture(){
 const project=D.newProject('Synthetic Émail Production');
 const [selected]=project.days;
 selected.label='Day 07';
 selected.date='2026-12-08';
 selected.weather={mode:'manual',summary:'Synthetic weather',approved:true};
 const location={id:'synthetic-location',name:'Fictional stage',address:'123 Example Road',latitude:38,longitude:-77,zone:'America/New_York',parking:'',hospital:'Fictional emergency facility',emergencyPhone:'555-0100',verified:true};
 project.locations.push(location);
 project.defaults.primaryLocationId=location.id;
 project.defaults.zone=location.zone;
 const person=(id,type,name,email)=>({id,type,name,email,character:type==='cast'?'Fictional character':'',role:type==='crew'?'Operator':'Cast',department:type==='crew'?'Camera':'Cast',phone:''});
 project.people=[
  person('cast','cast','Listed Performer','cast@example.invalid'),
  person('crew','crew','Listed Operator','crew@example.invalid'),
  person('duplicate','crew','Shared Mailbox Operator',' CREW@example.invalid '),
  person('missing','cast','Missing Contact','  '),
  person('bad','crew','Invalid Contact','bad@@example.invalid'),
  person('off-day','cast','Other Day Performer','other-day@example.invalid'),
  person('off-sheet','crew','Uncalled Crew','uncalled@example.invalid'),
  person('unlisted-cast','cast','Uncalled Performer','uncalled-cast@example.invalid'),
  person('deleted','crew','Deleted Crew','deleted@example.invalid')
 ];
 const call=personId=>({id:'call-'+personId,personId,call:'07:15',pickup:'',makeup:'',ready:'',notes:'',offset:0});
 selected.calls=['cast','crew','duplicate','missing','bad','deleted'].map(call);
 Records.apply(project,{kind:'delete',entity:'people',id:'deleted'});
 const next=D.newDay(project,'2026-12-09');
 next.calls=[call('off-day')];project.days.push(next);
 project.days.push(D.newDay(project,'2026-12-10'));
 return project;
}
module.exports={emailFixture};
