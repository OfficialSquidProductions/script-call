'use strict';

const callTypes=['cast','crew'];

function hasCallSection(layout,type){
 return !layout.hidden.includes(type)&&(type==='crew'&&layout.preset==='gcasper'||layout.order.includes(type));
}

function callsOfType(sheet,type){
 return sheet.calls.filter(call=>call.person.type===type);
}

function printedCalls(sheet){
 return callTypes.flatMap(type=>hasCallSection(sheet.day.layout,type)?callsOfType(sheet,type):[]);
}

module.exports={hasCallSection,callsOfType,printedCalls};
