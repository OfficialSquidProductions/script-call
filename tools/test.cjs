'use strict';
// Explicit file enumeration also works in Windows shells without glob expansion.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),files=fs.readdirSync(path.join(root,'tests')).filter(name=>name.endsWith('.test.cjs')).sort().map(name=>path.join(root,'tests',name));
const result=spawnSync(process.execPath,['--test',...files],{stdio:'inherit',cwd:root});
if(result.error)throw result.error;process.exitCode=result.status??1;
