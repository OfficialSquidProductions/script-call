'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),local=path.join(root,'.runtime/electron/Electron.app/Contents/MacOS/Electron');
let executable;
module.exports={playwright:require(process.env.CALLSHEET_PLAYWRIGHT||'playwright'),get electron(){return executable||=process.env.CALLSHEET_ELECTRON||(process.platform==='win32'&&process.env.CALLSHEET_WINDOWS_APP?require('./support/windows-app.cjs').prepare().executable:(fs.existsSync(local)?local:require('electron')));}};
