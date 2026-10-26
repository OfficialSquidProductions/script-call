'use strict';
// Stable bootstrap: only payload generations change during automatic updates.
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {Manager}=require('./portable-manager.cjs');
function environment(){const env={...process.env};for(const key of Object.keys(env))if(['ELECTRON_RUN_AS_NODE','NODE_OPTIONS','NODE_PATH','CALLSHEET_DATA_DIR'].includes(key.toUpperCase()))delete env[key];return env;}
async function supervise(manager,{launch=(file)=>spawn(file,[],{windowsHide:false,stdio:'ignore',env:environment()}),delay=ms=>new Promise(r=>setTimeout(r,ms)),startupTicks=600}={}){
 const unlock=manager.lock();try{
  manager.recover();let iterations=0;
  for(;;){if(++iterations>3)throw Error('Repeated portable update startup refused.');const {state,manifest}=manager.verifyActive();let child;
   try{child=launch(path.join(manager.payload(state.active),manifest.executable));}catch(e){if(state.trial){manager.recover();continue;}throw e;}
   let exited=false,launchError=null;const ended=new Promise(resolve=>{child.once('error',e=>{launchError=e;exited=true;resolve();});child.once('exit',()=>{exited=true;resolve();});});
   await new Promise(resolve=>{if(child.pid)resolve();else{child.once('spawn',resolve);child.once('error',resolve);}});
   if(state.trial){if(child.pid)manager.childStarted(child.pid);let accepted=false;for(let i=0;i<startupTicks&&!exited;i++){if(manager.accept()){accepted=true;break;}await delay(100);}if(!accepted){if(!exited)throw Error('Updated application has not acknowledged startup. Close it before reopening the launcher; recovery data is preserved.');manager.recover();continue;}}
   await ended;if(launchError)throw launchError;const request=manager.takeRequest();if(!request)return;
   // No payload or data replacement occurs until the old child has exited.
   try{manager.begin(request);}catch(e){throw Error('Update staging failed; the previous application and data remain available. '+e.message);}
  }
 }finally{unlock();}
}
if(require.main===module){const {app,dialog}=require('electron'),root=path.dirname(process.execPath);app.setName('Script Call Portable Launcher');app.setPath('userData',path.join(root,'.portable-update/bootstrap-profile'));app.whenReady().then(async()=>{try{const config=JSON.parse(fs.readFileSync(path.join(__dirname,'../portable-bootstrap.json')));await supervise(new Manager(root,config));}catch(e){fs.writeFileSync(path.join(root,'.portable-update/last-error.txt'),e.message);dialog.showErrorBox('Script Call portable update',e.message);}finally{app.quit();}});}
module.exports={supervise,environment};
