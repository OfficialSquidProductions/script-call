'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {_electron}=require('./runtime.cjs').playwright;
const root=path.resolve(__dirname,'..');
const profile=fs.mkdtempSync(path.join(root,'tmp/desktop-fixes-'));
const output=path.join(root,'verification/desktop-fixes');
fs.mkdirSync(output,{recursive:true});
const packaged=process.env.CALLSHEET_PACKAGED_APP;
let app,page;
const errors=[];
async function launch(){
 app=await _electron.launch({
  executablePath:packaged?path.join(packaged,'Contents/MacOS/Script Call'):require('./runtime.cjs').electron,
  args:packaged?[]:[root],
  env:{...process.env,CALLSHEET_DATA_DIR:profile}
 });
 page=await app.firstWindow();
 page.on('pageerror',error=>errors.push(error.message));
 await page.waitForFunction(()=>document.querySelector('#save-state')?.textContent==='Saved on this device');
 assert.equal((await page.evaluate(()=>CallSheet.request('bootstrap'))).dataDirectory,profile);
}
async function flush(){
 await page.waitForFunction(()=>document.querySelector('#save-state').textContent==='Saved on this device');
}
async function menu(label,item){
 await app.evaluate(({Menu,BrowserWindow},{label,item})=>{
  const entry=Menu.getApplicationMenu().items.find(entry=>entry.label===label)?.submenu?.items.find(entry=>entry.label===item);
  if(!entry)throw Error('Missing menu item: '+label+' → '+item);
  entry.click(entry,BrowserWindow.getAllWindows()[0]);
 },{label,item});
}
async function openSettings(){
 await page.click('#settings');
 await page.waitForFunction(()=>document.querySelector('#modal-title').textContent==='Settings & help');
}
const configured=selector=>page.locator('#modal '+selector);
const editor=()=>page.locator('[data-layout-scope]');
const readState=()=>page.evaluate(()=>CallSheet.request('get',{id:document.body.dataset.projectId}));

