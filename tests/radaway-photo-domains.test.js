'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path');
const install=require('../radaway-media-server');
let callback;
const api=install({get(route,fn){if(route==='/api/radaway-model-media')callback=fn;}});
test('Radaway France product gallery can use official Polish-hosted JPG media',()=>{
 const html='<html><head><meta property="og:image" content="https://www.radaway.fr/wp-content/uploads/2021/04/logo-radaway.png"></head>'+
 '<body><div class="product-gallery"><img src="https://www.radaway.pl/wp-content/uploads/2021/04/Radaway-Modo-X-Black-do-sufitu-760x1140.jpg" alt="Modo XL Black"></div>'+
 '<h1>Modo XL Black</h1><h3>VERRE 10 MM</h3></body></html>';
 const p=api.fromHtml(html,'modo-xl-black','https://www.radaway.fr/kategoria/modo-xl-black/');
 assert.equal(p.image,'https://www.radaway.pl/wp-content/uploads/2021/04/Radaway-Modo-X-Black-do-sufitu-760x1140.jpg');
 assert.equal(p.imageVerified,true);
 assert.deepEqual(p.thicknessOptions,[10]);
});
test('Radaway gallery rejects third-party image and color swatches',()=>{
 const html='<html><div class="gallery">'+
 '<img src="https://untrusted.example.org/wp-content/uploads/fake.jpg">'+
 '<img src="https://www.radaway.fr/wp-content/uploads/2023/02/kolor-Czarny.png">'+
 '<img src="https://www.radaway.pl/wp-content/uploads/2020/07/MODO_X_sufit_gora_01_RADAWAY_RI_do-sufitu-BLACK-small.jpg"></div></html>';
 const p=api.fromHtml(html,'modo-xl-black','https://www.radaway.fr/kategoria/modo-xl-black/');
 assert.ok(p.image.includes('RADAWAY_RI_do-sufitu-BLACK-small.jpg'));
});
