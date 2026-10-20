'use strict';
// Publish a prepared private GitHub Release using existing gh authentication only.
// Client distribution of these private assets needs a separately approved endpoint.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {verifyEnvelope}=require('../desktop/update-policy.cjs'),config=require('../desktop/update-config.json');
const repo='OfficialSquidProductions/script-call',gh=process.env.SCRIPT_CALL_GH||(fs.existsSync(path.join(__dirname,'../.runtime/gh'))?path.join(__dirname,'../.runtime/gh'):'gh');
function publish(dir){
 const version=require('../package.json').version,tag='v'+version,envelope=JSON.parse(fs.readFileSync(path.join(dir,'stable.json'),'utf8'));
 const payload=JSON.parse(Buffer.from(envelope.payload,'base64').toString('utf8'));if(payload.version!==version)throw Error('Prepared release version mismatch.');
 const keys=Object.keys(payload.artifacts);if(keys.length!==1)throw Error('Expected one platform per prepared release.');const key=keys[0],platform=key.startsWith('darwin-')?'darwin':'win32',arch=key.slice(platform.length+1);const manifest=verifyEnvelope(envelope,config,'0.0.0',platform,arch);if(!manifest)throw Error('No verified release.');
 const artifact=path.basename(new URL(manifest.artifact.url).pathname),bytes=fs.readFileSync(path.join(dir,artifact));if(bytes.length!==manifest.artifact.size||require('node:crypto').createHash('sha512').update(bytes).digest('base64')!==manifest.artifact.sha512)throw Error('Prepared artifact changed.');
 const metadata=JSON.parse(execFileSync(gh,['repo','view',repo,'--json','nameWithOwner,isPrivate'],{encoding:'utf8'}));if(metadata.nameWithOwner!==repo||!metadata.isPrivate)throw Error('Expected the verified private Script Call repository.');
 // Refuse an existing release instead of overwriting signed assets.
 const exists=require('node:child_process').spawnSync(gh,['release','view',tag,'--repo',repo],{stdio:'ignore'});if(exists.status===0)throw Error('Release tag already published; never replace release artifacts.');
 execFileSync(gh,['release','create',tag,'--repo',repo,'--target','main','--verify-tag','--title','Script Call '+version,'--notes-file',path.join(dir,'release-notes.txt'),path.join(dir,artifact),path.join(dir,'stable.json'),path.join(dir,'SHA512SUMS')],{stdio:'inherit'});
}
if(require.main===module){try{publish(process.argv[2]);}catch(e){console.error('Publication blocked: '+e.message);process.exitCode=1;}}
module.exports={publish};