async function verifySettings(){
 assert.equal(await page.getByRole('button',{name:/create.*local backup/i}).count(),0);
 assert.equal(await page.getByRole('button',{name:/check for updates/i}).count(),0);
 assert(fs.readdirSync(path.join(profile,'backups')).some(name=>name.endsWith('.sqlite')));
 await openSettings();
 assert.equal(await page.locator('#modal .settings-row').count(),3);
 assert.equal(await page.getByRole('button',{name:'Check for Updates',exact:true}).count(),1);
 await configured('[name="time-display"][value="12"]').check();
 await page.waitForFunction(()=>!document.querySelector('[name="time-display"]').disabled);
 await configured('[name="temperature-display"][value="F"]').check();
 await page.waitForFunction(()=>!document.querySelector('[name="temperature-display"]').disabled);
 await page.screenshot({path:path.join(output,'settings.png')});
 await page.getByRole('button',{name:'Check for Updates',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#modal-title').textContent==='Script Call updates');
 const status=await page.evaluate(()=>CallSheet.request('updateStatus'));
 assert.equal(status.status,packaged?'current':'disabled');
 await page.click('#modal-close');
 await menu('Script Call','Check for Updates…');
 await page.waitForFunction(()=>document.querySelector('#modal-title').textContent==='Script Call updates');
 await page.click('#modal-close');
 await app.close();app=null;await launch();
 await openSettings();
 assert(await configured('[name="time-display"][value="12"]').isChecked());
 assert(await configured('[name="temperature-display"][value="F"]').isChecked());
 await page.click('#modal-close');
 await page.click('#new-production');
 await page.fill('#new-production-title','Desktop controls QA');
 await page.getByRole('button',{name:'Create production',exact:true}).click();
 await page.waitForFunction(()=>!document.querySelector('#modal').open);
 const {project}=await readState();
 assert.equal(project.timeDisplayClock,'12');
 assert.equal(project.temperatureUnit,'F');
 console.log('PASS settings rows, device/production persistence, automatic backup, Settings and native menu actions');
}

async function seedLongLists(){
 const {project,version}=await readState();
 const day=project.days[0];
 day.layout.custom=Array.from({length:12},(_,i)=>({title:'Fixture section '+i,text:('Sample text for section '+i+'\n').repeat(12)}));
 for(const type of ['cast','crew']){
  for(let i=0;i<55;i++){
   project.people.push({id:type+'-'+i,type,name:'Fixture '+type+' '+i,role:'Fixture role',department:type==='cast'?'Cast':'Camera',character:'',email:'',phone:''});
  }
 }
 await page.evaluate(args=>CallSheet.request('save',args),{project,version});
 await page.reload();
 await page.waitForFunction(()=>document.querySelector('#save-state').textContent==='Saved on this device');
}
async function verifyLayout(){
 await page.click('[data-view="daily"]');
 assert.equal(await page.locator('[data-section="layout"],[data-layout-scope],#layout-preset').count(),0);
 await menu('View','Template & Layout');
 await editor().waitFor();
 assert.equal(await page.locator('[data-section]').count(),0);
 const box=page.locator('[data-bind="days.0.layout.custom.8.text"]');
 await box.scrollIntoViewIfNeeded();
 await box.click();
 const initial=await editor().evaluate(el=>el.scrollTop);
 assert(initial>1000);
 await box.evaluate(el=>el.setSelectionRange(4,11,'backward'));
 const beforeSize=await box.boundingBox();
 await page.mouse.move(beforeSize.x+beforeSize.width-5,beforeSize.y+beforeSize.height-5);
 await page.mouse.down();
 await page.mouse.move(beforeSize.x+beforeSize.width-5,beforeSize.y+beforeSize.height+32,{steps:8});
 await page.mouse.up();
 const resized=await box.boundingBox();
 assert(resized.height>beforeSize.height+20);
 for(const value of ['REVISED','UPDATED','RECHECK']){
  await box.evaluate(el=>{el.focus();el.setSelectionRange(4,11,'backward');});
  await page.keyboard.insertText(value);
  await box.evaluate(el=>el.setSelectionRange(4,11,'backward'));
  const before=await editor().evaluate(el=>el.scrollTop);
  await menu('View','Template & Layout');
  await page.waitForFunction(()=>document.activeElement?.dataset.bind==='days.0.layout.custom.8.text');
  assert.deepEqual(await box.evaluate(el=>[el.selectionStart,el.selectionEnd,el.selectionDirection]),[4,11,'backward']);
  assert(Math.abs(await editor().evaluate(el=>el.scrollTop)-before)<=2);
  assert(Math.abs((await box.boundingBox()).height-resized.height)<=1);
 }
 await flush();
 const stored=await readState();
 assert.match(stored.project.days[0].layout.custom[8].text,/RECHECK/);
 const move=page.locator('[data-layout-move="cast:down"]');
 await move.scrollIntoViewIfNeeded();
 const beforeMove=await editor().evaluate(el=>el.scrollTop);
 await move.click();
 assert(await move.evaluate(el=>document.activeElement===el));
 assert(Math.abs(await editor().evaluate(el=>el.scrollTop)-beforeMove)<=2);
 await flush();
 const moved=await readState();
 const movedOrder=moved.project.days[0].layout.order,originalOrder=stored.project.days[0].layout.order;
 assert.equal(movedOrder.indexOf('crew'),originalOrder.indexOf('crew'));
 assert(movedOrder.indexOf('notes')<movedOrder.indexOf('cast'));
 await page.click('[data-view="daily"]');
 assert.equal(await page.locator('[data-section="layout"],[data-layout-scope],#layout-preset').count(),0);
 await page.waitForFunction(()=>document.querySelector('#preview').contentDocument?.body?.textContent.includes('RECHECK'));
 console.log('PASS sidebar/menu separation, deep text drag-resize and repeated edits across rerenders, section movement and rendered sheet');
}

async function verifyCallList(type,width,height){
 await app.evaluate(({BrowserWindow},{width,height})=>BrowserWindow.getAllWindows()[0].setSize(width,height),{width,height});
 await page.waitForFunction(width=>window.innerWidth===width,width);
 console.log('Checking',type,width,height);
 await page.click('[data-view="daily"]');
 await page.click('[data-section="'+type+'"]');
 const search=page.locator('[data-call-search="'+type+'"]'),pane=page.locator('[data-call-scope]');
 await search.fill('Fixture');
 const start=await search.boundingBox();
 await page.mouse.move(start.x+120,start.y+110);
 await page.mouse.wheel(0,1550);
 await page.waitForFunction(()=>document.querySelector('[data-call-scope]').scrollTop>900);
 const finish=await search.boundingBox();
 assert(Math.abs(finish.y-start.y)<=1);
 assert(await search.evaluate(input=>{
  const rect=input.getBoundingClientRect(),pane=document.querySelector('[data-call-scope]'),first=pane.querySelector('[data-call-card]');
  return first.getBoundingClientRect().top<rect.bottom&&
   pane.getBoundingClientRect().top>rect.bottom&&
   document.elementFromPoint(rect.left+rect.width/2,rect.top+rect.height/2)===input;
 }));
 const target=await pane.evaluate(pane=>{
  const top=pane.getBoundingClientRect().top;
  return [...pane.querySelectorAll('[data-attend]')].find(el=>{
   const {y,bottom}=el.getBoundingClientRect();
   return y>top+30&&bottom<Math.min(pane.getBoundingClientRect().bottom,innerHeight)-15;
  })?.dataset.attend;
 });
 assert(target);
 const checkbox=page.locator('[data-attend="'+target+'"]'), before=await checkbox.boundingBox();
 await checkbox.setChecked(!await checkbox.isChecked());
 await page.waitForFunction(id=>document.activeElement?.dataset.attend===id,target, {timeout:3000}).catch(async error=>{
  console.error('Call focus:',await page.evaluate(id=>({expected:id,active:document.activeElement.outerHTML.slice(0,250),checked:document.querySelector('[data-attend="'+id+'"]')?.checked}),target));
  throw error;
 });
 assert(Math.abs((await checkbox.boundingBox()).y-before.y)<3);
 assert.equal(await search.inputValue(),'Fixture');
 assert.equal(await page.locator('[data-call-count]').textContent(),'55 of 55');
 assert(Math.abs((await search.boundingBox()).y-start.y)<=1);
 await page.screenshot({path:path.join(output,type+'-'+width+'.png')});
}
(async()=>{try{
 await launch();
 await verifySettings();
 await seedLongLists();
 await verifyLayout();
 for(const [width,height] of [[1500,940],[1080,730]])for(const type of ['cast','crew'])await verifyCallList(type,width,height);
 assert.deepEqual(errors,[]);
 console.log('PASS scrolling, clipping, search and edited-row focus for 55 Cast and 55 Crew at 1500×940 and 1080×730');
}finally{if(app)await app.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
