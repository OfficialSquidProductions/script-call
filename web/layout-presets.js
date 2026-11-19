'use strict';

(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LayoutPresets=factory();})(globalThis,()=>{
 const sections=['logistics','schedule','cast','crew','notes','advance'];
 const builtIns=[
  {id:'gcasper',name:'G-Casper-style · front & back (default)'},
  {id:'compact',name:'Compact Crew'},
  {id:'narrative',name:'Original Narrative'},
  {id:'commercial',name:'Commercial / Documentary'}
 ];
 const maxUnplaced=1000;
 const defaults=(preset='gcasper')=>({preset,sceneColors:true,paper:'A4',clock:'24',temperature:'C',mono:false,includeContacts:false,order:sections.slice(),hidden:[],custom:[]});
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
 function validateUnplaced(day){
  const items=day.unplacedCustom;
  if(items===undefined)return;
  const used=new Set(day.layout.custom.map(item=>item.id).filter(Boolean));
  if(!Array.isArray(items)||items.length>maxUnplaced)throw Error('Invalid unplaced custom sections.');
  for(const item of items){
   if(!item||typeof item.id!=='string'||!idPattern.test(item.id)||used.has(item.id)||typeof item.title!=='string'||typeof item.text!=='string')throw Error('Invalid unplaced custom section.');
   used.add(item.id);
  }
 }
 function matches(layout,preset){
  const structure=l=>JSON.stringify([l.preset,l.paper,l.mono,l.sceneColors??true,[...new Set(l.hidden)].sort(),order(l),l.custom.map(item=>item.title)]);
  return structure(layout)===structure(preset);
 }
 function recall(day,preset,templateId,key=customKey){
  const layout=day.layout,content=new Map((day.unplacedCustom||[]).map(item=>[customKey(item),item]));
  for(const [index,item] of layout.custom.entries())if(item.text.trim()){
   const id=key(item,index);content.set(id,{id:id.slice(7),title:item.title,text:item.text});
  }
  const custom=preset.custom.map(item=>{
   const id=customKey(item),text=content.get(id)?.text||'';
   content.delete(id);
   return {...item,text};
  });
  if(content.size>maxUnplaced)throw Error('There are too many unplaced custom sections. Add some back to the sheet before switching presets.');
  const {preset:base,paper,mono,sceneColors,hidden}=preset;
  const next={...defaults(base),paper,mono,sceneColors:sceneColors??true,hidden:[...hidden],clock:layout.clock,temperature:layout.temperature,includeContacts:layout.includeContacts};
  if(layout.includeKeyPhones!==undefined)next.includeKeyPhones=layout.includeKeyPhones;
  if(templateId)next.templateId=templateId;
  return {layout:withOrder(next,order(preset).slice(),custom),unplacedCustom:[...content.values()]};
 }
 function archiveData(layout){return layout.sectionOrder!==undefined;}
 return {sections,builtIns,defaults,customKey,order,movable,validate,validateUnplaced,move,remove,name,capture,matches,recall,archiveData};
});
