'use strict';
// Test-only seeding through ordinary create/save. No fixture loader ships in the app.
const D=require('../../core/domain.cjs');
async function loadFixture(page,name='last-light'){
 const project=D.clone(require('../fixtures/'+name+'.json'));project.fixtureId=project.id;project.sheetDefaults=D.sheetDefaults();project.days.forEach(d=>{d.layout=D.defaultLayout();d.sheetOverrides={};d.background=[];});
 const id=await page.evaluate(async project=>{const state=await CallSheet.request('create',{title:project.title});project.id=state.project.id;project.createdAt=state.project.createdAt;await CallSheet.request('save',{project,version:state.version});return project.id;},project);
 await page.reload();await page.waitForFunction(()=>document.querySelector('#save-state')?.textContent==='Saved on this device');await page.selectOption('#production',id);await page.waitForFunction(id=>document.body.dataset.projectId===id,id);return id;
}
module.exports={loadFixture};
