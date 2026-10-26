'use strict';
// Native, isolated development packaging only. This never produces an installer,
// publishes a feed, discovers signing keys, or touches an installed application.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function previewPlan(root,out,arch=process.arch) {
 root=fs.realpathSync(root);out=path.resolve(root,out||'build/windows-preview');
 const build=path.join(root,'build');
 if(!['x64','arm64'].includes(arch))throw Error('Windows preview supports explicit x64 or arm64 only.');
 if(!out.startsWith(build+path.sep)||out===build)throw Error('Choose a new preview directory inside this checkout/build.');
 if(path.relative(root,out).split(path.sep).some(part=>['.local-data','.reporter-preview-data'].includes(part)))throw Error('Preview output cannot use a user profile directory.');
 // Check existing ancestors rather than allowing a symlink/junction to live data.
 let ancestor=out;while(!fs.existsSync(ancestor))ancestor=path.dirname(ancestor);
 const actual=fs.realpathSync(ancestor);
 const physical=path.join(actual,path.relative(ancestor,out));
 if(!physical.startsWith(build+path.sep))throw Error('Preview output escapes checkout/build through a link.');
 if(fs.existsSync(out))throw Error('Preview output already exists; choose a fresh directory.');
 return {root,out,arch,profile:path.join(out,'profile')};
}
function previewConfig(plan) {
 return {directories:{output:plan.out},asar:false,publish:null,
  win:{target:'dir',icon:'web/assets/icon.ico',signExecutable:false,verifyUpdateCodeSignature:true},
  afterPack:async context=>{
   const app=path.join(context.appOutDir,'resources','app');
   fs.writeFileSync(path.join(app,'desktop','preview-profile.json'),JSON.stringify({directory:plan.profile,allowedParent:plan.out}));
   // Manifest contains public shipped source, not project contents or credentials.
   const hashes={};for(const folder of ['desktop','core','web'])walk(path.join(app,folder),file=>{hashes[path.relative(app,file).split(path.sep).join('/')]=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');});
   fs.writeFileSync(path.join(plan.out,'preview-build.json'),JSON.stringify({kind:'development-preview',version:require(path.join(plan.root,'package.json')).version,platform:'win32',arch:plan.arch,profile:plan.profile,updates:'disabled by embedded preview profile',sourceHashes:hashes},null,2));
  }};
}
function walk(dir,visit){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isSymbolicLink())throw Error('Unexpected linked shipping resource.');if(entry.isDirectory())walk(file,visit);else if(entry.isFile())visit(file);}}
async function build({out,arch=process.arch}={}) {
 if(process.platform!=='win32')throw Error('Build and verify this preview on the authorized Windows PC; Mac checks are not Windows verification.');
 const plan=previewPlan(path.resolve(__dirname,'..'),out,arch);
 if(arch!==process.arch)throw Error('Build the native Windows architecture first; cross-architecture validation is separate.');
 const {build,Platform,Arch}=require('electron-builder');
 // Prevent automatic certificate discovery during local preview preparation.
 const previous=process.env.CSC_IDENTITY_AUTO_DISCOVERY;process.env.CSC_IDENTITY_AUTO_DISCOVERY='false';
 try{await build({projectDir:plan.root,targets:Platform.WINDOWS.createTarget('dir',arch==='x64'?Arch.x64:Arch.arm64),publish:'never',config:previewConfig(plan)});}
 finally{if(previous===undefined)delete process.env.CSC_IDENTITY_AUTO_DISCOVERY;else process.env.CSC_IDENTITY_AUTO_DISCOVERY=previous;}
 return plan;
}
if(require.main===module)build({out:process.argv[2]}).then(plan=>console.log(JSON.stringify(plan,null,2))).catch(error=>{console.error('Windows preview blocked: '+error.message);process.exitCode=1;});
module.exports={previewPlan,previewConfig,build};
