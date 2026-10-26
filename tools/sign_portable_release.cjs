'use strict';
// Owner-operated signing on the existing Mac. Never creates or exports a key.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const P=require('../desktop/portable-policy.cjs'),F=require('../desktop/portable-files.cjs'),{signPayload}=require('./release_signer.cjs');
function sign(candidateFile,archive,out){
 const config=require('../desktop/update-config.json'),m=JSON.parse(fs.readFileSync(candidateFile));
 P.validate(m,config,{platform:'win32',arch:m.arch,systemVersion:'10.0.26300'});
 if(Object.keys(m.files).some(name=>name.includes('qa-fixture'))||m.notes.includes('NEVER PUBLISH'))throw Error('Refusing to sign a test fixture as a production release.');
 const bytes=fs.readFileSync(archive);
 if(fs.existsSync(out))throw Error('Use a fresh signed metadata path.');
 if(bytes.length!==m.artifact.size||crypto.createHash('sha512').update(bytes).digest('base64')!==m.artifact.sha512||path.basename(archive)!==path.basename(new URL(m.artifact.url).pathname))throw Error('Candidate artifact hash, size or name mismatch.');
 // Verify extracted content before asking the existing Keychain helper to sign.
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'script-call-portable-sign-'));try{F.extract(bytes,path.join(parent,'payload'),m);}finally{fs.rmSync(parent,{recursive:true,force:true});}
 const payload=Buffer.from(JSON.stringify(m)),envelope={payload:payload.toString('base64'),signature:signPayload(payload,config)};
 P.verify(envelope,config,{platform:'win32',arch:m.arch,systemVersion:'10.0.26300'});
 fs.writeFileSync(out,JSON.stringify(envelope,null,2)+'\n',{flag:'wx'});return out;
}
module.exports={sign};
if(require.main===module){try{console.log(sign(...process.argv.slice(2)));}catch(e){console.error('Portable signing blocked: '+e.message);process.exitCode=1;}}
