'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFile}=require('node:child_process'),{promisify}=require('node:util');
const execute=promisify(execFile);
function publishers(names){
 if(!Array.isArray(names)||!names.length||names.some(n=>typeof n!=='string'||!n.startsWith('CN=')||!n.includes(',')||n.trim()!==n))throw Error('Windows updates require approved full publisher identities.');
 return names;
}
async function verifyWindowsSignature(names,file,{run=execute}={}){
 publishers(names);
 const exact=fs.realpathSync(file);
 // The path is data in an environment variable, never interpolated into shell code.
 const script='$ErrorActionPreference="Stop";$s=Get-AuthenticodeSignature -LiteralPath $env:SCRIPT_CALL_VERIFY_FILE;[pscustomobject]@{Status=$s.Status.ToString();Subject=$s.SignerCertificate.Subject;Path=$s.Path}|ConvertTo-Json -Compress';
 // PowerShell 7's inherited module path is incompatible with Windows PowerShell 5.
 // Let the child discover its own standard modules without changing system settings.
 const env={...process.env,SCRIPT_CALL_VERIFY_FILE:exact};for(const key of Object.keys(env))if(key.toLowerCase()==='psmodulepath')delete env[key];
 const {stdout,stderr}=await run('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{windowsHide:true,timeout:20000,maxBuffer:65536,env});
 if(stderr?.trim())throw Error('Windows signature verification reported an error.');
 const result=JSON.parse(stdout.trim().replace(/^\uFEFF/,''));
 if(result.Status!=='Valid'||!names.includes(result.Subject))throw Error('Windows installer signature or publisher identity is not trusted.');
 if(typeof result.Path!=='string'||path.normalize(fs.realpathSync(result.Path))!==path.normalize(exact))throw Error('Windows signature verification returned a different file.');
 return null;
}
module.exports={publishers,verifyWindowsSignature};
