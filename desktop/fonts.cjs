'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
// Same installed-font discovery principle as Production Desk; no font is bundled.
function headingFont(){
 const roots=process.platform==='darwin'?[path.join(os.homedir(),'Library/Fonts'),'/Library/Fonts',...['.r','.w'].map(p=>path.join(os.homedir(),'Library/Application Support/Adobe/CoreSync/plugins/livetype',p))]:[path.join(process.env.WINDIR||'C:/Windows','Fonts'),path.join(process.env.LOCALAPPDATA||os.homedir(),'Microsoft/Windows/Fonts')];
 for(const dir of roots){let names=[];try{names=fs.readdirSync(dir);}catch{continue;}for(const file of names){try{const p=path.join(dir,file),stat=fs.statSync(p);if(!stat.isFile()||stat.size>10*1024*1024)continue;const b=fs.readFileSync(p);if(b.length<12)continue;const count=b.readUInt16BE(4);if(count>200)continue;for(let n=0;n<count;n++){const off=12+n*16;if(off+16>b.length)break;if(b.toString('ascii',off,off+4)!=='name')continue;const pos=b.readUInt32BE(off+8);if(pos+6>b.length)continue;const num=b.readUInt16BE(pos+2),strings=b.readUInt16BE(pos+4);for(let i=0;i<num;i++){const at=pos+6+i*12;if(at+12>b.length)break;if(b.readUInt16BE(at+6)!==6)continue;const platform=b.readUInt16BE(at),len=b.readUInt16BE(at+8),start=pos+strings+b.readUInt16BE(at+10);if(start+len>b.length)continue;let name;if(platform===0||platform===3){const x=Buffer.from(b.subarray(start,start+len));x.swap16();name=x.toString('utf16le');}else name=b.toString('latin1',start,start+len);if(['Reross-Quadratic','RerossStd-Quadratic'].includes(name))return p;}}}catch{}}
 }return null;
}
module.exports={headingFont};
