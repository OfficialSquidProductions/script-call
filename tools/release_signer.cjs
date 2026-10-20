'use strict';
const path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {loadReleaseKey}=require('./release_key.cjs');
function signPayload(payload,config,{keyFile=process.env.SCRIPT_CALL_UPDATE_KEY_FILE,execute=execFileSync,helper=process.env.SCRIPT_CALL_RELEASE_HELPER||path.join(__dirname,'../.runtime/script-call-release-key')}={}){
 let signature;
 if(keyFile){const key=loadReleaseKey({keyFile});signature=crypto.sign(null,payload,key);}
 else{
  if(process.platform!=='darwin')throw Error('Configure an existing approved signing key on this platform.');
  let result;try{result=JSON.parse(execute(helper,['sign'],{input:payload,encoding:'utf8',stdio:['pipe','pipe','pipe'],maxBuffer:16384}));}catch{throw Error('The approved local Keychain signing helper could not sign this release.');}
  const expected=crypto.createPublicKey(config.publicKey).export({type:'spki',format:'der'}),actual=crypto.createPublicKey(result.publicKey).export({type:'spki',format:'der'});if(!expected.equals(actual))throw Error('The Keychain signer does not match the public key trusted by installed apps.');
  signature=Buffer.from(result.signature,'base64');
 }
 if(signature.length!==64||!crypto.verify(null,payload,config.publicKey,signature))throw Error('Release signature verification failed.');return signature.toString('base64');
}
module.exports={signPayload};
