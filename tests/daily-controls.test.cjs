'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const D=require('../core/domain.cjs'),Archive=require('../core/archive.cjs'),{Store}=require('../core/store.cjs');
const {renderSheet}=require('../core/sheet.cjs'),Availability=require('../web/availability.js'),Details=require('../web/production-details.js');

function fixture(){
 const p=D.newProject('Synthetic shooting-day controls');
 const d=p.days[0];
 d.date='2026-03-08';
 p.locations.push({id:'stage',name:'Stage',address:'Shooting street',basecampAddress:'Catalog Basecamp',parking:'Catalog parking',hospital:'Catalog emergency',emergencyPhone:'555',verified:true,latitude:40.7,longitude:-74,zone:'America/Phoenix'});
 p.defaults.primaryLocationId='stage';
 return {p,d,loc:p.locations[0]};
}

test('drafts use the catalog address and production header while retaining stored legacy day text',()=>{
 const {p,d,loc}=fixture();
 p.sheetDefaults.header='Production office';
 p.sheetDefaults.basecamp='Legacy production address';
 p.sheetDefaults.high='20';
 p.sheetDefaults.hospitalNotes='Legacy production route';
 Object.assign(d.sheetOverrides,{header:'Legacy daily office',basecamp:'Legacy daily address',basecampNotes:'Daily basecamp directions',high:'0',hospitalNotes:''});
 for(const preset of ['gcasper','narrative']){
  d.layout.preset=preset;
  const resolved=D.resolve(p,d.id),html=renderSheet(resolved,'');
  assert.equal(resolved.sheet.header,'Production office');
  for(const value of ['Catalog Basecamp','Daily basecamp directions'])assert(html.includes(value),value);
  if(preset==='gcasper')assert(html.includes('Production office'));
  for(const value of ['Legacy daily office','Legacy daily address','Legacy production address','Legacy production route'])assert(!html.includes(value),value);
  assert.equal(resolved.sheet.high,'0');
 }
 assert.equal(d.sheetOverrides.header,'Legacy daily office');
 assert.equal(d.sheetOverrides.basecamp,'Legacy daily address');
 assert.equal(p.sheetDefaults.basecamp,'Legacy production address');
 delete loc.basecampAddress;
 assert.deepEqual(Details.logistics(D.resolve(p,d.id)).basecamp,{address:'',notes:'Daily basecamp directions'});
 d.overrides.primaryLocationId='';
 assert.deepEqual(Details.logistics(D.resolve(p,d.id)).basecamp,{address:'',notes:'Daily basecamp directions'});
});

test('zone selection controls DST review, lunch, forecast context and cross-zone availability with legacy fallback',()=>{
 const {p,d,loc}=fixture();
 const person={id:'crew',type:'crew',name:'Crew',role:'',department:'',character:'',email:'',phone:''};
 p.people.push(person);
 d.calls.push({id:'call',personId:person.id,call:'07:00',offset:0,pickup:'',makeup:'',ready:'',notes:''});
 Availability.set(p,person.id,d.date,{state:'windows',windows:[{start:'06:30',end:'07:30',nextDay:false}]});
 d.overrides.generalCall='01:30';
 assert.equal(p.defaults.zone,'America/New_York');
 assert.equal(D.resolve(p,d.id).lunch.time,'07:30');
 assert.equal(Availability.assess(p,d,person).status,'conflict');
 d.weather={mode:'nws',summary:'Old zone',approved:true,key:D.weatherKey(d,loc,'America/Phoenix'),fetchedAt:new Date().toISOString(),highC:18};
 assert.equal(D.resolve(p,d.id).sheet.high,'18');
 p.productionZoneSelected=true;
 let r=D.resolve(p,d.id);
 assert.equal(r.values.zone,'America/New_York');
 assert.equal(r.solar.zone,r.values.zone);
 assert.equal(r.lunch.time,'08:30');
 assert.equal(r.sheet.high,'');
 assert.equal(r.weather.stale,true);
 assert.equal(r.weather.approved,false);
 assert.equal(Availability.assess(p,d,person).status,'available');
 d.overrides.generalCall='02:30';
 assert.match(D.review(p,d.id).errors.join(' '),/skipped by daylight saving/);
 d.date='2026-11-01';
 d.overrides.generalCall='01:30';
 assert.match(D.review(p,d.id).errors.join(' '),/repeats/);
 d.overrides.zone='America/Phoenix';
 assert.equal(D.resolve(p,d.id).values.zone,'America/Phoenix');
 assert.equal(D.resolve(p,d.id).lunch.time,'07:30');
 delete d.overrides.zone;
 delete p.productionZoneSelected;
 loc.zone='';
 assert.equal(D.resolve(p,d.id).values.zone,'America/New_York');
});

test('a portable copy retains the production zone selection, original PDF and original snapshot',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'script-call-daily-controls-'));
 let store=new Store(dir);
 t.after(()=>{store.close();fs.rmSync(dir,{recursive:true,force:true});});
 const {p,d}=fixture();
 p.sheetDefaults.header='Original office';
 const created=store.create(p);
 const snapshot=D.resolve(p,d.id);
 snapshot.revision={id:D.id(),number:1,issued:new Date().toISOString()};
 snapshot.day.sheetOverrides.basecamp='Old manual address';
 snapshot.advanceDays[0].notes='Original advance text';
 const pdf=Buffer.from('%PDF-1.7 synthetic issued output');
 store.issue(p.id,d.id,created.version,snapshot,pdf);
 let saved=store.get(p.id);
 saved.project.defaults.zone='America/Los_Angeles';
 saved.project.productionZoneSelected=true;
 store.save(saved.project,saved.version);
 const issued=store.revision(p.id,saved.revisions[0].id);
 store.close();
 store=new Store(dir);
 const bytes=Archive.exportArchive(store,p.id);
 const manifest=JSON.parse(Buffer.from(require('fflate').unzipSync(bytes)['manifest.json']));
 assert.equal(manifest.minReaderVersion,13);
 const result=Archive.readArchive(bytes);
 assert.equal(result.project.productionZoneSelected,true);
 assert.equal(result.project.locations[0].zone,'America/Phoenix');
 assert.deepEqual(result.revisions[0].snapshot,issued.snapshot);
 assert.deepEqual(result.revisions[0].pdf,pdf);
 assert.match(renderSheet(result.revisions[0].snapshot,''),/Old manual address/);
 assert.match(renderSheet(result.revisions[0].snapshot,''),/Original advance text/);
});

test('Production Desk gives new imports Eastern Time and preserves local zones on reimport',()=>{
 const P=require('../core/productiondesk.cjs');
 const parsed=P.read(fs.readFileSync(path.join(__dirname,'fixtures/last-light.productiondesk')));
 const incoming=P.map(parsed).project;
 assert.equal(incoming.defaults.zone,'America/New_York');
 const legacy=D.clone(incoming);
 legacy.defaults.zone='';
 legacy.productionDesk.baseline.defaults.zone='';
 legacy.days[0].overrides.zone='America/Phoenix';
 assert.equal(P.merge(legacy,incoming).project.defaults.zone,'');
 legacy.defaults.zone='America/Los_Angeles';
 legacy.productionZoneSelected=true;
 const merged=P.merge(legacy,incoming).project;
 assert.equal(merged.defaults.zone,'America/Los_Angeles');
 assert.equal(merged.productionZoneSelected,true);
 assert.equal(merged.days[0].overrides.zone,'America/Phoenix');
});
