'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const P=require('../core/productiondesk.cjs'),D=require('../core/domain.cjs'),{Store}=require('../core/store.cjs'),A=require('../core/archive.cjs');
const file=path.resolve(__dirname,'./fixtures/last-light.productiondesk'),raw=fs.readFileSync(file),envelope=()=>JSON.parse(raw),parse=v=>P.read(Buffer.from(JSON.stringify(v)));
const temp=()=>new Store(fs.mkdtempSync(path.join(os.tmpdir(),'pd-import-test-')));
test('released v1 complete source maps exact IDs, script, all shots, notes, calendar, scenarios and blank operational data',()=>{
 const r=P.map(P.read(raw)),p=r.project,src=envelope().workspace.projects[0];
 assert.equal(p.sourceId,'25e4f541-7cb8-55c7-abdc-9455f3b77148');assert.equal(p.scenes.length,8);assert.equal(p.people.length,3);assert.equal(p.scenes.flatMap(s=>s.shots).length,16);
 assert.deepEqual(r.summary.days.map(d=>d.scenes),[['3','4','5'],['6','7'],['1','2']]);assert.deepEqual(r.summary.days.map(d=>d.date),['2026-11-02','2026-11-03','2026-11-04']);assert.deepEqual(r.summary.unscheduled,['8']);
 assert.deepEqual(p.scenes.map(s=>s.id),src.breakdowns.filter(b=>b.type==='scene').map(b=>b.id));assert.equal(p.productionDesk.model._sourceScript.text,src._sourceScript.text);assert.deepEqual(p.productionDesk.model,src);
 assert(p.scenes.every(s=>s.notes.includes('Fictional planning example')&&s.breakdownElements.length));assert(p.scenes.every(s=>s.script===src.breakdowns.find(b=>b.id===s.id)._scriptText));
 assert.equal(p.defaults.generalCall,'');assert.equal(p.defaults.zone,'');assert(p.people.every(p=>p.name===''&&p.phone===''));assert(p.days.flatMap(d=>d.calls).every(c=>!c.call&&!c.ready&&!c.makeup));assert(p.days.every(d=>d.layout.preset==='gcasper'&&!d.weather.approved));
 assert(P.map(P.read(raw),src.stripboards[1].id).summary.scenario.includes('Story'));assert.throws(()=>P.map(P.read(raw),'absent'),/scenario/);
});
test('preview is read-only, commit backed up, duplicate no-op, save/reopen and archive retain source',()=>{
 const s=temp();try{s.create(D.newProject('Preserve real project'));const before=s.list();const v=P.preview(s,P.read(raw));assert.deepEqual(s.list(),before);const imported=P.commit(s,v);assert(fs.existsSync(imported.importBackup));assert.equal(s.list().length,2);const version=imported.version;
  const duplicate=P.preview(s,P.read(raw));assert(duplicate.duplicate);assert.equal(P.commit(s,duplicate).version,version);assert.equal(s.list().length,2);
  const id=imported.project.id,dir=s.dir;s.close();const reopened=new Store(dir);try{assert.equal(reopened.get(id).project.productionDesk.model._sourceScript.text,envelope().workspace.projects[0]._sourceScript.text);const copy=A.importAsCopy(reopened,A.exportArchive(reopened,id));assert.deepEqual(copy.project.productionDesk,reopened.get(id).project.productionDesk);}finally{reopened.close();}
 }finally{try{s.close();}catch{}}
});
test('three-way reimport updates untouched fields, retains manual fields, calls, order, additions and issued days',()=>{
 const s=temp();try{let initial=P.commit(s,P.preview(s,P.read(raw))),p=initial.project;const scene=p.scenes[0];scene.synopsis='LOCAL synopsis';p.people[0].name='Local performer';p.people[0].phone='Private local number';p.days[0].overrides.generalCall='06:45';p.days[0].layout.preset='narrative';p.days[0].schedule.reverse();p.days[0].calls[0].call='06:30';p.days[1].lockedRevisionId='test-issued';p.days[1].baseRevisionId='test-issued';const locked=D.clone(p.days[1]);const order=p.days[0].schedule.map(x=>x.id);const localPerson={...p.people[0],id:D.id(),sourceId:'manual',name:'Manual crew',type:'crew'};p.people.push(localPerson);s.save(p,initial.version);
  const e=envelope(),src=e.workspace.projects[0];src.breakdowns[0].description='SOURCE updated synopsis';src.breakdowns[1].description='SOURCE untouched synopsis update';src.company='Updated source company';src.calendars[0].events[0].date='2026-11-09T12:00:00.000Z';
  const review=P.preview(s,parse(e));assert(review.conflicts.some(c=>c.includes('synopsis')));assert(review.conflicts.some(c=>c.includes('issued')));const update=P.commit(s,review);p=update.project;
  assert.equal(p.scenes[0].synopsis,'LOCAL synopsis');assert.equal(p.scenes[1].synopsis,'SOURCE untouched synopsis update');assert.equal(p.company,'Updated source company');assert.equal(p.people[0].name,'Local performer');assert.equal(p.people[0].phone,'Private local number');assert(p.people.some(x=>x.id===localPerson.id));assert.equal(p.days[0].overrides.generalCall,'06:45');assert.equal(p.days[0].layout.preset,'narrative');assert.deepEqual(p.days[0].schedule.map(x=>x.id),order);assert.equal(p.days[0].calls[0].call,'06:30');assert.deepEqual(p.days[1],locked);assert.equal(p.days[0].date,'2026-11-09');assert.equal(s.list().length,1);
 }finally{s.close();}
});
test('stale preview, malformed, oversized, unsupported, unsafe paths/keys, broken refs and tampered PDF reject without mutation',()=>{
 const s=temp();try{const v=P.preview(s,P.read(raw));P.commit(s,v);const next=envelope();next.workspace.projects[0].company='Changed';const preview=P.preview(s,parse(next));const state=s.get(preview.targetId);state.project.title='Changed after preview';s.save(state.project,state.version);assert.throws(()=>P.commit(s,preview),/changed since preview/);const before=JSON.stringify(s.get(preview.targetId));
  for(const mutate of [v=>v.formatVersion=2,v=>v.workspace.version=2,v=>v.workspace.projects.push(v.workspace.projects[0]),v=>v.workspace.projects[0]._sourceScript.filename='../private.txt',v=>v.workspace.projects[0].breakdowns[0].elements.push('unknown'),v=>v.workspace.projects[0]._shots[0].sceneId='unknown',v=>v.workspace.projects[0]._shots[0].takes=-2,v=>v.workspace.projects[0]._shots[0].status='Invalid',v=>v.workspace.projects[0].calendars[0].daysOff=[0,1,2,3,4,5,6],v=>v.workspace.projects[0].stripboards[0].boards[0].breakdownIds[0].push('unknown'),v=>v.workspace._pdfDocuments[Object.keys(v.workspace._pdfDocuments)[0]]='JVBERi1mYWtl',v=>v.workspace.projects[0].elements.push(v.workspace.projects[0].elements[0])]){const bad=envelope();mutate(bad);assert.throws(()=>parse(bad));}
  assert.throws(()=>P.read(Buffer.from('{bad')),/JSON/);assert.throws(()=>P.read(Buffer.from('{"__proto__":{}}')),/unsafe/);assert.throws(()=>P.read(Buffer.alloc(P.MAX_BYTES+1)),/25 MB/);assert.equal(JSON.stringify(s.get(preview.targetId)),before);
 }finally{s.close();}
});
test('calendar days off resolve locally, no dates invented, local deletions stay deleted and source removals retained',()=>{
 const e=envelope(),p=e.workspace.projects[0];p.calendars[0].events[0].date='2026-11-06T12:00:00.000Z';assert.deepEqual(P.map(parse(e)).summary.days.map(d=>d.date),['2026-11-06','2026-11-09','2026-11-10']);p.calendars[0].events=[];assert(P.map(parse(e)).project.days.every(d=>d.date===''));
 const mapped=P.map(P.read(raw)).project,local=D.clone(mapped),deleted=local.days[0].calls.pop().id,person=local.people[0];local.people[0].name='Manual performer';const e2=envelope();e2.workspace.projects[0].company='Reimport';const incoming=P.map(parse(e2)).project;const result=P.merge(local,incoming);assert(!result.project.days[0].calls.some(c=>c.id===deleted));assert.equal(result.project.people[0].name,'Manual performer');assert.equal(result.project.people[0].id,person.id);
});
test('failed SQLite insertion rolls back atomically and leaves a readable pre-import backup',()=>{
 const s=temp();try{const existing=s.create(D.newProject('Keep'));s.db.exec("CREATE TRIGGER reject_import BEFORE INSERT ON projects BEGIN SELECT RAISE(ABORT,'test disk failure'); END;");const preview=P.preview(s,P.read(raw));assert.throws(()=>P.commit(s,preview),/test disk failure/);assert.equal(s.list().length,1);assert.equal(s.get(existing.project.id).project.title,'Keep');const backups=fs.readdirSync(path.join(s.dir,'backups'));assert(backups.length>0);}finally{s.close();}
});
test('reimport preserves actual issued snapshot/PDF bytes and stable strip IDs across source reordering',()=>{
 const s=temp();try{const first=P.commit(s,P.preview(s,P.read(raw))),p=first.project,day=p.days[0],snapshot=D.resolve(p,day.id),bytes=Buffer.from('%PDF-1.4\nsynthetic immutable revision test');snapshot.revision={id:D.id(),number:1,issued:new Date().toISOString()};s.issue(p.id,day.id,first.version,snapshot,bytes);
  const e=envelope(),source=e.workspace.projects[0],group=source.stripboards[0].boards[0].breakdownIds[0];[group[1],group[2]]=[group[2],group[1]];source.breakdowns.find(b=>b.scene==='3').description='Updated at source';const incoming=P.map(parse(e)).project;
  for(const row of first.project.days[0].schedule)assert(incoming.days[0].schedule.some(x=>x.id===row.id));
  const result=P.commit(s,P.preview(s,parse(e)));assert.deepEqual(result.project.days[0],s.get(p.id).project.days[0]);assert.equal(result.project.days[0].lockedRevisionId,snapshot.revision.id);const revision=s.revision(p.id,snapshot.revision.id);assert(revision.pdf.equals(bytes));assert.deepEqual(revision.snapshot,snapshot);assert.equal(revision.hash,D.hash(bytes));
 }finally{s.close();}
});

