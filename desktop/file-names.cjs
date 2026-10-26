'use strict';
// Suggested filenames must also be valid on Windows. Native dialogs still let
// people choose their own name; no existing external file is renamed.
function safeName(value) {
 let name=String(value).replace(/[^a-zA-Z0-9_.-]+/g,'_').slice(0,120).replace(/[. ]+$/g,'');
 if(!name||name==='.'||name==='..')name='CallSheet';
 if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name))name='_'+name;
 return name;
}
module.exports={safeName};
