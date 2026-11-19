'use strict';
const fs=require('node:fs'),path=require('node:path');
const sourceFile=path.join(__dirname,'../fixtures/shoot-locations.productiondesk');
const ids={
 stage:'Harbor Studio Stage',yard:'Harbor Studio Yard',
 unscheduled:'Early location choice',dayOnly:'Scouted warehouse',unused:'Old audition room'
};

function sceneLocationExport({withoutSceneLinks=false}={}){
 // Start with the real Production Desk exporter fixture, then add a valid
 // day banner and an optional board extension. Neither is a scene link.
 const envelope=JSON.parse(fs.readFileSync(sourceFile,'utf8'));
 const source=envelope.workspace.projects[0];
 const category=source.categories.find(c=>c.ucid===6).id;
 const locations=source.elements.filter(e=>e.category===category);
 const idFor=name=>locations.find(e=>e.name===name).id;
 const locationIds=Object.fromEntries(Object.entries(ids).map(([key,name])=>[key,idFor(name)]));
 const board=source.stripboards[0].boards[0];
 const banner={
  id:'location-only-day-banner',type:'banner',bannerText:'Fictional logistics note',
  comments:null,created:source.created,description:null,elements:[locationIds.dayOnly],
  pages:null,scene:null,scriptPage:null,duration:null
 };
 source.breakdowns.push(banner);
 board.breakdownIds[2].push(banner.id);
 board._dayLocations={2:locationIds.dayOnly};
 const unscheduled=source.breakdowns.find(scene=>scene.scene==='12');
 unscheduled.elements=unscheduled.elements.filter(id=>id!==locationIds.yard);
 unscheduled.elements.push(locationIds.unscheduled);
 if(withoutSceneLinks){
  const reserved=new Set(locations.filter(el=>el.name.trim()).map(el=>el.id));
  for(const scene of source.breakdowns.filter(b=>b.type==='scene')){
   scene.elements=scene.elements.filter(id=>!reserved.has(id));
  }
 }
 return {envelope,locationIds};
}
module.exports={sceneLocationExport};
