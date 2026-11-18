'use strict';
// Observe the real stable offer in an unmodified previous release. Never install.
const {_electron}=require('./runtime.cjs').playwright,assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),bundle=path.resolve(process.argv[2]||''),expected=process.argv[3];assert(bundle.startsWith(path.join(root,'tmp')+path.sep),'Use only an authenticated disposable old app under this checkout/tmp');assert(expected);
const profile=fs.mkdtempSync(path.join(root,'tmp/stable-offer-'));let app;
(async()=>{try{
 execFileSync('codesign',['--verify','--deep','--strict',bundle]);
 app=await _electron.launch({executablePath:path.join(bundle,'Contents/MacOS/Script Call'),args:[],env:{...process.env,CALLSHEET_DATA_DIR:profile}});const page=await app.firstWindow();await page.waitForFunction(()=>document.querySelector('#save-state')?.textContent==='Saved on this device');await page.evaluate(()=>CallSheet.request('updatePreferences',{automatic:false}));
 await page.click('#updates');await page.waitForFunction(()=>document.querySelector('#modal-title').textContent==='Script Call updates');const status=await page.evaluate(()=>CallSheet.request('updateStatus'));assert.equal(status.status,'available');assert.equal(status.version,expected);
 const current=await app.evaluate(({app})=>app.getVersion()),feed=await app.evaluate(({app})=>{const require=process.getBuiltinModule('module').createRequire(app.getAppPath()+'/package.json');return require(app.getAppPath()+'/desktop/update-config.json').manifestUrl;});assert.equal(feed,'https://github.com/OfficialSquidProductions/script-call-updates/releases/latest/download/stable-{platform}-{arch}.json');
 await page.screenshot({path:path.join(root,'verification/stable-offer.png'),fullPage:true});execFileSync('codesign',['--verify','--deep','--strict',bundle]);fs.writeFileSync(path.join(root,'verification/stable-offer.json'),JSON.stringify({status:'passed',from:current,to:expected,feed,offer:status.status,oldBundleUnmodified:true,downloaded:false,installed:false,profile},null,2));console.log('PASS unmodified '+current+' offers '+expected+' from the public stable feed; no download/install requested');
 }finally{if(app)await app.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
