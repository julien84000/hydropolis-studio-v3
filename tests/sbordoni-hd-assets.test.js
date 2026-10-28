'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..','public','sbordoni','compositions');
const provenance=JSON.parse(fs.readFileSync(path.join(root,'provenance.json'),'utf8'));
const hd=JSON.parse(fs.readFileSync(path.join(root,'hd-manifest.json'),'utf8'));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');

test('Sbordoni HD: 99 source-grounded compositions, genuine JPEGs and matching checksums',()=>{
  const keys=Object.keys(provenance.images).sort();
  assert.equal(keys.length,99);
  assert.equal(hd.count,99);
  assert.equal(hd.catalogueSha256,provenance.sha256);
  assert.deepEqual(Object.keys(hd.images).sort(),keys);
  for(const key of keys){
    const file=path.join(root,key+'.jpg');
    const data=fs.readFileSync(file),row=hd.images[key],source=provenance.images[key];
    assert.equal(data[0],0xff,key+' JPEG SOI');
    assert.equal(data[1],0xd8,key+' JPEG SOI');
    assert.equal(data.at(-2),0xff,key+' JPEG EOI');
    assert.equal(data.at(-1),0xd9,key+' JPEG EOI');
    assert.equal(sha(data),row.sha256,key+' checksum');
    assert.equal(data.length,row.bytes,key+' byte length');
    assert.equal(row.sourcePage,source.page,key+' provenance page');
    assert.equal(row.sourceImageXref??null,source.xref??null,key+' source image xref');
    assert(row.pixelSize[0]>=110&&row.pixelSize[1]>=70,key+' pixels');
    assert(row.bytes>=2500,key+' real image data');
  }
});
test('Sbordoni HD: PDF orientation and caption cleanup for 5700 with G571',()=>{
  const row=hd.images['5700-G571'];
  assert(row.pixelSize[0]>400&&row.pixelSize[1]>390,'image must be larger than original low-resolution image');
  assert.match(row.transform,/display-matrix=/);
  assert(row.removedCaptionMasks.some(mask=>/5700\+G571/i.test(mask.text)),'vector caption must be removed');
  assert(hd.images['5033-default'].transform.includes('display-matrix=[-'),'mirrored source image must be rendered with PDF placement');
});
test('Sbordoni HD: image paths referenced by configurator still exist',()=>{
 const model=fs.readFileSync(path.join(__dirname,'..','public','sbordoni-model.js'),'utf8');
 assert.match(model,/\/sbordoni\/compositions\//);
 for(const [key,spec] of Object.entries(provenance.images)){
  assert.equal(spec.file,'/sbordoni/compositions/'+key+'.jpg',key+' canonical path');
 }
});
