'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const docs=require('../public/sbordoni-documents');
test('98 supplied Sbordoni PDFs match their source hashes and index',()=>{
 assert.equal(docs.documents.length,98);assert.deepEqual(docs.documents,require('../public/sbordoni/technical-index.json'));
 for(const d of docs.documents){const b=fs.readFileSync(path.join(__dirname,'../public',d.url));assert.equal(b.subarray(0,4).toString(),'%PDF');assert.equal(crypto.createHash('sha256').update(b).digest('hex'),d.sha256);}
});
test('exact support matching excludes other WC families sharing a cistern',()=>{
 const results=docs.forProduct({manufacturer:'Sbordoni',sbordoniConfiguration:{family:'7100',supportRef:'P7100CR'}});assert.equal(results[0].sourceName,'7100-P070.pdf');
 const wc=docs.forProduct({manufacturer:'Sbordoni',sbordoniWCConfiguration:{bowlRef:'7020',references:['7020','5129']}});assert(wc.length);assert(wc.every(d=>!d.references.includes('5107')&&!d.references.includes('9020')&&!d.references.includes('5520')));
 assert.equal(docs.forProduct({manufacturer:'Other',reference:'7200'}).length,0);
 assert(!docs.forProduct({manufacturer:'Sbordoni',sbordoniConfiguration:{family:'7200',supportRef:'P7200CR'}}).some(d=>d.references.includes('P720')));
});
test('saved project migration is idempotent and preserves custom documents and prices',()=>{
 const p={manufacturer:'Sbordoni',reference:'7200/3',quantity:2,priceOverride:999};docs.migrate(p);assert.equal(p.technicalSheetUrl,'/sbordoni/technical/7200.pdf');assert.equal(p.quantity,2);assert.equal(p.priceOverride,999);const before=JSON.stringify(p);docs.migrate(p);assert.equal(JSON.stringify(p),before);
 const custom={...p,customTechnicalSheet:true,technicalSheetUrl:'custom.pdf'};docs.migrate(custom);assert.equal(custom.technicalSheetUrl,'custom.pdf');
 const external={manufacturer:'Sbordoni',reference:'7200/3',technicalSheetUrl:'https://example.test/user.pdf'};docs.migrate(external);assert.equal(external.technicalSheetUrl,'https://example.test/user.pdf');assert(external.technicalDocuments.length);
});
