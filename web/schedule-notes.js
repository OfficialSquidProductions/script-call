'use strict';
// A daily schedule row may override the scene's reusable production notes.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ScheduleNotes=factory();})(globalThis,()=>{
 const resolve=(row,scene)=>Object.hasOwn(row,'notes')?row.notes:scene?.notes||'';
 const hasData=p=>[...p.days,...(p.deletedDays||[])].some(d=>d.schedule.some(s=>Object.hasOwn(s,'notes')));
 // Frozen revisions without this marker retain their historical timed layout.
 const notesFirst=r=>!r.revision||r.schedulePresentation==='scene-notes';
 return {resolve,hasData,notesFirst};
});
