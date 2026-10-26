'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {safePath}=require('./portable-policy.cjs');
function atomic(file,value){const temp=file+'.'+crypto.randomBytes(8).toString('hex')+'.tmp';const fd=fs.openSync(temp,'wx',0o600);try{fs.writeFileSync(fd,JSON.stringify(value));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}try{fs.renameSync(temp,file);}catch(e){fs.unlinkSync(temp);throw e;}}
function plain(root){const stat=fs.lstatSync(root);if(stat.isSymbolicLink()||!stat.isDirectory()||fs.realpathSync(root)!==path.resolve(root))throw Error('Linked portable root rejected.');}
function walk(root,visit){plain(root);for(const d of fs.readdirSync(root,{withFileTypes:true})){const p=path.join(root,d.name),s=fs.lstatSync(p);if(s.isSymbolicLink())throw Error('Linked portable file rejected.');if(s.isDirectory())walk(p,visit);else if(s.isFile())visit(p);else throw Error('Unsupported portable file.');}}
function verifyTree(root,m){const actual=[];walk(root,p=>{const name=path.relative(root,p).split(path.sep).join('/');actual.push(name);const f=m.files[name];if(!f||fs.statSync(p).size!==f.size||crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')!==f.sha256)throw Error('Portable installed file mismatch: '+name);});if(actual.length!==Object.keys(m.files).length)throw Error('Portable files missing.');const pkg=JSON.parse(fs.readFileSync(path.join(root,'resources/app/package.json'))),profile=JSON.parse(fs.readFileSync(path.join(root,'resources/app/desktop/preview-profile.json')));if(pkg.version!==m.version||profile.kind!=='managed-portable-windows-preview'||profile.schema!==1)throw Error('Portable package version/profile mismatch.');}
function extract(bytes,directory,m,{internetOrigin=false}={}){
 if(bytes.length!==m.artifact.size||crypto.createHash('sha512').update(bytes).digest('base64')!==m.artifact.sha512)throw Error('Portable archive hash or size mismatch.');
 // Inspect central-directory attributes before decompression; reject links,
 // encryption, ZIP64, duplicates and any entry not bound by the signed file map.
 let end=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(bytes.readUInt32LE(i)===0x06054b50&&i+22+bytes.readUInt16LE(i+20)===bytes.length){end=i;break;}
 if(end<0||bytes.readUInt16LE(end+4)||bytes.readUInt16LE(end+6))throw Error('Invalid ZIP directory.');
 const count=bytes.readUInt16LE(end+10),start=bytes.readUInt32LE(end+16),size=bytes.readUInt32LE(end+12);if(count!==Object.keys(m.files).length||start+size!==end)throw Error('ZIP directory mismatch.');
 let at=start;const seen=new Set();for(let i=0;i<count;i++){
  if(at+46>end||bytes.readUInt32LE(at)!==0x02014b50)throw Error('Invalid ZIP entry.');
  const flags=bytes.readUInt16LE(at+8),method=bytes.readUInt16LE(at+10),expanded=bytes.readUInt32LE(at+24),n=bytes.readUInt16LE(at+28),extra=bytes.readUInt16LE(at+30),comment=bytes.readUInt16LE(at+32),mode=bytes.readUInt32LE(at+38)>>>16;
  if(at+46+n+extra+comment>end||flags&1||![0,8].includes(method)||mode&&(mode&0xf000)!==0x8000)throw Error('ZIP link or unsupported entry rejected.');
  const name=safePath(bytes.subarray(at+46,at+46+n).toString('utf8'));if(seen.has(name.toLowerCase())||!m.files[name]||expanded!==m.files[name].size)throw Error('Unexpected or oversized ZIP entry.');seen.add(name.toLowerCase());at+=46+n+extra+comment;
 }
 if(at!==end)throw Error('Invalid ZIP directory size.');
 const unpacked=require('fflate').unzipSync(bytes,{filter:f=>{const expected=m.files[f.name];if(!expected||f.originalSize!==expected.size)throw Error('ZIP local entry mismatch.');return true;}});
 if(Object.keys(unpacked).length!==count)throw Error('ZIP file count mismatch.');
 fs.mkdirSync(directory);plain(directory);
 for(const [name,data]of Object.entries(unpacked)){const expected=m.files[name];if(!expected||data.length!==expected.size||crypto.createHash('sha256').update(data).digest('hex')!==expected.sha256)throw Error('Extracted file hash mismatch.');const target=path.join(directory,...safePath(name).split('/'));fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,data,{flag:'wx'});if(internetOrigin&&process.platform==='win32')fs.writeFileSync(target+':Zone.Identifier','[ZoneTransfer]\r\nZoneId=3\r\n');}
 verifyTree(directory,m);
}
function clone(source,dest){plain(source);walk(source,()=>{});if(fs.existsSync(dest))throw Error('Fresh data generation required.');fs.cpSync(source,dest,{recursive:true,errorOnExist:true,force:false,filter:p=>{if(fs.lstatSync(p).isSymbolicLink())throw Error('Linked data rejected.');return true;}});}
module.exports={atomic,plain,walk,verifyTree,extract,clone};
