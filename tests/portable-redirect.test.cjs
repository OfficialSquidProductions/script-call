'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../desktop/portable-download.cjs');
test('portable GitHub asset redirect accepts signed CDN queries without weakening manifest URL policy',async()=>{
 const original='https://github.com/OfficialSquidProductions/script-call-updates/releases/download/v1/payload.zip',target='https://release-assets.githubusercontent.com/github-production-release-asset/123/file?sp=r&sig=synthetic';const seen=[];
 const result=await D.response(original,async(url,options)=>{seen.push(url);assert.equal(options.credentials,'omit');assert.equal(options.redirect,'manual');return seen.length===1?new Response(null,{status:302,headers:{location:target}}):new Response('payload');});assert.equal(await result.text(),'payload');assert.deepEqual(seen,[original,target]);
 await assert.rejects(D.response(original+'?token=x',async()=>{throw Error('must not fetch');}),/HTTPS/);
});
test('portable redirect rejects credentials, insecure schemes, fragments, ports and unapproved hosts',async()=>{
 const original='https://github.com/org/repo/releases/download/v1/payload.zip';
 for(const location of ['http://release-assets.githubusercontent.com/a?sig=x','https://user:pass@release-assets.githubusercontent.com/a?sig=x','https://release-assets.githubusercontent.com:444/a?sig=x','https://release-assets.githubusercontent.com/a?sig=x#fragment','https://release-assets.githubusercontent.com.evil.test/a?sig=x','https://evil.test/a','https://github.com/a?token=x'])await assert.rejects(D.response(original,async()=>new Response(null,{status:302,headers:{location}})),/HTTPS/);
 await assert.rejects(D.response('https://example.test/feed',async()=>new Response(null,{status:302,headers:{location:'https://release-assets.githubusercontent.com/a?sig=x'}})),/HTTPS/);
});
test('portable same-origin relative redirect works and repeated redirects remain bounded',async()=>{
 let calls=0;const r=await D.response('https://example.test/feed',async url=>++calls===1?new Response(null,{status:302,headers:{location:'/next'}}):new Response(url));assert.equal(await r.text(),'https://example.test/next');
 calls=0;await assert.rejects(D.response('https://github.com/a',async()=>{calls++;return new Response(null,{status:302,headers:{location:'https://release-assets.githubusercontent.com/a?sig=x'}});}),/Too many/);assert.equal(calls,6);
});
