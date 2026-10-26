'use strict';
const fs=require('node:fs'),path=require('node:path');
const {Manager}=require('./portable-manager.cjs');
function context(executable=process.execPath){
 if(process.platform!=='win32')throw Error('Managed portable runtime requires Windows.');
 const slot=path.basename(path.dirname(executable)),versions=path.dirname(path.dirname(executable)),root=path.dirname(versions);
 if(path.basename(versions)!=='versions'||!/^[a-f0-9]{32}$/.test(slot))throw Error('Launch this portable application using its root launcher.');
 const config=JSON.parse(fs.readFileSync(path.join(root,'resources/app/portable-bootstrap.json'))),manager=new Manager(root,config),state=manager.state();
 if(state.active.slot!==slot)throw Error('This portable version is not active. Use the root launcher.');
 return {root,config,manager,state,directory:manager.data(state.active)};
}
async function ready(ctx){if(!ctx.state.trial)return;ctx.manager.acknowledge(ctx.state.trial);for(let n=0;n<450;n++){const s=ctx.manager.state();if(!s.trial&&s.active.slot===ctx.state.active.slot)return;await new Promise(r=>setTimeout(r,100));}throw Error('The portable launcher did not acknowledge startup. Close and reopen the root launcher to recover.');}
module.exports={context,ready};
