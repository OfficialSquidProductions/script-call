'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {promisify}=require('node:util'),{execFile}=require('node:child_process');
const D=require('../core/domain.cjs'),{describeEmail}=require('../core/call-sheet-email.cjs');
const exec=promisify(execFile);

function lines64(bytes){
 return Buffer.from(bytes).toString('base64').match(/.{1,76}/g)?.join('\r\n')||'';
}
function subjectHeader(text){
 const words=[];
 let chunk='';
 for(const character of text){
  if(Buffer.byteLength(chunk+character)>42){
   words.push('=?UTF-8?B?'+Buffer.from(chunk).toString('base64')+'?=');
   chunk='';
  }
  chunk+=character;
 }
 if(chunk)words.push('=?UTF-8?B?'+Buffer.from(chunk).toString('base64')+'?=');
 return words.join('\r\n ');
}

function messageFile(review,attachments){
 const boundary='script-call-'+D.id();
 return Buffer.from([
  'Subject: '+subjectHeader(review.subject),
  'Bcc: '+review.recipients.join(',\r\n '),
  'Date: '+new Date().toUTCString(),
  'MIME-Version: 1.0',
  'Content-Type: multipart/mixed; boundary="'+boundary+'"',
  '',
  '--'+boundary,
  'Content-Type: text/plain; charset=UTF-8',
  'Content-Transfer-Encoding: base64',
  '',
  lines64(review.body.replace(/\n/g,'\r\n')),
  ...attachments.flatMap(file=>[
   '--'+boundary,
   'Content-Type: '+file.type+'; name="'+file.name+'"',
   'Content-Disposition: attachment; filename="'+file.name+'"',
   'Content-Transfer-Encoding: base64',
   '',
   lines64(file.bytes)
  ]),
  '--'+boundary+'--',''
 ].join('\r\n'));
}

function privateDirectory(){return fs.mkdtempSync(path.join(os.tmpdir(),'script-call-email-'));}
function remove(directory){fs.rmSync(directory,{recursive:true,force:true});}

async function pngPages(pdf,directory,filename){
 const input=path.join(directory,'sheet.pdf');
 fs.writeFileSync(input,pdf,{mode:0o600,flag:'wx'});
 const {stdout}=await exec('/usr/bin/osascript',['-l','JavaScript',path.join(__dirname,'pdf-pages.js'),input,directory],{timeout:90000})
  .catch(()=>{throw Error('The call sheet could not be rendered as PNGs. Choose PDF and try again.');});
 const pages=Number(stdout.trim());
 if(!Number.isSafeInteger(pages)||pages<1)throw Error('No call sheet pages were rendered.');
 return Array.from({length:pages},(_,index)=>({
  type:'image/png',name:filename+'-page-'+String(index+1).padStart(2,'0')+'.png',
  bytes:fs.readFileSync(path.join(directory,(index+1)+'.png'))
 }));
}

