'use strict';
const {_electron}=require('./runtime.cjs').playwright,assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/layout-presets'),profile=fs.mkdtempSync(path.join(root,'tmp/layout-presets-'));
fs.mkdirSync(out,{recursive:true});
let app,page;
const checks=[],errors=[],check=message=>{checks.push(message);console.log('PASS',message);};
const state=()=>page.evaluate(()=>CallSheet.request('get',{id:document.body.dataset.projectId}));
const presets=()=>page.evaluate(()=>CallSheet.request('layoutPresets'));
const pane=()=>page.locator('[data-layout-scope]');
const row=key=>pane().locator(`[data-layout-row="${key}"]`);
const action=name=>page.locator('#modal').getByRole('button',{name,exact:true});
const modalClosed=()=>page.waitForFunction(()=>!document.querySelector('#modal').open);
const order=()=>pane().locator('[data-layout-row]').evaluateAll(rows=>rows.map(row=>row.dataset.layoutRow));
async function launch(){
 const bundle=process.env.CALLSHEET_PACKAGED_APP;
 app=await _electron.launch({executablePath:bundle?path.join(bundle,'Contents/MacOS/Script Call'):require('./runtime.cjs').electron,args:bundle?[]:[root],env:{...process.env,CALLSHEET_DATA_DIR:profile}});
 page=await app.firstWindow();page.setDefaultTimeout(12000);page.on('pageerror',error=>errors.push(error.message));
 await page.waitForFunction(()=>document.querySelector('#save-state').textContent==='Saved on this device');
 assert.equal((await page.evaluate(()=>CallSheet.request('bootstrap'))).dataDirectory,profile);
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1500,980));
}
async function select(id){
 await page.selectOption('#production',id);
 await page.waitForFunction(id=>document.body.dataset.projectId===id,id);
}
async function layout(){await page.click('[data-view="layout"]');await pane().waitFor();}
async function flush(){await page.click('#save');await page.waitForFunction(()=>document.querySelector('#save-state').textContent==='Saved on this device');}
async function nameDialog(value){
 await pane().locator('[data-action="save-layout-template"]').click();
 await page.fill('#layout-template-name',value);
}
async function saveTemplate(value){await nameDialog(value);await action('Save Template').click();await modalClosed();}
async function pdf(name){
 const file=path.join(out,name);
 await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},file);
 await page.click('#export-pdf');
 await page.waitForFunction(file=>document.querySelector('#toast').textContent.includes(file),file);
 return fs.readFileSync(file);
}
async function pointerDrag(source,target,{after=false,invalid=false}={}){
 await target.scrollIntoViewIfNeeded();await source.scrollIntoViewIfNeeded();
 const a=await source.boundingBox(),b=await target.boundingBox();assert(a&&b);
 const x=a.x+24,y=a.y+a.height/2,tx=b.x+26,ty=after?b.y+b.height-6:b.y+6;
 assert.equal(await source.evaluate((el,{x,y})=>el.contains(document.elementFromPoint(x,y)),{x,y}),true);
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+15,y,{steps:5});
 await page.mouse.move(tx,ty,{steps:12});await page.mouse.move(tx+1,ty);
 if(!invalid)assert.equal(await target.evaluate((el,after)=>el.classList.contains('layout-insert-'+(after?'after':'before')),after),true);
 await page.mouse.up();
}
function verifyPrintedOrder(name,style){
 const file=path.join(out,name);
 const pages=JSON.parse(execFileSync('/usr/bin/osascript',['-l','JavaScript',path.join(__dirname,'support/pdf-text.js'),file],{encoding:'utf8'})).map(text=>text.replace(/\s+/g,'').toLowerCase());
 const headings=[style==='gcasper'?'totalpages':'dailyschedule','syntheticsafetyplaceholder','productionnotes'];
 const front=pages.findIndex(page=>headings.every(heading=>page.includes(heading)));
 assert(front>=0,`PDF must contain ${headings.join(', ')} on the same page. Got: ${pages.join(' || ')}`);
 const [first,middle,last]=headings.map(heading=>pages[front].indexOf(heading));
 assert(first<middle&&middle<last,`PDF heading order is wrong: ${pages[front]}`);
 if(style==='gcasper'){
  const crew=pages.findIndex(page=>page.includes('crewcalls/unit'));
  assert(crew>front,'G-Casper crew calls must print on a separate later page');
  assert(!pages[crew].includes('syntheticsafetyplaceholder'));
 }
}
async function openDemo(){
 await require('./support/project-fixtures.cjs').loadFixture(page);
 await page.waitForFunction(()=>document.querySelector('#heading').textContent.includes('Day 01'));
}
(async()=>{try{
 await launch();await openDemo();
 const original=await state(),productionId=original.project.id,firstId=original.project.days[0].id;
 await layout();
 assert.equal(await pane().locator('#layout-preset').count(),1);assert.equal(await pane().locator('.template-card').count(),0);
 assert.deepEqual(await pane().locator('#layout-preset option').evaluateAll(els=>els.map(el=>el.value)),['gcasper','compact','narrative','commercial']);
 assert.equal(await pane().locator('[data-action="save-layout-template"]').evaluate(el=>el.closest('.layout-save')===el.closest('[data-layout-scope]').lastElementChild),true);
 for(const title of ['Synthetic safety placeholder','Synthetic second box']){
  await pane().locator('[data-action="custom-section"]').click();
  await pane().locator('[data-layout-custom] input').last().fill(title);
  await pane().locator('[data-layout-custom] textarea').last().fill('Synthetic source-day text for '+title);
 }
 const [first,second]=(await order()).filter(key=>key.startsWith('custom:'));
 assert.equal(await row(first).locator('[data-layout-order-name]').innerText(),'Synthetic safety placeholder');
 assert.equal(await pane().getByText('Fixed in header',{exact:true}).count(),1);
 assert.equal(await pane().getByText('Fixed on back',{exact:true}).count(),1);
 await pane().locator('[data-bind="days.0.layout.paper"]').selectOption('Letter');
 await pane().locator('[data-bind="days.0.layout.mono"]').check();
 await pane().locator('[data-bind="days.0.layout.includeContacts"]').check();
 await flush();
 const beforeDrag=await order();
 await pointerDrag(row(first),pane().getByText('Fixed on back',{exact:true}).locator('..'),{invalid:true});
 assert.deepEqual(await order(),beforeDrag);
 const text=pane().locator('[data-layout-custom] textarea').first();
 await text.evaluate(el=>{el.focus({preventScroll:true});el.setSelectionRange(2,12,'backward');});
 await pointerDrag(row(first),row('schedule'));
 assert.equal((await order())[0],first);
 assert.deepEqual(await text.evaluate(el=>[el===document.activeElement,el.selectionStart,el.selectionEnd,el.selectionDirection]),[true,2,12,'backward']);
 const scheduleUp=row('schedule').getByRole('button',{name:'Move Daily schedule up'});
 const scheduleDown=row('schedule').getByRole('button',{name:'Move Daily schedule down'});
 await scheduleUp.press('Enter');
 assert.equal(await scheduleDown.evaluate(el=>el===document.activeElement),true);
 await scheduleDown.press('Enter');
 await pointerDrag(row('notes'),row('schedule'),{after:true});
 assert.equal((await order()).indexOf('notes'),(await order()).indexOf('schedule')+1);
 const button=row(second).getByRole('button',{name:'Move Synthetic second box up'});
 await button.press('Enter');
 assert.equal(await button.evaluate(el=>document.activeElement===el),true);
 const arranged=await order();
 assert(arranged.indexOf(second)<arranged.indexOf('advance'));
 assert.equal(await pane().locator('[data-layout-custom] textarea').first().inputValue(),'Synthetic source-day text for Synthetic safety placeholder');
 await page.waitForFunction(()=>{
  const doc=document.querySelector('#preview')?.contentDocument,front=doc?.querySelector('[data-side="front"]');
  const custom=front?.querySelector('.custom'),schedule=front?.querySelector('[data-section="schedule"]');
  return custom&&schedule&&!!(custom.compareDocumentPosition(schedule)&4)&&!!doc.querySelector('[data-side="back"]');
 });
 await page.screenshot({path:path.join(out,'order-with-custom.png')});
 check('single Presets selector, bottom Save Template, actual built-in and custom drags, fixed G-Casper pages and printed order');
 await pointerDrag(row(first),row('schedule'),{after:true});
 assert.deepEqual((await order()).slice(0,3),['schedule',first,'notes']);
 await pane().locator('[data-hide="advance"]').uncheck();
 await nameDialog('Cancel this synthetic preset');
 await page.keyboard.press('Escape');await modalClosed();assert.deepEqual(await presets(),[]);
 await nameDialog('  ');await action('Save Template').click();
 assert.match(await page.locator('#modal-error').innerText(),/template name/);
 await action('Cancel').click();await modalClosed();
 await saveTemplate('  Synthetic   Travel Pack  ');
 const [preset]=await presets();assert.equal(preset.name,'Synthetic Travel Pack');
 assert.equal(preset.layout.paper,'Letter');assert.equal(preset.layout.mono,true);
 assert(!JSON.stringify(preset).includes('Synthetic source-day text'));
 assert.equal(await page.inputValue('#layout-preset'),preset.id);
 await nameDialog('synthetic travel pack');await action('Save Template').click();
 await page.waitForFunction(()=>document.querySelector('#modal-error').textContent.includes('already exists'));
 await action('Cancel').click();await modalClosed();
 assert.deepEqual(await presets(),[preset]);
 await saveTemplate('Synthetic Save As');
 assert.equal((await presets()).length,2);
 assert.equal((await state()).project.days[0].id,firstId);
 assert.equal((await state()).project.days[0].layout.includeContacts,true);
 check('custom name normalization, cancel and duplicate rejection preserve data; Save As keeps both presets and the selected day');
 await page.selectOption('#layout-preset','narrative');
 assert.equal(await row('crew').count(),1);
 await pointerDrag(row('crew'),row('logistics'));
 await flush();
 assert.equal((await state()).project.days[0].layout.order[0],'crew');
 await pointerDrag(row(first),row('notes'),{after:true});
 await pointerDrag(row(first),row('schedule'),{after:true});
 await saveTemplate('Synthetic Narrative PDF');
 const narrative=(await presets()).find(item=>item.name==='Synthetic Narrative PDF');
 assert.equal(narrative.layout.preset,'narrative');
 await page.selectOption('#layout-preset',preset.id);await flush();
 assert.equal(await row('crew').count(),0);
 assert.equal(await pane().locator('[data-layout-custom] textarea').first().inputValue(),'Synthetic source-day text for Synthetic safety placeholder');
 await page.click('[data-view="production"]');await page.click('[data-master="locations"]');
 await require('./support/location-cards.cjs').expandLocations(page);
 await page.locator('[data-bind="locations.0.verified"]').check();
 await page.click('[data-view="daily"]');
 assert.equal(await page.locator('#layout-preset,[data-layout-scope]').count(),0);
 await page.click('#issue');await page.check('#ack-warnings');await action('Issue revision').click();await modalClosed();
 const issued=await state(),beforePDF=await pdf('issued-before-preset-reuse.pdf');
 assert.equal(beforePDF.subarray(0,5).toString(),'%PDF-');
 await app.close();app=null;await launch();await select(productionId);
 const resumed=await state();assert.equal(resumed.project.days[0].lockedRevisionId,issued.revisions[0].id);
 await layout();assert.equal(await page.locator('#layout-preset').count(),0);
 assert.equal((await presets()).length,3);
 await page.click('#new-production');await page.fill('#new-production-title','Synthetic second layout production');
 await page.locator('#modal [data-modal-action="0"]').click();await modalClosed();
 const other=await state();assert.notEqual(other.project.id,productionId);
 await layout();
 await page.selectOption('[data-bind="timeDisplayClock"]','12');
 await page.selectOption('[data-bind="temperatureUnit"]','F');
 await page.selectOption('#layout-preset',preset.id);await flush();
 const applied=(await state()).project.days[0].layout;
 assert.deepEqual(applied.custom.map(c=>c.title),preset.layout.custom.map(c=>c.title));
 assert(applied.custom.every(c=>c.text===''));
 assert.equal(applied.includeContacts,false);
 assert.equal(applied.paper,'Letter');assert.equal(applied.mono,true);
 assert.equal(await page.inputValue('#layout-preset'),preset.id);
 await page.reload();await page.waitForFunction(()=>document.querySelector('#save-state').textContent==='Saved on this device');await select(other.project.id);await layout();
 assert.equal(await page.inputValue('#layout-preset'),preset.id);
 for(const [style,id] of [['gcasper',preset.id],['narrative',narrative.id]]){
  await page.selectOption('#layout-preset',id);await flush();
  const {project:appliedProject}=await state();
  assert.equal(appliedProject.timeDisplayClock,'12');
  assert.equal(appliedProject.temperatureUnit,'F');
  assert.equal(await page.inputValue('[data-bind="timeDisplayClock"]'),'12');
  assert.equal(await page.inputValue('[data-bind="temperatureUnit"]'),'F');
  const file='after-relaunch-'+style+'.pdf';
  await pdf(file);verifyPrintedOrder(file,style);
 }
 check('fresh PDF exports after relaunch and recall interleave a custom section between two built-ins in both styles, retain the G-Casper crew back and keep time and temperature settings');
 await select(productionId);await page.click('[data-view="daily"]');
 assert.deepEqual(await pdf('issued-after-preset-reuse.pdf'),beforePDF);
 assert.deepEqual((await state()).revisions,issued.revisions);
 check('named layouts survive relaunch and apply to another production with blank custom text; original issued PDF and revision stay byte-identical');
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({status:'passed',checks,profile,errors},null,2)+'\n');
}finally{if(app)await app.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
