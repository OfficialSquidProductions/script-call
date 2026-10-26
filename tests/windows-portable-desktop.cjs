'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {_electron}=require('./runtime.cjs').playwright;
const root=path.resolve(__dirname,'..'),source=fs.realpathSync(process.env.CALLSHEET_WINDOWS_APP),work=fs.mkdtempSync(path.join(root,'tmp/portable-relocation-')),out=path.join(root,'verification/windows-portable');
assert.equal(process.platform,'win32');assert(source.startsWith(path.join(root,'build')+path.sep));fs.mkdirSync(out,{recursive:true});
let bundle=path.join(work,'First Unicode – folder'),app,page;const checks=[],errors=[];
fs.cpSync(source,bundle,{recursive:true});const check=s=>{checks.push(s);console.log('PASS '+s);};
async function launch(){const env={...process.env};delete env.CALLSHEET_DATA_DIR;app=await _electron.launch({executablePath:path.join(bundle,'Script Call Windows Preview.exe'),args:[],env});page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message));await page.waitForFunction(()=>document.querySelector('#save-state')?.textContent==='Saved on this device');const boot=await page.evaluate(()=>CallSheet.request('bootstrap'));assert.equal(boot.dataDirectory,path.join(bundle,'Script Call Preview Data'));assert.equal(boot.version,'0.3.16-windows.preview.1');assert.equal(boot.updates.enabled,false);const dirs=await app.evaluate(({app})=>['userData','logs','crashDumps'].map(k=>app.getPath(k)));assert(dirs.every(d=>d.startsWith(boot.dataDirectory)));return boot;}
async function close(){await app.close();app=null;}
async function state(){return page.evaluate(()=>CallSheet.request('get',{id:document.querySelector('#production').value}));}
(async()=>{try{
 await launch();check('portable preview direct launch has prerelease version, disabled updates and contained project/log/crash storage');
 await page.locator('[data-bind="days.0.label"]').fill('Portable Windows – synthetic');await page.keyboard.press('Control+s');await page.waitForFunction(()=>document.querySelector('#save-state').textContent==='Saved on this device');const before=await state();
 const file=path.join(out,'Unicode – round trip.callsheet');await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},file);await page.click('#export-project');await page.waitForFunction(file=>document.querySelector('#toast').textContent.includes(file),file);const archive=require('../core/archive.cjs').readArchive(fs.readFileSync(file));assert.deepEqual(archive.project,before.project);check('portable editing, Ctrl+S and Unicode archive export preserve the shared Mac/Windows data contract');
 await close();const relocated=path.join(work,'Relocated preview');fs.cpSync(bundle,relocated,{recursive:true});bundle=relocated;await launch();assert.deepEqual((await state()).project,before.project);assert(!fs.readdirSync(work).some(n=>n.startsWith('.script-call-profile')));check('relocating the closed portable folder preserves exact project IDs/data and writes no parent installation marker');
 const rejected=await page.evaluate(async()=>{try{await CallSheet.request('updateDownload');return false;}catch(e){return /Preview builds cannot/.test(e.message);}});assert(rejected);check('portable preview cannot download or install updates');
 await page.screenshot({path:path.join(out,'portable-preview.png'),fullPage:true});assert.deepEqual(errors,[]);await close();
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({status:'passed',platform:process.platform,arch:process.arch,checks,errors,source,executableSHA256:crypto.createHash('sha256').update(fs.readFileSync(path.join(source,'Script Call Windows Preview.exe'))).digest('hex')},null,2));
}finally{if(app)await close();}})().catch(e=>{console.error(e);process.exitCode=1;});
