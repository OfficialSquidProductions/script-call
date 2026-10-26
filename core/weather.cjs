'use strict';
const D=require('./domain.cjs'),Calendar=require('../web/availability.js');
async function forecast(r,{consent=false,fetchImpl=globalThis.fetch,now=Date.now()}={}){
 if(consent!==true)throw Error('Explicit permission is required for each online forecast request.');
 const loc=r.location,zone=r.values.zone,date=r.day.date;
 if(!loc||!Number.isFinite(loc.latitude)||Math.abs(loc.latitude)>90||!Number.isFinite(loc.longitude)||Math.abs(loc.longitude)>180||!D.okDate(date)||!D.okZone(zone))throw Error('Set coordinates, date, and timezone first.');
 const today=Calendar.parts(now,zone).date;const distance=(Date.parse(date+'T12:00Z')-Date.parse(today+'T12:00Z'))/86400000;if(distance<0||distance>7)throw Error('NWS forecasts cover approximately seven days. This date is outside that horizon.');
 const key=D.weatherKey(r.day,loc,zone);
 if(Object.hasOwn(r.weather,'highC')&&Object.hasOwn(r.weather,'lowC')&&r.weather.mode==='nws'&&r.weather.key===key&&now-Date.parse(r.weather.fetchedAt)>=0&&now-Date.parse(r.weather.fetchedAt)<3600000)return {...r.weather,fromCache:true};
 const json=async url=>{
  const u=new URL(url);if(u.protocol!=='https:'||u.hostname!=='api.weather.gov'||u.port||u.username||u.password||u.hash)throw Error('Unexpected weather provider URL.');
  const response=await fetchImpl(url,{headers:{'User-Agent':'ScriptCall (https://scriptcall.squidproductions.org; public forecast)','Accept':'application/geo+json'},signal:AbortSignal.timeout(15000),redirect:'error'});
  if(!response.ok)throw Error('NWS is unavailable ('+response.status+'). Manual and cached weather remain available.');
  let text='';if(response.body?.getReader){const reader=response.body.getReader();let bytes=0;const decoder=new TextDecoder();while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>2*1024*1024){await reader.cancel();throw Error('Weather response too large.');}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();}else text=await response.text();
  if(text.length>2*1024*1024)throw Error('Weather response too large.');return JSON.parse(text);
 };
 const point=await json(`https://api.weather.gov/points/${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`);if(!point.properties?.forecast)throw Error('NWS has no forecast for these coordinates.');
 const data=await json(point.properties.forecast),start=Calendar.epoch(date,'00:00',zone),end=Calendar.epoch(Calendar.addDate(date,1),'00:00',zone);if(start===null||end===null)throw Error('The shoot date has an ambiguous local midnight; review its timezone.');
 const periods=(data.properties?.periods||[]).filter(p=>{const a=Date.parse(p.startTime),b=Date.parse(p.endTime);return Number.isFinite(a)&&Number.isFinite(b)&&b>a&&a<end&&b>start&&Number.isFinite(p.temperature)&&typeof p.temperatureUnit==='string'&&['C','F'].includes(p.temperatureUnit)&&typeof p.shortForecast==='string';});
 if(!periods.length)throw Error('No forecast is available for this local date.');
 const temperatures=flag=>periods.filter(p=>p.isDaytime===flag).map(p=>p.temperatureUnit==='C'?p.temperature:(p.temperature-32)*5/9).filter(t=>Math.abs(t)<=100);const highs=temperatures(true),lows=temperatures(false);
 return {mode:'nws',highC:highs.length?Math.max(...highs):null,lowC:lows.length?Math.min(...lows):null,summary:periods.map(p=>`${p.name}: ${p.temperature}°${p.temperatureUnit}, ${p.shortForecast}, wind ${p.windSpeed} ${p.windDirection}`).join(' / '),fetchedAt:new Date(now).toISOString(),providerIssuedAt:data.properties.updated||null,key,approved:false,attribution:'National Weather Service'};
}
module.exports={forecast};
