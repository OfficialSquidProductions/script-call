'use strict';
// Read-only observers for native acceptance. They never install, prevent closing,
// alter updater settings, clear caches or replace the real native updater.
async function observeNativeUpgrade(application,file){
 return application.evaluate(({app,BrowserWindow,ipcMain},file)=>{
  const require=process.getBuiltinModule('module').createRequire(app.getAppPath()+'/package.json');
  const fs=require('node:fs'),updater=require('electron-updater').autoUpdater,native=require('electron').autoUpdater;
  const record=(event,args=[])=>{try{fs.appendFileSync(file,JSON.stringify({at:new Date().toISOString(),pid:process.pid,version:app.getVersion(),event,args:args.map(x=>String(x?.stack||x).slice(0,3000)),squirrelDownloaded:updater.squirrelDownloadedUpdate,autoRun:updater.autoRunAppAfterInstall})+'\n');}catch{}};
  const path=require('node:path'),bundle=path.dirname(path.dirname(path.dirname(app.getPath('exe'))));let writable;try{fs.accessSync(bundle,fs.constants.W_OK);writable=true;}catch{writable=false;}record('observe-start',[JSON.stringify({bundle,writable,uid:fs.statSync(bundle).uid,mode:fs.statSync(bundle).mode&0o777})]);
  updater.logger=Object.fromEntries(['info','warn','error','debug'].map(level=>[level,(...args)=>record('updater.'+level,args)]));
  for(const event of ['checking-for-update','update-available','update-not-available','update-downloaded','before-quit-for-update','error'])native.on(event,(...args)=>record('native.'+event,args));
  for(const event of ['before-quit','will-quit','quit','window-all-closed'])app.on(event,(...args)=>record('app.'+event,args.map(x=>typeof x==='object'?{defaultPrevented:x.defaultPrevented}:x)));
  for(const window of BrowserWindow.getAllWindows()){window.on('close',event=>record('window.close',[String(event.defaultPrevented)]));window.on('closed',()=>record('window.closed'));}
  ipcMain.on('close-ready',()=>record('ipc.close-ready'));
  return {pid:process.pid,version:app.getVersion(),squirrelDownloaded:updater.squirrelDownloadedUpdate,autoRun:updater.autoRunAppAfterInstall};
 },file);
}
module.exports={observeNativeUpgrade};
