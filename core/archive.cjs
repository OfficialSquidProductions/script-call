'use strict';
const {zipSync,unzipSync,strToU8,strFromU8}=require('fflate');
const D=require('./domain.cjs');
const MAX=25*1024*1024;
function exportArchive(store,projectId){
 const {project}=store.get(projectId),files={'project.json':strToU8(JSON.stringify(project))},revisions=[];
 for(const m of store.revisions(projectId)){const r=store.revision(projectId,m.id);const {pdf,...metadata}=r;files['pdfs/'+r.id+'.pdf']=pdf;revisions.push(metadata);}
 files['revisions.json']=strToU8(JSON.stringify(revisions));
 const manifest={format:'squid-callsheet',schema:1,minReaderVersion:require('../web/availability.js').hasData(project)?4:project.deletedDays?.length||!project.days.length?3:[...project.days,...(project.deletedDays||[])].some(d=>d.layout.preset==='gcasper')||revisions.some(r=>r.snapshot.day.layout.preset==='gcasper')?2:1,projectId,createdAt:new Date().toISOString(),files:Object.fromEntries(Object.entries(files).map(([n,b])=>[n,{bytes:b.length,sha256:D.hash(Buffer.from(b))}]))};
 const total=Object.values(files).reduce((n,b)=>n+b.length,0);if(total>MAX)throw Error('Prototype archives support up to 25 MB expanded.');files['manifest.json']=strToU8(JSON.stringify(manifest));return Buffer.from(zipSync(files,{level:6}));
}
function readArchive(bytes){
 if(bytes.length>MAX)throw Error('Choose an archive smaller than 25 MB.');
 let total=0,count=0;const files=unzipSync(bytes,{filter:f=>{
  count++;if(count>1000||!Number.isSafeInteger(f.originalSize)||f.originalSize<0||f.originalSize>MAX||f.originalSize>Math.max(1024*1024,f.size*100))throw Error('Archive expansion limit exceeded.');
  total+=f.originalSize;if(total>MAX)throw Error('Archive expanded size exceeds 25 MB.');
  if(!/^(manifest\.json|project\.json|revisions\.json|pdfs\/[a-zA-Z0-9_.-]{1,100}\.pdf)$/.test(f.name)||f.name.includes('..'))throw Error('Unexpected or unsafe archive path.');return true;
 }});
 if(Object.keys(files).length!==count)throw Error('Duplicate archive paths.');
 const m=JSON.parse(strFromU8(files['manifest.json']||new Uint8Array()));
 if(m.format!=='squid-callsheet'||m.schema!==1||m.minReaderVersion>4)throw Error('Unsupported project archive version.');
 if(!m.files||Object.keys(m.files).length!==count-1)throw Error('Archive manifest is incomplete.');
 for(const [name,meta] of Object.entries(m.files)){if(!files[name]||meta.bytes!==files[name].length||meta.sha256!==D.hash(Buffer.from(files[name])))throw Error('Archive checksum mismatch.');}
 const project=D.validateProject(JSON.parse(strFromU8(files['project.json']))),revisions=JSON.parse(strFromU8(files['revisions.json']));
 if(!Array.isArray(revisions)||revisions.length>200)throw Error('Invalid revision list.');
 D.clone(revisions).forEach(r=>{D.guard(r.snapshot);if(!r||typeof r.id!=='string'||![...project.days,...(project.deletedDays||[])].some(d=>d.id===r.dayId)||!Number.isInteger(r.number)||r.number<1||!r.snapshot||r.snapshot.day?.id!==r.dayId||r.snapshot.revision?.number!==r.number||r.hash!==D.hash(Buffer.from(files['pdfs/'+r.id+'.pdf']||[])))throw Error('Invalid issued revision.');D.validateProject({...project,days:[r.snapshot.day],deletedDays:[]});if(!Buffer.from(files['pdfs/'+r.id+'.pdf']).subarray(0,5).equals(Buffer.from('%PDF-')))throw Error('Invalid stored PDF.');});
 return {project,revisions:revisions.map(r=>({...r,pdf:Buffer.from(files['pdfs/'+r.id+'.pdf'])}))};
}
function importAsCopy(store,bytes){
 const {project,revisions}=readArchive(bytes),oldId=project.id;project.id=D.id();project.importedFrom={projectId:oldId,at:new Date().toISOString()};project.title+=' (imported copy)';
 // Revision IDs are global in the local database; remap them without changing PDF bytes.
 const remap=new Map(revisions.map(r=>[r.id,D.id()]));for(const d of [...project.days,...(project.deletedDays||[])]){d.baseRevisionId=remap.get(d.baseRevisionId)||null;d.lockedRevisionId=remap.get(d.lockedRevisionId)||null;}
 store.db.exec('BEGIN IMMEDIATE');try{
  store.create(project);for(const r of revisions)store.db.prepare('INSERT INTO revisions VALUES(?,?,?,?,?,?,?,?)').run(remap.get(r.id),project.id,r.dayId,r.number,JSON.stringify(r.snapshot),r.pdf,r.hash,r.issued);
  store.db.exec('COMMIT');return store.get(project.id);
 }catch(e){store.db.exec('ROLLBACK');throw e;}
}
module.exports={exportArchive,readArchive,importAsCopy};
