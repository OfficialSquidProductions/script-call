'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const D=require('../../core/domain.cjs');

const zones={eastern:'America/New_York',phoenix:'America/Phoenix',pacific:'America/Los_Angeles',central:'America/Chicago'};
const text={
 catalog:'Catalog basecamp address',oldGlobal:'Old production basecamp address',oldDay:'Old daily basecamp address',
 office:'Current production office contact',oldOffice:'Old daily office contact',
 advance:'Old manual next day',advanceSecond:'Old manual second day',notes:'Separate notes from the daily editor'
};
const saved=(page)=>page.evaluate(()=>CallSheet.request('get',{id:document.body.dataset.projectId}));
const flush=(page)=>page.waitForFunction(()=>document.querySelector('#save-state').textContent==='Saved on this device');
const preview=(page,ids)=>page.evaluate(ids=>CallSheet.request('preview',ids),ids);
const field=(page,key)=>page.locator(`[data-bind="${key}"]`);

async function seed(page){
 const state=await page.evaluate(async({zones,text})=>{
  const saved=await CallSheet.request('get',{id:project.id});
  const p=saved.project,d=p.days[1],loc=p.locations[0];
  p.defaults.zone=zones.eastern;
  p.defaults.primaryLocationId=loc.id;
  loc.zone=zones.phoenix;
  loc.basecampAddress=text.catalog;
  Object.assign(p.sheetDefaults,{basecamp:text.oldGlobal,header:text.office,high:'19',low:'7',weatherIcon:'Cloudy',hospitalNotes:'Legacy hospital note',parkingNotes:'Legacy parking note'});
  for(const draft of [p.days[0],d]){
   Object.assign(draft.sheetOverrides,{header:text.oldOffice,basecamp:text.oldDay});
   Object.assign(draft,{advance:text.advance,advanceSecond:text.advanceSecond});
  }
  d.overrides.primaryLocationId=loc.id;
  d.overrides.zone=zones.phoenix;
  d.overrides.generalCall='01:30';
  d.lunchMode='auto';
  d.date='2026-03-08';
  d.weather.approved=true;
  p.days[2].date='2026-04-10';
  p.days[0].date='2026-04-11';
  for(const row of p.days[2].schedule.filter(row=>row.type==='scene'))p.scenes.find(s=>s.id===row.sceneId).slug='FIRSTQA';
  for(const row of p.days[0].schedule.filter(row=>row.type==='scene'))p.scenes.find(s=>s.id===row.sceneId).slug='SECONDQA';
  await CallSheet.request('save',{project:p,version:saved.version});
  const result=await CallSheet.request('get',{id:p.id});
  await useState(result);
  return result;
 },{zones,text});
 return {projectId:state.project.id,dayId:state.project.days[1].id,locationId:state.project.locations[0].id};
}

async function selectDay(page,id){
 await page.click('[data-view="calendar"]');
 await page.click('#days-overview');
 await page.locator(`#modal [data-day="${id}"]`).click();
 await page.waitForFunction(()=>!document.querySelector('#modal').open);
 await page.click('[data-view="daily"]');
}
async function saveZone(page,scope,value){
 await page.click('#settings');
 assert.equal(await page.locator('#settings-time-zone').count(),1);
 await page.locator('#settings-zone-scope').selectOption(scope);
 await page.locator('#settings-time-zone').selectOption(value);
 await page.click('#save-settings-zone');
 await page.waitForFunction(()=>document.querySelector('#toast').textContent==='Time zone saved.');
 await page.click('#modal-close');
}

