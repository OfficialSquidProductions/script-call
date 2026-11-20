'use strict';
// Seed preferences saved by earlier versions, whose editing controls were removed.
async function seedLayout(page,fields){
 await page.evaluate(async fields=>{
  Object.assign(day().layout,fields);
  mark();
  await flush();
  render();
 },fields);
}
async function displayChoices(page,{clock,temperature}){
 await page.click('#settings');
 for(const [name,value] of [['time-display',clock],['temperature-display',temperature]]){
  if(!value)continue;
  await page.check(`[name="${name}"][value="${value}"]`);
  await page.waitForFunction(name=>!document.querySelector(`[name="${name}"]`).disabled,name);
 }
 await page.click('#modal-close');
}
module.exports={seedLayout,displayChoices};
