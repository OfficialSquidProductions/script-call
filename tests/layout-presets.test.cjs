'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),os=require('node:os'),fs=require('node:fs'),path=require('node:path');
const D=require('../core/domain.cjs'),Layouts=require('../web/layout-presets.js'),{Store}=require('../core/store.cjs'),Archive=require('../core/archive.cjs');
const {renderSheet}=require('../core/sheet.cjs');
const draft=()=>({...D.defaultLayout(),custom:[{id:'first',title:'First custom',text:'Private day notes'},{id:'second',title:'Second custom',text:'Other draft notes'}]});
const compare=(text,a,b)=>assert(text.includes(a)&&text.includes(b)&&text.indexOf(a)<text.indexOf(b));

test('G-Casper groups retain fixed logistics and crew while built-in and custom rows interleave',()=>{
 const initial=draft();
 assert.equal(Layouts.move(initial,'cast','crew','after'),null);
 assert.equal(Layouts.move(initial,'logistics','schedule','after'),null);
 assert.equal(Layouts.move(initial,'custom:first','custom:first','before'),null);
 assert.equal(Layouts.move(initial,'custom:first','not-found','before'),null);
 const l=Layouts.move(initial,'custom:second','cast','before');
 assert.equal(l.order.indexOf('logistics'),0);
 assert.equal(Layouts.order(l).indexOf('crew'),3);
 assert.equal(l.custom[0].id,'second');
 assert.deepEqual(l.custom.map(c=>c.text),['Other draft notes','Private day notes']);
 assert(!initial.sectionOrder);
 const p=D.newProject();p.days.push(D.newDay(p,'2026-11-04'));p.days[0].layout=l;D.validateProject(p);
 const html=renderSheet(D.resolve(p,p.days[0].id),'');
 compare(html,'Second custom','<section data-section="cast"');compare(html,'First custom','data-side="back"');
 const back=html.split('data-side="back"')[1];assert(!back.includes('custom'));
 const restored=Layouts.remove(l,'custom:second');
 assert(!restored.sectionOrder);
 assert.deepEqual(restored.custom,[initial.custom[0]]);
});

test('single-flow styles interleave custom with all built-ins and legacy layouts still render custom last',()=>{
 const p=D.newProject();p.days.push(D.newDay(p,'2026-11-04'));const d=p.days[0];
 for(const preset of ['narrative','commercial','compact']){
  const legacy={...draft(),preset,custom:[{title:'Legacy custom heading',text:'Legacy body'}]};
  d.layout=legacy;
  compare(renderSheet(D.resolve(p,d.id),''),'>Advance schedule','Legacy custom heading');
  const changed=Layouts.move(legacy,'custom:legacy-0','crew','before'),after=Layouts.move(changed,'crew','logistics','before');
  d.layout=after;D.validateProject(p);
  const html=renderSheet(D.resolve(p,d.id),'');
  compare(html,'>Crew calls','>Locations &amp; emergency');
  compare(html,'Legacy custom heading','>Production notes');
  assert.equal(after.custom[0].text,'Legacy body');
 }
});

test('preset names normalize safely and reject duplicates without rewriting earlier presets or drafts',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'layout-preset-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 let store=new Store(dir);
 const p=D.newProject();p.days.push(D.newDay(p,'2026-11-04'));const day=p.days[0];
 day.layout={...draft(),paper:'Letter',mono:true,includeContacts:true,includeKeyPhones:true};
 day.layout=Layouts.move(day.layout,'custom:first','schedule','before');
 const state=store.create(p),args={name:'  Travel   Pack  ',projectId:p.id,dayId:day.id,version:state.version};
 const preset=store.saveLayoutPreset(args);
 assert.equal(preset.name,'Travel Pack');
 for(const name of ['travel pack','Ｔｒａｖｅｌ Pack'])assert.throws(()=>store.saveLayoutPreset({...args,name}),/already exists/);
 for(const name of ['narrative','Original Narrative','   ','x'.repeat(61)])assert.throws(()=>store.saveLayoutPreset({...args,name}),/template name|built-in/);
 assert.throws(()=>store.saveLayoutPreset({...args,version:state.version+1}),/draft changed/);
 assert.deepEqual(store.get(p.id),state);
 assert(!JSON.stringify(preset).includes('Private day notes'));
 assert(!Object.hasOwn(preset.layout,'includeContacts')&&!Object.hasOwn(preset.layout,'includeKeyPhones'));
 const copy=store.saveLayoutPreset({...args,name:'Different name'});
 assert.notEqual(copy.id,preset.id);
 const expected=store.layoutPresets();store.close();
 store=new Store(dir);assert.deepEqual(store.layoutPresets(),expected);
 const other={...D.defaultLayout(),clock:'12',temperature:'F',custom:[{id:'unrelated',title:'Local heading',text:'Local content'}]};
 const recalled=Layouts.recall({layout:other},preset.layout,preset.id),applied=recalled.layout;
 assert.equal(applied.paper,'Letter');assert.equal(applied.mono,true);
 assert.equal(applied.includeContacts,false);assert.equal(applied.clock,'12');assert.equal(applied.temperature,'F');
 assert.deepEqual(applied.custom.map(c=>c.text),['','']);
 assert.deepEqual(recalled.unplacedCustom,other.custom);
 assert.equal(Layouts.recall(day,preset.layout,preset.id).layout.custom[0].text,'Private day notes');
 D.validateProject({...p,days:[{...day,layout:applied}]});
 const frozen=D.resolve(p,day.id);frozen.revision={id:'synthetic-layout-revision',number:1,issued:'2026-11-04'};
 const pdf=Buffer.from('%PDF-1.7\nSynthetic issued layout\n%%EOF');
 store.issue(p.id,day.id,state.version,frozen,pdf);
 const archive=Archive.exportArchive(store,p.id),manifest=JSON.parse(Buffer.from(require('fflate').unzipSync(archive)['manifest.json']));
 assert.equal(manifest.minReaderVersion,11);
 assert.deepEqual(Archive.readArchive(archive).revisions[0].pdf,pdf);
 assert(!Archive.readArchive(archive).project.layout_presets);
 store.close();
});

