'use strict';
// Presentation only. Canonical stored times always remain HH:MM, without zone conversion.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.TimeDisplay=factory();})(globalThis,()=>{
 const canonical=/^(?:[01]\d|2[0-3]):[0-5]\d$/;
 function format(value,mode='24'){if(!value)return '';if(!canonical.test(value))return value;const [h,m]=value.split(':').map(Number);return mode==='12'?`${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`:value;}
 function parse(value,mode='24'){if(typeof value!=='string')throw Error('Enter a time.');const s=value.trim();if(!s)return '';const m=mode==='12'?s.match(/^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/i):s.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);if(!m)throw Error(mode==='12'?'Use a time with AM or PM, such as 5:30 PM.':'Use 24-hour time, such as 17:30.');let h=Number(m[1]);if(mode==='12')h=h%12+(/pm/i.test(m[3])?12:0);return String(h).padStart(2,'0')+':'+m[2];}
 const mode=(p,d)=>p.timeDisplayClock||d?.layout?.clock||'24';
 const hint=m=>m==='12'?'12-hour time; AM or PM required (12:00 AM is midnight, 12:00 PM is noon).':'24-hour time (00:00 is midnight, 12:00 is noon).';
 return {format,parse,mode,hint,canonical};
});
