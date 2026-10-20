'use strict';
const D=require('./domain.cjs');
async function forecast(r,{consent=false,fetchImpl=globalThis.fetch,now=Date.now()}={}){
 if(consent!==true)throw Error('Explicit permission is required for each online forecast request.');
 const loc=r.location,zone=r.values.zone,date=r.day.date;
 if(!loc||loc.latitude===null||loc.longitude===null||!D.okDate(date)||!D.okZone(zone))throw Error('Set coordinates, date, and timezone first.');
 const distance=(Date.parse(date+'T12:00Z')-now)/86400000;if(distance< -1||distance>7)throw Error('NWS forecasts cover approximately seven days. This date is outside that horizon.');
 const key=D.weatherKey(r.day,loc,zone);
 if(r.weather.mode==='nws'&&r.weather.key===key&&now-Date.parse(r.weather.fetchedAt)<3600000)return {...r.weather,fromCache:true};
 const json=async url=>{
  const u=new URL(url);if(u.protocol!=='https:'||u.hostname!=='api.weather.gov'||u.port)throw Error('Unexpected weather provider URL.');
  const response=await fetchImpl(url,{headers:{'User-Agent':'CallSheetPrototype/0.1 (local desktop)','Accept':'application/geo+json'},signal:AbortSignal.timeout(15000),redirect:'error'});
  if(!response.ok)throw Error('NWS is unavailable ('+response.status+'). Manual and cached weather remain available.');
  let text='';if(response.body?.getReader){const reader=response.body.getReader();let bytes=0;const decoder=new TextDecoder();while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>2*1024*1024){await reader.cancel();throw Error('Weather response too large.');}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();}else text=await response.text();
  if(text.length>2*1024*1024)throw Error('Weather response too large.');return JSON.parse(text);
 };
 const point=await json(`https://api.weather.gov/points/${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`);if(!point.properties?.forecast)throw Error('NWS has no forecast for these coordinates.');
 const data=await json(point.properties.forecast),periods=(data.properties?.periods||[]).filter(p=>{try{const parts=new Intl.DateTimeFormat('en',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(p.startTime));const value=Object.fromEntries(parts.map(x=>[x.type,x.value]));return `${value.year}-${value.month}-${value.day}`===date;}catch{return false;}});
 if(!periods.length)throw Error('No forecast is available for this local date.');
 return {mode:'nws',summary:periods.map(p=>`${p.name}: ${p.temperature}°${p.temperatureUnit}, ${p.shortForecast}, wind ${p.windSpeed} ${p.windDirection}`).join(' / '),fetchedAt:new Date(now).toISOString(),providerIssuedAt:data.properties.updated||null,key,approved:false,attribution:'National Weather Service'};
}
module.exports={forecast};
