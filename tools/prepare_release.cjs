'use strict';
// Publisher-only tooling. This command reads an existing private key; it never creates one.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {APP_ID,configuration,verifyEnvelope,version,httpsURL}=require('../desktop/update-policy.cjs');
function prepare({artifact,appBundle,platform,arch,notesFile,out,config=require('../desktop/update-config.json'),packageVersion=require('../package.json').version,keyFile=process.env.SCRIPT_CALL_UPDATE_KEY_FILE}){
 configuration(config);version(packageVersion);if(!keyFile)throw Error('Set SCRIPT_CALL_UPDATE_KEY_FILE to the existing approved Ed25519 private-key file outside the repository.');
 if(!['arm64','x64'].includes(arch)||platform!==process.platform||!['darwin','win32'].includes(platform))throw Error('Prepare releases on the matching native OS with an explicit supported architecture.');
 const key=crypto.createPrivateKey(fs.readFileSync(keyFile));if(key.asymmetricKeyType!=='ed25519'||crypto.createPublicKey(key).export({type:'spki',format:'pem'})!==crypto.createPublicKey(config.publicKey).export({type:'spki',format:'pem'}))throw Error('Signing key does not match the public key trusted by installed apps.');
 const notes=fs.readFileSync(notesFile,'utf8').trim();if(!notes||notes.length>20000)throw Error('Provide release notes under 20,000 characters.');
 if(platform==='darwin'){
  if(!appBundle)throw Error('Pass the exact signed .app used in the ZIP.');
  execFileSync('codesign',['--verify','--deep','--strict',appBundle]);
  // codesign writes identity to stderr; inspect with spawnSync below.
  const result=require('node:child_process').spawnSync('codesign',['-dvv',appBundle],{encoding:'utf8'});if(result.status!==0||!/Authority=Developer ID Application:/.test(result.stderr)||!/TeamIdentifier=[A-Z0-9]+/.test(result.stderr))throw Error('A Developer ID signed app is required; ad-hoc builds cannot ship updates.');
  execFileSync('spctl',['--assess','--type','execute','--verbose=2',appBundle]);execFileSync('xcrun',['stapler','validate',appBundle]);
  const info=JSON.parse(execFileSync('plutil',['-convert','json','-o','-',path.join(appBundle,'Contents/Info.plist')],{encoding:'utf8'}));if(info.CFBundleIdentifier!==APP_ID||info.CFBundleShortVersionString!==packageVersion)throw Error('Bundle identity/version mismatch.');
  // Package the verified bundle here, eliminating any mismatch with a supplied ZIP.
  if(fs.existsSync(artifact))throw Error('Use a new ZIP path; release artifacts are immutable.');fs.mkdirSync(path.dirname(artifact),{recursive:true});execFileSync('ditto',['-c','-k','--sequesterRsrc','--keepParent',appBundle,artifact]);
 }else{
  const script='$s=Get-AuthenticodeSignature -LiteralPath $env:SCRIPT_CALL_ARTIFACT;if($s.Status -ne "Valid"){exit 1};$s.SignerCertificate.Subject';
  const subject=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{encoding:'utf8',env:{...process.env,SCRIPT_CALL_ARTIFACT:path.resolve(artifact)}}).trim();if(!config.publisherName?.includes(subject))throw Error('Installer signer does not match the approved full publisher identity.');
 }
 const bytes=fs.readFileSync(artifact),file=path.basename(artifact);if(!new RegExp('^Script-Call-'+packageVersion.replaceAll('.','\\.')+'-'+platform+'-'+arch+'\\.'+(platform==='darwin'?'zip':'exe')+'$').test(file))throw Error('Use versioned artifact name Script-Call-VERSION-PLATFORM-ARCH.zip (or .exe).');
 const now=Date.now(),manifest={schema:1,appId:APP_ID,channel:'stable',version:packageVersion,issuedAt:new Date(now).toISOString(),expiresAt:new Date(now+30*86400000).toISOString(),notes,artifacts:{[platform+'-'+arch]:{url:new URL(file,config.artifactBaseUrl).href,size:bytes.length,sha512:crypto.createHash('sha512').update(bytes).digest('base64')}}};
 const envelope={payload:Buffer.from(JSON.stringify(manifest)).toString('base64')};envelope.signature=crypto.sign(null,Buffer.from(envelope.payload,'base64'),key).toString('base64');verifyEnvelope(envelope,config,'0.0.0',platform,arch);
 const dest=path.join(out,packageVersion,platform+'-'+arch);if(fs.existsSync(dest))throw Error('Release output already exists; increase the version.');fs.mkdirSync(dest,{recursive:true});fs.copyFileSync(artifact,path.join(dest,file));fs.writeFileSync(path.join(dest,'stable.json'),JSON.stringify(envelope,null,2)+'\n');fs.writeFileSync(path.join(dest,'release-notes.txt'),notes+'\n');fs.writeFileSync(path.join(dest,'SHA512SUMS'),crypto.createHash('sha512').update(bytes).digest('hex')+'  '+file+'\n');return dest;
}
if(require.main===module){try{const [artifact,appBundle,arch,notesFile,out='build/releases']=process.argv.slice(2);console.log(prepare({artifact,appBundle:appBundle==='-'?undefined:appBundle,arch,platform:process.platform,notesFile,out}));}catch(e){console.error('Release blocked: '+e.message);process.exitCode=1;}}
module.exports={prepare};
