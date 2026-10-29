'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');

const root=path.join(__dirname,'..');
const manifest=require('../public/catalog_manifest.json');
const makers=require('../public/manufacturers_manifest.json');
const idx=require('../public/sbordoni/sbordoni-image-index.json');

test('Sbordoni : 5216 références, 6 chunks et remise 55%',()=>{
  const chunks=manifest.chunks.filter(x=>/^Sbordoni 2023 /.test(x.label||''));
  assert.equal(chunks.length,6);
  assert.equal(chunks.reduce((n,x)=>n+Number(x.count||0),0),5216);
  const rows=chunks.flatMap(c=>JSON.parse(fs.readFileSync(path.join(root,'public',c.file),'utf8')));
  assert.equal(rows.length,5216);
  assert(rows.every(x=>x.manufacturer==='Sbordoni'&&x.reference&&Number.isFinite(Number(x.price))));
  assert(rows.filter(x=>x.image).length>=4500);
  const maker=makers.manufacturers.find(x=>x.name==='Sbordoni');
  assert.ok(maker);
  assert.equal(maker.catalogChunks,6);
  assert.equal(maker.purchaseDiscount,55);
});

test('Sbordoni : les 8 planches PDF sont décodables et les crops fonctionnent',async()=>{
  assert.equal(idx.version,1);
  assert.equal(idx.tile,128);
  assert.equal(Object.keys(idx.sheets).length,8);
  assert(Object.keys(idx.items).length>=4500);
  for(let n=1;n<=8;n++){
    const b64=fs.readFileSync(path.join(root,'public','sbordoni',`sbordoni-sheet-${n}.b64`),'utf8').trim();
    const img=await loadImage(Buffer.from(b64,'base64'));
    assert(img.width>0&&img.height>0,`sheet ${n}`);
  }
  for(const ref of ['MI1475COCR','9200/3','9065/1','DP1PCR','PI151CR']){
    const item=idx.items[ref];
    assert.ok(item,`mapping absent: ${ref}`);
    const [sheet,x,y,w,h]=item;
    const b64=fs.readFileSync(path.join(root,'public','sbordoni',`sbordoni-sheet-${sheet}.b64`),'utf8').trim();
    const img=await loadImage(Buffer.from(b64,'base64'));
    const canvas=createCanvas(w,h);
    canvas.getContext('2d').drawImage(img,x,y,w,h,0,0,w,h);
    const out=canvas.toBuffer('image/jpeg');
    assert(out.length>500,`crop invalide: ${ref}`);
  }
});
