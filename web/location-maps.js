'use strict';
// Local URL inspection only. A label in a link is a suggestion, not geocoding.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LocationMaps=factory();})(globalThis,()=>{
 const domains=new Set(['com','co.uk','ca','com.au','co.nz','ie','fr','de','es','it','nl','be','ch','at','co.in','co.jp']);
 function inspect(value){
  const raw=typeof value==='string'?value.trim():'';if(!raw)return {status:'empty',url:null,text:''};
  let u;try{u=new URL(raw);}catch{return {status:'invalid',url:null,text:''};}
  if(u.protocol!=='https:'||u.username||u.password||u.port)return {status:'invalid',url:null,text:''};
  const short=u.hostname==='maps.app.goo.gl'||u.hostname==='goo.gl'&&u.pathname.startsWith('/maps/');
  const host=u.hostname.replace(/^(?:www\.|maps\.)/,'');
  if(!short&&!(host.startsWith('google.')&&domains.has(host.slice(7))&&(u.hostname.startsWith('maps.')||/^\/maps(?:\/|$)/.test(u.pathname))))return {status:'invalid',url:null,text:''};
  if(short)return {status:'short',url:u.href,text:''};
  // Use explicit search/destination text. Never infer an address from camera
  // coordinates, opaque place IDs, path slugs or Google's undocumented data blob.
  const key=['destination','daddr','query','q'].find(k=>u.searchParams.has(k));
  const candidates=key?[...new Set(u.searchParams.getAll(key))]:[];if(candidates.length>1)return {status:'no-address',url:u.href,text:''};
  const text=candidates.find(s=>s.trim()&&!/^[-+\d.\s,]+$/.test(s)&&! /^(?:place_id:|loc:|https?:|0x)/i.test(s)&&!/[\u0000-\u001f\u007f]/.test(s)&&s.length<=1000)?.trim()||'';
  return {status:text?'text':'no-address',url:u.href,text};
 }
 function openURL(link,address){const found=inspect(link);if(found.status==='invalid')throw Error('Enter a valid HTTPS Google Maps link, or clear it to search the address.');if(found.url)return found.url;if(typeof address!=='string'||!address.trim())throw Error('Enter a Google Maps link or a manual address first.');return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(address.trim());}
 return {inspect,openURL};
});
