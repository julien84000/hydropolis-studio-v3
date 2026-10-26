'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');

const root=path.join(__dirname,'..');
const appSource=fs.readFileSync(path.join(root,'public','app.js'),'utf8');
const serverSource=fs.readFileSync(path.join(root,'server.js'),'utf8');
const mediaSource=fs.readFileSync(path.join(root,'public','official-media.js'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'public','catalog_manifest.json'),'utf8'));
const makers=JSON.parse(fs.readFileSync(path.join(root,'public','manufacturers_manifest.json'),'utf8'));

test('Dornbracht 2026 commercial catalogue is complete and chunked',()=>{
  const chunks=manifest.chunks.filter(x=>/^Dornbracht 2026/.test(x.label||''));
  assert.equal(chunks.length,9);
  assert.equal(chunks.reduce((n,x)=>n+Number(x.count||0),0),8996);
  let rows=[];
  for(const chunk of chunks){
    const part=JSON.parse(fs.readFileSync(path.join(root,'public',chunk.file),'utf8'));
    rows=rows.concat(part);
  }
  assert.equal(rows.length,8996);
  assert.ok(rows.every(x=>x.manufacturer==='Dornbracht'&&x.reference&&Number.isFinite(Number(x.price))));
  assert.ok(rows.every(x=>/^https:\/\/www\.dornbracht\.com\/fr-fr\/produits\//.test(x.manufacturerUrl||'')));
});

test('Dornbracht photos are resolved only from the official Dornbracht domain',()=>{
  assert.match(serverSource,/resolveDornbrachtProductUrl/);
  assert.match(serverSource,/dornbracht-official-product-image/);
  assert.match(serverSource,/"dornbracht\.com"/);
  assert.match(mediaSource,/dornbracht:\['dornbracht\.com'\]/);
  assert.match(appSource,/Gessi\|Dornbracht/);
  assert.match(appSource,/Gessi\|Dornbracht\)\$\/i/);
});

test('Dornbracht is exposed as a first-class manufacturer',()=>{
  const d=makers.manufacturers.find(x=>x.name==='Dornbracht');
  assert.ok(d);
  assert.equal(d.catalogChunks,9);
  assert.ok(d.capabilities.includes('official-site-image'));
  assert.ok(d.capabilities.includes('fabdis-2026-pricing'));
});
