'use strict';
const fs=require('fs');
const path=require('path');
const assert=require('assert/strict');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const pkg=JSON.parse(read('package.json'));

assert.equal(pkg.version,'11.56.0','La version runtime doit être 11.56.0');

const assets=read('assets-server.js');
assert(assets.includes("require('./memory-safe-server')(app)"),'Les garde-fous mémoire doivent être installés avant les routes legacy');
assert(assets.includes('PACK_CACHE_MAX_COMPRESSED_BYTES'),'Le cache des packs assets doit être borné par taille');
assert(assets.includes('while(cache.size>1)'),'Un seul petit pack peut rester en mémoire');

const guard=read('memory-safe-server.js');
assert(guard.includes("app.get('/api/catalog/search'"),'La route de recherche lourde doit être interceptée');
assert(guard.includes("source:'client-catalog-memory-safe'"),'La recherche serveur doit annoncer le mode mémoire sûre');
assert(guard.includes("app.get('/api/health/memory'"),'Le monitoring mémoire doit être disponible');
assert(guard.includes('process.memoryUsage()'),'Le monitoring doit utiliser process.memoryUsage');

const official=read('official-assets-server.js');
assert(!official.includes("responseType:'arraybuffer'"),'Les images officielles ne doivent plus être chargées entièrement en Buffer');
assert(!official.includes('dataUrl:`data:'),'Les images ne doivent plus être encodées en Base64 côté serveur');
assert(official.includes("responseType:'stream'"),'Les images officielles doivent être streamées');
assert(official.includes('MAX_CACHE_ENTRIES=120'),'Le cache resolver doit rester petit et borné');
assert(official.includes("app.get('/api/image-proxy'"),'Le proxy officiel streamé doit être installé');

const tariff=read('tariff-server.js');
assert(tariff.includes('data=null'),'Le tarif TDA doit pouvoir être libéré');
assert(tariff.includes('60*1000'),'Le tarif TDA doit être libéré après inactivité');

const sw=read('public/sw.js');
assert(sw.includes('hydropolis-v11-56-0-shell'),'Le cache shell doit être versionné V11.56.0');
assert(sw.includes('hydropolis-v11-56-0-catalogs'),'Le cache catalogues doit être versionné V11.56.0');

console.log('V11.56 memory static checks: OK');
