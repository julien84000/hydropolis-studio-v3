'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const photos=require('../public/galassia-dossier-photos.js');

const thumbnail='https://www.ceramicagalassia.it/public/_resized/7353_650X550_90_C.jpg';
const original='https://www.ceramicagalassia.it/public/7353.jpg';
const product={manufacturer:'Galassia',base:'7353',reference:'7353MT',image:thumbnail};

test('Full-size manufacturer original comes before 650 x 550 thumbnail',()=>{
 assert.deepEqual(photos.candidates(thumbnail),[original,thumbnail]);
 assert.deepEqual(photos.candidates('https://www.ceramicagalassia.com/public/colori/2051/_resized/2051_650X550_90_C.jpg'),[
  'https://www.ceramicagalassia.com/public/colori/2051/2051.jpg',
  'https://www.ceramicagalassia.com/public/colori/2051/_resized/2051_650X550_90_C.jpg'
 ]);
});
test('Official Galassia HD image is safely proxied for PDF and client dossier',async()=>{
 const calls=[];
 const photo=await photos.resolve(product,{officialImage:thumbnail,probe:async src=>{
  calls.push(src);return {width:1000,height:1000};
 }});
 assert.equal(calls.length,1);
 assert.equal(calls[0],'/api/image-proxy?url='+encodeURIComponent(original));
 assert.equal(photo.quality,'original-hd');
 const fields=photos.fields(photo);
 assert.equal(fields.image,photo.src);assert.deepEqual(fields.images,[photo.src]);
 assert.equal(fields.pdfImage,photo.src);assert.deepEqual(fields.pdfImages,[photo.src]);
 assert.equal(fields.galassiaPhotoWidth,1000);
 assert.match(fields.imageNote,/finition photographiée peut différer/);
});
test('Missing original uses verified thumbnail without pretending to be HD',async()=>{
 const photo=await photos.resolve(product,{officialImage:thumbnail,probe:async src=>
  src.includes(encodeURIComponent('/public/7353.jpg'))?null:{width:650,height:550}
 });
 assert.equal(photo.url,thumbnail);assert.equal(photo.quality,'limited');
 const fields=photos.fields(photo);
 assert.match(fields.imageStatus,/résolution limitée/);
 assert.match(fields.imageNote,/Résolution insuffisante/);
});
test('Do not substitute a lookalike, unsafe host or custom project image',async()=>{
 const unsafe='https://evil.example.net/public/_resized/7353_650X550_90_C.jpg';
 assert.deepEqual(photos.candidates(unsafe),[]);
 assert.deepEqual(photos.candidates('http://www.ceramicagalassia.it/public/7353.jpg'),[]);
 assert.deepEqual(photos.candidates('https://www.ceramicagalassia.it.evil.net/public/7353.jpg'),[]);
 assert.equal(await photos.resolve({...product,customImage:true},{officialImage:thumbnail,probe:async()=>({width:1000,height:1000})}),null);
 assert.equal(await photos.resolve({...product,manufacturer:'Other'},{officialImage:thumbnail,probe:async()=>({width:1000,height:1000})}),null);
});
test('Broken original and thumbnail never produce a fictitious image',async()=>{
 const photo=await photos.resolve(product,{officialImage:thumbnail,probe:async()=>null});
 assert.equal(photo,null);
});
