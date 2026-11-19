'use strict';

(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./day-management.js'),require('./availability.js'),require('./record-recovery.js'),require('./time-display.js'),require('./call-defaults.js'));
 else root.CalendarMoves=factory(root.ShootingDays,root.Availability,root.RecordRecovery,root.TimeDisplay,root.CallDefaults);
})(globalThis,(Days,Availability,Records,TimeDisplay,CallDefaults)=>{
 const minute=60000;
 const dayLabel=d=>[d.label,'Unit '+(d.unit||'—'),d.date||'Date needed'].join(' · ');
 const sceneLabel=s=>[s.number,s.slug].filter(Boolean).join(' · ')||'Untitled scene';
 const personLabel=p=>p.name||p.character||'Unnamed '+p.type;
 function rowTime(d,row,zone){
  if(!Days.validDate(d.date)||!row.start)return null;
  return Availability.epoch(Availability.addDate(d.date,row.offset||0),row.start,zone);
 }
 function interval(d,row,zone,scenes){
  if(!['scene','meal','move','break'].includes(row.type))return null;
  const scene=scenes.get(row.sceneId);
  if(row.type==='scene'&&!scene)return null;
  const start=rowTime(d,row,zone);
  if(start===null||!(row.duration>0))return null;
  return {start,end:start+row.duration*minute,label:scene?sceneLabel(scene):row.description||row.type,scene};
 }
 function collision(a,b){
  // A known call without an explicit release occupies only its start instant.
  return a.start<Math.max(b.end,b.start+1)&&b.start<Math.max(a.end,a.start+1);
 }
 function formatInterval(p,d,span){
  const zone=Availability.dayZone(p,d),clock=TimeDisplay.mode(p,d);
  const stamp=ms=>{const {date,time}=Availability.parts(ms,zone);return date+' '+TimeDisplay.format(time,clock);};
  return stamp(span.start)+(span.end>span.start?' – '+stamp(span.end):'')+' ('+zone+')';
 }
 function engagements(p,d,people,scenes,onlyRow){
  const zone=Availability.dayZone(p,d),out=new Map();
  const onCall=id=>Availability.record(p,id,d.date).state==='on-call';
  function add(id,span){
   if(!people.has(id)||onCall(id))return;
   if(!out.has(id))out.set(id,[]);
   out.get(id).push(span);
  }
  for(const row of onlyRow?[onlyRow]:d.schedule){
   if(row.type!=='scene')continue;
   const span=interval(d,row,zone,scenes);
   if(span)for(const id of span.scene.castIds)add(id,span);
  }
  if(onlyRow)return out;
  for(const call of d.calls){
   const person=people.get(call.personId);
   if(!person||onCall(person.id))continue;
   const {start}=Availability.personalStart(p,d,person);
   if(start===null)continue;
   let end=start;
   if(call.loseAt){
    const callDate=Availability.addDate(d.date,call.offset||0),time=CallDefaults.resolve(p,d,person,call);
    const releaseDate=call.loseAt<time?Availability.addDate(callDate,1):callDate;
    end=Availability.epoch(releaseDate,call.loseAt,zone)??start;
   }
   add(person.id,{start,end,label:'Personal call'});
  }
  return out;
 }
 function plan(p,command){
  if(!['date','scene'].includes(command.kind))throw Error('Choose a calendar move.');
  const source=p.days.find(d=>d.id===command.id);
  if(!source)throw Error('Shooting day no longer exists.');
  const sceneMove=command.kind==='scene';
  if(!sceneMove&&source.date===command.date)throw Error('Choose a different date.');
  const targetId=sceneMove?command.targetId:command.id;
  const candidate={...p,days:p.days.map(d=>d.id===command.id||d.id===targetId?{...d,schedule:[...d.schedule]}:d)};
  Days.apply(candidate,command);
  const target=candidate.days.find(d=>d.id===targetId);
  if(sceneMove&&!Days.validDate(target.date))throw Error('Choose a shooting day with a date.');
  const people=new Map(Records.active(p,'people').map(person=>[person.id,person]));
  const scenes=new Map(Records.active(p,'scenes').map(scene=>[scene.id,scene]));
  const row=sceneMove?target.schedule.find(row=>row.id===command.rowId):null,scene=row&&scenes.get(row.sceneId);
  const assessments=sceneMove?[...new Set(scene.castIds)].filter(id=>people.has(id)).map(id=>Availability.assess(candidate,target,people.get(id))):Availability.assessDay(candidate,target);
  const conflicts=new Set(assessments.filter(a=>a.status==='conflict').map(a=>a.message));
  const unknown=assessments.filter(a=>a.status==='unknown').map(a=>a.message);
  if(sceneMove){
   const zone=Availability.dayZone(candidate,target),moved=interval(target,row,zone,scenes);
   if(!moved)unknown.push(sceneLabel(scene)+': start, duration or timezone is missing or ambiguous.');
   else for(const other of target.schedule){
    if(other===row)continue;
    const span=interval(target,other,zone,scenes);
    if(span&&collision(moved,span)){
     const shared=scene.castIds.filter(id=>span.scene?.castIds.includes(id)&&people.has(id)&&Availability.record(p,id,target.date).state!=='on-call').map(id=>personLabel(people.get(id)));
     conflicts.add(`${shared.length?shared.join(', '):dayLabel(target)}: ${moved.label} (${formatInterval(p,target,moved)}) overlaps ${span.label} (${formatInterval(p,target,span)}).`);
    }
   }
  }
  const assignments=engagements(candidate,target,people,scenes,row);
  if(assignments.size){
   const dayMs=Date.parse(target.date+'T12:00Z');
   // Day spill offsets can be up to three days, plus duration and timezone differences.
   for(const other of candidate.days){
    if(other===target||!Days.validDate(other.date)||Math.abs(dayMs-Date.parse(other.date+'T12:00Z'))>6*86400000)continue;
    const existing=engagements(candidate,other,people,scenes);
    for(const [id,spans] of assignments)for(const a of spans)for(const b of existing.get(id)||[]){
     if(collision(a,b))conflicts.add(`${personLabel(people.get(id))}: ${a.label} on ${dayLabel(target)} (${formatInterval(candidate,target,a)}) overlaps ${b.label} on ${dayLabel(other)} (${formatInterval(candidate,other,b)}).`);
    }
   }
  }
  const occupied=sceneMove?[]:candidate.days.filter(d=>d!==target&&d.date===target.date).map(dayLabel);
  return {source, target, scene, conflicts:[...conflicts], unknown, occupied};
 }
 return {plan,dayLabel,sceneLabel};
});