async function accept({page,fixture,out,check,exportPDF,preset}){
 const {projectId,dayId,locationId}=fixture;
 await selectDay(page,dayId);
 await page.click('[data-section="overview"]');
 assert.equal(await page.locator('[data-bind$=".overrides.zone"]').count(),0);
 await page.click('[data-view="production"]');
 await page.click('[data-master="general"]');
 for(const key of ['basecamp','hospitalNotes','parkingNotes','high','low','weatherIcon'])assert.equal(await field(page,'sheetDefaults.'+key).count(),0,key);
 assert.equal(await field(page,'defaults.zone').count(),0);
 assert.equal(await field(page,'sheetDefaults.header').inputValue(),text.office);
 await page.click('[data-view="layout"]');
 for(const selector of ['.layout.paper','.layout.mono','timeDisplayClock','temperatureUnit']){
  assert.equal(await page.locator(`[data-layout-scope] [data-bind$="${selector}"]`).count(),0,selector);
 }
 await page.locator('#layout-preset').selectOption('gcasper');
 if(preset){
  await page.locator('#layout-preset').selectOption(preset.id);
  assert.equal((await saved(page)).project.id,projectId);
  await flush(page);
  assert.equal((await saved(page)).project.days.find(d=>d.id===dayId).layout.paper,'Letter');
  assert.equal((await saved(page)).project.days.find(d=>d.id===dayId).layout.mono,true);
  assert.deepEqual(await page.evaluate(()=>CallSheet.request('layoutPresets')),[preset]);
  await page.locator('#layout-preset').selectOption('gcasper');
 }
 await page.getByRole('button',{name:'Save Template…',exact:true}).click();
 await page.locator('#layout-template-name').fill('New daily controls QA preset');
 await page.locator('#modal').getByRole('button',{name:'Save Template',exact:true}).click();
 await page.waitForFunction(()=>!document.querySelector('#modal').open);
 assert.equal((await page.evaluate(()=>CallSheet.request('layoutPresets'))).length,preset?2:1);
 await page.locator('[data-layout-move="cast:down"]').click();
 await page.getByRole('button',{name:'Reload Preset',exact:true}).click();
 await page.getByRole('button',{name:'Undo preset change',exact:true}).click();
 await flush(page);
 check('removed layout and production controls are absent; preset recall, storage, reset, undo and section ordering are available');

 await page.click('[data-view="daily"]');
 await page.click('[data-section="notes"]');
 for(const key of ['advance','advanceSecond','header'])assert.equal(await page.locator(`[data-bind$=".${key}"]`).count(),0,key);
 const result=await preview(page,{projectId,dayId});
 for(const value of [text.office,'FIRSTQA','SECONDQA'])assert(result.html.includes(value),value);
 assert(result.html.indexOf('FIRSTQA')<result.html.indexOf('SECONDQA'));
 for(const value of [text.oldOffice,text.advance,text.advanceSecond])assert(!result.html.includes(value),value);
 await page.click('[data-section="logistics"]');
 const basecamp=page.locator('fieldset.location-place').filter({has:page.locator('legend').getByText('Basecamp',{exact:true})});
 assert.match(await basecamp.innerText(),new RegExp(text.catalog));
 assert.equal(await basecamp.locator('input,textarea,select').count(),1);
 await basecamp.locator('summary').click();
 assert.match(await basecamp.innerText(),new RegExp(text.oldDay));
 assert.match(await basecamp.innerText(),new RegExp(text.oldGlobal));
 const location=field(page,'days.1.overrides.primaryLocationId');
 assert.equal(await location.inputValue(),locationId);
 await location.selectOption('');
 await basecamp.getByText('Choose a primary location',{exact:true}).waitFor();
 await location.selectOption(locationId);
 await basecamp.getByText(text.catalog,{exact:true}).waitFor();
 await basecamp.locator('textarea').fill(text.notes);
 await page.click('[data-section="weather"]');
 assert.equal(await field(page,'days.1.sheetOverrides.weatherIcon').inputValue(),'Cloudy');
 await field(page,'days.1.sheetOverrides.weatherIcon').selectOption('Sunny');
 const high=field(page,'days.1.sheetOverrides.high');
 await high.fill('21');
 await high.press('Tab');
 await flush(page);
 const draft=await saved(page);
 assert.equal(draft.project.sheetDefaults.high,'19');
 assert.equal(draft.project.days[1].sheetOverrides.high,'21');
 assert.equal(draft.project.days[1].sheetOverrides.basecamp,text.oldDay);
 const changed=await preview(page,{projectId,dayId});
 for(const value of [text.catalog,text.notes,'Sunny','21°C'])assert(changed.html.includes(value),value);
 assert(!changed.html.includes(text.oldDay));
 const file=path.join(out,'new-draft-with-catalog.pdf');
 await exportPDF(file);
 const printed=JSON.parse(execFileSync('/usr/bin/osascript',['-l','JavaScript',path.join(__dirname,'pdf-text.js'),file],{encoding:'utf8'})).join(' ').replace(/\s+/g,'');
 for(const value of [text.catalog,text.notes,text.office,'FIRSTQA','SECONDQA'])assert(printed.includes(value.replace(/\s+/g,'')),value);
 for(const value of [text.oldDay,text.oldOffice,text.advance])assert(!printed.includes(value.replace(/\s+/g,'')),value);
 check('exact draft preview and PDF use the catalog address, separate notes, production office and two chronological advance schedules');

 assert.equal(result.display.zone,zones.phoenix);
 assert.equal(result.lunch.time,'07:30');
 await page.click('#settings');
 assert.equal(await page.locator('#settings-time-zone').inputValue(),zones.eastern);
 assert.match(await page.locator('#settings-time-zone option:checked').innerText(),/Eastern Time \(EDT\)/);
 assert.match(await page.locator('#settings-zone-picker').innerText(),/America\/Phoenix/);
 await page.screenshot({path:path.join(out,'settings-time-zone.png')});
 await page.click('#modal-close');
 await saveZone(page,'production',zones.pacific);
 let state=await saved(page);
 assert.equal(state.project.defaults.zone,zones.pacific);
 assert.equal(state.project.days[1].overrides.zone,zones.phoenix);
 assert.equal((await preview(page,{projectId,dayId})).display.zone,zones.phoenix);
 await saveZone(page,'day','inherit');
 let fresh=await preview(page,{projectId,dayId});
 assert.equal(fresh.display.zone,zones.pacific);
 assert.equal(fresh.solar.zone,zones.pacific);
 assert.equal(fresh.lunch.time,'08:30');
 assert.equal((await saved(page)).project.days[1].weather.approved,false);
 await saveZone(page,'day',zones.central);
 await page.reload();
 await page.waitForFunction(()=>document.querySelector('#save-state')?.textContent==='Saved on this device');
 await page.selectOption('#production',projectId);
 await page.waitForFunction(id=>document.body.dataset.projectId===id,projectId);
 state=await saved(page);
 assert.equal(state.project.days[1].overrides.zone,zones.central);
 assert.equal(state.project.locations[0].zone,zones.phoenix);
 assert.equal(state.project.days[1].sheetOverrides.basecampNotes,text.notes);
 assert.equal((await preview(page,{projectId,dayId})).display.zone,zones.central);
 check('Settings keeps production and legacy day choices, applies inherited zones to solar and DST lunch, and persists after reload');
}

module.exports={seed,accept,selectDay,text};
