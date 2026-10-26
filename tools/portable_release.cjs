'use strict';
// Produces unsigned metadata candidates. Existing-key signing is a separate,
// owner-coordinated operation; no credentials are discovered or generated here.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const P=require('../desktop/portable-policy.cjs'),F=require('../desktop/portable-files.cjs');
const modules=['portable-policy.cjs','portable-files.cjs','portable-manager.cjs','portable-launcher.cjs','update-policy.cjs'];
function candidate(source,out,{notes,artifactBaseUrl=require('../desktop/update-config.json').artifactBaseUrl}={}){
 source=fs.realpathSync(source);if(fs.existsSync(out))throw Error('Immutable candidate output must be new.');
 const pkg=JSON.parse(fs.readFileSync(path.join(source,'resources/app/package.json')));P.version(pkg.version);
 const exe=fs.readFileSync(path.join(source,'Script Call Windows Preview.exe')),pe=exe.readUInt32LE(0x3c);if(exe.toString('ascii',0,2)!=='MZ'||pe+6>exe.length||exe.readUInt32LE(pe)!==0x4550||exe.readUInt16LE(pe+4)!==({x64:0x8664,arm64:0xaa64})[process.arch])throw Error('Payload executable architecture mismatch.');
 const entries={},files={};F.walk(source,file=>{const name=path.relative(source,file).split(path.sep).join('/');P.safePath(name);if(name.includes('Preview Data/')||/\.(sqlite|callsheet|log)$/i.test(name))throw Error('Runtime data cannot ship.');const b=fs.readFileSync(file);entries[name]=b;files[name]={size:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')};});
 const bytes=Buffer.from(require('fflate').zipSync(entries,{level:6})),filename=`Script-Call-${pkg.version}-win32-${process.arch}-payload.zip`,now=Date.now();
 const manifest={schema:1,kind:'portable-windows-release',appId:P.APP_ID,channel:P.CHANNEL,version:pkg.version,platform:'win32',arch:process.arch,minimumSystemVersion:'10.0.0',bootstrapProtocol:1,dataEpoch:1,issuedAt:new Date(now).toISOString(),expiresAt:new Date(now+30*86400000).toISOString(),notes,executable:'Script Call Windows Preview.exe',files,artifact:{url:artifactBaseUrl+'v'+pkg.version+'/'+filename,size:bytes.length,sha512:crypto.createHash('sha512').update(bytes).digest('base64')}};
 P.validate(manifest,{artifactBaseUrl});fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,filename),bytes,{flag:'wx'});fs.writeFileSync(path.join(out,'portable-candidate.json'),JSON.stringify(manifest,null,2));return {manifest,bytes,filename};
}
function bootstrap(source,root,bytes,envelope,config){
 const manifest=P.verify(envelope,config);if(fs.existsSync(root))throw Error('Fresh bootstrap output required.');fs.mkdirSync(root,{recursive:true});
 // Copy the trusted packaged runtime, never a user's installed application.
 for(const entry of fs.readdirSync(source,{withFileTypes:true})){if(entry.name==='resources')continue;fs.cpSync(path.join(source,entry.name),path.join(root,entry.name),{recursive:true});}
 const app=path.join(root,'resources/app');fs.mkdirSync(path.join(app,'desktop'),{recursive:true});
 for(const name of modules)fs.copyFileSync(path.join(source,'resources/app/desktop',name),path.join(app,'desktop',name));
 fs.cpSync(path.join(source,'resources/app/node_modules/fflate'),path.join(app,'node_modules/fflate'),{recursive:true});
 for(const name of ['LICENSE','THIRD_PARTY_NOTICES.md'])fs.copyFileSync(path.join(source,'resources/app',name),path.join(app,name));
 fs.cpSync(path.join(source,'resources/app/licenses'),path.join(app,'licenses'),{recursive:true});
 fs.writeFileSync(path.join(app,'package.json'),JSON.stringify({name:'script-call-portable-bootstrap',version:manifest.version,main:'desktop/portable-launcher.cjs'}));
 fs.writeFileSync(path.join(app,'portable-bootstrap.json'),JSON.stringify(config,null,2));
 return require('../desktop/portable-manager.cjs').initialize(root,config,bytes,envelope);
}
module.exports={candidate,bootstrap};
if(require.main===module){const [source,out,notesFile]=process.argv.slice(2);try{const c=candidate(source,out,{notes:fs.readFileSync(notesFile,'utf8')});console.log(JSON.stringify({file:path.join(out,c.filename),version:c.manifest.version,bytes:c.bytes.length,signing:'not performed'}));}catch(e){console.error(e.message);process.exitCode=1;}}
