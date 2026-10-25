'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
// Extract the authenticated public ZIP without altering it, then make an ordinary
// user-owned copy for the disposable installation. Archive-restored OS-local
// app-management metadata made the prior fixture nonwritable despite owner modes.
// Copy all bytes/symlinks exactly; do not chmod, delete attributes, or change TCC.
function nativeUpgradeFixture(zip,work,installation){
 const extracted=path.join(work,'authenticated-bootstrap');fs.mkdirSync(extracted);
 execFileSync('ditto',['-x','-k',zip,extracted]);const source=path.join(extracted,'Script Call.app'),bundle=path.join(installation,'Script Call.app');
 fs.cpSync(source,bundle,{recursive:true,preserveTimestamps:true,dereference:false,verbatimSymlinks:true});
 let files=0,links=0;function verify(relative=''){
  const from=path.join(source,relative),to=path.join(bundle,relative);assert.deepEqual(fs.readdirSync(to).sort(),fs.readdirSync(from).sort());
  for(const name of fs.readdirSync(from)){const part=path.join(relative,name),a=path.join(source,part),b=path.join(bundle,part),s=fs.lstatSync(a),t=fs.lstatSync(b);assert.equal(s.isDirectory(),t.isDirectory());assert.equal(s.isSymbolicLink(),t.isSymbolicLink());if(s.isSymbolicLink()){assert.equal(fs.readlinkSync(a),fs.readlinkSync(b));links++;}else if(s.isDirectory())verify(part);else{assert(fs.readFileSync(a).equals(fs.readFileSync(b)),part);files++;}}
 }verify();
 for(const args of [['codesign','--verify','--deep','--strict',bundle],['xcrun','stapler','validate',bundle],['spctl','--assess','--type','execute',bundle]])execFileSync(args[0],args.slice(1),{stdio:'pipe'});
 return {source,bundle,files,links,byteIdentical:true,securityChecksPassed:true,copyMethod:'ordinary user-owned fs.cp; no modes, attributes or system settings changed'};
}
module.exports={nativeUpgradeFixture};
