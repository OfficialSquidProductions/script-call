'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {applicationMenu}=require('../desktop/application-menu.cjs'),{safeName}=require('../desktop/file-names.cjs');
const {previewPlan,previewConfig}=require('../tools/package_windows.cjs'),{preflight}=require('../tools/windows_preflight.cjs'),{previewLocation}=require('../desktop/preview-location.cjs');
test('Windows menus expose Save, Quit, About, updates and bug reporting through shared actions',()=>{
 const sent=[],menu=applicationMenu('win32',name=>sent.push(name)),file=menu.find(x=>x.label==='File'),help=menu.find(x=>x.label==='Help');
 assert.equal(file.submenu.find(x=>x.label==='Save').accelerator,'CmdOrCtrl+S');assert(file.submenu.some(x=>x.role==='quit'));assert(help.submenu.some(x=>x.role==='about'));
 file.submenu[0].click();help.submenu.find(x=>x.label==='Check for Updates…').click();help.submenu.find(x=>x.label==='Report a Bug…').click();assert.deepEqual(sent,['menu-save','check-updates','report-bug']);
 const mac=applicationMenu('darwin',()=>{});assert(mac[0].submenu.some(x=>x.label==='Check for Updates…'));assert(!mac.find(x=>x.label==='Help').submenu.some(x=>x.label==='Check for Updates…'));
});
test('suggested file names protect Windows devices and trailing dots without changing normal exports',()=>{
 for(const name of ['CON','con.pdf','PRN','AUX','NUL','COM1','LPT9.txt'])assert.equal(safeName(name),'_'+name);
 assert.equal(safeName('Film title/Day 01'),'Film_title_Day_01');assert.equal(safeName('..'),'CallSheet');assert.equal(safeName('Film...'),'Film');assert.equal(safeName('COM10'),'COM10');assert(safeName('x'.repeat(200)).length<=120);
});
test('Windows previews fail closed on non-native machines and use fresh contained storage for direct launch',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'script-call-win-plan-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({version:'0.3.16'}));fs.mkdirSync(path.join(root,'build'));
 const plan=previewPlan(root,'build/windows-qa','x64'),config=previewConfig(plan);assert.equal(config.publish,null);assert.equal(config.win.verifyUpdateCodeSignature,true);assert.equal(config.win.signExecutable,false);
 assert.throws(()=>previewPlan(root,'../live','x64'),/inside/);assert.throws(()=>previewPlan(root,'build/other','ia32'),/x64 or arm64/);
 fs.mkdirSync(path.join(root,'protected-profile'));fs.symlinkSync(path.join(root,'protected-profile'),path.join(root,'build','redirect'),process.platform==='win32'?'junction':'dir');assert.throws(()=>previewPlan(root,'build/redirect/new'),/through a link/);assert.deepEqual(fs.readdirSync(path.join(root,'protected-profile')),[]);
 const appOutDir=path.join(plan.out,'win-unpacked'),app=path.join(appOutDir,'resources','app');for(const name of ['desktop','web','core'])fs.mkdirSync(path.join(app,name),{recursive:true});fs.writeFileSync(path.join(app,'core','synthetic.cjs'),'module.exports=1;');
 await config.afterPack({appOutDir});const profile=JSON.parse(fs.readFileSync(path.join(app,'desktop/preview-profile.json')));assert.equal(previewLocation(profile),plan.profile);assert.throws(()=>previewLocation(profile,os.homedir()),/inside/);assert.throws(()=>previewPlan(root,'build/windows-qa'),/already exists/);
 const manifest=JSON.parse(fs.readFileSync(path.join(plan.out,'preview-build.json')));assert.equal(manifest.platform,'win32');assert.match(manifest.sourceHashes['core/synthetic.cjs'],/^[a-f0-9]{64}$/);assert(!fs.existsSync(plan.profile));
 if(process.platform!=='win32')await assert.rejects(require('../tools/package_windows.cjs').build(),/authorized Windows PC/);
});
test('Windows preflight reports actual native blockers without claiming verification or inspecting keys',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'script-call-win-preflight-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const good=preflight({platform:'win32',arch:'x64',node:'24.0.0',release:'10.0.26100',root});assert.equal(good.status,'ready-for-dependency-setup');assert.equal(good.windowsVerified,false);
 const bad=preflight({platform:'darwin',arch:'ia32',node:'20.19.0',release:'24.0.0',root});assert.equal(bad.blockers.length,3);assert.equal(preflight({platform:'win32',arch:'x64',node:'22.12.0',release:'6.3.0',root}).blockers.length,2);
});

test('portable Windows preview resolves dedicated storage after relocation and rejects external profiles',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'script-call-portable-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const config={kind:'portable-windows-preview',schema:1},executable=path.join(root,'Script Call Windows Preview.exe');
 assert.equal(previewLocation(config,undefined,{platform:'win32',executable}),path.join(root,'Script Call Preview Data'));
 assert.throws(()=>previewLocation(config,os.homedir(),{platform:'win32',executable}),/inside/);
 assert.throws(()=>previewLocation(config,undefined,{platform:'darwin',executable}),/unsupported/);
 assert.throws(()=>previewLocation({...config,schema:2},undefined,{platform:'win32',executable}),/unsupported/);
 const other=fs.mkdtempSync(path.join(os.tmpdir(),'script-call-portable-relocated-'));t.after(()=>fs.rmSync(other,{recursive:true,force:true}));
 assert.equal(previewLocation(config,undefined,{platform:'win32',executable:path.join(other,'Script Call Windows Preview.exe')}),path.join(other,'Script Call Preview Data'));
 const plan=previewPlan(root,'build/portable'),options=previewConfig(plan,{portable:true});
 assert.equal(options.appId,'org.squidproductions.scriptcall.windows-preview');assert.equal(options.productName,'Script Call Windows Preview');assert.equal(options.extraMetadata.version,'0.3.16-windows.preview.1');assert.equal(options.publish,null);assert.equal(options.win.verifyUpdateCodeSignature,true);
});
