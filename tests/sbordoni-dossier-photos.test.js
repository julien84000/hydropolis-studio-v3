'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const api=require('../public/sbordoni-dossier-photos');
const {photos}=require('../public/sbordoni/dossier/manifest.json');
test('23 native source photos: exact bytes, source reference and genuine dimensions',()=>{
 assert.equal(photos.length,23);assert.equal(new Set(photos.map(p=>p.key)).size,23);
 for(const photo of photos){
  assert(photo.width>=750&&photo.height>=1000);assert(photo.caption&&photo.captionPage&&photo.xref);
  const bytes=fs.readFileSync('public'+photo.url);assert.equal(bytes.length,photo.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),photo.sha256);
  if(photo.method==='embedded-jpeg-original-bytes')assert.equal(photo.sha256,photo.sourceImageSha256);
  assert.match(photo.source,/^https:\/\/www\.sbordoniceramica\.com\/download\//);
 }
});
test('Photos are restricted to exact compositions, never a similar support or another brand',()=>{
 const p={manufacturer:'Sbordoni',image:'/sbordoni/compositions/5700-G571.jpg'};
 assert.deepEqual(api.photosFor(p,photos).map(p=>p.key),['5700-G571']);
 assert.equal(api.photosFor({...p,image:'/sbordoni/compositions/5700-alone.jpg'},photos).length,0);
 assert.equal(api.photosFor({...p,manufacturer:'Other'},photos).length,0);
 assert.equal(api.photosFor({...p,image:'/sbordoni/compositions/5700-N5700.jpg'},photos)[0].key,'5700-N5700');
 assert.equal(api.photosFor({...p,image:'custom.jpg',sbordoniConfiguration:{resultImage:'/sbordoni/compositions/5700-G571.jpg'}},photos)[0].key,'5700-G571');
});
