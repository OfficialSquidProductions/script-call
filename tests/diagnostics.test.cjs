'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {Diagnostics,summary,sanitizeText,RECIPIENT,MAX_EVENTS,MAX_BYTES,RETENTION_MS}=require('../desktop/diagnostics.cjs');
const {openDraft}=require('../desktop/report-delivery.cjs');
function fixture(t,options={}){const directory=fs.mkdtempSync(path.join(os.tmpdir(),'script-call-diagnostics-'));t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));return new Diagnostics({directory,version:'0.3.4',alive:()=>false,...options});}
test('automatic diagnostics retain only fixed categories and app-owned source locations',t=>{
 const d=fixture(t);d.begin();d.capture('renderer-error',{name:'TypeError',code:'EACCES',message:'PRIVATE-PROJECT screenplay token=secret',stack:'TypeError: PRIVATE-PROJECT\n at name (/Users/alice/private-film/core/store.cjs:20:4)\n at secretName (C:\\Users\\Alice\\Film\\web\\app.js:14:2)\n at /Users/alice/secret.txt:55:2'});
 const text=fs.readFileSync(d.log,'utf8');assert(!/PRIVATE|alice|Alice|secret|private-film|secretName/.test(text));assert.match(text,/core\/store.cjs:20:4/);assert.match(text,/web\/app.js:14:2/);if(process.platform!=='win32'){assert.equal(fs.statSync(d.log).mode&0o777,0o600);assert.equal(fs.statSync(d.directory).mode&0o777,0o700);}assert.equal(d.status().pending,1);
 assert.deepEqual(summary(new Proxy({},{get(){throw Error('hostile getter');}})),{name:'Error',frames:[]});
});
test('clean shutdown differs from an interrupted session and live sessions are not misclassified',t=>{
 const d=fixture(t);d.begin();d.clean();const clean=new Diagnostics({directory:d.directory,version:'0.3.4',alive:()=>false});clean.begin();assert.equal(clean.status().pending,0);
 const live=new Diagnostics({directory:d.directory,version:'0.3.4',alive:()=>true});live.begin();assert.equal(live.status().pending,0);
 const interrupted=new Diagnostics({directory:d.directory,version:'0.3.4',alive:()=>false});interrupted.begin();assert.deepEqual(interrupted.status().kinds,['session-interrupted']);assert.match(interrupted.preview().text,/cause is unknown/);interrupted.dismiss();interrupted.clean();const next=new Diagnostics({directory:d.directory,version:'0.3.4',alive:()=>false});next.begin();assert.equal(next.status().pending,0);
});
test('retention, byte/count bounds and duplicate throttling survive restarts',t=>{
 let now=Date.now();const d=fixture(t,{now:()=>now});d.begin();d.capture('renderer-error');d.capture('renderer-error');assert.equal(d.events.length,1);
 for(let n=0;n<100;n++){now+=11000;d.capture(n%2?'renderer-error':'main-unhandled-rejection');}assert.equal(d.events.length,MAX_EVENTS);assert(fs.statSync(d.log).size<=MAX_BYTES);
 now+=RETENTION_MS+1;assert.equal(d.status().pending,0);d.clean();const restored=new Diagnostics({directory:d.directory,version:'0.3.4',now:()=>now});restored.begin();assert.equal(restored.events.length,0);
});
test('reports redact common credentials, URLs, contacts and personal paths and can omit diagnostics',t=>{
 const d=fixture(t);d.begin();d.capture('main-unhandled-rejection',new Error('PRIVATE-MESSAGE'));const draft=d.preview({description:'Problem\n/Users/alice/Film/secret.txt\nC:\\Users\\Alice\\film\npassword=hidden\ntoken="keep out"\nBearer tokenhere\n'+'ghp'+'_'+'abcdefghijklmnopqrstuvwxyz12345'+'\nhttps://example.test/private?token=secret\nalice@example.test',steps:'Click the button.',includeDiagnostics:false});
 assert.equal(draft.to,RECIPIENT);assert(!/alice|Alice|hidden|keep out|tokenhere|ghp_|example.test|PRIVATE-MESSAGE/.test(draft.text));assert.match(draft.text,/Excluded by user/);assert.match(draft.text,/0.3.4/);assert.match(draft.text,/OS:/);assert.equal(d.draft(draft.id).text,draft.text);assert.equal(sanitizeText('x'.repeat(10000)).length,3000);
});
test('corrupt/oversized logs are bounded and storage failure leaves manual report available',t=>{
 const d=fixture(t);fs.writeFileSync(d.log,'x'.repeat(MAX_BYTES+1));d.begin();assert.equal(d.events.length,0);d.capture('renderer-error');const e=JSON.parse(fs.readFileSync(d.log));e[0].diagnostic.frames={bad:true};fs.writeFileSync(d.log,JSON.stringify(e));const repaired=new Diagnostics({directory:d.directory,version:'0.3.4',alive:()=>false});assert.doesNotThrow(()=>repaired.begin());
 const blocked=path.join(d.directory,'file');fs.writeFileSync(blocked,'file');const broken=new Diagnostics({directory:blocked,version:'0.3.4'});assert.doesNotThrow(()=>broken.begin());assert.equal(broken.status().available,false);assert.equal(broken.preview().to,RECIPIENT);
});
test('diagnostic storage refuses a symlink and preserves captured version across app upgrades',t=>{
 const d=fixture(t);d.begin();d.capture('renderer-crash');d.clean();const next=new Diagnostics({directory:d.directory,version:'0.3.5',alive:()=>false});next.begin();assert.match(next.preview().text,/v0.3.4 renderer-crash/);next.clean();
 const target=path.join(d.directory,'target'),link=path.join(d.directory,'linked');fs.mkdirSync(target,{mode:0o700});fs.symlinkSync(target,link,process.platform==='win32'?'junction':'dir');const blocked=new Diagnostics({directory:link,version:'0.3.4'});assert.doesNotThrow(()=>blocked.begin());assert.equal(blocked.status().available,false);assert.deepEqual(fs.readdirSync(target),[]);
});
test('only immutable reviewed drafts are delivered; previews expire and are bounded',t=>{
 let now=Date.now();const d=fixture(t,{now:()=>now});for(let n=0;n<12;n++)d.preview({description:String(n)});assert.equal(d.drafts.size,5);const a=d.preview();now+=31*60000;assert.throws(()=>d.draft(a.id),/expired/);assert.throws(()=>d.draft('unknown'),/expired/);
});
test('mail action uses exact recipient and reviewed text; success means draft requested only',async t=>{
 const d=fixture(t),draft=d.preview({description:'The button did not respond.'}),calls=[];
 const result=await openDraft(draft,{app:{getApplicationNameForProtocol:url=>{assert.equal(url,'mailto:'+RECIPIENT);return 'Mail';}},shell:{openExternal:async url=>calls.push(url)}});
 assert.equal(result.opened,true);assert.match(result.reason,/Delivery is not confirmed/);const url=new URL(calls[0]);assert.equal(url.pathname,RECIPIENT);assert.equal(url.searchParams.get('body'),draft.text);assert.equal(url.searchParams.get('subject'),draft.subject);
});
test('missing/failed mail client and oversized URI keep full copy/export fallback without sending',async t=>{
 const d=fixture(t),draft=d.preview();let calls=0;const shell={openExternal:async()=>{calls++;throw Error('fail');}};
 const absent=await openDraft(draft,{app:{getApplicationNameForProtocol:()=>''},shell});assert.equal(absent.opened,false);assert.match(absent.reason,/Copy or export/);assert.equal(calls,0);
 const large=await openDraft(d.preview({description:'x'.repeat(3000)}),{app:{getApplicationNameForProtocol:()=>'Mail'},shell});assert.equal(large.opened,false);assert.match(large.reason,/size limit/);assert.equal(calls,0);
 const failed=await openDraft(draft,{app:{getApplicationNameForProtocol:()=>'Mail'},shell});assert.equal(failed.opened,false);assert.equal(calls,1);assert.match(failed.reason,/could not be opened/);
});
