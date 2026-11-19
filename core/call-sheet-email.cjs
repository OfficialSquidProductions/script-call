'use strict';
const {printedCalls}=require('./sheet-calls.cjs');
const {clock}=require('./sheet.cjs');
const Records=require('../web/record-recovery.js');

const atom="[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+";
const localPart=new RegExp('^'+atom+'(?:\\.'+atom+')*$');
const domainLabel=/^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i;
function validEmail(value){
 const parts=value.split('@');
 if(value.length>254||parts.length!==2||parts[0].length>64||!localPart.test(parts[0]))return false;
 const labels=parts[1].split('.');
 return labels.length>1&&labels.every(label=>domainLabel.test(label));
}
const oneLine=value=>String(value||'').replace(/[\u0000-\u001f\u007f]+/g,' ').trim();

function describeEmail(sheet,project){
 const contacts=new Map(Records.active(project,'people').map(person=>[person.id,person]));
 const roster=printedCalls(sheet),addresses=new Map(),missing=[],invalid=[];
 const counts={cast:0,crew:0,duplicates:0};
 for(const call of roster){
  const person=call.person;
  counts[person.type]++;
  const label=oneLine(person.name)||oneLine(person.character)||oneLine(person.role)||'Unnamed '+person.type+' member';
  const address=(contacts.get(call.personId)?.email||'').trim();
  if(!address){missing.push(label);continue;}
  if(!validEmail(address)){invalid.push(label);continue;}
  const key=address.toLowerCase();
  if(addresses.has(key)){counts.duplicates++;continue;}
  addresses.set(key,address);
 }
 const {day,revision}=sheet,title=oneLine(sheet.title)||'Untitled production';
 const date=oneLine(day.date)||'Date to be confirmed',dayLabel=oneLine(day.label)||'Shooting day';
 const revisionLabel=revision?'Issued R'+revision.number:'Draft (unissued)';
 const subject=title+' — '+dayLabel+' Call Sheet — '+date+' — '+revisionLabel;
 const callTime=sheet.values.generalCall?clock(sheet.values.generalCall,day.layout.clock):'To be confirmed';
 const body=[
  'Hi everyone,','',
  'Attached is the '+(revision?'issued call sheet (R'+revision.number+')':'draft call sheet for review')+' for '+title+' — '+dayLabel+' ('+date+').',
  'Unit: '+(oneLine(day.unit)||'To be confirmed')+'. General crew call: '+callTime+(sheet.values.zone?' ('+oneLine(sheet.values.zone)+')':'')+'.',
  'Please check your individual call time, location and instructions on the sheet. Reply to production with any questions.','','Thanks,','Production'
 ].join('\n');
 const printedEmail=!!day.layout.includeContacts&&roster.some(call=>call.person.email?.trim());
 return {subject,body,revisionLabel,recipients:[...addresses.values()],missing,invalid,counts,printedEmail};
}

module.exports={describeEmail,validEmail};
