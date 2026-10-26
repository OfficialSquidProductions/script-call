'use strict';
const fs=require('node:fs'),path=require('node:path');
// Resolve existing ancestors so symlinks cannot redirect a preview into live data.
function canonical(value){let at=path.resolve(value),tail=[];while(!fs.existsSync(at)){tail.unshift(path.basename(at));const parent=path.dirname(at);if(parent===at)throw Error('Preview storage parent is unavailable.');at=parent;}return path.join(fs.realpathSync(at),...tail);}
function previewLocation(config,explicit,{platform=process.platform,executable=process.execPath}={}){
 if(config.kind==='portable-windows-preview'){
  if(platform!=='win32'||config.schema!==1)throw Error('Portable Windows preview profile is unsupported.');
  const parent=path.dirname(executable);
  config={allowedParent:parent,directory:path.join(parent,'Script Call Preview Data')};
 }
 if(!path.isAbsolute(config.directory)||!path.isAbsolute(config.allowedParent)||explicit&&!path.isAbsolute(explicit))throw Error('Preview storage must be an absolute dedicated directory.');
 const directory=canonical(explicit||config.directory),parent=canonical(config.allowedParent);
 if(!directory.startsWith(parent+path.sep)||directory===parent||directory.split(path.sep).some(x=>['.local-data','.reporter-preview-data'].includes(x)))throw Error('Preview storage must stay inside its development checkout and outside user profiles.');
 return directory;
}
module.exports={previewLocation};
