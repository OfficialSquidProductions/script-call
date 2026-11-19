'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {emailFixture}=require('./email-fixture.cjs');

const state=page=>page.evaluate(()=>CallSheet.request('get',{id:document.body.dataset.projectId}));
const dialogBody=page=>page.locator('#modal-body');
const action=(page,name)=>page.locator('#modal').getByRole('button',{name,exact:true});

async function saveFixture(page){
 const project=emailFixture();
 const created=await page.evaluate(async project=>{
  const row=await CallSheet.request('create',{title:project.title});
  project.id=row.project.id;
  await CallSheet.request('save',{project,version:row.version});
  return project.id;
 },project);
 await page.reload();
 await page.waitForFunction(()=>document.querySelector('#save-state')?.textContent==='Saved on this device');
 await page.selectOption('#production',created);
 await page.waitForFunction(id=>document.body.dataset.projectId===id,created);
 return {projectId:created,dayId:project.days[0].id};
}

async function issueFixture(page){
 const fixture=await saveFixture(page);
 const selected=await state(page);
 const result=await page.evaluate(args=>CallSheet.request('issue',args),{
  ...fixture,version:selected.version,acknowledgeWarnings:true
 });
 assert.equal(result.revisions.length,1);
 await page.reload();
 await page.waitForFunction(()=>document.querySelector('#save-state')?.textContent==='Saved on this device');
 await page.selectOption('#production',fixture.projectId);
 await page.waitForFunction(id=>document.body.dataset.projectId===id,fixture.projectId);
 return fixture;
}

async function openReview(page){
 await page.locator('#email-call-sheet').click();
 await page.waitForFunction(()=>document.querySelector('#modal-title').textContent==='Email Call Sheet');
}
async function showBcc(page){
 const summary=page.getByText('Review Bcc addresses',{exact:true});
 if(await summary.count())await summary.click();
}
async function saveTo(app,target){
 await app.evaluate(({dialog},target)=>{dialog.showSaveDialog=async()=>({canceled:!target,filePath:target});},target);
}
async function verifyIssuedReview(app,page,out,check){
 await openReview(page);
 await showBcc(page);
 const text=await dialogBody(page).innerText();
 assert.match(text,/Issued R1/);
 assert.match(text,/2 listed cast · 3 listed crew/);
 assert.match(text,/2 Bcc recipients · 1 duplicate address combined/);
 assert.match(text,/Missing email \(1\) · Missing Contact/);
 assert.match(text,/Invalid email \(1\) · Invalid Contact/);
 assert.match(text,/cast@example.invalid/);assert.match(text,/crew@example.invalid/);
 assert(!/other-day@example.invalid|uncalled|deleted@example.invalid/.test(text));
 assert.match(await page.locator('#modal-body input').inputValue(),/Synthetic Émail Production — Day 07 Call Sheet — 2026-12-08 — Issued R1/);
 const reviewedPDF=path.join(out,'reviewed-issued.pdf');
 await saveTo(app,reviewedPDF);
 await action(page,'Export attachments…').click();
 await page.waitForFunction(()=>document.querySelector('#sheet-email-status').textContent.includes('reviewed-issued.pdf'));
 await page.locator('#modal-close').click();
 const regularPDF=path.join(out,'original-issued.pdf');
 await saveTo(app,regularPDF);
 await page.locator('#export-pdf').click();
 await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('original-issued.pdf'));
 assert.deepEqual(fs.readFileSync(reviewedPDF),fs.readFileSync(regularPDF));
 assert.equal((await state(page)).revisions.length,1);
 check('issued email review uses only the frozen day roster and exports the exact original issued PDF');
 return regularPDF;
}

module.exports={state,dialogBody,action,saveFixture,issueFixture,openReview,showBcc,saveTo,verifyIssuedReview};
