'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const D=require('../core/domain.cjs'),{describeEmail,validEmail}=require('../core/call-sheet-email.cjs');
const {renderSheet}=require('../core/sheet.cjs'),{CallSheetEmail,messageFile}=require('../desktop/call-sheet-email.cjs');
const {emailFixture}=require('./support/email-fixture.cjs');

test('email addresses come from visible, active cast and crew of just the reviewed day',()=>{
 const project=emailFixture(),sheet=D.resolve(project,project.days[0].id);
 assert(sheet.calls.every(c=>c.person.email===''));
 const email=describeEmail(sheet,project);
 assert.deepEqual(email.recipients,['cast@example.invalid','crew@example.invalid']);
 assert.deepEqual(email.counts,{cast:2,crew:3,duplicates:1});
 assert.deepEqual(email.missing,['Missing Contact']);
 assert.deepEqual(email.invalid,['Invalid Contact']);
 assert.match(email.subject,/Synthetic Émail Production — Day 07 Call Sheet — 2026-12-08 — Draft/);
 assert.match(email.body,/General crew call: 07:00 \(America\/New_York\)/);
 assert.deepEqual(describeEmail(D.resolve(project,project.days[1].id),project).recipients,['other-day@example.invalid']);
 assert.deepEqual(describeEmail(D.resolve(project,project.days[2].id),project).recipients,[]);
 for(const preset of ['gcasper','narrative','compact','commercial']){
  sheet.day.layout.preset=preset;
  sheet.day.layout.hidden=['crew'];
  assert.deepEqual(describeEmail(sheet,project).recipients,['cast@example.invalid']);
  assert(!renderSheet(sheet,'').includes('Listed Operator'));
  sheet.day.layout.hidden=['cast'];
  assert.deepEqual(describeEmail(sheet,project).recipients,['crew@example.invalid']);
  assert(!renderSheet(sheet,'').includes('Listed Performer'));
 }
 sheet.day.layout.hidden=[];
 sheet.revision={number:2};
 project.days[0].calls.push({personId:'off-day'});
 project.people[0].email='updated@example.invalid';
 assert.deepEqual(describeEmail(sheet,project).recipients,['updated@example.invalid','crew@example.invalid']);
 assert.match(describeEmail(sheet,project).subject,/Issued R2/);
 sheet.day.layout.includeContacts=true;sheet.calls[0].person.email='historic@example.invalid';
 assert(describeEmail(sheet,project).printedEmail);
});
test('malformed contact data cannot add another recipient or header',()=>{
 for(const address of ['bob.example.invalid','a..b@example.invalid','person@localhost','person@bad_domain.invalid','a@-example.invalid','a@example.invalid, x@example.invalid','Name <person@example.invalid>','x@example.invalid\r\nTo: person@example.invalid','a'.repeat(65)+'@example.invalid'])assert(!validEmail(address),address);
 for(const address of ["o'neil+call@sub.example.invalid",'cast@example.invalid'])assert(validEmail(address),address);
 const mime=messageFile({subject:'Day 7\r\nAccént'+('—'.repeat(45)),body:'Hi all,\nCall time attached.',recipients:['cast@example.invalid','crew@example.invalid']},[{name:'Day07.pdf',type:'application/pdf',bytes:Buffer.from('%PDF-test')}]).toString();
 assert.match(mime,/\r\nBcc: cast@example.invalid,\r\n crew@example.invalid\r\n/);
 assert(!/^To:|^Cc:/mi.test(mime));
 assert.match(mime,/Content-Disposition: attachment; filename="Day07.pdf"/);
 assert(mime.includes(Buffer.from('%PDF-test').toString('base64')));
 assert(mime.split('\r\n').every(line=>line.length<100));
});
test('review invalidation, cancellation, denied Mail and exact issued attachment are handled locally',async()=>{
 const project=emailFixture(),[day]=project.days;
 let version=1,copied=[],opened=0,saved;
 const controller=new CallSheetEmail({
  getProject:()=>({project,version}),getRevision:()=>revision,
  printPDF:async()=>Buffer.from('%PDF-draft'),
  savePDF:async(bytes,name,check)=>{check();saved={bytes,name};return {path:name};},
  chooseFolder:async()=>null,copy:value=>copied.push(value),filename:value=>value.replace(/\W/g,'_'),
  nativeOpen:async file=>{opened++;assert(fs.readFileSync(file,'utf8').includes('Bcc:'));return false;}
 });
 let review=controller.review(project.id,day.id);
 controller.copyReview(review.token,'addresses');
 assert.deepEqual(copied,['cast@example.invalid, crew@example.invalid']);
 version++;
 await assert.rejects(controller.open(review.token,'pdf'),/changed/);
 assert.equal(opened,0);
 review=controller.review(project.id,day.id);
 controller.cancel(review.token);
 await assert.rejects(controller.export(review.token,'pdf'),/again/);
 if(controller.canOpenMail){
  review=controller.review(project.id,day.id);
  const fallback=await controller.open(review.token,'pdf');
  assert.equal(fallback.opened,false);
  assert.match(fallback.reason,/Export attachments/);
  assert.equal(opened,1);
 }
 const snapshot=D.resolve(project,day.id);
 snapshot.revision={id:D.id(),number:4};
 const revision={snapshot,pdf:Buffer.from('%PDF-original')};
 day.lockedRevisionId=snapshot.revision.id;version++;
 review=controller.review(project.id,day.id);
 await controller.export(review.token,'pdf');
 assert.equal(review.revisionLabel,'Issued R4');
 assert.deepEqual(saved.bytes,revision.pdf);
 assert.match(saved.name,/_R4\.pdf$/);
 snapshot.day.id=project.days[1].id;
 assert.throws(()=>controller.review(project.id,day.id),/different shooting day/);
 const empty=controller.review(project.id,project.days[2].id);
 await assert.rejects(controller.open(empty.token,'pdf'),/No valid Bcc recipients/);
});
test('changes during attachment rendering abort before handing data to Mail or disk',async()=>{
 const project=emailFixture();
 let version=1,saveCount=0,complete;
 const controller=new CallSheetEmail({
  getProject:()=>({project,version}),filename:()=>'Fixture',
  printPDF:()=>new Promise(resolve=>{complete=resolve;}),
  savePDF:()=>{saveCount++;}
 });
 const {token}=controller.review(project.id,project.days[0].id);
 const pending=controller.export(token,'pdf');
 version++;complete(Buffer.from('%PDF-stale'));
 await assert.rejects(pending,/changed/);
 assert.equal(saveCount,0);
});
