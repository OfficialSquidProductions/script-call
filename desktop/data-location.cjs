'use strict';
// Installation-local preference, outside the signed bundle. No project data is moved.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
function dataLocation({explicit,defaultProfile,executable,platform=process.platform,user=process.getuid?.()??crypto.createHash('sha256').update(os.homedir()).digest('hex').slice(0,12)}){
 const bundle=platform==='darwin'?path.dirname(path.dirname(path.dirname(executable))):path.dirname(executable);
 // Keep Windows's remembered store outside the replaced installation directory,
 // just as the Mac marker is outside its .app. A path hash separates side-by-side
 // test installations without writing into the user's default project profile.
 const windows=platform==='win32',folder=platform==='darwin'||windows?path.dirname(bundle):bundle;
 const installation=windows?'-'+crypto.createHash('sha256').update(path.resolve(bundle).toLowerCase()).digest('hex').slice(0,16):'';
 let marker=path.join(folder,'.script-call-profile-'+user+installation+'.json');
 const legacyMarker=windows?path.join(bundle,'.script-call-profile-'+user+'.json'):null;
 if(!explicit&&legacyMarker&&!fs.existsSync(marker)&&fs.existsSync(legacyMarker))marker=legacyMarker;
 const absolute=value=>typeof value==='string'&&path.isAbsolute(value)&&!value.includes('\0');
 function result(directory,error){return {userData:directory,storeDirectory:directory,marker,error};}
 if(explicit){
  if(!absolute(explicit))throw Error('CALLSHEET_DATA_DIR must be an absolute local path.');const directory=path.resolve(explicit);let error;
  const locationKey=windows?directory.toLowerCase():directory,bundleKey=windows?bundle.toLowerCase():bundle;
  if(locationKey===bundleKey||locationKey.startsWith(bundleKey+path.sep))error='The chosen data directory is inside the app bundle. Updates are blocked to protect it.';
  else{const tmp=marker+'.'+process.pid+'.tmp';try{fs.writeFileSync(tmp,JSON.stringify({format:'script-call-installation-data-location',version:1,directory}),{flag:'wx',mode:0o600});fs.renameSync(tmp,marker);}catch{error='The installation data location could not be saved. Updates are blocked so a restart cannot open a different project store.';}finally{try{fs.unlinkSync(tmp);}catch{}}}
  return result(directory,error);
 }
 let stat;try{stat=fs.lstatSync(marker);}catch(e){if(e.code!=='ENOENT')throw Error('The installation data setting cannot be read. Relaunch with your explicit data directory.');}
 if(stat){
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size>4096||(platform==='darwin'&&(stat.uid!==user||(stat.mode&0o077)!==0)))throw Error('The saved installation data location is not private to this user. Relaunch with your explicit data directory.');
  let value;try{value=JSON.parse(fs.readFileSync(marker,'utf8'));}catch{throw Error('The installation data location is unreadable. Relaunch with your explicit data directory.');}
  if(value.format!=='script-call-installation-data-location'||value.version!==1||!absolute(value.directory))throw Error('The installation data location is invalid. Relaunch with your explicit data directory.');
  return result(path.resolve(value.directory));
 }
 return {userData:defaultProfile,storeDirectory:path.join(defaultProfile,'local-projects'),marker};
}
module.exports={dataLocation};
