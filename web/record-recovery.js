'use strict';
// Soft deletion keeps original records and references intact for exact recovery.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.RecordRecovery=factory();})(globalThis,()=>{
 const kinds=['people','locations','scenes'];
 const entries=(p,kind)=>p.recordTrash?.[kind]||[];
 const deleted=(p,kind,id)=>entries(p,kind).some(x=>x.id===id);
 const active=(p,kind)=>p[kind].filter(x=>!deleted(p,kind,x.id));
 const hasData=p=>kinds.some(k=>entries(p,k).length);
 function validate(p){const t=p.recordTrash;if(t===undefined)return;if(!t||t.schema!==1||Object.keys(t).some(k=>!['schema',...kinds].includes(k)))throw Error('Invalid deleted-record register.');for(const kind of kinds){if(kind==='scenes'&&t[kind]===undefined)continue;if(!Array.isArray(t[kind])||t[kind].length>3000)throw Error('Invalid deleted-record list.');const ids=new Set();for(const x of t[kind]){if(!x||Object.keys(x).some(k=>!['id','deletedAt'].includes(k))||typeof x.id!=='string'||!p[kind]?.some(r=>r.id===x.id)||ids.has(x.id)||typeof x.deletedAt!=='string'||!Number.isFinite(Date.parse(x.deletedAt)))throw Error('Invalid deleted-record reference.');ids.add(x.id);}}}
 function apply(p,{kind,entity,id},now=new Date().toISOString()){
  if(!kinds.includes(entity)||!['delete','restore'].includes(kind))throw Error('Choose a supported record action.');
  const record=p[entity].find(x=>x.id===id);if(!record)throw Error('Record no longer exists.');
  if(kind==='delete'&&deleted(p,entity,id))throw Error('Record is already deleted.');
  if(kind==='restore'&&!deleted(p,entity,id))throw Error('Record is already active.');
  if(!Number.isFinite(Date.parse(now)))throw Error('Invalid deletion date.');
  p.recordTrash||={schema:1,people:[],locations:[]};
  if(kind==='delete'){p.recordTrash[entity]||=[];p.recordTrash[entity].push({id,deletedAt:now});}else {p.recordTrash[entity]=p.recordTrash[entity].filter(x=>x.id!==id);if(entity==='scenes'&&!p.recordTrash.scenes.length)delete p.recordTrash.scenes;}
  return record;
 }
 function scheduleNeighbor(p,list,index,delta){if(![-1,1].includes(delta)||!Number.isInteger(index)||index<0||index>=list.length)return -1;for(let i=index+delta;i>=0&&i<list.length;i+=delta)if(list[i].type!=='scene'||!deleted(p,'scenes',list[i].sceneId))return i;return -1;}
 return {entries,deleted,active,hasData,validate,apply,scheduleNeighbor};
});
