'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {publishers,verifyWindowsSignature}=require('../desktop/windows-signature.cjs');
const names=['CN=Synthetic test publisher, O=Example'];
test('Windows publisher identities must be explicit full subjects',()=>{for(const v of [null,[],[''],['Example'],[null]])assert.throws(()=>publishers(v));assert.deepEqual(publishers(names),names);});
test('Windows signature gate fails closed and treats executable paths only as data',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'signature-fixture-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const file=path.join(dir,"QA ' Unicode –.exe");fs.writeFileSync(file,'synthetic inert fixture');
 const valid={Status:'Valid',Subject:names[0],Path:file};
 const run=async(command,args,options)=>{assert.equal(command,'powershell.exe');assert(!args.join(' ').includes(file));assert.equal(options.env.SCRIPT_CALL_VERIFY_FILE,fs.realpathSync(file));assert.equal(options.windowsHide,true);return {stdout:JSON.stringify(valid),stderr:''};};
 assert.equal(await verifyWindowsSignature(names,file,{run}),null);
 for(const result of [{...valid,Status:'NotSigned'},{...valid,Subject:'CN=Other, O=Example'},{...valid,Path:dir},{Status:'Valid'},{}])await assert.rejects(verifyWindowsSignature(names,file,{run:async()=>({stdout:JSON.stringify(result),stderr:''})}));
 await assert.rejects(verifyWindowsSignature(names,file,{run:async()=>({stdout:'not JSON',stderr:''})}));
 await assert.rejects(verifyWindowsSignature(names,file,{run:async()=>({stdout:JSON.stringify(valid),stderr:'verification warning'})}));
 await assert.rejects(verifyWindowsSignature(names,file,{run:async()=>{throw Error('PowerShell unavailable');}}),/unavailable/);
});
test('native Windows Authenticode rejects the actual unsigned preview without running it',{skip:process.platform!=='win32'||!process.env.CALLSHEET_UNSIGNED_PREVIEW},async()=>{
 await assert.rejects(verifyWindowsSignature(names,process.env.CALLSHEET_UNSIGNED_PREVIEW),/signature or publisher/);
});
