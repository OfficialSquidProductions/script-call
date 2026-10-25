'use strict';
const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs'),path=require('node:path');
const D=require('./domain.cjs');
class Store{
 constructor(dir){
  fs.mkdirSync(dir,{recursive:true,mode:0o700});this.dir=dir;this.db=new DatabaseSync(path.join(dir,'callsheet.sqlite'));
  this.db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY,version INTEGER NOT NULL,data TEXT NOT NULL,updated TEXT NOT NULL); CREATE TABLE IF NOT EXISTS revisions(id TEXT PRIMARY KEY,project_id TEXT NOT NULL REFERENCES projects(id),day_id TEXT NOT NULL,number INTEGER NOT NULL,snapshot TEXT NOT NULL,pdf BLOB NOT NULL,hash TEXT NOT NULL,issued TEXT NOT NULL, UNIQUE(project_id,day_id,number)); CREATE TABLE IF NOT EXISTS deleted_productions(project_id TEXT PRIMARY KEY REFERENCES projects(id),deleted_at TEXT NOT NULL); PRAGMA user_version=1;');
 }
 list(){return this.db.prepare('SELECT id,version,data,updated FROM projects WHERE NOT EXISTS (SELECT 1 FROM deleted_productions WHERE project_id=projects.id) ORDER BY updated DESC,id').all().map(r=>({id:r.id,version:r.version,title:JSON.parse(r.data).title,demo:!!JSON.parse(r.data).demo,updated:r.updated}));}
 create(project){D.validateProject(project);this.db.prepare('INSERT INTO projects VALUES(?,?,?,?)').run(project.id,1,JSON.stringify(project),new Date().toISOString());return this.get(project.id);}
 get(id){const r=this.db.prepare('SELECT * FROM projects WHERE id=? AND NOT EXISTS (SELECT 1 FROM deleted_productions WHERE project_id=projects.id)').get(id);if(!r)throw Error('Production not found or moved to Deleted productions.');return {project:JSON.parse(r.data),version:r.version,revisions:this.revisions(id)};}
 save(project,version){D.validateProject(project);const r=this.db.prepare('UPDATE projects SET data=?,version=version+1,updated=? WHERE id=? AND version=? AND NOT EXISTS (SELECT 1 FROM deleted_productions WHERE project_id=projects.id)').run(JSON.stringify(project),new Date().toISOString(),project.id,version);if(!r.changes)throw Error('Save conflict: a newer version exists. Keep your current window open and export a recovery copy before reloading.');return this.get(project.id);}
 changeRecord(projectId,version,command){const before=this.get(projectId);if(before.version!==version)throw Error('Production changed. Review the record before trying again.');const project=D.clone(before.project);require('../web/record-recovery.js').apply(project,command);D.validateProject(project);this.backup();return this.save(project,version);}
 deletedProductions(){return this.db.prepare('SELECT p.id,p.version,p.data,t.deleted_at FROM projects p JOIN deleted_productions t ON t.project_id=p.id ORDER BY t.deleted_at DESC,p.id').all().map(r=>{const p=JSON.parse(r.data);return {id:r.id,version:r.version,title:p.title,deletedAt:r.deleted_at,dayCount:p.days.length+(p.deletedDays?.length||0),issuedRevisions:this.revisions(r.id).length};});}
 deleteProduction(id,version){
  const before=this.get(id);if(before.version!==version)throw Error('Production changed. Close this dialog and review it before deleting.');
  const backup=this.backup();this.db.exec('BEGIN IMMEDIATE');try{
   const current=this.get(id);if(current.version!==version)throw Error('Production changed. Close this dialog and review it before deleting.');
   const now=new Date().toISOString();this.db.prepare('INSERT INTO deleted_productions VALUES(?,?)').run(id,now);this.db.prepare('UPDATE projects SET version=version+1 WHERE id=?').run(id);
   const next=this.list()[0];const state=next?this.get(next.id):this.create(D.newProject());this.db.exec('COMMIT');return {deleted:{id,title:current.project.title},state,backup};
  }catch(e){this.db.exec('ROLLBACK');throw e;}
 }
 restoreProduction(id,version){
  const row=()=>this.db.prepare('SELECT p.version FROM projects p JOIN deleted_productions t ON t.project_id=p.id WHERE p.id=?').get(id);
  const before=row();if(!before||before.version!==version)throw Error('Deleted production changed. Refresh the deleted productions list.');
  const backup=this.backup();this.db.exec('BEGIN IMMEDIATE');try{
   const current=row();if(!current||current.version!==version)throw Error('Deleted production changed. Refresh the deleted productions list.');
   this.db.prepare('DELETE FROM deleted_productions WHERE project_id=?').run(id);this.db.prepare('UPDATE projects SET version=version+1,updated=? WHERE id=?').run(new Date().toISOString(),id);const state=this.get(id);this.db.exec('COMMIT');return {state,backup};
  }catch(e){this.db.exec('ROLLBACK');throw e;}
 }
 revisions(id){return this.db.prepare('SELECT id,day_id AS dayId,number,hash,issued FROM revisions WHERE project_id=? ORDER BY number DESC').all(id);}
 revision(projectId,id){const r=this.db.prepare('SELECT * FROM revisions WHERE project_id=? AND id=?').get(projectId,id);if(!r)throw Error('Revision not found.');return {id:r.id,dayId:r.day_id,number:r.number,issued:r.issued,hash:r.hash,snapshot:JSON.parse(r.snapshot),pdf:Buffer.from(r.pdf)};}
 issue(projectId,dayId,version,snapshot,pdf){
  this.db.exec('BEGIN IMMEDIATE');try{
   const state=this.get(projectId);if(state.version!==version)throw Error('Project changed while rendering. Review and issue again.');
   const d=state.project.days.find(d=>d.id===dayId);if(!d||d.lockedRevisionId)throw Error('Create a new draft before issuing.');
   const number=(this.db.prepare('SELECT MAX(number) AS n FROM revisions WHERE project_id=? AND day_id=?').get(projectId,dayId).n||0)+1;
   const rid=snapshot.revision.id,issued=snapshot.revision.issued;if(snapshot.revision.number!==number)throw Error('Revision sequence changed during rendering.');
   this.db.prepare('INSERT INTO revisions VALUES(?,?,?,?,?,?,?,?)').run(rid,projectId,dayId,number,JSON.stringify(snapshot),pdf,D.hash(pdf),issued);
   d.lockedRevisionId=rid;d.baseRevisionId=rid;this.save(state.project,version);this.db.exec('COMMIT');return this.get(projectId);
  }catch(e){this.db.exec('ROLLBACK');throw e;}
 }
 backup(){const dest=path.join(this.dir,'backups');fs.mkdirSync(dest,{recursive:true,mode:0o700});const previous=fs.readdirSync(dest).filter(f=>/^callsheet-\d+\.sqlite$/.test(f)).map(f=>Number(f.slice(10,-7))).filter(Number.isSafeInteger);let stamp=Math.max(Date.now(),...previous.map(n=>n+1));while(fs.existsSync(path.join(dest,'callsheet-'+stamp+'.sqlite')))stamp++;const target=path.join(dest,'callsheet-'+stamp+'.sqlite');this.db.exec("VACUUM INTO '"+target.replaceAll("'","''")+"'");const files=fs.readdirSync(dest).filter(f=>/^callsheet-\d+\.sqlite$/.test(f)).sort();for(const f of files.slice(0,-10))fs.unlinkSync(path.join(dest,f));return target;}
 close(){this.db.close();}
}
module.exports={Store};
