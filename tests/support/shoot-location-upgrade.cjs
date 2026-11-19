'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const file=path.resolve(__dirname,'../fixtures/shoot-locations.productiondesk');
const P=require('../../core/productiondesk.cjs');
const parsed=P.read(fs.readFileSync(file));
const rawLocations=new Map(parsed.source.elements.filter(el=>el.category===parsed.source.categories.find(c=>c.ucid===6).id).map(el=>[el.name,el.id]));
const stage=rawLocations.get('Harbor Studio Stage'),yard=rawLocations.get('Harbor Studio Yard');
const edited=rawLocations.get('Old audition room'),referenced=rawLocations.get('Scouted warehouse');
const obsolete=rawLocations.get('Early location choice'),empty=rawLocations.get('  ');
const dates=['2026-12-04','2026-12-07','2026-12-08','2026-12-09'];
const state=page=>page.evaluate(()=>CallSheet.request('get',{id:document.body.dataset.projectId}));
async function choose(app,page){
 await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},file);
 await page.click('#import-productiondesk');
 await page.waitForSelector('#pd-scenario');
}
async function commit(page){
 await page.click('[data-modal-action="0"]');
 await page.waitForFunction(()=>!document.querySelector('#modal').open);
 await page.waitForFunction(()=>{
  const selected=document.body.dataset.projectId;
  return selected&&document.querySelector('#production option:checked')?.textContent==='Shoot Location QA';
 });
 return state(page);
}
async function productionLocations(page){
 await page.click('[data-view="production"]');
 await page.click('[data-master="locations"]');
 return page.locator('[data-location-card]>summary span').allTextContents();
}
function verifyImportData(project){
 assert.deepEqual(project.days.map(d=>d.date),dates);
 assert.equal(project.scenes.length,12);
 assert.equal(project.people[0].character,'RILEY');
 assert.equal(project.people[0].role,'Cast');
 assert.match(project.days[0].sheetOverrides.departmentNotes,/Red production binder/);
}
async function fresh(app,page,check){
 await choose(app,page);
 assert.match(await page.locator('#modal-body').innerText(),/12 scenes · 2 shoot locations/);
 const {project}=await commit(page);
 verifyImportData(project);
 assert.deepEqual(project.locations.map(loc=>loc.id),[stage,yard]);
 assert.deepEqual(project.days.map(d=>d.overrides.primaryLocationId),[stage,yard,'','']);
 assert.deepEqual(project.scenes.slice(8).map(scene=>scene.locationId),[stage,'','',yard]);
 assert.deepEqual(await productionLocations(page),['Harbor Studio Stage','Harbor Studio Yard']);
 check('native exporter fixture imports 12 distinct headings into two physical Locations with exact IDs, dates, cast and department notes');
}
async function seed(app,page,check){
 await choose(app,page);
 const {project,version}=await commit(page);
 assert(!project.productionDesk.shootLocationMapping);
 assert.deepEqual(project.locations.map(l=>l.id),[stage,yard,edited,referenced,obsolete,empty]);
 const location=project.locations.find(loc=>loc.id===stage);
 Object.assign(location,{address:'15 Fictional Stage Way',zone:'Etc/UTC',hospital:'Fictional medical centre',emergencyPhone:'555-0100',verified:true});
 project.defaults.generalCall='07:00';
 project.people[0].name='Local fictional performer';
 project.locations.find(l=>l.id===edited).address='20 Fictional Lane';
 project.scenes[9].locationId=referenced;
 const manual={...location,id:'manually-added-local',address:'99 Fictional Drive'};
 delete manual.sourceId;
 project.locations.push(manual);
 const saved=await page.evaluate(args=>CallSheet.request('save',args),{project,version});
 const dayId=project.days[0].id;
 const issued=await page.evaluate(args=>CallSheet.request('issue',args),{projectId:project.id,dayId,version:saved.version,acknowledgeWarnings:true});
 const revisionId=issued.revisions.find(r=>r.dayId===dayId).id;
 async function exportIssued(targetPage,targetApp,filename){
  await targetApp.evaluate(({dialog},filename)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:filename});},filename);
  await targetPage.evaluate(args=>CallSheet.request('exportPDF',args),{projectId:project.id,dayId,revisionId});
  return fs.readFileSync(filename);
 }
 check('exact signed 0.3.18 imports the exporter fixture, saves local location edits and issues a real PDF');
 return {projectId:project.id,lockedDay:issued.project.days[0],exportIssued};
}
async function reconcile(app,page,before,out,check){
 await page.selectOption('#production',before.projectId);
 await page.waitForFunction(id=>document.body.dataset.projectId===id,before.projectId);
 const legacy=await state(page);
 const pdf=await before.exportIssued(page,app,path.join(out,'shoot-location-before-reimport.pdf'));
 await choose(app,page);
 assert.equal(await page.locator('#modal-title').textContent(),'Review Production Desk update');
 assert.match(await page.locator('#modal-body').innerText(),/Unused imported locations to remove \(2\)/);
 assert.match(await page.locator('#modal-body').innerText(),/Early location choice/);
 assert.deepEqual(await state(page),legacy);
 await page.click('[data-modal-cancel]');
 assert.deepEqual(await state(page),legacy);
 await choose(app,page);
 const {project}=await commit(page);
 assert.equal(project.id,before.projectId);
 assert.deepEqual(project.locations.map(loc=>loc.id),[stage,yard,edited,referenced,'manually-added-local']);
 assert.equal(project.locations.find(loc=>loc.id===edited).address,'20 Fictional Lane');
 assert.equal(project.locations.find(loc=>loc.id===stage).address,'15 Fictional Stage Way');
 assert.equal(project.locations.find(loc=>loc.id==='manually-added-local').address,'99 Fictional Drive');
 assert.deepEqual(project.scenes.slice(8).map(scene=>scene.locationId),[stage,referenced,'',yard]);
 assert.deepEqual(project.days.map(d=>d.overrides.primaryLocationId),[stage,yard,'','']);
 assert.deepEqual(project.days[0],before.lockedDay);
 verifyImportData(project);
 assert.equal(project.people[0].name,'Local fictional performer');
 assert.deepEqual(await before.exportIssued(page,app,path.join(out,'shoot-location-after-reimport.pdf')),pdf);
 await choose(app,page);
 assert.equal(await page.locator('#modal-title').textContent(),'Production already imported');
 await page.click('[data-modal-cancel]');
 check('same-file 0.3.18 reimport previews/cancels safely, removes two unedited unused rows, and preserves local addresses, references and exact issued PDF bytes');
}
module.exports={fresh,seed,reconcile};
