'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const service=require('../hotbath-live-media-server');
const page=(title,images)=>'<html><head><title>'+title+' | Hotbath</title></head><body><main><h1>'+title+'</h1>'+images.map(src=>'<img src="'+src+'">').join('')+'</main></body></html>';
const exact='https://hotbath.com/images/compano/M515/M515CR_02.png?resolution=400x400&background=FFFFFF7F';
const other='https://hotbath.com/images/compano/CB127/CB127BCP_02.png?resolution=600x600';
test('Hotbath 2026: only priced/imported or official models may trigger Hotbath manufacturer requests',()=>{
 assert(service.permitted('Mate','M515','CR'));
 assert(service.permitted('Mate','M515','BBP'));
 assert(!service.permitted('Mate','M515/../../../other','CR'));
 assert(!service.permitted('Mate','AC003','CR'));
 assert(!service.permitted('Unknown','M515','CR'));
 assert.equal(service.productUrl('Mate','M515','CR'),'https://hotbath.com/fr-be/produit/mate-m515/cr/');
 assert.equal(service.productUrl('Cobber X','CX003C'),'https://hotbath.com/fr-be/produit/cobber-x-cx003c/');
});
test('Hotbath manufacturer image: exact model and finish from product page, never recommendations',()=>{
 const markup=page('MATE M515CR',[other,exact]);
 const resolved=service.extract(markup,{model:'M515',collection:'Mate',finish:'CR',url:service.productUrl('Mate','M515','CR')});
 assert.equal(resolved.image,exact);
 assert.equal(resolved.scope,'exact');
 assert.equal(resolved.finish,'CR');
 assert(!service.trustedImage(other,'M515'));
 assert.equal(service.extract(page('ACE AC517',[other]),{model:'M515',collection:'Mate',finish:'CR',url:''}),null);
 assert.equal(service.extract(page('MATE M515CR',[other]),{model:'M515',collection:'Mate',finish:'CR',url:''}),null);
 assert(!service.trustedImage('https://evil.example/images/compano/M515/M515CR_02.png','M515'));
});
test('Hotbath finish mismatch is an explicitly model-only preview, not exact variant photo',()=>{
 const preview=service.extract(page('MATE M515',[exact]),{model:'M515',finish:'BBP',collection:'Mate',url:'https://hotbath.com/fr-be/produit/mate-m515/'});
 assert.equal(preview.scope,'model');
 assert.equal(preview.image,exact);
 assert.equal(preview.finish,'CR');
});
test('Hotbath source fallback, cache, and no substituted images when site has discontinued model',async()=>{
 const calls=[];
 const fetcher=async url=>{
  calls.push(url);
  if(url.endsWith('/bbp/'))throw Error('HTTP 404');
  return {data:page('MATE M515',[exact])};
 };
 const live=service.makeService({get:fetcher});
 const p=await live.resolve('Mate','M515','BBP');
 assert.equal(p.scope,'model');
 assert.equal(calls.length,2);
 assert.equal((await live.resolve('Mate','M515','BBP')).image,exact);
 assert.equal(calls.length,2,'Cache prevents re-fetching same source');
 await assert.rejects(live.resolve('Mate','M515<script>','CR'),/inconnue/);
});
test('Hotbath frontend loads fallback images without changing pricing, references or unrelated configurators',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../public/hotbath-official-guide.js'),'utf8');
 const server=fs.readFileSync(path.join(__dirname,'../server.js'),'utf8');
 assert.match(source,/\/api\/hotbath-live-media\?collection=/);
 assert.match(source,/running.count<3/);
 assert.match(source,/data-hb-finish-ref/);
 assert.match(source,/chosen=button\.dataset\.hbFinishRef/);
 assert.match(source,/Photo fabricant de la référence et de la finition/);
 assert.match(server,/require\("\.\/hotbath-live-media-server"\)\(app\)/);
});
