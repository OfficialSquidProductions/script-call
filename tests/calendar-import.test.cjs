'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const P=require('../core/productiondesk.cjs'),Days=require('../web/day-management.js');
const raw=fs.readFileSync(path.join(__dirname,'fixtures/current-productiondesk.productiondesk'));
test('current Production Desk exporter output maps every department by category and scene into usable fields',()=>{
 const parsed=P.read(raw),p=P.map(parsed).project,source=parsed.source;
 for(const b of source.breakdowns.filter(b=>b.type==='scene')){
  const scene=p.scenes.find(s=>s.id===b.id);assert.equal(scene.breakdownElements.length,b.elements.length);
  for(const c of source.categories.filter(c=>c.ucid>=100&&c.ucid!==100)){
   const tags=source.elements.filter(e=>e.category===c.id&&b.elements.includes(e.id));
   for(const e of tags){assert(scene.notes.includes(c.name+':'));assert(scene.notes.includes(e.name));}
  }
 }
 for(const d of p.days){
  for(const row of d.schedule.filter(row=>row.type==='scene')){
   const scene=p.scenes.find(s=>s.id===row.sceneId);
   for(const e of scene.breakdownElements.filter(e=>e.ucid>=100&&e.ucid!==100)){assert(d.sheetOverrides.departmentNotes.includes(e.categoryName));assert(d.sheetOverrides.departmentNotes.includes('Scene '+scene.number+':'));assert(d.sheetOverrides.departmentNotes.includes(e.name));}
   for(const id of scene.castIds){assert(d.calls.some(c=>c.personId===id));assert.equal(p.people.find(w=>w.id===id).name,'');}
  }
 }
 assert.deepEqual(p.days.map(d=>d.date),['2026-11-02','2026-11-03','2026-11-04']);assert(p.scenes[0].notes.includes('Camera'));assert(p.scenes[0].notes.includes('Wardrobe'));
 assert.deepEqual(p.productionDesk.model,source);
});
test('missing source dates stay undated and reimport preserves locally edited department instructions',()=>{
 const envelope=JSON.parse(raw);envelope.workspace.projects[0].calendars.forEach(c=>c.events=[]);
 const p=P.map(P.read(Buffer.from(JSON.stringify(envelope)))).project;assert(p.days.every(d=>d.date===''));
 const local=P.map(P.read(raw)).project;local.days[0].sheetOverrides.departmentNotes='Local reviewed department instructions';
 const updated=JSON.parse(raw);const source=updated.workspace.projects[0],tag=source.elements.find(e=>source.categories.find(c=>c.id===e.category).ucid===110);tag.name='SOURCE updated camera requirement';
 const merged=P.merge(local,P.map(P.read(Buffer.from(JSON.stringify(updated)))).project);
 assert.equal(merged.project.days[0].sheetOverrides.departmentNotes,'Local reviewed department instructions');assert(merged.conflicts.some(x=>x.includes('departmentNotes')));
});
test('calendar uses Monday-first UTC date cells across leap years, DST, year boundaries and empty/gapped shoots',()=>{
 assert.equal(Days.monthGrid('2026-11')[0],'2026-10-26');assert.equal(Days.monthGrid('2026-11').length,42);assert(Days.monthGrid('2028-02').includes('2028-02-29'));assert(!Days.monthGrid('2026-02').includes('2026-02-29'));
 assert.equal(Days.shiftMonth('2026-12',1),'2027-01');assert.equal(Days.shiftMonth('2026-01',-1),'2025-12');assert.equal(Days.shiftMonth('1900-01',-1),'1900-01');assert.equal(Days.shiftMonth('2100-12',1),'2100-12');assert.throws(()=>Days.monthGrid('2026-13'));
 const days=[{id:'later',date:'2027-01-05'},{id:'A',date:'2026-11-02'},{id:'B',date:'2026-11-02'},{id:'unknown',date:''}];assert.deepEqual(Days.months(days),['2026-11','2027-01']);assert.deepEqual(Days.ordered(days).map(d=>d.id),['A','B','later','unknown']);assert.deepEqual(Days.months([]),[]);
});
