'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Availability=require('../web/availability.js'),Days=require('../web/day-management.js'),Moves=require('../web/calendar-moves.js'),D=require('../core/domain.cjs'),ProductionDesk=require('../core/productiondesk.cjs');
const {calendarFixture}=require('./support/calendar-move-fixture.cjs');
const dayMove={kind:'date',id:'cal-a',date:'2026-11-04'};
const sceneMove={kind:'scene',id:'cal-a',targetId:'cal-b',rowId:'cal-row-0',beforeId:'cal-row-1'};

test('day review is read-only and describes occupied units, limited availability and real overlapping assignments',()=>{
 const p=calendarFixture(),before=structuredClone(p);
 const plan=Moves.plan(p,dayMove);
 assert.deepEqual(p,before);
 assert.deepEqual(plan.occupied,['Day 02 · Unit A · 2026-11-04','Day 02 Splinter · Unit B · 2026-11-04']);
 assert(plan.conflicts.some(msg=>msg.includes('Ari Example: personal call')&&msg.includes('2026-11-04 9:00 AM')));
 assert(plan.conflicts.some(msg=>msg.includes('Cameron Example: personal call')&&msg.includes('10:00 AM')));
 assert(plan.conflicts.some(msg=>msg.includes('Ari Example')&&msg.includes('Moving scene')&&msg.includes('Other unit scene')&&msg.includes('10:45 AM')));
 assert(!plan.conflicts.some(msg=>msg.includes('Casey Example')));
 const inverse=Days.apply(p,dayMove);
 assert.deepEqual(p.days[0],{...before.days[0],date:dayMove.date,weather:{...before.days[0].weather,approved:false}});
 D.validateProject(p);
 const after=Availability.assessDay(p,p.days[0]);
 const reviewed=D.review(p,p.days[0].id);
 for(const [id,stored,time] of [['synthetic-cast','09:00','9:00 AM'],['synthetic-crew','','8:00 AM']]){
  assert.equal(p.days[0].calls.find(c=>c.personId===id).call,stored);
  const advice=after.find(entry=>entry.personId===id);
  assert.equal(advice.status,'conflict');
  assert(advice.message.includes(time));
  assert(plan.conflicts.includes(advice.message));
  assert(reviewed.warnings.includes(advice.message));
 }
 const redo=Days.apply(p,inverse);
 assert.deepEqual(p,before);
 Days.apply(p,redo);
 assert.equal(p.days[0].date,dayMove.date);
});

test('scene review scopes availability to linked cast and moves the identical row before an explicit target',()=>{
 const p=calendarFixture(),before=structuredClone(p);
 const plan=Moves.plan(p,sceneMove);
 assert.deepEqual(p,before);
 assert(plan.conflicts.some(msg=>msg.includes('Ari Example')&&msg.includes('Destination scene')));
 assert(plan.conflicts.some(msg=>msg.includes('Other unit scene')));
 assert(!plan.conflicts.some(msg=>msg.includes('Cameron Example')||msg.includes('Casey Example')));
 const row=p.days[0].schedule[0],inverse=Days.apply(p,sceneMove);
 assert.strictEqual(p.days[1].schedule[0],row);
 assert.deepEqual(p.days.map(d=>d.calls),before.days.map(d=>d.calls));
 assert.deepEqual(p.scenes,before.scenes);
 assert.deepEqual(p.days[0].schedule,[before.days[0].schedule[1]]);
 assert.deepEqual(p.days[1].schedule,[row,before.days[1].schedule[0]]);
 D.validateProject(p);
 const redo=Days.apply(p,inverse);
 assert.deepEqual(p,before);
 Days.apply(p,redo);
 assert.deepEqual(p.days[1].schedule,[row,before.days[1].schedule[0]]);
});

test('uncertain availability, invalid times and touching intervals are not hard conflicts',()=>{
 const p=calendarFixture();
 p.availability.byPerson={};
 p.days[1].calls=[];p.days[2].calls=[];p.days[2].schedule=[];
 p.days[1].schedule[0].start='09:30';
 let outcome=Moves.plan(p,sceneMove);
 assert.deepEqual(outcome.conflicts,[]);
 assert(outcome.unknown.some(msg=>msg.includes('Ari Example')&&msg.includes('Personal call not entered')));
 p.days[0].schedule[0].duration=0;
 outcome=Moves.plan(p,sceneMove);
 assert.deepEqual(outcome.conflicts,[]);
 assert(outcome.unknown.some(msg=>msg.includes('start, duration or timezone')));
 p.days[0].schedule[0].duration=60;
 p.days[1].schedule[0].duration=120;
 p.days[1].overrides.zone='America/New_York';p.days[1].date='2026-11-01';
 p.days[0].schedule[0].start='01:30';
 outcome=Moves.plan(p,sceneMove);
 assert.equal(outcome.conflicts.length,0);
 assert(outcome.unknown.some(msg=>msg.includes('ambiguous')));
});

