'use strict';
const crypto=require('node:crypto');
const APP_ID='org.squidproductions.scriptcall.windows-preview',CHANNEL='windows-portable-preview';
const MAX_ARCHIVE=400*1024*1024,MAX_EXPANDED=1400*1024*1024,MAX_FILES=1200;
function version(v){const m=typeof v==='string'&&/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)-windows\.preview\.(0|[1-9]\d*)$/.exec(v);if(!m)throw Error('Invalid portable preview version.');const a=m.slice(1).map(Number);if(a.some(n=>!Number.isSafeInteger(n)))throw Error('Invalid portable version.');return a;}
function newer(a,b){const x=version(a),y=version(b);for(let i=0;i<x.length;i++)if(x[i]!==y[i])return x[i]>y[i];return false;}
function safePath(name){if(typeof name!=='string'||name.length>200||name.includes('\\')||name.split('/').some(p=>!p||p==='.'||p==='..'||/[<>:"|?*\x00-\x1f]/.test(p)||/[. ]$/.test(p)||/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(p)))throw Error('Unsafe portable package path.');return name;}
function https(value){const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash)throw Error('A credential-free HTTPS URL is required.');return u;}
function verify(envelope,config,{current,platform=process.platform,arch=process.arch,now=Date.now(),installed=false,systemVersion=require('node:os').release()}={}){
 const key=crypto.createPublicKey(config.publicKey);if(key.asymmetricKeyType!=='ed25519')throw Error('Pinned Ed25519 key required.');
 if(!envelope||typeof envelope.payload!=='string'||envelope.payload.length>500000||typeof envelope.signature!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(envelope.signature))throw Error('Invalid portable signed envelope.');
 const bytes=Buffer.from(envelope.payload,'base64');if(!crypto.verify(null,bytes,key,Buffer.from(envelope.signature,'base64')))throw Error('Portable release signature verification failed.');
 return validate(JSON.parse(bytes),config,{current,platform,arch,now,installed,systemVersion});
}
function validate(m,config,{current,platform=process.platform,arch=process.arch,now=Date.now(),installed=false,systemVersion=require('node:os').release()}={}){
 version(m.version);
 if(m.schema!==1||m.kind!=='portable-windows-release'||m.appId!==APP_ID||m.channel!==CHANNEL||m.platform!==platform||platform!=='win32'||m.arch!==arch||!['x64','arm64'].includes(arch))throw Error('Wrong portable release identity or platform.');
 if(m.bootstrapProtocol!==1||m.dataEpoch!==1)throw Error('A manual bootstrap or data migration is required; automatic migration refused.');
 const stable=require('./update-policy.cjs');stable.version(m.minimumSystemVersion);if(stable.newer(m.minimumSystemVersion,systemVersion))throw Error('Portable update requires a newer Windows version.');
 const issued=Date.parse(m.issuedAt),expires=Date.parse(m.expiresAt);
 if(!Number.isFinite(issued)||!Number.isFinite(expires)||expires<=issued||expires-issued>31*86400000||!installed&&(issued>now+300000||expires<=now))throw Error('Expired or invalid portable metadata.');
 if(current&&!newer(m.version,current))throw Error('Portable update must be strictly newer.');
 if(typeof m.notes!=='string'||!m.notes.trim()||m.notes.length>20000)throw Error('Portable release notes required.');
 const a=m.artifact,u=https(a?.url),base=https(config.artifactBaseUrl);
 if(!base.pathname.endsWith('/')||u.origin!==base.origin||!u.pathname.startsWith(base.pathname)||u.pathname.includes('%')||u.pathname.includes('..')||!u.pathname.endsWith('.zip'))throw Error('Unapproved portable artifact URL.');
 if(!Number.isSafeInteger(a.size)||a.size<1||a.size>MAX_ARCHIVE||typeof a.sha512!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(a.sha512))throw Error('Invalid portable artifact size or hash.');
 if(m.executable!=='Script Call Windows Preview.exe'||!m.files||Array.isArray(m.files)||typeof m.files!=='object')throw Error('Invalid portable executable layout.');
 const entries=Object.entries(m.files),seen=new Set();let total=0;
 if(!entries.length||entries.length>MAX_FILES)throw Error('Invalid portable file count.');
 for(const [name,f]of entries){safePath(name);const lower=name.toLowerCase();if(seen.has(lower))throw Error('Duplicate case-insensitive path.');seen.add(lower);if(!f||!Number.isSafeInteger(f.size)||f.size<0||!/^[a-f0-9]{64}$/.test(f.sha256))throw Error('Invalid portable file digest.');total+=f.size;}
 if(total>MAX_EXPANDED||!m.files[m.executable]||!m.files['resources/app/package.json']||!m.files['resources/app/desktop/preview-profile.json'])throw Error('Unsupported portable package layout or expanded size.');
 for(const name of seen){const parts=name.split('/');parts.pop();while(parts.length){if(seen.has(parts.join('/')))throw Error('Portable file/directory collision.');parts.pop();}}
 return m;
}
module.exports={APP_ID,CHANNEL,MAX_ARCHIVE,MAX_EXPANDED,MAX_FILES,version,newer,safePath,https,verify,validate};
