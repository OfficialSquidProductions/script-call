'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {configuration,verifyEnvelope}=require('./update-policy.cjs');
async function readManifest(url,fetcher=fetch){
 let target=url,response;
 for(let redirects=0;redirects<6;redirects++){
  const u=new URL(target);if(u.protocol!=='https:'||u.username||u.password)throw Error('Insecure metadata redirect rejected.');
  response=await fetcher(target,{signal:AbortSignal.timeout(15000),headers:{Accept:'application/json'},redirect:'manual',cache:'no-store'});
  if(response.status>=300&&response.status<400){const next=response.headers.get('location');await response.body?.cancel();if(!next)throw Error('Invalid metadata redirect.');target=new URL(next,target).href;response=null;continue;}break;
 }
 if(!response)throw Error('Too many metadata redirects.');
 if(!response.ok)throw Error('Update server is unavailable.');
 const reader=response.body.getReader();let size=0,parts=[];try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>200000)throw Error('Release metadata exceeds the size limit.');parts.push(Buffer.from(value));}}finally{await reader.cancel();}
 return JSON.parse(Buffer.concat(parts).toString('utf8'));
}
class Updates {
 constructor({app,config,updaterFactory,fetcher,backup,busy,notify,platform=process.platform,arch=process.arch}){
  Object.assign(this,{app,config,updaterFactory,fetcher,backup,busy,notify,platform,arch});this.state={status:'disabled',reason:config.reason};this.pending=false;this.server=null;this.timers=[];this.enabled=false;
  this.preferenceFile=path.join(app.getPath('userData'),'script-call-updates.json');this.automatic=true;
  try{this.automatic=JSON.parse(fs.readFileSync(this.preferenceFile,'utf8')).automatic!==false;}catch{}
  try{configuration(config);if(!app.isPackaged)throw Error('Install a packaged signed release to use updates.');if(!['darwin','win32'].includes(platform))throw Error('Updates are unsupported on this platform.');if(platform==='win32'&&(!Array.isArray(config.publisherName)||!config.publisherName.length))throw Error('Windows update publisher identity is not configured.');this.enabled=true;this.state={status:'idle',reason:'Ready to check signed stable releases.'};}catch(e){this.state.reason=e.message;}
 }
 status(){return {...this.state,enabled:this.enabled,automatic:this.automatic};}
 setState(status,extra={}){this.state={status,...extra};this.notify?.(this.status());return this.status();}
 preferences(automatic){if(typeof automatic!=='boolean')throw Error('Invalid update preference.');fs.mkdirSync(path.dirname(this.preferenceFile),{recursive:true});const tmp=this.preferenceFile+'.tmp';fs.writeFileSync(tmp,JSON.stringify({automatic}),{mode:0o600});fs.renameSync(tmp,this.preferenceFile);this.automatic=automatic;return this.status();}
 start(){if(!this.enabled)return;const run=()=>{if(this.automatic)this.check().catch(()=>{});};this.timers.push(setTimeout(run,30000),setInterval(run,86400000));this.timers.forEach(t=>t.unref?.());}
 async check(){
  if(!this.enabled)return this.status();if(this.pending||['available','downloaded','downloading','installing'].includes(this.state.status))return this.status();this.pending=true;this.setState('checking');
  try{const manifestUrl=this.config.manifestUrl.replaceAll('{platform}',this.platform).replaceAll('{arch}',this.arch);const envelope=await readManifest(manifestUrl,this.fetcher);const release=verifyEnvelope(envelope,this.config,this.app.getVersion(),this.platform,this.arch);this.release=release;return this.setState(release?'available':'current',release?{version:release.version,notes:release.notes}:{reason:'Script Call is up to date.'});}
  catch(e){return this.setState('error',{reason:'Could not check updates. Your work is safe; try again when online. '+e.message});}finally{this.pending=false;}
 }
 async setup(){
  if(this.updater)return;const updater=this.updaterFactory?this.updaterFactory():require('electron-updater').autoUpdater;this.updater=updater;
  updater.autoDownload=false;updater.autoInstallOnAppQuit=false;updater.allowDowngrade=false;updater.allowPrerelease=false;updater.disableDifferentialDownload=true;updater.disableWebInstaller=true;
  // A random loopback path exposes only metadata derived from the verified envelope.
  const token=crypto.randomBytes(24).toString('hex');this.server=http.createServer((req,res)=>{const name=this.platform==='darwin'?'latest-mac.yml':'latest.yml';if(req.method!=='GET'||new URL(req.url,'http://127.0.0.1').pathname!=='/'+token+'/'+name){res.writeHead(404).end();return;}const r=this.release,a=r.artifact;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify({version:r.version,releaseNotes:r.notes,releaseDate:r.issuedAt,path:a.url,sha512:a.sha512,files:[{url:a.url,sha512:a.sha512,size:a.size}]}));});
  await new Promise((resolve,reject)=>{this.server.once('error',reject);this.server.listen(0,'127.0.0.1',resolve);});this.server.unref();
  const {port}=this.server.address();const provider={provider:'generic',url:`http://127.0.0.1:${port}/${token}/`,useMultipleRangeRequest:false};
  if(this.platform==='win32')provider.publisherName=this.config.publisherName;
  // Never consult package publish settings or an unauthenticated remote YAML feed.
  const configPath=path.join(this.app.getPath('userData'),'script-call-native-update.yml');updater.updateConfigPath=configPath;
  fs.writeFileSync(configPath,JSON.stringify({provider:'generic',url:provider.url,publisherName:this.config.publisherName,updaterCacheDirName:'script-call-updater'}),{mode:0o600});
  updater.setFeedURL(provider);
  updater.on('error',()=>this.setState('error',{reason:'The update could not be verified or downloaded. Your current app and projects are unchanged.'}));
  updater.on('update-downloaded',()=>this.setState('downloaded',{version:this.release.version,notes:this.release.notes}));
 }
 async download(){
  if(!this.enabled||this.state.status!=='available'||this.pending)throw Error('Check for an available update first.');this.pending=true;
  try{const release=this.release;if(Date.parse(release.expiresAt)<=Date.now())throw Error('Check again: release metadata expired.');this.setState('downloading',{version:release.version});await this.setup();const found=await this.updater.checkForUpdates();if(!found||found.updateInfo.version!==release.version)throw Error('Release metadata mismatch.');await this.updater.downloadUpdate();return this.status();}
  catch(e){this.setState('error',{reason:'Update download failed. '+e.message});return this.status();}finally{this.pending=false;}
 }
 async install(){
  if(this.state.status!=='downloaded'||this.pending||this.busy())throw Error('Finish saving or issuing before installing the update.');
  // Renderer has completed flush() before this IPC. Backup is main-process only.
  this.backup();this.setState('installing');this.updater.quitAndInstall(false,true);return this.status();
 }
 close(){this.timers.forEach(clearTimeout);this.timers.forEach(clearInterval);this.server?.close();}
}
module.exports={Updates,readManifest};
