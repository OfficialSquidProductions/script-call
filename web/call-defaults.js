'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CallDefaults=factory();})(globalThis,()=>{
 const values=(p,d)=>({...p.defaults,...d.overrides});
 function base(p,d,basis){if(basis==='shooting')return Object.hasOwn(d.sheetOverrides||{},'shootingCall')?d.sheetOverrides.shootingCall:p.sheetDefaults?.shootingCall||'';return values(p,d).generalCall;}
 function resolve(p,d,person,call){return call.call||base(p,d,call.callBasis==='shooting'?'shooting':'crew')||'';}
 function initial(p,d,person){const callBasis=person.type==='cast'?'shooting':'crew';return {call:base(p,d,callBasis)||'',callBasis};}
 const hasData=p=>[...p.days,...(p.deletedDays||[])].some(d=>d.calls.some(c=>Object.hasOwn(c,'callBasis')));
 return {base,resolve,initial,hasData};
});
