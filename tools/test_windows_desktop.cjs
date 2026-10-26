'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const suites=process.argv.slice(2);const out=path.join(root,'verification/windows');fs.mkdirSync(out,{recursive:true});
(async()=>{const results=fs.existsSync(path.join(out,'results.json'))?JSON.parse(fs.readFileSync(path.join(out,'results.json'))).results:[];for(const suite of suites){
 if(!/^[a-z-]+\.cjs$/.test(suite))throw Error('Invalid suite');
 const file=path.join(out,suite+'.log'),log=fs.openSync(file,'w');console.log('START '+suite);
 const result=await new Promise(resolve=>{const child=spawn(process.execPath,[path.join(root,'tests',suite)],{cwd:root,env:process.env,stdio:['ignore',log,log]});child.on('error',error=>resolve({error:error.message}));child.on('exit',(code,signal)=>resolve({code,signal}));});fs.closeSync(log);
 const text=fs.readFileSync(file,'utf8');const previous=results.findIndex(r=>r.suite===suite);if(previous>=0)results.splice(previous,1);results.push({suite,source:process.env.CALLSHEET_WINDOWS_APP,...result,passedChecks:(text.match(/^PASS /gm)||[]).length,log:file});fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({platform:process.platform,arch:process.arch,node:process.version,source:process.env.CALLSHEET_WINDOWS_APP,results},null,2));console.log('END '+JSON.stringify(results.at(-1)));if(result.code!==0)console.log(text.slice(-2600));
 }process.exitCode=results.some(x=>x.code!==0)?1:0;})().catch(e=>{console.error(e);process.exitCode=1;});