test('same date alone and unrecorded wrap do not overlap; previous-day offsets and explicit releases do',()=>{
 const p=calendarFixture();
 p.availability.byPerson={};
 p.days[0].schedule=[];p.days[1].schedule=[];p.days[2].schedule=[];
 p.days[0].calls=p.days[0].calls.filter(c=>c.personId==='synthetic-crew');
 p.days[1].calls=[{...p.days[0].calls[0],id:'second-call',call:'11:00'}];p.days[2].calls=[];
 assert.deepEqual(Moves.plan(p,dayMove).conflicts,[]);
 p.days[1].date='2026-11-03';
 p.days[1].calls[0].offset=1;
 p.days[0].calls[0].loseAt='11:30';
 assert(Moves.plan(p,dayMove).conflicts.some(msg=>msg.includes('Cameron Example')&&msg.includes('11:30 AM')));
 p.days[0].calls[0].loseAt='11:00';
 assert.deepEqual(Moves.plan(p,dayMove).conflicts,[]);
});

test('duplicate, no-op, deleted, stale and issued scene targets fail without mutation',()=>{
 const p=calendarFixture();
 function rejects(op,pattern){const before=structuredClone(p);assert.throws(()=>Moves.plan(p,op),pattern);assert.deepEqual(p,before);}
 rejects({...dayMove,date:p.days[0].date},/different date/);
 rejects({...sceneMove,targetId:sceneMove.id},/different shooting day/);
 rejects({...sceneMove,beforeId:'unknown-row'},/insertion point changed/);
 p.days[1].schedule.push({...p.days[0].schedule[0],id:'another-row'});
 rejects(sceneMove,/already has this scene/);
 p.days[1].schedule.pop();
 p.days[1].lockedRevisionId='issued-synthetic';
 rejects(sceneMove,/Start a new draft/);
 p.days[1].lockedRevisionId=null;
 p.days[1].date='';
 rejects(sceneMove,/with a date/);
 p.days[1].date='2026-11-04';
 p.recordTrash={schema:1,people:[],locations:[],scenes:[{id:'cal-scene-0',deletedAt:'2026-11-01T00:00:00Z'}]};
 rejects(sceneMove,/no longer available/);
});

test('calendar moves and local row edits survive repeated changed Production Desk schedules',()=>{
 const envelope=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/current-productiondesk.productiondesk')));
 const parse=()=>ProductionDesk.map(ProductionDesk.read(Buffer.from(JSON.stringify(envelope)))).project;
 const local=parse(),[a,b,c]=local.days;
 const row=a.schedule.find(r=>r.type==='scene');
 row.notes='Reviewed fictional local notes';row.start='09:30';
 Days.apply(local,{kind:'scene',id:a.id,targetId:b.id,rowId:row.id});
 Days.apply(local,{kind:'date',id:b.id,date:'2026-12-03'});
 const source=envelope.workspace.projects[0];
 function assertMoved(state){
  const occurrences=state.days.flatMap(d=>d.schedule.filter(r=>r.type==='scene'&&r.sceneId===row.sceneId).map(r=>[d.id,r]));
  assert.deepEqual(occurrences,[[b.id,row]]);
  assert.equal(state.days.find(d=>d.id===b.id).date,'2026-12-03');
 }
 source.breakdowns.find(x=>x.id===row.sceneId).description='An updated synthetic synopsis';
 let merged=ProductionDesk.merge(local,parse());assertMoved(merged.project);
 const groups=source.stripboards[0].boards.flatMap(board=>board.breakdownIds.filter(Array.isArray));
 const origin=groups.find(group=>group.includes(row.sceneId));
 origin.splice(origin.indexOf(row.sceneId),1);
 groups.at(-1).push(row.sceneId);
 assert.notEqual(c.id,b.id);
 merged=ProductionDesk.merge(merged.project,parse());assertMoved(merged.project);
 assert(merged.conflicts.some(message=>message.includes('local calendar move')));
 source.project='Synthetic new source title';
 merged=ProductionDesk.merge(merged.project,parse());assertMoved(merged.project);
});
