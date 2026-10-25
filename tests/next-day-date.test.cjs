'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
const Days=require('../web/day-management.js'),D=require('../core/domain.cjs'),{Store}=require('../core/store.cjs');
test('appended shooting date follows the final production record, independent of chronological sidebar order or deleted days',()=>{
 const p=D.newProject();p.days[0].date='2026-12-30';p.days.push(D.newDay(p,'2026-10-22'));p.deletedDays=[D.newDay(p,'2027-05-01')];const before=D.clone(p);
 assert.equal(Days.nextDayDate(p.days),'2026-10-23');const added=D.newDay(p);assert.equal(added.date,'2026-10-23');assert.deepEqual(p,before);assert.equal(Days.ordered(p.days).at(-1).date,'2026-12-30');
});
test('calendar successor handles month/year transitions, leap years and both DST transitions',()=>{
 for(const [previous,next] of [['2026-10-22','2026-10-23'],['2026-01-31','2026-02-01'],['2026-12-31','2027-01-01'],['2028-02-28','2028-02-29'],['2028-02-29','2028-03-01'],['2026-02-28','2026-03-01'],['2000-02-28','2000-02-29'],['2100-02-28','2100-03-01'],['2026-03-08','2026-03-09'],['2026-11-01','2026-11-02']])assert.equal(Days.nextDayDate([{date:previous}]),next,previous);
});
test('successor is host-timezone independent at DST and extreme UTC offsets',()=>{
 const modulePath=require.resolve('../web/day-management.js');const script=`const D=require(${JSON.stringify(modulePath)});process.stdout.write(JSON.stringify(['2026-03-08','2026-11-01','2026-12-31'].map(date=>D.nextDayDate([{date}]))));`;
 for(const TZ of ['Etc/UTC','America/Los_Angeles','America/New_York','Europe/London','Pacific/Kiritimati','Pacific/Pago_Pago'])assert.deepEqual(JSON.parse(execFileSync(process.execPath,['-e',script],{env:{...process.env,TZ},encoding:'utf8'})),['2026-03-09','2026-11-02','2027-01-01'],TZ);
});
test('first day and unusable final dates retain today fallback; explicit dates remain unchanged',()=>{
 const today='2026-07-12';for(const days of [[],[{date:''}],[{date:'invalid'}],[{date:'2026-02-30'}],[{date:'2026-10-22'},{date:''}],[{date:'2100-12-31'}]])assert.equal(Days.nextDayDate(days,today),today);
 const p=D.newProject();assert.equal(p.days[0].date,new Date().toISOString().slice(0,10));p.days[0].date='2026-10-22';assert.equal(D.newDay(p,'2026-10-22').date,'2026-10-22');assert.equal(D.newDay(p,'').date,'');
});
test('repeated additions follow manual previous-date changes through save/reopen without changing prior records',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'next-day-date-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));let store=new Store(dir),p=D.newProject();p.days[0].date='2026-12-31';const first=D.clone(p.days[0]);p.days.push(D.newDay(p));p.days.push(D.newDay(p));assert.deepEqual(p.days.map(d=>d.date),['2026-12-31','2027-01-01','2027-01-02']);p.days.at(-1).date='2028-02-28';const old=D.clone(p.days);let state=store.create(p);store.close();store=new Store(dir);state=store.get(p.id);state.project.days.push(D.newDay(state.project));state=store.save(state.project,state.version);assert.equal(state.project.days.at(-1).date,'2028-02-29');assert.deepEqual(state.project.days.slice(0,-1),old);assert.deepEqual(state.project.days[0],first);D.validateProject(state.project);store.close();
});
