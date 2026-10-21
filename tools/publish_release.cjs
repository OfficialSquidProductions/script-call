'use strict';
// Publish approved public release artifacts using existing gh authentication only.
// The separate repository contains release metadata only, never private build inputs.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {verifyEnvelope}=require('../desktop/update-policy.cjs'),config=require('../desktop/update-config.json');
const repo='OfficialSquidProductions/script-call-updates',gh=process.env.SCRIPT_CALL_GH||(fs.existsSync(path.join(__dirname,'../.runtime/gh'))?path.join(__dirname,'../.runtime/gh'):'gh');
function publish(dir,{run=execFileSync,probe=require('node:child_process').spawnSync,verify=verifyEnvelope}={}){
 const envelope=JSON.parse(fs.readFileSync(path.join(dir,'stable.json'),'utf8'));
 const payload=JSON.parse(Buffer.from(envelope.payload,'base64').toString('utf8')),version=payload.version,tag='v'+version;
 const keys=Object.keys(payload.artifacts);if(keys.length!==1)throw Error('Expected one platform per prepared release.');const key=keys[0],platform=key.startsWith('darwin-')?'darwin':'win32',arch=key.slice(platform.length+1);const manifest=verify(envelope,config,'0.0.0',platform,arch);if(!manifest)throw Error('No verified release.');if(fs.readFileSync(path.join(dir,'release-notes.txt'),'utf8').trim()!==manifest.notes.trim())throw Error('Release notes differ from the signed manifest.');
 const artifact=path.basename(new URL(manifest.artifact.url).pathname),bytes=fs.readFileSync(path.join(dir,artifact));if(bytes.length!==manifest.artifact.size||require('node:crypto').createHash('sha512').update(bytes).digest('base64')!==manifest.artifact.sha512)throw Error('Prepared artifact changed.');
 const alias=platform==='darwin'?path.join(dir,'Script-Call-Mac.zip'):null;if(alias&&!fs.readFileSync(alias).equals(bytes))throw Error('Download alias differs from the signed artifact.');
 const metadata=JSON.parse(run(gh,['repo','view',repo,'--json','nameWithOwner,isPrivate'],{encoding:'utf8'}));if(metadata.nameWithOwner!==repo||metadata.isPrivate)throw Error('Expected the approved public Script Call updates repository.');
 // Refuse an existing release instead of overwriting signed assets.
 const exists=probe(gh,['release','view',tag,'--repo',repo],{stdio:'ignore'});if(exists.status===0)throw Error('Release tag already published; never replace release artifacts.');
 run(gh,['release','create',tag,'--repo',repo,'--target','main','--draft','--title','Script Call '+version,'--notes-file',path.join(dir,'release-notes.txt'),path.join(dir,artifact),path.join(dir,'stable-'+platform+'-'+arch+'.json'),path.join(dir,'SHA512SUMS'),path.join(dir,'release-notes.txt'),...(alias?[alias]:[])],{stdio:'inherit'});
 const files=[path.join(dir,artifact),path.join(dir,'stable-'+platform+'-'+arch+'.json'),path.join(dir,'SHA512SUMS'),path.join(dir,'release-notes.txt'),...(alias?[alias]:[])];const remote=JSON.parse(run(gh,['release','view',tag,'--repo',repo,'--json','assets'],{encoding:'utf8'}));if(remote.assets.length!==files.length)throw Error('Draft asset inventory is incomplete. The release remains unpublished.');for(const file of files){const bytes=fs.readFileSync(file),a=remote.assets.find(a=>a.name===path.basename(file));if(!a||a.state!=='uploaded'||a.size!==bytes.length||a.digest!=='sha256:'+require('node:crypto').createHash('sha256').update(bytes).digest('hex'))throw Error('Draft asset verification failed. The release remains unpublished.');}
 run(gh,['release','edit',tag,'--repo',repo,'--draft=false','--latest'],{stdio:'inherit'});
}
if(require.main===module){try{publish(process.argv[2]);}catch(e){console.error('Publication blocked: '+e.message);process.exitCode=1;}}
module.exports={publish};
