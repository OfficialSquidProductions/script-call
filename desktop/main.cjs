'use strict';
const {app,BrowserWindow,ipcMain,dialog,protocol,net,Menu,clipboard,shell}=require('electron');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {Store}=require('../core/store.cjs'),D=require('../core/domain.cjs'),A=require('../core/archive.cjs'),{renderSheet}=require('../core/sheet.cjs'),{headingFont}=require('./fonts.cjs');
const P=require('../core/productiondesk.cjs');
const {Updates}=require('./updates.cjs'),updateConfig=require('./update-config.json');
const {Diagnostics}=require('./diagnostics.cjs'),{openDraft}=require('./report-delivery.cjs');
const ROOT=path.resolve(__dirname,'..');let win,store,font,logo,updates,issueBusy=false,pendingImport=null;
protocol.registerSchemesAsPrivileged([{scheme:'callsheet',privileges:{standard:true,secure:true,supportFetchAPI:true}}]);
app.setName('Script Call');
// Keep the original default profile and origin: branding must never orphan projects.
const previewFile=path.join(__dirname,'preview-profile.json'),previewProfile=fs.existsSync(previewFile)?JSON.parse(fs.readFileSync(previewFile,'utf8')):null;
// A packaged development preview always has its own profile, including direct launch.
const previewDirectory=previewProfile?require('./preview-location.cjs').previewLocation(previewProfile,process.env.CALLSHEET_DATA_DIR):null;
const profileLocation=require('./data-location.cjs').dataLocation({explicit:previewDirectory||process.env.CALLSHEET_DATA_DIR,defaultProfile:path.join(app.getPath('appData'),'Call Sheet Prototype'),executable:app.getPath('exe')});
app.setPath('userData',profileLocation.userData);
// Keep all application-owned diagnostics with the selected profile, including release QA copies.
app.setAppLogsPath(path.join(profileLocation.userData,'logs'));app.setPath('crashDumps',path.join(profileLocation.userData,'crash-dumps'));
const primaryInstance=app.requestSingleInstanceLock();if(!primaryInstance)app.quit();
const diagnostics=new Diagnostics({directory:path.join(profileLocation.userData,'diagnostics'),version:app.getVersion(),notify:state=>{if(win&&!win.isDestroyed())win.webContents.send('diagnostic-status',state);}});
if(primaryInstance){
 diagnostics.safe(()=>diagnostics.begin());
 // Monitoring does not suppress Node's fatal uncaught-exception behavior.
 process.on('uncaughtExceptionMonitor',error=>diagnostics.capture('main-uncaught-exception',error));
 process.on('unhandledRejection',error=>diagnostics.capture('main-unhandled-rejection',error));
 app.on('child-process-gone',(_,details)=>{if(['crashed','oom','abnormal-exit','integrity-failure'].includes(details.reason))diagnostics.capture('utility-crash',undefined,details);});
}
app.on('second-instance',()=>{if(win){win.show();win.focus();}});
const safeName=s=>String(s).replace(/[^a-zA-Z0-9_.-]+/g,'_').slice(0,120)||'CallSheet';
async function pdf(snapshot){
 const errors=D.printErrors(snapshot);if(errors.length)throw Error(errors.join('\n'));
 const output=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
 output.webContents.setWindowOpenHandler(()=>({action:'deny'}));output.webContents.on('will-navigate',e=>e.preventDefault());
 try{await output.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(renderSheet(snapshot,logo,font?fs.readFileSync(font).toString('base64'):'')));
  await output.webContents.executeJavaScript('document.fonts.ready.then(()=>true)');
  return await output.webContents.printToPDF({printBackground:true,preferCSSPageSize:true,displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:`<div style="font-family:Arial;font-size:8px;width:100%;text-align:center;color:#64555e">${safeName(snapshot.day.label)} / ${snapshot.revision?'R'+snapshot.revision.number:'DRAFT'} / <span class="pageNumber"></span> of <span class="totalPages"></span></div>`});
 }finally{output.destroy();}
}
function frozen(projectId,dayId){const s=store.get(projectId),day=s.project.days.find(d=>d.id===dayId);if(!day)throw Error('Day not found.');return day.lockedRevisionId?store.revision(projectId,day.lockedRevisionId).snapshot:D.resolve(s.project,dayId);}
async function saveFile(bytes,defaultPath,filter){const r=await dialog.showSaveDialog(win,{defaultPath,filters:[filter]});if(r.canceled)return {canceled:true};const target=r.filePath,tmp=target+'.'+D.id()+'.tmp';try{fs.writeFileSync(tmp,bytes,{flag:'wx',mode:0o600});fs.renameSync(tmp,target);}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}return {path:target};}
const actions={
 bootstrap(){if(!store.list().length)store.create(D.newProject());return {projects:store.list(),fontAvailable:!!font,version:app.getVersion(),dataDirectory:store.dir,updates:updates.status(),diagnostics:diagnostics.status()};},
 diagnosticStatus:()=>diagnostics.status(),diagnosticDismiss:()=>diagnostics.dismiss(),
 diagnosticCapture:a=>{if(['renderer-error','renderer-unhandled-rejection'].includes(a.kind))diagnostics.capture(a.kind,a.error);return {recorded:true};},
 reportPreview:a=>diagnostics.preview(a),
 reportCopy:a=>{clipboard.writeText(diagnostics.draft(a.id).text);return {copied:true};},
 reportExport:a=>saveFile(Buffer.from(diagnostics.draft(a.id).text),'Script-Call-Bug-Report.txt',{name:'Reviewed bug report',extensions:['txt']}),
 reportMail:a=>openDraft(diagnostics.draft(a.id),{app,shell}),
 updateStatus:()=>updates.status(),updateCheck:()=>updates.check(),updateDownload:()=>{if(previewProfile)throw Error('Preview builds cannot download or install updates.');return updates.download();},updateInstall:()=>{if(previewProfile)throw Error('Preview builds cannot install updates.');if(profileLocation.error)throw Error(profileLocation.error);return updates.install();},updatePreferences:a=>updates.preferences(a.automatic),
 list:()=>store.list(),get:a=>store.get(a.id),save:a=>store.save(a.project,a.version),
 create:a=>store.create(D.newProject(String(a.title||'Untitled production').slice(0,200))),
 preview:a=>{const r=frozen(a.projectId,a.dayId);return {html:renderSheet(r,logo,font?fs.readFileSync(font).toString('base64'):''),display:{generalCall:r.values.generalCall,location:r.location?.name||'Required',zone:r.values.zone},review:D.review(store.get(a.projectId).project,a.dayId)};},
 recovery:a=>{D.guard(a.project);const raw=JSON.stringify({format:'callsheet-recovery',schema:1,project:a.project},null,2);if(Buffer.byteLength(raw)>10*1024*1024)throw Error('Recovery copy exceeds 10 MB.');return saveFile(Buffer.from(raw),'CallSheet-Recovery.json',{name:'Unsaved recovery data',extensions:['json']});},
 review:a=>D.review(store.get(a.projectId).project,a.dayId),
 async issue(a){
  if(issueBusy)throw Error('An issue is already rendering.');issueBusy=true;try{
   const state=store.get(a.projectId);if(state.version!==a.version)throw Error('Save and review the latest changes first.');const review=D.review(state.project,a.dayId);if(review.errors.length)throw Error(review.errors.join('\n'));if(review.warnings.length&&!a.acknowledgeWarnings)throw Error('Review and acknowledge the remaining warnings.');
   const day=state.project.days.find(d=>d.id===a.dayId);if(day.lockedRevisionId)throw Error('Create a new draft first.');
   const r=D.resolve(state.project,a.dayId),number=1+Math.max(0,...state.revisions.filter(r=>r.dayId===a.dayId).map(r=>r.number));r.revision={id:D.id(),number,issued:new Date().toISOString()};
   const bytes=await pdf(r);return store.issue(a.projectId,a.dayId,a.version,r,bytes);
  }finally{issueBusy=false;}
 },
 revision:a=>{const r=store.revision(a.projectId,a.revisionId);return {id:r.id,number:r.number,issued:r.issued,hash:r.hash,html:renderSheet(r.snapshot,logo,font?fs.readFileSync(font).toString('base64'):'')};},
 async exportPDF(a){const s=store.get(a.projectId),day=s.project.days.find(d=>d.id===a.dayId);const rev=a.revisionId||day?.lockedRevisionId;const r=rev?store.revision(a.projectId,rev):null;const bytes=r?r.pdf:await pdf(D.resolve(s.project,a.dayId));return saveFile(bytes,safeName(s.project.title+'_'+(r?.snapshot.day||day).label+'_'+(r?'R'+r.number:'DRAFT'))+'.pdf',{name:'PDF document',extensions:['pdf']});},
 exportProject:a=>saveFile(A.exportArchive(store,a.projectId),safeName(store.get(a.projectId).project.title)+'.callsheet',{name:'Call Sheet project',extensions:['callsheet']}),
 async importProject(){const r=await dialog.showOpenDialog(win,{properties:['openFile'],filters:[{name:'Call Sheet project',extensions:['callsheet']}]});if(r.canceled)return {canceled:true};const stat=fs.statSync(r.filePaths[0]);if(stat.size>25*1024*1024)throw Error('Choose an archive under 25 MB.');return A.importAsCopy(store,fs.readFileSync(r.filePaths[0]));},
 async chooseProductionDesk(a){
  pendingImport=null;const r=await dialog.showOpenDialog(win,{properties:['openFile'],filters:[{name:'Production Desk project',extensions:['productiondesk']}]});if(r.canceled)return {canceled:true};
  const file=fs.openSync(r.filePaths[0],'r');let parsed;try{const st=fs.fstatSync(file);if(!st.isFile()||st.size>P.MAX_BYTES)throw Error('Choose a regular Production Desk file under 25 MB.');const bytes=Buffer.alloc(st.size);let n=0;while(n<bytes.length){const read=fs.readSync(file,bytes,n,bytes.length-n,null);if(!read)throw Error('File changed while reading.');n+=read;}parsed=P.read(bytes);}finally{fs.closeSync(file);}
  pendingImport={token:D.id(),parsed,expires:Date.now()+15*60000};return actions.previewProductionDesk({...a,token:pendingImport.token});
 },
 previewProductionDesk(a){
  if(!pendingImport||a.token!==pendingImport.token||pendingImport.expires<Date.now())throw Error('Import preview expired. Choose the file again.');
  const selected=a.currentProjectId?store.get(a.currentProjectId).project:null;
  const effectiveScenarioId=a.scenarioId||pendingImport.parsed.source.stripboards[0]?.id;
  const targetId=selected?.productionDesk?.sourceId===pendingImport.parsed.source.id&&selected.productionDesk.scenarioId===effectiveScenarioId?selected.id:undefined;
  const result=P.preview(store,pendingImport.parsed,a.scenarioId,targetId);pendingImport.preview=result;
  return {token:pendingImport.token,summary:result.summary,scenarios:result.scenarios,scenarioId:result.project.productionDesk.scenarioId,warnings:result.warnings,conflicts:result.conflicts,targetId:result.targetId,duplicate:!!result.duplicate};
 },
 commitProductionDesk(a){if(!pendingImport||a.token!==pendingImport.token||pendingImport.expires<Date.now()||!pendingImport.preview)throw Error('Import preview expired. Choose the file again.');const result=P.commit(store,pendingImport.preview);pendingImport=null;return result;},
 cancelProductionDesk(){pendingImport=null;return {canceled:true};},
 backup:()=>({path:store.backup()}),
 async forecast(a){
  const state=store.get(a.projectId),r=D.resolve(state.project,a.dayId);if(r.day.lockedRevisionId)throw Error('Create a draft before refreshing weather.');
  const weather=await require('../core/weather.cjs').forecast(r,{consent:a.consent});
  const current=store.get(a.projectId);if(current.version!==state.version)throw Error('Project changed during forecast retrieval. Try again.');
  const d=current.project.days.find(d=>d.id===a.dayId);if(d.lockedRevisionId)throw Error('Create a draft before refreshing weather.');
  d.weather=weather;return store.save(current.project,current.version);
 }
};
app.whenReady().then(()=>{
 if(!primaryInstance)return;
 const dir=profileLocation.storeDirectory;store=new Store(dir);store.backup();font=headingFont();logo='data:image/png;base64,'+fs.readFileSync(path.join(ROOT,'web/assets/SP_PURPLE.png')).toString('base64');
 updates=new Updates({app,config:updateConfig,backup:()=>store.backup(),busy:()=>issueBusy,notify:state=>{if(win&&!win.isDestroyed())win.webContents.send('update-status',state);}});
 protocol.handle('callsheet',request=>{
  const u=new URL(request.url);if(u.host!=='app')return new Response('Not found',{status:404});
  if(u.pathname==='/fonts/heading.otf')return font?net.fetch(pathToFileURL(font).toString()):new Response('',{status:404});
  const relative=decodeURIComponent(u.pathname).replace(/^\//,'')||'index.html';if(relative.split('/').some(x=>x==='..'||x.startsWith('.')))return new Response('',{status:403});
  const p=path.resolve(ROOT,'web',relative);if(!p.startsWith(path.join(ROOT,'web')+path.sep))return new Response('',{status:403});return net.fetch(pathToFileURL(p).toString());
 });
 const hiddenPreview=!!previewProfile&&process.env.CALLSHEET_PREVIEW_HIDDEN==='1';
 win=new BrowserWindow({show:!hiddenPreview,width:1500,height:980,minWidth:1050,minHeight:700,title:'Script Call',backgroundColor:'#faf8f9',icon:path.join(ROOT,'web/assets/SP_PURPLE.png'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false,spellcheck:false,backgroundThrottling:!hiddenPreview}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());
 win.webContents.on('render-process-gone',(_,details)=>{if(details.reason!=='clean-exit'){diagnostics.capture(['crashed','oom','abnormal-exit','integrity-failure'].includes(details.reason)?'renderer-crash':'renderer-interrupted',undefined,details);dialog.showMessageBox(win,{type:'error',title:'Script Call window stopped',message:'The editing window stopped unexpectedly.',detail:(diagnostics.available?'A minimal diagnostic summary was saved locally for review next time you open Script Call.':'Local diagnostic storage is unavailable; you can report this manually after reopening.')+' Unsaved edits may not have been saved. Nothing was sent.',buttons:['OK']}).catch(()=>{});}});
 // No renderer HTTP access: forecast traffic only originates from the explicit main-process action.
 win.webContents.session.webRequest.onBeforeRequest((details,callback)=>callback({cancel:details.webContentsId===win.webContents.id&&/^https?:/.test(details.url)}));
 ipcMain.handle('callsheet',async(event,action,args)=>{if(event.sender!==win.webContents||event.senderFrame!==win.webContents.mainFrame||!Object.hasOwn(actions,action))throw Error('Unsupported request.');if(!args||typeof args!=='object')throw Error('Invalid request.');try{return await actions[action](args);}catch(error){if(!action.startsWith('report')&&!action.startsWith('diagnostic')&&(error?.code||error instanceof TypeError||error instanceof RangeError||error instanceof ReferenceError||error instanceof SyntaxError))diagnostics.capture('operation-failure',error);throw error;}});
 const template=[...(process.platform==='darwin'?[{label:'Script Call',submenu:[{role:'about'},{label:'Check for Updates…',click:()=>win.webContents.send('check-updates')},{type:'separator'},{role:'hide'},{role:'quit'}]}]:[]),{label:'File',submenu:[{label:'Save',accelerator:'CmdOrCtrl+S',click:()=>win.webContents.send('menu-save')},{role:'close'}]},{role:'editMenu'},{role:'viewMenu'},{role:'windowMenu'}];
 template.push({label:'Help',submenu:[{label:'Report a Bug…',click:()=>win.webContents.send('report-bug')}]});Menu.setApplicationMenu(Menu.buildFromTemplate(template));
 win.on('close',event=>{if(win&&!win.forceClose&&!win.webContents.isCrashed()){event.preventDefault();win.webContents.send('before-close');}});
 ipcMain.on('close-ready',event=>{if(event.sender===win.webContents){win.forceClose=true;win.close();}});
 win.loadURL('callsheet://app/index.html');if(!previewProfile)updates.start();
}).catch(error=>{diagnostics.capture('startup-failure',error);dialog.showErrorBox('Script Call could not start',error.message);app.quit();});
app.on('window-all-closed',()=>app.quit());app.on('will-quit',()=>{updates?.close();if(store)store.close();if(primaryInstance)diagnostics.clean();});