const shootLocations=fs.readFileSync(path.join(__dirname,'fixtures/shoot-locations.productiondesk'));

test('Production Desk exporter fixture registers only explicit Shoot Locations and uses unambiguous scene/day links',()=>{
 const {project,summary,warnings}=P.map(P.read(shootLocations));
 const [stage,yard]=project.locations;
 assert.deepEqual(project.locations.map(loc=>loc.name),['Harbor Studio Stage','Harbor Studio Yard']);
 assert(project.locations.every(loc=>loc.id===loc.sourceId&&loc.address===''));
 assert.equal(new Set(project.scenes.map(s=>s.slug)).size,12);
 assert.deepEqual(project.scenes.map(s=>s.locationId),[stage.id,stage.id,stage.id,stage.id,yard.id,yard.id,yard.id,yard.id,stage.id,'','',yard.id]);
 assert.deepEqual(project.days.map(d=>d.overrides.primaryLocationId),[stage.id,yard.id,'','']);
 assert.deepEqual(summary.days.map(d=>d.date),['2026-12-04','2026-12-07','2026-12-08','2026-12-09']);
 assert.equal(project.defaults.primaryLocationId,'');
 assert.equal(project.people[0].character,'RILEY');
 assert.equal(project.people[0].role,'Cast');
 assert.match(project.days[0].sheetOverrides.departmentNotes,/Red production binder/);
 assert.match(project.scenes[9].notes,/Shoot Location: Fictional script location/);
 assert(warnings.some(w=>w.includes('Day 03, Day 04')));
 assert(warnings.some(w=>w.includes('links need local review: 11')));
 const alternate=JSON.parse(shootLocations);
 const source=alternate.workspace.projects[0];
 source.elements.find(e=>e.id===yard.id).name=stage.name;
 assert.deepEqual(P.map(parse(alternate)).project.locations.map(l=>l.id),[stage.id,yard.id]);
 source.categories.find(c=>c.ucid===6).ucid=348;
 const missing=P.map(parse(alternate)).project;
 assert.deepEqual(missing.locations,[]);
 assert(missing.scenes.every(sc=>sc.locationId===''));
 assert(missing.days.every(d=>d.overrides.primaryLocationId===''));
});

