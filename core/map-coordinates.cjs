'use strict';
const Maps=require('../web/location-maps.js');
async function resolve(link,{fetchImpl=globalThis.fetch}={}){
 const first=Maps.inspect(link);if(!first.url)throw Error('Use a valid HTTPS Google Maps link.');if(first.url.length>4096)throw Error('Maps link is too long.');let url=first.url;const seen=new Set(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{for(let n=0;n<6;n++){
  const allowed=Maps.inspect(url);if(!allowed.url)throw Error('Blocked unsafe Maps redirect. Only HTTPS Google Maps hosts are permitted.');if(seen.has(allowed.url))throw Error('Maps redirect loop.');seen.add(allowed.url);const parsed=Maps.coordinates(allowed.url);if(parsed.status==='resolved')return {...parsed,inputURL:link,resolvedURL:allowed.url,networkUsed:n>0};
  const response=await fetchImpl(allowed.url,{redirect:'manual',signal:controller.signal,headers:{Accept:'text/html','User-Agent':'ScriptCall/0.3 (Maps coordinates)'}});if(response.status>=300&&response.status<400){const target=response.headers?.get('location');await response.body?.cancel();if(!target)throw Error('Maps redirect has no destination.');url=new URL(target,allowed.url).href;continue;}if(!response.ok)throw Error('Google Maps lookup unavailable ('+response.status+'). Manual coordinates remain available.');
  let text='';if(response.body?.getReader){const reader=response.body.getReader(),decoder=new TextDecoder();let size=0;try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>262144)throw Error('Maps response exceeds the safe lookup limit.');text+=decoder.decode(value,{stream:true});}text+=decoder.decode();}finally{await reader.cancel();}}else{text=await response.text();if(Buffer.byteLength(text)>262144)throw Error('Maps response exceeds the safe lookup limit.');}
  const canonical=[...text.matchAll(/<link\b[^>]*>/gi)].filter(m=>/\brel\s*=\s*["']canonical["']/i.test(m[0])).map(m=>m[0].match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1]).filter(Boolean);if(canonical.length===1){const next=new URL(canonical[0].replaceAll('&amp;','&'),allowed.url).href;if(next!==allowed.url){url=next;continue;}}
  return {...parsed,inputURL:link,resolvedURL:allowed.url,networkUsed:true};
 }throw Error('Maps lookup exceeded the redirect limit.');}catch(error){if(controller.signal.aborted)throw Error('Maps lookup timed out. Manual coordinates remain available.');throw error;}finally{clearTimeout(timer);}
}
module.exports={resolve};
