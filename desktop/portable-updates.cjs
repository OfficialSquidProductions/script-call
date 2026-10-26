'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {verify,CHANNEL}=require('./portable-policy.cjs'),{metadata,download}=require('./portable-download.cjs');
const {atomic}=require('./portable-files.cjs');
class PortableUpdates{
 constructor({context,app,backup,busy,notify,fetcher=fetch}){Object.assign(this,{context,app,backup,busy,notify,fetcher});this.enabled=!!context.config.manifestUrl;this.automatic=false;this.pending=false;this.state={status:this.enabled?'idle':'disabled',reason:this.enabled?'Ready to check signed portable preview releases.':'The signed portable preview feed is not published yet.'};this.preference=path.join(context.directory,'portable-update-preferences.json');try{this.automatic=JSON.parse(fs.readFileSync(this.preference)).automatic===true;}catch{}this.timers=[];}
 status(){return {...this.state,enabled:this.enabled,automatic:this.automatic,channel:CHANNEL};}
 set(status,extra={}){this.state={status,...extra};this.notify?.(this.status());return this.status();}
 preferences(automatic){if(typeof automatic!=='boolean')throw Error('Invalid update preference.');atomic(this.preference,{automatic});this.automatic=automatic;return this.status();}
 start(){if(!this.enabled)return;const run=()=>{if(this.automatic)this.check().catch(()=>{});};this.timers=[setTimeout(run,30000),setInterval(run,86400000)];this.timers.forEach(t=>t.unref());}
 async check(){if(!this.enabled||this.pending||['available','downloaded','installing'].includes(this.state.status))return this.status();this.pending=true;this.set('checking');try{this.envelope=await metadata(this.context.config.manifestUrl,this.fetcher);this.release=verify(this.envelope,this.context.config);if(!require('./portable-policy.cjs').newer(this.release.version,this.app.getVersion()))return this.set('current',{reason:'This portable preview is up to date.'});return this.set('available',{version:this.release.version,notes:this.release.notes});}catch(e){return this.set('error',{reason:e.message});}finally{this.pending=false;}}
 async download(){if(!this.enabled||this.pending||this.state.status!=='available')throw Error('Check for an available update first.');this.pending=true;this.set('downloading');const file=this.context.manager.file('download-'+crypto.randomBytes(16).toString('hex')+'.zip');try{const m=verify(this.envelope,this.context.config,{current:this.app.getVersion()});await download(m,file,this.fetcher);this.staged=this.context.manager.stage(fs.readFileSync(file),this.envelope);return this.set('downloaded',{version:m.version,notes:m.notes});}catch(e){return this.set('error',{reason:e.message});}finally{this.pending=false;}}
 install(){if(this.pending||this.state.status!=='downloaded'||this.busy())throw Error('Finish saving before installing.');this.backup();this.context.manager.request(this.staged);this.set('installing');this.app.quit();return this.status();}
 close(){this.timers.forEach(clearTimeout);}
}
module.exports={PortableUpdates};