test('reviewed legacy same-file cleanup only drops unedited and unreferenced generated records',()=>{
 const store=temp();try{
  const parsed=P.read(shootLocations),legacy=P.map(parsed).project;
  // Recreate the 0.3.18 baseline: every reserved element became a row, and
  // the first matching scene supplied an inferred day/production location.
  const reserved=parsed.source.categories.find(c=>c.ucid===6).id;
  const blank=legacy.locations[0];
  legacy.locations=parsed.source.elements.filter(e=>e.category===reserved).map(e=>({...blank,id:e.id,sourceId:e.id,name:e.name}));
  const [stage,yard,edited,referenced,unused,empty]=legacy.locations;
  legacy.scenes[9].locationId=empty.id;
  legacy.scenes[10].locationId=stage.id;
  legacy.defaults.primaryLocationId=stage.id;
  legacy.days[2].overrides.primaryLocationId=stage.id;
  legacy.days[3].overrides.primaryLocationId=stage.id;
  const baseline=D.clone(legacy);delete baseline.productionDesk;delete baseline.id;
  legacy.productionDesk.baseline=baseline;delete legacy.productionDesk.shootLocationMapping;
  edited.address='123 Fictional Rd';
  legacy.scenes[9].locationId=referenced.id;
  const manual={...stage,id:D.id(),name:stage.name,address:'321 Fictional Rd'};delete manual.sourceId;
  legacy.locations.push(manual);
  const original=store.create(legacy),day=legacy.days[0],snapshot=D.resolve(legacy,day.id),pdf=Buffer.from('%PDF-1.7\nimmutable shoot location fixture');
  snapshot.revision={id:D.id(),number:1,issued:new Date().toISOString()};store.issue(legacy.id,day.id,original.version,snapshot,pdf);
  const before=store.get(legacy.id),review=P.preview(store,parsed);
  assert(!review.duplicate);
  assert.deepEqual(new Set(review.locationCleanup.map(l=>l.id)),new Set([unused.id,empty.id]));
  assert.deepEqual(store.get(legacy.id),before);
  const {project,importBackup}=P.commit(store,review);
  assert(fs.existsSync(importBackup));
  assert.deepEqual(project.locations.map(l=>l.id),[stage.id,yard.id,edited.id,referenced.id,manual.id]);
  assert.equal(project.locations.find(l=>l.id===edited.id).address,'123 Fictional Rd');
  assert.equal(project.scenes[9].locationId,referenced.id);
  assert.equal(project.days[2].overrides.primaryLocationId,'');
  assert.equal(project.days[3].overrides.primaryLocationId,'');
  assert.deepEqual(project.days[0],before.project.days[0]);
  const issued=store.revision(legacy.id,snapshot.revision.id);
  assert.deepEqual(issued.snapshot,snapshot);
  assert.deepEqual(issued.pdf,pdf);
  assert(P.preview(store,parsed).duplicate);
 }finally{store.close();}
});

