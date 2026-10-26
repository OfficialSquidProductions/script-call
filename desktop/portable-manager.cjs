'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const policy=require('./portable-policy.cjs'),files=require('./portable-files.cjs');
const id=()=>crypto.randomBytes(16).toString('hex');
function hex(v){if(typeof v!=='string'||!/^[a-f0-9]{32}$/.test(v))throw Error('Invalid portable generation.');return v;}
function alive(pid){if(!Number.isSafeInteger(pid)||pid<1)return false;try{process.kill(pid,0);return true;}catch(e){return e.code!=='ESRCH';}}
class Manager{
 constructor(root,config){this.root=path.resolve(root);files.plain(this.root);this.config=config;this.meta=path.join(this.root,'.portable-update');for(const d of [this.meta,path.join(this.root,'versions'),path.join(this.root,'data')])files.plain(d);}
 file(name){return path.join(this.meta,name);}
 state(){const s=JSON.parse(fs.readFileSync(this.file('current.json')));if(s.schema!==1||s.dataEpoch!==1)throw Error('Unsupported portable state.');this.validateRef(s.active);if(s.trial)hex(s.trial);return s;}
 validateRef(r){hex(r.slot);hex(r.data);policy.version(r.version);}
 data(r){return path.join(this.root,'data',hex(r.data));}
 payload(r){return path.join(this.root,'versions',hex(r.slot));}
 release(r,{installed=true,current}={}){this.validateRef(r);const envelope=JSON.parse(fs.readFileSync(this.file(hex(r.slot)+'.json')));const m=policy.verify(envelope,this.config,{installed,current});if(m.version!==r.version)throw Error('Portable pointer version mismatch.');return m;}
 verifyActive(){const s=this.state(),m=this.release(s.active);files.verifyTree(this.payload(s.active),m);files.plain(this.data(s.active));return {state:s,manifest:m};}
 stage(bytes,envelope){const s=this.state();if(s.trial)throw Error('Finish the pending startup before downloading.');const m=policy.verify(envelope,this.config,{current:s.active.version}),slot=id(),ref={slot,data:s.active.data,version:m.version};files.extract(bytes,this.payload(ref),m,{internetOrigin:true});files.atomic(this.file(slot+'.json'),envelope);return ref;}
 request(ref){const s=this.state();if(s.trial)throw Error('An update is already pending.');const m=this.release(ref,{installed:false,current:s.active.version});files.verifyTree(this.payload(ref),m);files.atomic(this.file('request.json'),{schema:1,from:s.active,to:ref});}
 takeRequest(){const file=this.file('request.json');if(!fs.existsSync(file))return null;const r=JSON.parse(fs.readFileSync(file));if(r.schema!==1||JSON.stringify(r.from)!==JSON.stringify(this.state().active))throw Error('Stale portable update request.');this.validateRef(r.to);fs.renameSync(file,this.file('request-consumed-'+id()+'.json'));return r.to;}
 begin(ref,{checkpoint=()=>{}}={}){
  const s=this.state();if(s.trial)throw Error('An update is already pending.');const m=this.release(ref,{installed:false,current:s.active.version});files.verifyTree(this.payload(ref),m);
  // Copy only after the old process exits. Failed startup/migration never modifies
  // the previous generation. Once acknowledged, never auto-revert later edits.
  const next={...ref,data:id()};files.clone(this.data(s.active),this.data(next));checkpoint('data-cloned');
  const tx={schema:1,nonce:id(),from:s.active,to:next,pid:null,phase:'prepared'};files.atomic(this.file('transaction.json'),tx);checkpoint('journal-written');
  files.atomic(this.file('current.json'),{schema:1,dataEpoch:1,active:next,trial:tx.nonce});checkpoint('pointer-switched');return tx;
 }
 transaction(){const tx=JSON.parse(fs.readFileSync(this.file('transaction.json')));if(tx.schema!==1)throw Error('Invalid portable journal.');hex(tx.nonce);this.validateRef(tx.from);this.validateRef(tx.to);return tx;}
 childStarted(pid){const s=this.state(),tx=this.transaction();if(s.trial!==tx.nonce||!Number.isSafeInteger(pid)||pid<1)throw Error('Invalid portable startup.');tx.pid=pid;tx.phase='started';files.atomic(this.file('transaction.json'),tx);}
 acknowledge(nonce){const s=this.state();if(!s.trial)return;const tx=this.transaction();if(nonce!==s.trial||nonce!==tx.nonce||JSON.stringify(s.active)!==JSON.stringify(tx.to))throw Error('Invalid portable startup acknowledgement.');files.atomic(this.file('ack-'+hex(nonce)+'.json'),{nonce,dataEpoch:1,ready:true});}
 accept(){const s=this.state();if(!s.trial)return true;const tx=this.transaction(),p=this.file('ack-'+hex(s.trial)+'.json');if(!fs.existsSync(p))return false;const ack=JSON.parse(fs.readFileSync(p));if(ack.nonce!==s.trial||ack.dataEpoch!==1||ack.ready!==true||tx.nonce!==s.trial)throw Error('Invalid startup acknowledgement.');
  files.atomic(this.file('current.json'),{schema:1,dataEpoch:1,active:s.active,previous:tx.from});
  // The committed pointer is the acknowledgement; no second file must be atomic.
  return true;
 }
 recover({isAlive=alive}={}){const s=this.state();if(!s.trial)return {recovered:false};const tx=this.transaction();if(s.trial!==tx.nonce||JSON.stringify(s.active)!==JSON.stringify(tx.to))throw Error('Portable journal mismatch.');if(tx.pid&&isAlive(tx.pid))throw Error('The trial application is still running. Close it before recovery.');files.atomic(this.file('current.json'),{schema:1,dataEpoch:1,active:tx.from,failed:{version:tx.to.version,slot:tx.to.slot,data:tx.to.data}});return {recovered:true,failed:tx.to.version};}
 lock(){const file=this.file('launcher.lock');try{fs.writeFileSync(file,JSON.stringify({pid:process.pid}),{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;const lock=JSON.parse(fs.readFileSync(file));if(alive(lock.pid))throw Error('Script Call portable is already running.');fs.unlinkSync(file);fs.writeFileSync(file,JSON.stringify({pid:process.pid}),{flag:'wx'});}return ()=>{if(JSON.parse(fs.readFileSync(file)).pid===process.pid)fs.unlinkSync(file);};}
}
function initialize(root,config,bytes,envelope){const m=policy.verify(envelope,config);if(fs.existsSync(path.join(root,'.portable-update')))throw Error('Fresh bootstrap directory required.');fs.mkdirSync(root,{recursive:true});files.plain(root);for(const d of ['.portable-update','versions','data'])fs.mkdirSync(path.join(root,d));const manager=new Manager(root,config),ref={slot:id(),data:id(),version:m.version};files.extract(bytes,manager.payload(ref),m);files.atomic(manager.file(ref.slot+'.json'),envelope);fs.mkdirSync(manager.data(ref));files.atomic(manager.file('current.json'),{schema:1,dataEpoch:1,active:ref});return manager;}
module.exports={Manager,initialize,alive};
