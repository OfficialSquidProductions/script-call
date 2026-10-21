'use strict';
const fs=require('node:fs'),path=require('node:path');
function checkPublicResources(root){
 const bad=[];function walk(p){const st=fs.lstatSync(p);if(st.isSymbolicLink())return;if(st.isDirectory()){if((st.mode&0o555)!==0o555)bad.push(path.relative(root,p)||'.');for(const name of fs.readdirSync(p))walk(path.join(p,name));}else if(st.isFile()){if((st.mode&0o444)!==0o444)bad.push(path.relative(root,p));}else bad.push(path.relative(root,p));}walk(root);
 if(bad.length)throw Error('Public release resources must remain readable after installer ownership changes: '+bad.slice(0,8).join(', '));return true;
}
module.exports={checkPublicResources};