const {sceneLocationExport}=require('./support/scene-location-fixture.cjs');

test('only scene-linked Shoot Locations enter the register, including sites used only by unscheduled scenes',()=>{
 const {envelope,locationIds:ids}=sceneLocationExport();
 const {project,summary}=P.map(parse(envelope));
 assert.deepEqual(project.locations.map(loc=>loc.id),[ids.stage,ids.yard,ids.unscheduled]);
 assert.equal(project.locations.filter(loc=>loc.id===ids.stage).length,1);
 assert(project.scenes.slice(0,4).every(scene=>scene.locationId===ids.stage));
 assert.equal(project.scenes.find(scene=>scene.number==='12').locationId,ids.unscheduled);
 assert.deepEqual(summary.unscheduled,['12']);
 assert.deepEqual(project.days.map(day=>day.overrides.primaryLocationId),[ids.stage,ids.yard,'','']);
 assert.equal(project.defaults.primaryLocationId,'');
 assert(project.days[2].schedule.some(item=>item.type==='note'&&item.description==='Fictional logistics note'));
 assert(!project.locations.some(loc=>[ids.dayOnly,ids.unused].includes(loc.id)));
 // With every physical scene link gone, Set, blank/custom fields, a day
 // banner, and the registry cannot create an operational location.
 const missing=P.map(parse(sceneLocationExport({withoutSceneLinks:true}).envelope)).project;
 assert.deepEqual(missing.locations,[]);
 assert.equal(new Set(missing.scenes.map(scene=>scene.slug)).size,12);
 assert(missing.scenes.every(scene=>scene.locationId===''));
 assert(missing.days.every(day=>day.overrides.primaryLocationId===''));
 assert.equal(missing.defaults.primaryLocationId,'');
});

