'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const runtime=require('./runtime.cjs'),{seed,accept}=require('./support/daily-controls.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/daily-controls'),bundle=process.env.CALLSHEET_PACKAGED_APP;
fs.mkdirSync(out,{recursive:true});
const profile=fs.mkdtempSync(path.join(root,'tmp/daily-controls-')),checks=[],errors=[];
const check=message=>{checks.push(message);console.log('PASS',message);};
(async()=>{
 const app=await runtime.playwright._electron.launch({
  executablePath:bundle?path.join(bundle,'Contents/MacOS/Script Call'):runtime.electron,
  args:bundle?[]:[root],env:{...process.env,CALLSHEET_DATA_DIR:profile}
 });
 try{
  const page=await app.firstWindow();
  page.setDefaultTimeout(15000);
  page.on('pageerror',error=>errors.push(error.message));
  await page.waitForFunction(()=>document.querySelector('#save-state')?.textContent==='Saved on this device');
  const boot=await page.evaluate(()=>CallSheet.request('bootstrap'));
  assert.equal(boot.dataDirectory,profile);
  await require('./support/project-fixtures.cjs').loadFixture(page);
  const fixture=await seed(page);
  async function exportPDF(file){
   await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},file);
   await page.click('#export-pdf');
   await page.waitForFunction(file=>document.querySelector('#toast').textContent.includes(file),file);
   return fs.readFileSync(file);
  }
  await accept({page,fixture,out,check,exportPDF});
  await page.click('#new-production');
  await page.fill('#new-production-title','New Eastern QA production');
  await page.locator('#modal [data-modal-action="0"]').click();
  await page.waitForFunction(()=>!document.querySelector('#modal').open);
  const fresh=await page.evaluate(()=>CallSheet.request('get',{id:document.body.dataset.projectId}));
  assert.equal(fresh.project.defaults.zone,'America/New_York');
  assert.equal(fresh.project.productionZoneSelected,undefined);
  assert.deepEqual(fresh.project.days[0].sheetOverrides,{});
  for(const key of ['high','low','parkingNotes','hospitalNotes','basecamp'])assert.equal(fresh.project.sheetDefaults[key],'');
  assert.equal(fresh.project.sheetDefaults.weatherIcon,'None');
  await page.click('[data-view="daily"]');
  await page.click('[data-section="overview"]');
  await page.locator('[data-bind="days.0.date"]').fill('2026-01-15');
  await page.click('#settings');
  assert.match(await page.locator('#settings-time-zone option:checked').innerText(),/Eastern Time \(EST\)/);
  check('new production defaults to Eastern Time with the correct seasonal label and blank daily logistics and weather');
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({status:'passed',version:boot.version,checks,errors},null,2)+'\n');
 }finally{await app.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
