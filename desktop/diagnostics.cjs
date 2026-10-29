'use strict';
// Deliberately no error messages, console logs, project records or crash dumps.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const RECIPIENT='alexanderhosier@squidproductions.org',MAX_EVENTS=40,MAX_BYTES=32768,RETENTION_MS=14*86400000;
const KINDS=new Set(['renderer-error','renderer-unhandled-rejection','renderer-crash','renderer-interrupted','main-unhandled-rejection','main-uncaught-exception','startup-failure','operation-failure','utility-crash','session-interrupted']);
const NAMES=new Set(['Error','TypeError','RangeError','ReferenceError','SyntaxError','URIError','EvalError','AggregateError']);
const CODES=new Set(['EACCES','EPERM','ENOENT','ENOSPC','EIO','EBUSY','ENOMEM','ETIMEDOUT','ECONNRESET','ERR_FAILED','SQLITE_BUSY','SQLITE_FULL','SQLITE_CORRUPT']);
const REASONS=new Set(['crashed','oom','abnormal-exit','killed','integrity-failure','launch-failed']);
const SOURCES=new Set(['desktop/main.cjs','desktop/updates.cjs','desktop/diagnostics.cjs','desktop/report-delivery.cjs','core/store.cjs','core/domain.cjs','core/archive.cjs','core/productiondesk.cjs','core/sheet.cjs','core/gcasper.cjs','core/weather.cjs','web/app.js']);
const numeric=s=>String(s||'').match(/^\d+(?:\.\d+){0,3}$/)?.[0]||'unknown';
function summary(error={}){
 try{
 const frames=[];const stack=typeof error?.stack==='string'?error.stack.slice(0,16000).replaceAll('\\','/'):'';
 for(const match of stack.matchAll(/((?:desktop|core)\/[a-z_-]+\.cjs|web\/app\.js|app\/app\.js):(\d{1,7}):(\d{1,7})/g)){
  const source=match[1]==='app/app.js'?'web/app.js':match[1];if(SOURCES.has(source))frames.push(source+':'+match[2]+':'+match[3]);if(frames.length===5)break;
 }
 return {name:NAMES.has(error?.name)?error.name:'Error',...(CODES.has(error?.code)?{code:error.code}:{}),frames};
 }catch{return {name:'Error',frames:[]};}
}
function sanitizeText(value,max=3000){
 return String(value??'').slice(0,12000).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'')
  .replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?(?:-----END [^-]*PRIVATE KEY-----|$)/g,'[private key removed]')
  .replace(/\b(?:github_pat_[\w]+|gh[pousr]_[\w]+|AKIA[A-Z0-9]{16}|xox[baprs]-[\w-]+)\b/g,'[secret removed]')
  .replace(/\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g,'[secret removed]')
  .replace(/\b(?:bearer\s+\S+|(?:password|passwd|token|api[_ -]?key|secret)\s*[:=]\s*(?:"[^"]*"|'[^']*'|\S+))/gi,'[secret removed]')
  .replace(/\b[A-Z]:[\\/][^\r\n<>"|]*/gi,'[local path removed]')
  .replace(/(?:file:\/\/)?\/(?:Users|home|private|var|tmp|Volumes|mnt|opt|Applications)\b[^\r\n<>"']*/g,'[local path removed]')
  .replace(/(?:~[\\/]|\\\\)[^\r\n<>"']*/g,'[local path removed]')
  .replace(/(?:https?|ftp):\/\/\S+/gi,'[URL removed]')
  .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[email removed]').slice(0,max);
}
// Accept only shipped stable/Windows-preview labels, not arbitrary report text.
function diagnosticVersion(value,fallback='unknown'){
 if(typeof value!=='string'||value.length>64)return fallback;
 const match=/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-windows\.preview\.(?:0|[1-9]\d*))?$/.exec(value);
 // JS $ can match before a final newline; require the entire original string.
 return match?.[0]===value?value:fallback;
}
function environment(version,versions=process.versions){return {app:'Script Call',version:diagnosticVersion(version),platform:['darwin','win32','linux'].includes(process.platform)?process.platform:'unknown',os:numeric(os.release()),arch:['arm64','x64','ia32'].includes(process.arch)?process.arch:'unknown',electron:numeric(versions.electron),chromium:numeric(versions.chrome)};}
class Diagnostics{
 constructor({directory,version,versions,now=Date.now,pid=process.pid,alive=p=>{try{process.kill(p,0);return true;}catch{return false;}},notify}){
  Object.assign(this,{directory,now,pid,alive,notify});this.environment=environment(version,versions);this.events=[];this.available=true;this.started=false;this.lastCapture=0;this.drafts=new Map();
  this.log=path.join(directory,'events.json');this.session=path.join(directory,'session.json');
 }
 safe(fn){try{return fn();}catch{this.available=false;return undefined;}}
 read(file,max){try{const st=fs.lstatSync(file);if(!st.isFile()||st.isSymbolicLink()||st.size>max)return null;return JSON.parse(fs.readFileSync(file,'utf8'));}catch{return null;}}
 write(file,value){fs.mkdirSync(this.directory,{recursive:true,mode:0o700});const dir=fs.lstatSync(this.directory);if(!dir.isDirectory()||dir.isSymbolicLink()||(process.platform!=='win32'&&(dir.uid!==process.getuid()||(dir.mode&0o077))))throw Error('Diagnostic directory must be private.');const tmp=file+'.'+crypto.randomUUID()+'.tmp';try{fs.writeFileSync(tmp,JSON.stringify(value),{flag:'wx',mode:0o600});fs.renameSync(tmp,file);}finally{try{fs.unlinkSync(tmp);}catch{}}}
 prune(){const cutoff=this.now()-RETENTION_MS;this.events=this.events.filter(e=>Date.parse(e.at)>=cutoff&&Date.parse(e.at)<=this.now()+300000).slice(-MAX_EVENTS);while(Buffer.byteLength(JSON.stringify(this.events))>MAX_BYTES)this.events.shift();}
 persist(){this.prune();this.safe(()=>this.write(this.log,this.events));try{this.notify?.(this.status());}catch{}}
 begin(){
  const old=this.read(this.log,MAX_BYTES);if(Array.isArray(old))this.events=old.slice(-MAX_EVENTS).filter(e=>KINDS.has(e?.kind)&&typeof e.id==='string'&&/^[a-f0-9-]{36}$/.test(e.id)&&typeof e.at==='string').map(e=>({id:e.id,at:new Date(Date.parse(e.at)||0).toISOString(),version:diagnosticVersion(e.version),kind:e.kind,pending:e.pending===true,diagnostic:summary({name:e.diagnostic?.name,code:e.diagnostic?.code,stack:Array.isArray(e.diagnostic?.frames)?e.diagnostic.frames.filter(x=>typeof x==='string').slice(0,5).join('\n'):''}),...(REASONS.has(e.reason)?{reason:e.reason}:{}),...(Number.isInteger(e.exitCode)&&Math.abs(e.exitCode)<65536?{exitCode:e.exitCode}:{})}));
  const previous=this.read(this.session,2048);if(previous?.schema===1&&previous.clean===false&&Number.isSafeInteger(previous.pid)&&previous.pid>0&&!this.alive(previous.pid))this.capture('session-interrupted',undefined,{version:previous.version});
  this.started=true;this.safe(()=>this.write(this.session,{schema:1,pid:this.pid,version:this.environment.version,started:new Date(this.now()).toISOString(),clean:false}));this.persist();
  this.retentionTimer=setInterval(()=>this.persist(),3600000);this.retentionTimer.unref?.();
 }
 capture(kind,error,details={}){
  if(!KINDS.has(kind))return;
  const diagnostic=summary(error),signature=JSON.stringify([kind,diagnostic,details.reason]);const recent=this.events.at(-1);
  // Repeated identical failures cannot fill the disk or hammer IPC/storage.
  if(recent&&this.lastSignature===signature&&this.now()-this.lastCapture<10000)return;
  this.lastSignature=signature;this.lastCapture=this.now();
  this.events.push({id:crypto.randomUUID(),at:new Date(this.now()).toISOString(),version:diagnosticVersion(details.version,this.environment.version),kind,pending:true,diagnostic,...(REASONS.has(details.reason)?{reason:details.reason}:{}),...(Number.isInteger(details.exitCode)&&Math.abs(details.exitCode)<65536?{exitCode:details.exitCode}:{})});this.persist();
 }
 clean(){clearInterval(this.retentionTimer);if(this.started)this.safe(()=>this.write(this.session,{schema:1,pid:this.pid,clean:true}));}
 status(){this.prune();return {available:this.available,pending:this.events.filter(e=>e.pending).length,kinds:[...new Set(this.events.filter(e=>e.pending).map(e=>e.kind))],retentionDays:14,maxEvents:MAX_EVENTS};}
 dismiss(){this.events.forEach(e=>e.pending=false);this.persist();return this.status();}
 preview({description='',steps='',includeDiagnostics=true}={}){
  this.prune();const id=crypto.randomUUID(),selected=includeDiagnostics?this.events.filter(e=>e.pending).slice(-5):[];
  const lines=['Script Call bug / failure report','To: '+RECIPIENT,'App: Script Call '+this.environment.version,'OS: '+this.environment.platform+' '+this.environment.os+' / '+this.environment.arch,'Electron: '+this.environment.electron+' / Chromium: '+this.environment.chromium,'','Description:',sanitizeText(description)||'(not provided)','','Steps to reproduce:',sanitizeText(steps)||'(not provided)','','Diagnostics:'];
  if(!includeDiagnostics)lines.push('Excluded by user.');else if(!selected.length)lines.push('No pending diagnostic events.');else for(const e of selected){lines.push(e.at+' v'+e.version+' '+e.kind+(e.reason?' ('+e.reason+')':'')+(e.exitCode!==undefined?' exit '+e.exitCode:''),e.diagnostic.name+(e.diagnostic.code?' / '+e.diagnostic.code:''),...e.diagnostic.frames.map(f=>'  '+f));}
  lines.push('','Project/script/media contents, raw error messages, paths, contacts and memory dumps are not collected.','An interrupted session may mean a crash, force quit or power loss; cause is unknown.','Review your own description before sharing. Opening a mail draft does not confirm delivery.');
  const draft={id,to:RECIPIENT,subject:'Script Call '+this.environment.version+' bug report',text:lines.join('\n'),created:this.now()};this.drafts.set(id,draft);for(const [key,v] of this.drafts)if(this.now()-v.created>30*60000||this.drafts.size>5)this.drafts.delete(key);return draft;
 }
 draft(id){const d=this.drafts.get(id);if(!d||this.now()-d.created>30*60000)throw Error('Report preview expired. Review the report again.');return d;}
}
module.exports={Diagnostics,summary,sanitizeText,RECIPIENT,MAX_EVENTS,MAX_BYTES,RETENTION_MS};
