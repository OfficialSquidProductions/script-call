'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {_electron}=require('./runtime.cjs').playwright;
const {state,dialogBody,action,saveFixture,issueFixture,openReview,showBcc,saveTo,verifyIssuedReview}=require('./support/email-desktop.cjs');
const root=path.resolve(__dirname,'..'),bundle=process.env.CALLSHEET_PACKAGED_APP;
const work=fs.mkdtempSync(path.join(root,'tmp/email-desk-')),out=path.join(root,'verification/email-desktop');
fs.mkdirSync(out,{recursive:true});
const check=message=>console.log('PASS',message);

(async()=>{
 const app=await _electron.launch({
  executablePath:bundle?path.join(bundle,'Contents/MacOS/Script Call'):require('./runtime.cjs').electron,
  args:bundle?[]:[root],env:{...process.env,CALLSHEET_DATA_DIR:path.join(work,'profile')}
 });
 try{
  const page=await app.firstWindow(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.waitForFunction(()=>document.querySelector('#save-state').textContent==='Saved on this device');
  await saveFixture(page);
  await page.locator('[data-view="production"]').click();
  assert(!(await page.locator('#email-call-sheet').isVisible()));
  await page.locator('[data-view="daily"]').click();
  await openReview(page);
  assert.equal(await page.locator('#sheet-email-format').inputValue(),'pdf');
  assert.match(await page.locator('#modal-body input').inputValue(),/Day 07 Call Sheet.*Draft \(unissued\)/);
  await showBcc(page);
  await action(page,'Copy Bcc addresses').click();
  assert.equal(await app.evaluate(({clipboard})=>clipboard.readText()),'cast@example.invalid, crew@example.invalid');
  await action(page,'Copy body').click();
  assert.match(await app.evaluate(({clipboard})=>clipboard.readText()),/draft call sheet for review/);
  await saveTo(app,null);
  await action(page,'Export attachments…').click();
  await page.waitForFunction(()=>document.querySelector('#sheet-email-status').textContent==='Export canceled.');
  assert.equal((await state(page)).revisions.length,0);
  await page.locator('#modal-close').click();
  check('Daily Sheet review defaults to PDF, copies Bcc and body, and cancels without issuing');

  await page.locator('#next').click();await openReview(page);await showBcc(page);
  assert.match(await dialogBody(page).innerText(),/other-day@example.invalid/);
  assert(!((await dialogBody(page).innerText()).includes('crew@example.invalid')));
  await page.keyboard.press('Escape');
  await page.locator('#next').click();await openReview(page);
  assert.match(await dialogBody(page).innerText(),/No valid email addresses/);
  assert.equal(await action(page,'Open in Apple Mail').count(),0);
  assert.equal(await action(page,'Copy Bcc addresses').count(),0);
  await page.locator('#modal-close').click();
  await page.locator('#previous').click();await page.locator('#previous').click();await openReview(page);
  const changed=await state(page);
  changed.project.people.find(person=>person.id==='cast').email='revised@example.invalid';
  await page.evaluate(args=>CallSheet.request('save',args),changed);
  await action(page,'Copy Bcc addresses').click();
  assert.match(await page.locator('#modal-error').innerText(),/contacts changed/);
  await page.locator('#modal-close').click();
  check('other day addresses stay isolated, an empty roster has no Mail action, and stale reviews are rejected');

  await issueFixture(page);
  const original=await verifyIssuedReview(app,page,out,check);
  await openReview(page);
  await page.locator('#sheet-email-format').selectOption('png');
  await app.evaluate(({dialog},work)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[work]});},work);
  await action(page,'Export attachments…').click();
  await page.waitForFunction(()=>document.querySelector('#sheet-email-status').textContent.startsWith('Attachments saved to '));
  const directory=(await page.locator('#sheet-email-status').textContent()).slice('Attachments saved to '.length);
  const files=fs.readdirSync(directory).sort();
  assert.equal(files.length,2,'synthetic G-Casper front/back should render two pages');
  const expected=path.join(work,'expected');fs.mkdirSync(expected);
  const count=execFileSync('/usr/bin/osascript',['-l','JavaScript',path.join(root,'desktop/pdf-pages.js'),original,expected],{encoding:'utf8'}).trim();
  assert.equal(count,'2');
  for(const [i,file] of files.entries()){
   const bytes=fs.readFileSync(path.join(directory,file));
   assert(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
   assert(bytes.readUInt32BE(16)>1000&&bytes.readUInt32BE(20)>1000);
   assert.deepEqual(bytes,fs.readFileSync(path.join(expected,(i+1)+'.png')));
  }
  assert.notDeepEqual(fs.readFileSync(path.join(directory,files[0])),fs.readFileSync(path.join(directory,files[1])));
  await page.screenshot({path:path.join(out,'review-png.png')});
  check('the two PNG attachments are distinct full-size pages rasterized from the same issued PDF');
  assert.deepEqual(errors,[]);
 }finally{await app.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
