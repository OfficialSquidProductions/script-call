'use strict';
// Publisher only. This module reads an already approved key; it never generates or stores one.
const fs=require('node:fs'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const SERVICE='org.squidproductions.script-call.release-signing',ACCOUNT='ed25519-v1';
function loadReleaseKey({keyFile=process.env.SCRIPT_CALL_UPDATE_KEY_FILE,platform=process.platform,readFile=fs.readFileSync,execute=execFileSync,createPrivateKey=crypto.createPrivateKey}={}){
 if(keyFile)return createPrivateKey(readFile(keyFile));
 if(platform!=='darwin')throw Error('Use an approved publisher key file on this platform.');
 let secret;
 try{
  // Only nonsecret item identifiers enter argv. Capture output in memory; never log it.
  const result=execute('/usr/bin/security',['find-generic-password','-s',SERVICE,'-a',ACCOUNT,'-w'],{encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:16384});
  const encoded=String(result).trim();if(!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)||encoded.length>16000)throw Error('Invalid item format.');
  secret=Buffer.from(encoded,'base64');return createPrivateKey({key:secret,format:'der',type:'pkcs8'});
 }catch{throw Error('The approved Script Call release key is unavailable in the unlocked login Keychain. No key was created.');}
 finally{secret?.fill(0);}
}
function artifactURL(base,version,file){return new URL('v'+version+'/'+file,base).href;}
module.exports={SERVICE,ACCOUNT,loadReleaseKey,artifactURL};
