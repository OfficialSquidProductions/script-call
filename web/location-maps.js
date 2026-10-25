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
 function coordinates(value){const info=inspect(value);if(!info.url)return {status:'invalid',reason:'Use a valid HTTPS Google Maps link.'};if(info.status==='short')return {status:'unresolved',reason:'Short Maps link must resolve before coordinates can be identified.'};const u=new URL(info.url);let decoded;try{decoded=decodeURIComponent(u.pathname+u.search);}catch{return {status:'unresolved',reason:'Malformed coordinate data.'};}const pair=(a,b)=>{const latitude=Number(a),longitude=Number(b);return Number.isFinite(latitude)&&Math.abs(latitude)<=90&&Number.isFinite(longitude)&&Math.abs(longitude)<=180?{latitude,longitude}:null;};
  const placeData=decodeURIComponent(u.pathname).split('/data=')[1]||'';const places=[...placeData.matchAll(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)(?=!|$)/g)].map(m=>pair(m[1],m[2]));const unique=[...new Map(places.filter(Boolean).map(x=>[x.latitude+','+x.longitude,x])).values()];if(places.some(x=>!x)||unique.length>1)return {status:'unresolved',reason:'Multiple or invalid place coordinates; choose the correct point manually.'};if(unique.length===1)return {status:'resolved',kind:'maps-place',coordinates:unique[0],reason:'Selected-place coordinate data in Google Maps link; confirm the venue.'};
  if(['query_place_id','destination_place_id','place_id','cid'].some(k=>u.searchParams.has(k)))return {status:'unresolved',reason:'Place ID without explicit place coordinates; resolve the link or enter coordinates manually.'};
  for(const key of ['destination','daddr','query','q'])if(u.searchParams.has(key)){const values=u.searchParams.getAll(key);if(values.length!==1)return {status:'unresolved',reason:'Ambiguous location query.'};const m=values[0].trim().match(/^(?:loc:)?(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/i);if(m){const point=pair(m[1],m[2]);return point?{status:'resolved',kind:'maps-query',coordinates:point,reason:'Explicit coordinate pin in Google Maps query; confirm the venue.'}:{status:'unresolved',reason:'Coordinates are outside valid latitude/longitude ranges.'};}}
  return {status:'unresolved',reason:/@-?\d/.test(decoded)?'Map viewport only; camera coordinates do not identify the venue.':'No reliable place coordinates in this link.'};
 }
 const capture=loc=>({mapsUrl:loc.mapsUrl||'',latitude:loc.latitude,longitude:loc.longitude,coordinateSource:loc.coordinateSource?{...loc.coordinateSource}:null});
 function applyCoordinates(loc,result,expected,{force=false}={}){if(JSON.stringify(capture(loc))!==JSON.stringify(expected))return {applied:false,reason:'Location changed while coordinates were resolving.'};if(result.status!=='resolved'||!result.coordinates)return {applied:false,reason:result.reason||'No reliable coordinates.'};const c=result.coordinates;if(!Number.isFinite(c.latitude)||Math.abs(c.latitude)>90||!Number.isFinite(c.longitude)||Math.abs(c.longitude)>180)throw Error('Invalid resolved coordinates.');const source=loc.coordinateSource,auto=source&&['maps-place','maps-query'].includes(source.kind)&&source.latitude===loc.latitude&&source.longitude===loc.longitude;if(!force&&(loc.latitude!==null||loc.longitude!==null)&&!auto)return {applied:false,reason:'Manual coordinates retained. Use Maps coordinates only if you choose to replace them.'};loc.latitude=c.latitude;loc.longitude=c.longitude;loc.coordinateSource={kind:result.kind,url:loc.mapsUrl,latitude:c.latitude,longitude:c.longitude};return {applied:true,reason:result.reason};}
 return {inspect,openURL,coordinates,capture,applyCoordinates};
});
