'use strict';
// Windows-only exact-build QA copy. Never selects an installed app or user profile.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
function prepare(profile,destination){
 assert.equal(process.platform,'win32');
 const source=fs.realpathSync(process.env.CALLSHEET_WINDOWS_APP||'');
 assert(source.startsWith(fs.realpathSync(path.join(root,'build'))+path.sep),'Use a packaged build in this checkout');
 const manifest=JSON.parse(fs.readFileSync(path.join(path.dirname(source),'preview-build.json')));
 assert.equal(manifest.platform,'win32');assert.equal(manifest.arch,process.arch);
 for(const [name,hash] of Object.entries(manifest.sourceHashes)){
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(source,'resources/app',name))).digest('hex'),hash,'Build resource changed: '+name);
 }
 fs.mkdirSync(path.join(root,'tmp'),{recursive:true});
 const bundle=destination||path.join(fs.mkdtempSync(path.join(root,'tmp/windows-app-')),'Script Call');
 assert(path.resolve(bundle).startsWith(path.join(root,'tmp')+path.sep));
 assert(!fs.existsSync(bundle),'QA destination must be fresh');
 fs.cpSync(source,bundle,{recursive:true});
 const config={directory:profile||path.join(path.dirname(bundle),'direct-profile'),allowedParent:root};
 assert(path.resolve(config.directory).startsWith(path.join(root,'tmp')+path.sep));
 fs.writeFileSync(path.join(bundle,'resources/app/desktop/preview-profile.json'),JSON.stringify(config));
 return {bundle,config,executable:path.join(bundle,manifest.kind==='portable-windows-preview'?'Script Call Windows Preview.exe':'Script Call.exe'),source};
}
function executable(bundle){return path.join(bundle,fs.existsSync(path.join(bundle,'Script Call Windows Preview.exe'))?'Script Call Windows Preview.exe':'Script Call.exe');}
module.exports={prepare,executable};
