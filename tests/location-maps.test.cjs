'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const M=require('../web/location-maps.js'),D=require('../core/domain.cjs'),P=require('../core/productiondesk.cjs'),A=require('../core/archive.cjs'),{Store}=require('../core/store.cjs');
test('explicit search and direction text is decoded locally, without claiming a verified address',()=>{
 assert.equal(M.inspect('https://www.google.com/maps/search/?api=1&query=123+Fictional+St%2C+Test+Town').text,'123 Fictional St, Test Town');
 assert.equal(M.inspect('https://maps.google.co.uk/?q=Caf%C3%A9+%26+Studio').text,'Café & Studio');
 assert.equal(M.inspect('https://www.google.com/maps/dir/?api=1&origin=Wrong+Street&destination=Base+Camp').text,'Base Camp');
 assert.equal(M.inspect('https://maps.google.com/?daddr=Unit+B').text,'Unit B');
});
test('short/opaque/place-path/coordinate links do not invent street addresses or infer a map camera position',()=>{
 for(const u of ['https://maps.app.goo.gl/Fictional123','https://goo.gl/maps/Fictional123']){assert.equal(M.inspect(u).status,'short');assert.equal(M.inspect(u).text,'');}
 for(const u of ['https://www.google.com/maps/place/Some+Studio/@51,-1,12z/data=123','https://maps.google.com/?q=51.123,-1.23','https://www.google.com/maps/search/?api=1&query=place_id:abc','https://www.google.com/maps/dir/?destination=51,-1&q=Wrong+Street','https://maps.google.com/?q=One&q=Two'])assert.equal(M.inspect(u).text,'');
});
test('unsafe links, spoofed hosts, credentials, custom protocols and control text cannot become external destinations',()=>{
 for(const u of ['javascript:alert(1)','file:///tmp/test','http://maps.google.com/?q=Street','https://google.com.evil.invalid/maps','https://evil.invalid/maps','https://user:password@www.google.com/maps','https://www.google.com/url?q=https://evil.invalid','https://maps.google.com:123/maps']){assert.equal(M.inspect(u).status,'invalid');assert.throws(()=>M.openURL(u,'Manual address'),/valid HTTPS/);}
 assert.equal(M.inspect('https://maps.google.com/?q=Bad%00text').text,'');assert.equal(M.inspect('unfinished').status,'invalid');assert.equal(M.inspect('').status,'empty');
});
test('independent manual address searches and stored short links use HTTPS Google Maps; missing values fail clearly',()=>{
 assert.equal(new URL(M.openURL('','Parking & base camp')).searchParams.get('query'),'Parking & base camp');
 assert.equal(M.openURL('https://maps.app.goo.gl/Fictional123','Override stays manual'),'https://maps.app.goo.gl/Fictional123');assert.throws(()=>M.openURL('',' '),/Enter/);
 const loc={address:'Manually reviewed shoot',parking:'Different base camp',mapsUrl:'https://maps.google.com/?q=Other+label',parkingMapsUrl:'https://maps.google.com/?q=Different+label'};const before=D.clone(loc);M.inspect(loc.mapsUrl);M.openURL(loc.parkingMapsUrl,loc.parking);assert.deepEqual(loc,before);
});
test('legacy locations load unchanged, optional map/parking coordinates validate, and Production Desk reimport preserves manual fields',()=>{
 const p=P.map(P.read(fs.readFileSync(path.join(__dirname,'fixtures/last-light.productiondesk')))).project,old=D.clone(p),incoming=D.clone(p);D.validateProject(p);assert.deepEqual(p,old);
 Object.assign(p.locations[0],{mapsUrl:'https://maps.google.com/?q=Shoot',parkingMapsUrl:'https://maps.app.goo.gl/BaseCamp',address:'Manual shoot',parking:'Manual base camp',latitude:0,longitude:0,parkingLatitude:10,parkingLongitude:-20});const loc=D.clone(p.locations[0]);D.validateProject(p);assert.deepEqual(P.merge(p,incoming).project.locations[0],loc);
 for(const patch of [{parkingLatitude:91},{parkingLongitude:'bad'},{mapsUrl:7}]){const bad=D.clone(p);Object.assign(bad.locations[0],patch);assert.throws(()=>D.validateProject(bad),/location|parking/);}
});
test('save/reopen and portable round trip preserve optional fields, stable location IDs, original coordinates and issued PDF bytes',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'location-maps-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));let store=new Store(dir);const p=D.clone(require('./fixtures/last-light.json'));let s=store.create(p);const snap=D.resolve(p,p.days[0].id);snap.revision={id:D.id(),number:1,issued:new Date().toISOString()};const pdf=Buffer.from('%PDF-1.7\nSynthetic location original\n%%EOF');s=store.issue(p.id,p.days[0].id,s.version,snap,pdf);const original=D.clone(s.project.locations);
 Object.assign(s.project.locations[0],{mapsUrl:'https://maps.google.com/?q=Shoot',parkingMapsUrl:'https://maps.google.com/?q=Parking',parkingLatitude:0,parkingLongitude:0});s=store.save(s.project,s.version);const expected=D.clone(s.project.locations),copy=A.importAsCopy(store,A.exportArchive(store,p.id));assert.deepEqual(copy.project.locations,expected);assert.deepEqual(store.revision(copy.project.id,copy.revisions[0].id).pdf,pdf);assert.equal(s.project.locations[0].latitude,original[0].latitude);assert.equal(s.project.locations[0].longitude,original[0].longitude);store.close();store=new Store(dir);assert.deepEqual(store.get(p.id).project.locations,expected);assert.deepEqual(store.revision(p.id,s.revisions[0].id).pdf,pdf);store.close();
});
