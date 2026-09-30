'use strict';
const fs=require('fs');
const path=require('path');
const assert=require('assert/strict');
const root=path.join(__dirname,'..');
const readJson=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const catalog=readJson('public/catalog_manifest.json');
assert.equal(catalog.version,'11.55.2');
assert.equal(catalog.engineVersion,'11.55.2');
const alpiChunk=catalog.chunks.find(x=>x.file==='alpi_catalog_2025.json');
assert(alpiChunk,'ALPI doit être chargé par le manifest principal');
assert.equal(alpiChunk.count,3041);
assert.equal(catalog.total,catalog.chunks.reduce((sum,x)=>sum+Number(x.count||0),0),'Le total du manifest doit être la somme des chunks');

const makers=readJson('public/manufacturers_manifest.json');
assert.equal(makers.version,'11.55.2');
const alpi=makers.manufacturers.find(x=>x.name==='Alpi');
assert(alpi,'ALPI absent du manufacturers manifest');
assert.equal(alpi.catalog,'alpi_catalog_2025.json');
assert.equal(alpi.purchaseDiscount,55);
assert(alpi.capabilities.includes('official-only-assets'));

const server=read('official-assets-server.js');
assert(server.includes("app.post('/api/manufacturer-image'"),'Resolver officiel non branché sur manufacturer-image');
assert(server.includes("maker!=='alpi'&&maker!=='gessi'"),'Le resolver doit être limité à ALPI/Gessi');
assert(server.includes("app.get('/api/sira-product-v1154'"),'Resolver Sira exact manquant');
assert(!/sanitairkamer/i.test(server),'Le resolver officiel ne doit jamais utiliser Sanitairkamer');

const assets=read('assets-server.js');
assert(assets.includes("require('./official-assets-server')(app)"),'official-assets-server doit être installé avant les routes legacy');

const sw=read('public/sw.js');
assert(sw.includes('hydropolis-v11-55-2-catalogs'),'Cache catalogue non versionné V11.55.2');
assert(sw.includes('alpi)_catalog'),'Le service worker doit reconnaître le catalogue ALPI');
assert(sw.includes('fetch(req,{cache:"no-store"})'),'Les catalogues doivent être network-first');

console.log('V11.55.2 repair static checks: OK');
