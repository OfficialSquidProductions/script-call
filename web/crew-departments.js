'use strict';
// Suggestions only: existing and custom department strings are never normalized.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./department-groups.js'));else root.CrewDepartments=factory(root.DepartmentGroups);})(globalThis,groups=>Object.freeze([...new Set([
 'DIRECTOR','PRODUCERS','CASTING','PRODUCTION','LOCATIONS','ART','CAMERA','ELECTRIC','GRIP','LOCATION SOUND','COSTUME DESIGN','HAIR & MAKEUP','STUNTS','DRIVERS','CATERING','EDITORIAL / POST','VFX'
,...groups.columns.flat().map(s=>s.toUpperCase())])]));
