'use strict';
// Exact page-unit text -> existing integer eighths; never round imported or edited data.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PageLength=factory();})(globalThis,()=>{
 const message='Enter 0–1000 pages as a whole number, an exact decimal, or a fraction such as 2 3/8 or 3/8. Fractions must equal whole eighths; nothing is rounded.';
 function parse(text){if(typeof text!=='string'||text.length>100)throw Error(message);const s=text.trim();let value;const fraction=s.match(/^(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)$/),decimal=s.match(/^(\d+)(?:\.(\d+))?$/);
  if(fraction){const whole=BigInt(fraction[1]||'0'),n=BigInt(fraction[2]),d=BigInt(fraction[3]);if(d===0n||n*8n%d!==0n)throw Error(message);value=whole*8n+n*8n/d;}
  else if(decimal){const scale=10n**BigInt((decimal[2]||'').length),n=BigInt(decimal[1])*scale+BigInt(decimal[2]||'0');if(n*8n%scale!==0n)throw Error(message);value=n*8n/scale;}
  else throw Error(message);
  if(value>8000n)throw Error(message);return Number(value);
 }
 function format(eighths){if(!Number.isInteger(eighths)||eighths<0||eighths>8000)throw Error(message);const whole=Math.floor(eighths/8),rest=eighths%8;return rest?(whole?whole+' ':'')+rest+'/8':String(whole);}
 return {parse,format,message};
});
