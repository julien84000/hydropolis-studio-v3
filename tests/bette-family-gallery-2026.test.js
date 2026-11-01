'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const gallery=require('../public/bette-family-gallery.js');
const dir=path.join(__dirname,'../public');
const ui=fs.readFileSync(path.join(dir,'brand-configurators.js'),'utf8');
const css=fs.readFileSync(path.join(dir,'bette-showcase.css'),'utf8');
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(dir,'sw.js'),'utf8');

test('Bette family images have verified manufacturer names and HTTPS product URLs',()=>{
 assert(gallery.records.length>=65,'Expected Bette gallery photos from official category listings');
 const seen=new Set();
 for(const item of gallery.records){
  assert(['showers','baths','basins'].includes(item.category),item.name);
  assert(/^https:\/\/content\.my-bette\.com\/produkt_bilder\/.+\.(webp|png|jpe?g)$/i.test(item.image),item.name);
  assert(/^https:\/\/www\.my-bette\.com\/fr\/produit\//.test(item.page),item.name);
  assert(item.name&&item.name.length>4);
  const id=item.category+'|'+item.page;assert(!seen.has(id),'Duplicate '+id);seen.add(id);
 }
});
test('Every identified shower family in screenshot gets its matching distinct manufacturer model image',()=>{
 const names=['BetteAir','BetteCaro 35 mm, côtés égaux','BetteCorner 35 mm, côtés asymétriques',
   'BetteCorner 35 mm, côtés égaux','BetteDelta','BetteFlat','BetteFloor','BetteFloor Caro',
   'BetteFloor Corner','BetteFloor Side'];
 const urls=new Set();
 for(const name of names){
  const item=gallery.resolve(name,'showers');
  assert(item,'Missing official shower family thumbnail '+name);
  assert(item.category==='showers');
  urls.add(item.image);
 }
 assert.equal(urls.size,names.length,'Each family photo must be distinct');
 assert(gallery.resolve('BetteFloor Side avec système d’étanchéité','showers')?.name==='BetteFloor Side');
 assert(!gallery.resolve('BetteFloor Side','baths'),'Do not use bath photos for showers');
});
test('Family gallery does not misrepresent unrelated model colours or variants',()=>{
 assert(!gallery.resolve('BetteNonexistent','showers'));
 assert(!gallery.resolve('BetteFloor Side','basins'));
 assert(!gallery.resolve('BetteOne','showers'));
 assert(gallery.resolve('BetteArt','baths')?.category==='baths');
 assert(gallery.resolve('BetteArt Vasque à poser','basins')?.category==='basins');
});
test('Bette listing, facet and unclassified routes always render an image, even when importer has no image field',()=>{
 assert.match(ui,/const betteGroupCard=g=>/);
 assert.match(ui,/src=imported\|\|trustedImage\(familyPhoto\?\.image\)\|\|fallback/);
 assert.match(ui,/data-bette-group-image/);
 assert.match(ui,/data-bette-fallback/);
 assert.match(ui,/wireBetteFamilyImages\(overlay\)/);
 assert.match(ui,/unknown\.map\(betteGroupCard\)/);
 assert.match(ui,/officialBettePreview\(g,exact\)/);
 assert.match(ui,/familyPhoto\?\.image\|\|media\.representativeImage/);
 assert.match(css,/\.bette-family-card \.bette-group-photo/);
 assert.match(html,/bette-family-gallery\.js\?v=__APP_VERSION__/);
 assert.match(sw,/bette-family-gallery\.js/);
});