test('reviewed reimport removes an untouched location after its last scene link is removed',()=>{
 const store=temp();
 try{
  const {envelope,locationIds:ids}=sceneLocationExport();
  const first=P.commit(store,P.preview(store,parse(envelope)));
  const local=first.project;
  local.locations.find(loc=>loc.id===ids.yard).address='20 Manual Yard Road';
  local.days[2].overrides.primaryLocationId=ids.yard;
  const original=store.save(local,first.version);
  const day=local.days[0],snapshot=D.resolve(local,day.id);
  const pdf=Buffer.from('%PDF-1.7\nissued location preservation fixture');
  snapshot.revision={id:D.id(),number:1,issued:new Date().toISOString()};
  store.issue(local.id,day.id,original.version,snapshot,pdf);
  const before=store.get(local.id);
  const revised=parse(sceneLocationExport({withoutSceneLinks:true}).envelope);
  const review=P.preview(store,revised);
  assert.deepEqual(review.locationCleanup.map(loc=>loc.id),[ids.unscheduled]);
  assert.deepEqual(store.get(local.id),before);
  const {project,importBackup}=P.commit(store,review);
  assert(fs.existsSync(importBackup));
  assert.deepEqual(project.locations.map(loc=>loc.id),[ids.stage,ids.yard]);
  assert.equal(project.locations.find(loc=>loc.id===ids.yard).address,'20 Manual Yard Road');
  assert.deepEqual(project.days.map(day=>day.overrides.primaryLocationId),[ids.stage,'',ids.yard,'']);
  assert(project.scenes.every(scene=>scene.locationId===''));
  assert.deepEqual(project.days[0],before.project.days[0]);
  const issued=store.revision(local.id,snapshot.revision.id);
  assert.deepEqual(issued.snapshot,snapshot);
  assert.deepEqual(issued.pdf,pdf);
  assert(P.preview(store,revised).duplicate);
 }finally{store.close();}
});
