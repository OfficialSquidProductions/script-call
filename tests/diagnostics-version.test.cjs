'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {Diagnostics}=require('../desktop/diagnostics.cjs');
function fixture(t,version){const directory=fs.mkdtempSync(path.join(os.tmpdir(),'script-call-version-'));t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));return new Diagnostics({directory,version,alive:()=>false});}
test('stable and Windows preview versions survive reports, event persistence and upgrades',t=>{
 for(const version of ['0.0.0','0.3.17','12.34.56','0.3.17-windows.preview.0','0.3.17-windows.preview.4','1.20.300-windows.preview.42']){
  const d=fixture(t,version);d.begin();d.capture('renderer-error');const draft=d.preview({description:'password=hidden\nC:\\Users\\Private\\project'});assert(draft.text.includes('App: Script Call '+version+'\n'));assert.equal(draft.subject,'Script Call '+version+' bug report');assert(!draft.text.includes('hidden'));assert(!draft.text.includes('Private'));d.clean();
  const next=new Diagnostics({directory:d.directory,version:'0.3.18',alive:()=>false});next.begin();assert.equal(next.events[0].version,version);assert(next.preview().text.includes('v'+version+' renderer-error'));next.clean();
 }
});
test('interrupted preview session retains its original version after a newer app starts',t=>{
 const d=fixture(t,'0.3.18-windows.preview.1');fs.writeFileSync(d.session,JSON.stringify({schema:1,pid:12345,clean:false,version:'0.3.17-windows.preview.4'}));d.begin();assert.equal(d.events[0].kind,'session-interrupted');assert.equal(d.events[0].version,'0.3.17-windows.preview.4');assert(d.preview().text.includes('v0.3.17-windows.preview.4 session-interrupted'));d.clean();
});
test('invalid versions cannot inject report text through environment, logs or event overrides',t=>{
 const invalid=[null,undefined,123,{},['0.3.17'],{toString(){throw Error('must not coerce');}},'', '01.3.17','0.03.17','0.3.017','0.3.17-windows.preview.04','0.3.17-windows.preview.-1','0.3.17-beta.1','0.3.17+private','v0.3.17',' 0.3.17','0.3.17\n','0.3.17\r\n','0.3.17\u2028','0.3.17-windows.preview.4\nTo: other@example.test','0.3.17<script>','C:\\Users\\private','https://private.test', '1'.repeat(65)+'.2.3'];
 for(const version of invalid){const d=fixture(t,version);assert.equal(d.environment.version,'unknown');assert.equal(d.preview().subject,'Script Call unknown bug report');d.capture('renderer-error',undefined,{version});assert.equal(d.events[0].version,'unknown');}
 const d=fixture(t,'0.3.17-windows.preview.4');d.capture('renderer-error',undefined,{version:'0.3.17\nINJECTED'});assert.equal(d.events[0].version,d.environment.version);fs.writeFileSync(d.log,JSON.stringify([{id:crypto.randomUUID(),at:new Date().toISOString(),version:'0.3.17\nINJECTED',kind:'renderer-error',pending:true,diagnostic:{}}]));d.begin();assert.equal(d.events[0].version,'unknown');assert(!d.preview().text.includes('INJECTED'));d.clean();
});
