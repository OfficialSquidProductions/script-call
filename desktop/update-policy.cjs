'use strict';
const crypto=require('node:crypto');
const APP_ID='org.squidproductions.callsheet.prototype';
function version(v){if(typeof v!=='string'||!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(v))throw Error('A stable major.minor.patch version is required.');const n=v.split('.').map(Number);if(n.some(x=>!Number.isSafeInteger(x)))throw Error('Invalid version.');return n;}
function newer(a,b){const x=version(a),y=version(b);for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]>y[i];return false;}
function httpsURL(value){const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.hash||u.search)throw Error('A credential-free HTTPS URL is required.');return u;}
function configuration(c){
 if(!c.enabled)throw Error(c.reason||'Release updates are not configured.');
 if(c.channel!=='stable')throw Error('Unsupported release channel.');
 httpsURL(c.manifestUrl);const base=httpsURL(c.artifactBaseUrl);if(!base.pathname.endsWith('/'))throw Error('Artifact base URL must end in /.');
 const key=crypto.createPublicKey(c.publicKey);if(key.asymmetricKeyType!=='ed25519')throw Error('An Ed25519 public key is required.');return key;
}
function verifyEnvelope(envelope,c,current,platform,arch,now=Date.now(),systemVersion=require('node:os').release()){
 const key=configuration(c);version(current);
 if(!envelope||typeof envelope.payload!=='string'||typeof envelope.signature!=='string'||envelope.payload.length>180000)throw Error('Invalid signed release envelope.');
 const bytes=Buffer.from(envelope.payload,'base64'),sig=Buffer.from(envelope.signature,'base64');
 if(sig.length!==64||!crypto.verify(null,bytes,key,sig))throw Error('Release signature verification failed.');
 const m=JSON.parse(bytes.toString('utf8'));
 if(m.schema!==1||m.appId!==APP_ID||m.channel!==c.channel)throw Error('Incompatible release identity, schema or channel.');version(m.version);
 const issued=Date.parse(m.issuedAt),expires=Date.parse(m.expiresAt);
 if(!Number.isFinite(issued)||!Number.isFinite(expires)||issued>now+300000||expires<=now||expires<=issued||expires-issued>31*86400000)throw Error('Release metadata is expired or has invalid dates.');
 if(typeof m.notes!=='string'||!m.notes.trim()||m.notes.length>20000)throw Error('Release notes are required.');
 if(!newer(m.version,current))return null;
 const a=m.artifacts?.[platform+'-'+arch];if(!a)throw Error('No compatible artifact for this operating system and architecture.');
 version(a.minimumSystemVersion);version(systemVersion);if(newer(a.minimumSystemVersion,systemVersion))throw Error('This update requires a newer operating system.');
 const url=httpsURL(a.url),base=httpsURL(c.artifactBaseUrl);
 if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname)||url.pathname.includes('%')||url.pathname.includes('..'))throw Error('Artifact URL is outside the approved release destination.');
 const suffix=platform==='darwin'?'.zip':platform==='win32'?'.exe':null;
 if(!suffix||!url.pathname.endsWith(suffix)||!Number.isSafeInteger(a.size)||a.size<1||a.size>2*1024**3||typeof a.sha512!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(a.sha512))throw Error('Invalid release artifact size, type or SHA-512.');
 return {...m,artifact:{...a,url:url.href}};
}
module.exports={APP_ID,version,newer,httpsURL,configuration,verifyEnvelope};
