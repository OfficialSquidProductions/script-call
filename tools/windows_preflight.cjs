'use strict';
// Read-only native inventory. No user project, network, signing store or security
// settings are accessed. Run before npm ci in a dedicated Windows checkout.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
function preflight({platform=process.platform,arch=process.arch,node=process.versions.node,release=os.release(),root=path.resolve(__dirname,'..')}={}) {
 const blockers=[];
 if(platform!=='win32')blockers.push('This is not the authorized Windows PC.');
 if(!['x64','arm64'].includes(arch))blockers.push('A native x64 or arm64 environment is required.');
 const [major,minor]=node.split('.').map(Number);if(major<22||(major===22&&minor<13))blockers.push('Use Node.js 22.13+ with node:sqlite (Node 24 LTS recommended).');
 if(platform==='win32'&&Number(release.split('.')[0])<10)blockers.push('This Electron baseline requires Windows 10 or later; native testing is still required.');
 if(fs.existsSync(path.join(root,'node_modules'))&&fs.lstatSync(path.join(root,'node_modules')).isSymbolicLink())blockers.push('Use a dedicated checkout with its own node_modules before npm ci.');
 return {platform,arch,node,osRelease:release,sourceVersion:require('../package.json').version,status:blockers.length?'blocked':'ready-for-dependency-setup',blockers,windowsVerified:false,signing:'not inspected; no identity configured by this tool'};
}
if(require.main===module){const report=preflight();console.log(JSON.stringify(report,null,2));if(report.blockers.length)process.exitCode=1;}
module.exports={preflight};
