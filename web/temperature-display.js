'use strict';
// Canonical storage is Celsius. Unit changes only affect presentation.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.TemperatureDisplay=factory();})(globalThis,()=>{
 const mode=(p,d)=>p.temperatureUnit||d?.layout?.temperature||'C';
 const convert=(n,from,to)=>from===to?n:from==='C'?n*9/5+32:(n-32)*5/9;
 function format(value,unit='C',digits=2){if(value===''||value===null||value===undefined)return '';const n=convert(Number(value),'C',unit);return Number.isFinite(n)?String(Number(n.toFixed(digits))):String(value);}
 function parse(text,unit='C'){const s=String(text).trim();if(!s)return '';if(!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(s)||!Number.isFinite(Number(s)))throw Error('Enter a number in °'+unit+', or leave it blank.');const n=convert(Number(s),unit,'C');if(!Number.isFinite(n))throw Error('Temperature is too large.');return String(Object.is(n,-0)?0:n);}
 function summary(text,unit='C'){return String(text||'').replace(/(-?\d+(?:\.\d+)?)\s*°\s*([CF])\b/g,(_,n,from)=>String(Number(convert(Number(n),from,unit).toFixed(1)))+'°'+unit);}
 return {mode,convert,format,parse,summary};
});
