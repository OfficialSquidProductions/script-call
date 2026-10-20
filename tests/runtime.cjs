'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),local=path.join(root,'.runtime/electron/Electron.app/Contents/MacOS/Electron');
module.exports={playwright:require(process.env.CALLSHEET_PLAYWRIGHT||'playwright'),electron:process.env.CALLSHEET_ELECTRON||(fs.existsSync(local)?local:require('electron'))};