test('combined order rejects malformed or ambiguous keys and recall retains written sections outside the selected layout',()=>{
 const l=Layouts.move(draft(),'custom:first','schedule','before');
 for(const change of [{sectionOrder:l.sectionOrder.slice(1)},{sectionOrder:l.sectionOrder.map((k,i)=>i===0?'unrecognized':k)},{order:l.order.slice().reverse()},{custom:[l.custom[0],{...l.custom[1],id:l.custom[0].id}]}])assert.throws(()=>Layouts.validate({...l,...change}),/order|identity/);
 const preset=Layouts.capture(l,()=>{throw Error('existing identities should be reused');});
 const crowded={...D.defaultLayout(),custom:Array.from({length:20},(_,i)=>({id:'existing-'+i,title:String(i),text:'Retain me'}))};
 const recalled=Layouts.recall({layout:crowded},preset,'saved');
 assert.equal(recalled.layout.custom.length,2);
 assert.deepEqual(recalled.unplacedCustom,crowded.custom);
 assert.equal(crowded.custom.length,20);
});


test('recalling a built-in restores canonical independent layout defaults and retains draft-owned preferences',()=>{
 const edit=Layouts.move({...draft(),paper:'Letter',mono:true,clock:'12',temperature:'F',sceneColors:false,includeContacts:true,includeKeyPhones:true,hidden:['cast']},'custom:first','schedule','before');
 const day={layout:{...edit,templateId:'saved-original'},schedule:[{id:'synthetic-row'}],calls:[{id:'synthetic-call'}]};
 const before=structuredClone(day),narrative=Layouts.recall(day,Layouts.defaults('narrative'));
 const gcasper=Layouts.recall(narrative,Layouts.defaults());
 assert.deepEqual(gcasper.layout,{...D.defaultLayout(),clock:'12',temperature:'F',includeContacts:true,includeKeyPhones:true});
 assert.deepEqual(gcasper.unplacedCustom,draft().custom);
 assert.deepEqual(day,before);
 assert.equal(Layouts.matches(gcasper.layout,Layouts.defaults()),true);
 assert.equal(Layouts.matches(before.layout,Layouts.defaults()),false);
 const saved=Layouts.capture(edit,()=>{throw Error('Identity already exists');}),untouched=structuredClone(saved);
 const applied=Layouts.recall(gcasper,saved,'saved-original');
 assert.deepEqual(applied.layout.custom,edit.custom);
 assert.deepEqual(applied.layout.sectionOrder,edit.sectionOrder);
 assert.deepEqual(applied.unplacedCustom,[]);
 applied.layout.custom[0].title='Edit only the draft';applied.layout.hidden.push('notes');applied.layout.sectionOrder.reverse();
 assert.deepEqual(saved,untouched);
});

test('unplaced custom sections survive a portable copy while remaining outside the rendered and frozen data',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'unplaced-layout-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const store=new Store(dir);
 try{
  const p=D.newProject(),d=D.newDay(p,'2026-11-04');p.days.push(d);
  d.layout=draft();Object.assign(d,Layouts.recall(d,Layouts.defaults()));
  const state=store.create(p),resolved=D.resolve(p,d.id);
  assert(!Object.hasOwn(resolved.day,'unplacedCustom'));
  assert(!renderSheet(resolved,'').includes('Private day notes'));
  const digest=Buffer.from('%PDF-1.7\nFrozen issue\n%%EOF');
  resolved.revision={id:'synthetic-unplaced-issue',number:1,issued:'2026-11-04'};
  store.issue(p.id,d.id,state.version,resolved,digest);
  const archive=Archive.exportArchive(store,p.id),manifest=JSON.parse(Buffer.from(require('fflate').unzipSync(archive)['manifest.json']));
  assert.equal(manifest.minReaderVersion,12);
  const copy=Archive.importAsCopy(store,archive);
  assert.deepEqual(copy.project.days.find(day=>day.id===d.id).unplacedCustom,d.unplacedCustom);
  assert.deepEqual(store.revision(copy.project.id,copy.revisions[0].id).pdf,digest);
  assert.throws(()=>D.validateProject({...p,days:[{...d,unplacedCustom:[d.unplacedCustom[0],d.unplacedCustom[0]]}]}),/Invalid unplaced/);
 }finally{store.close();}
});
