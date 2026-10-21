'use strict';
// Publisher only. Existing explicitly approved files are optional on other platforms.
// Mac Keychain secrets are never exported: use the signed release-key helper.
const fs=require('node:fs'),crypto=require('node:crypto');
const SERVICE='org.squidproductions.script-call.release-signing',ACCOUNT='ed25519-v1';
function loadReleaseKey({keyFile=process.env.SCRIPT_CALL_UPDATE_KEY_FILE,readFile=fs.readFileSync,createPrivateKey=crypto.createPrivateKey}={}){
 if(!keyFile)throw Error('Use the approved signing helper. This tool never exports a private Keychain item.');
 let bytes;try{bytes=readFile(keyFile);return createPrivateKey(bytes);}finally{if(Buffer.isBuffer(bytes))bytes.fill(0);}
}
function artifactURL(base,version,file){return new URL('v'+version+'/'+file,base).href;}
module.exports={SERVICE,ACCOUNT,loadReleaseKey,artifactURL};
