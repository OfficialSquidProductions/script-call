'use strict';

(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LayoutPresets=factory();})(globalThis,()=>{
 const sections=['logistics','schedule','cast','crew','notes','advance'];
 const builtIns=[
  {id:'gcasper',name:'G-Casper-style · front & back (default)'},
  {id:'compact',name:'Compact Crew'},
  {id:'narrative',name:'Original Narrative'},
  {id:'commercial',name:'Commercial / Documentary'}
 ];
 const idPattern=/^[a-zA-Z0-9_.-]{1,100}$/;
 const customKey=(item,index)=>'custom:'+(item.id||'legacy-'+index);
 const order=(layout,key=customKey)=>layout.sectionOrder||[...layout.order,...layout.custom.map(key)];
 const movable=(layout,key)=>layout.preset!=='gcasper'||!['logistics','crew'].includes(key);
 function arrayEqual(a,b){return a.length===b.length&&a.every((value,i)=>value===b[i]);}
 function validate(layout){
  if(layout.templateId!==undefined&&(typeof layout.templateId!=='string'||!idPattern.test(layout.templateId)))throw Error('Invalid saved preset reference.');
  const ids=layout.custom.map(item=>item.id).filter(id=>id!==undefined);
  if(ids.some(id=>typeof id!=='string'||!idPattern.test(id))||new Set(ids).size!==ids.length)throw Error('Invalid custom section identity.');
  if(layout.sectionOrder===undefined)return;
  const all=[...sections,...layout.custom.map(customKey)],saved=layout.sectionOrder;
  if(ids.length!==layout.custom.length||!Array.isArray(saved)||saved.length!==all.length||new Set(saved).size!==all.length||saved.some(key=>!all.includes(key))||!arrayEqual(saved.filter(key=>sections.includes(key)),layout.order))throw Error('Invalid combined section order.');
 }
 function withOrder(layout,keys,custom){
  const built=keys.filter(key=>sections.includes(key)),items=new Map(custom.map((item,i)=>[customKey(item,i),item]));
  const sorted=keys.filter(key=>items.has(key)).map(key=>items.get(key));
  const result={...layout,order:built,custom:sorted};
  // Retain the original schema when the order is expressible as built-ins followed by custom sections.
  if(arrayEqual(keys,[...built,...sorted.map(customKey)]))delete result.sectionOrder;
  else result.sectionOrder=keys;
  return result;
 }
 function move(layout,source,target,edge,key=customKey){
  if(source===target||!['before','after'].includes(edge)||!movable(layout,source)||!movable(layout,target))return null;
  const current=order(layout,key),sequence=current.filter(section=>movable(layout,section));
  if(!sequence.includes(source)||!sequence.includes(target))return null;
  const revised=sequence.filter(section=>section!==source);
  revised.splice(revised.indexOf(target)+(edge==='after'?1:0),0,source);
  if(arrayEqual(sequence,revised))return null;
  let i=0;
  const keys=current.map(section=>movable(layout,section)?revised[i++]:section);
  return withOrder(layout,keys,layout.custom.map((item,index)=>({...item,id:key(item,index).slice(7)})));
 }
 function remove(layout,key,idOf=customKey){
  const custom=layout.custom.flatMap((item,i)=>{const id=idOf(item,i);return id===key?[]:[{...item,id:id.slice(7)}];});
  return withOrder(layout,order(layout,idOf).filter(section=>section!==key),custom);
 }
 function name(value){
  if(typeof value!=='string')throw Error('Enter a template name.');
  const display=value.normalize('NFKC').trim().replace(/\s+/gu,' '),key=display.toLowerCase();
  if(!display||[...display].length>60||/\p{C}/u.test(display))throw Error('Enter a template name with 1–60 printable characters.');
  if(builtIns.some(p=>p.id===key||p.name.toLowerCase()===key)||['g-casper-style','g-casper'].includes(key))throw Error('Choose a name different from the built-in presets.');
  return {display,key};
 }
 function capture(layout,makeId){
  const custom=layout.custom.map(item=>({id:item.id||makeId(),title:item.title,text:''}));
  const keys=layout.sectionOrder||[...layout.order,...custom.map(customKey)];
  const {preset,paper,mono,sceneColors}=layout;
  return withOrder({preset,paper,mono,sceneColors:sceneColors??true,hidden:[...layout.hidden]},keys,custom);
 }
 function apply(layout,preset,templateId,key=customKey){
  const current=new Map(layout.custom.map((item,i)=>[key(item,i),item]));
  // Preserve the draft's written text and privacy preferences when applying a reusable layout.
  const custom=preset.custom.map(item=>({...item,text:current.get(customKey(item))?.text||''}));
  const known=new Set(custom.map(customKey));
  const retained=layout.custom.flatMap((item,i)=>item.text.trim()&&!known.has(key(item,i))?[{...item,id:key(item,i).slice(7)}]:[]);
  if(custom.length+retained.length>20)throw Error('This preset and the written custom sections exceed the 20-section limit.');
  const {preset:base,paper,mono,sceneColors,hidden}=preset;
  return withOrder({...layout,preset:base,paper,mono,sceneColors,hidden:[...hidden],templateId},[...order(preset),...retained.map(customKey)],[...custom,...retained]);
 }
 function archiveData(layout){return layout.sectionOrder!==undefined;}
 return {sections,builtIns,customKey,order,movable,validate,move,remove,name,capture,apply,archiveData};
});
