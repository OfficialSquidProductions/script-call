'use strict';
// Menu roles keep the OS's normal keyboard conventions; actions use the same IPC
// path as the sidebar so save/update/report behavior does not diverge by platform.
function applicationMenu(platform, send) {
 const updates={label:'Check for Updates…',click:()=>send('check-updates')};
 return [
  ...(platform==='darwin'?[{label:'Script Call',submenu:[{role:'about'},updates,{type:'separator'},{role:'hide'},{role:'hideOthers'},{role:'unhide'},{type:'separator'},{role:'quit'}]}]:[]),
  {label:'File',submenu:[{label:'Save',accelerator:'CmdOrCtrl+S',click:()=>send('menu-save')},{type:'separator'},{role:'close'},...(platform==='darwin'?[]:[{role:'quit'}])]},
  {role:'editMenu'},{role:'viewMenu'},{role:'windowMenu'},
  {label:'Help',submenu:[...(platform==='darwin'?[]:[updates,{role:'about'},{type:'separator'}]),{label:'Report a Bug…',click:()=>send('report-bug')}]}
 ];
}
module.exports={applicationMenu};