class CallSheetEmail {
 constructor({getProject,getRevision,printPDF,savePDF,chooseFolder,copy,filename,nativeOpen=openMail}){
  Object.assign(this,{getProject,getRevision,printPDF,savePDF,chooseFolder,copy,filename,nativeOpen});
  this.canOpenMail=process.platform==='darwin';
  this.canRenderPNGs=process.platform==='darwin';
  this.openFiles=new Map();
 }
 review(projectId,dayId){
  if(this.busy)throw Error('Finish the current email action first.');
  const {project,version}=this.getProject(projectId);
  const day=project.days.find(candidate=>candidate.id===dayId);
  if(!day)throw Error('Choose a shooting day.');
  const revision=day.lockedRevisionId?this.getRevision(projectId,day.lockedRevisionId):null;
  const snapshot=revision?.snapshot||D.resolve(project,dayId);
  if(snapshot.day.id!==dayId)throw Error('The issued revision belongs to a different shooting day. Review the selected day before emailing.');
  const description=describeEmail(snapshot,project);
  const filename=this.filename(snapshot.title+'_'+snapshot.day.label+'_'+(snapshot.revision?'R'+snapshot.revision.number:'DRAFT'));
  const token=D.id();
  this.pending={token,projectId,version,dayId,revision,snapshot,filename,description};
  return {token,...description,canOpenMail:this.canOpenMail,canRenderPNGs:this.canRenderPNGs};
 }
 assertFresh(review){
  if(this.pending!==review||this.getProject(review.projectId).version!==review.version){
   throw Error('The call sheet or its contacts changed. Close this review and open Email Call Sheet again.');
  }
 }
 reviewed(token){
  const review=this.pending;
  if(!review||review.token!==token)throw Error('Open Email Call Sheet again to review recipients.');
  this.assertFresh(review);
  return review;
 }
 cancel(token){
  if(this.pending?.token===token)this.pending=null;
 }
 copyReview(token,part){
  const review=this.reviewed(token);
  const {subject,body,recipients}=review.description;
  const text=part==='addresses'?recipients.join(', '):part==='subject'?subject:part==='body'?body:'';
  if(!text)throw Error('There is nothing to copy for this field.');
  this.copy(text);
 }
 async prepare(token,format,operation){
  if(this.busy)throw Error('Finish the current email action first.');
  const review=this.reviewed(token);
  if(format!=='pdf'&&(format!=='png'||!this.canRenderPNGs))throw Error('Choose an available attachment format.');
  const directory=privateDirectory();
  this.busy=true;
  try{
   const pdf=review.revision?.pdf||await this.printPDF(review.snapshot);
   this.assertFresh(review);
   const attachments=format==='pdf'
    ?[{type:'application/pdf',name:review.filename+'.pdf',bytes:pdf}]
    :await pngPages(pdf,directory,review.filename);
   this.assertFresh(review);
   return await operation(review,attachments);
  }finally{this.busy=false;remove(directory);}
 }
 async export(token,format){
  return this.prepare(token,format,async(review,files)=>{
   if(format==='pdf')return this.savePDF(files[0].bytes,files[0].name,()=>this.assertFresh(review));
   const parent=await this.chooseFolder();
   if(!parent)return {canceled:true};
   this.assertFresh(review);
   const target=fs.mkdtempSync(path.join(parent,review.filename+'-pages-'));
   try{
    for(const file of files)fs.writeFileSync(path.join(target,file.name),file.bytes,{mode:0o600,flag:'wx'});
    return {path:target};
   }catch(error){remove(target);throw error;}
  });
 }
 async open(token,format){
  const {description}=this.reviewed(token);
  if(!description.recipients.length)throw Error('No valid Bcc recipients are listed for this sheet.');
  if(description.printedEmail)throw Error('This sheet prints personal email addresses. Review the attachment before sharing.');
  if(!this.canOpenMail)return {opened:false,reason:'Apple Mail is unavailable. Export attachments and copy the message and Bcc addresses.'};
  return this.prepare(token,format,async(review,attachments)=>{
   const directory=privateDirectory(),file=path.join(directory,'Call Sheet.eml');
   let opened=false;
   try{
    fs.writeFileSync(file,messageFile(review.description,attachments),{mode:0o600,flag:'wx'});
    this.assertFresh(review);
    opened=await this.nativeOpen(file);
   }finally{
    if(!opened)remove(directory);
   }
   if(!opened)return {opened:false,reason:'Apple Mail could not open the message. Export attachments and copy the message and Bcc addresses.'};
   const timer=setTimeout(()=>{this.openFiles.delete(directory);remove(directory);},60*60*1000);
   timer.unref();
   this.openFiles.set(directory,timer);
   return {opened:true,reason:'In Apple Mail, choose Message → Send Again to open the unsent draft. Confirm Bcc, the attachments, and that To and Cc are empty.'};
  });
 }
 close(){
  for(const [directory,timer] of this.openFiles){clearTimeout(timer);remove(directory);}
  this.openFiles.clear();
 }
}

async function openMail(file){
 try{await exec('/usr/bin/open',['-b','com.apple.mail',file],{timeout:15000});return true;}
 catch{return false;}
}

module.exports={CallSheetEmail,messageFile};
