'use strict';
// Only explicit review-screen actions call these operations. No SMTP or telemetry.
async function openDraft(draft,{app,shell}){
 const uri='mailto:'+draft.to+'?subject='+encodeURIComponent(draft.subject)+'&body='+encodeURIComponent(draft.text);
 let client='';try{client=app.getApplicationNameForProtocol('mailto:'+draft.to);}catch{}
 if(!client)return {opened:false,reason:'No supported default mail client was found. Copy or export the report, then email it to '+draft.to+'.'};
 if(uri.length>1800)return {opened:false,reason:'This report exceeds the reliable mail-link size limit. Copy or export the full report and attach/paste it in an email to '+draft.to+'.'};
 try{await shell.openExternal(uri);return {opened:true,reason:'Requested a draft in your mail client. Delivery is not confirmed; review and send it there. If no draft appeared, use Copy or Export.'};}
 catch{return {opened:false,reason:'The mail client could not be opened. Copy or export the report, then email it to '+draft.to+'.'};}
}
module.exports={openDraft};
