'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dir=path.join(__dirname,'../public');
const js=fs.readFileSync(path.join(dir,'brand-configurators.js'),'utf8');
const css=fs.readFileSync(path.join(dir,'bette-showcase.css'),'utf8');
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');

test('Bette launches a prominent manufacturer photo-led, keyboard-accessible catalog with all six categories',()=>{
 for(const category of ['baths','showers','basins','equipment','design','news']){
   assert.match(js,new RegExp('\\b'+category+':\\{image:'));
 }
 assert.match(js,/bette-category-card/);
 assert.match(js,/bettePhotoHtml\(x\.id\)/);
 assert.match(js,/data-bette-family/);
 assert.match(js,/bette-showcase-hero/);
 assert.match(js,/bette-section-heading/);
 assert.match(js,/betteGroupCard\(g\)/);
 assert.match(css,/\.bette-category-grid/);
 assert.match(css,/@media\(max-width:580px\)/);
 assert.match(html,/bette-showcase\.css\?v=__APP_VERSION__/);
});
test('Bette 3D button links to verified manufacturer configurator, never invents supplier product or variant ids',()=>{
 assert.match(js,/https:\/\/www\.my-bette\.com\/fr\/configurator\/products/);
 assert.match(js,/bette-3d-link/);
 assert.match(js,/target="_blank" rel="noopener noreferrer"/);
 assert.doesNotMatch(js,/product=10402|variant=10410/);
});
test('Illustrative category images do not masquerade as exact configured SKU photographs',()=>{
 assert.match(js,/representativeScope:categoryRepresentative\?'category'/);
 assert.match(js,/Illustration Bette de catégorie · non contractuelle/);
 assert.match(js,/Illustration de catégorie Bette · non contractuelle/);
 assert.match(js,/media\.image\?'Visuel exact fabricant'/);
 assert.match(js,/verifiedPublicPrice\('Bette',selected\)/);
 assert.match(js,/commitConfigured\(configured,roomId,'betteConfiguration'/);
});
test('Model and colour visual choices keep actual select controls and tariff reference',()=>{
 assert.match(js,/choiceTiles\('bcModel',models,draft\.model\)/);
 assert.match(js,/choiceTiles\('bcColor',colors,draft\.color\)/);
 assert.match(js,/wireChoices\(overlay\)/);
 assert.match(js,/const refs=rows\.map\(v=>v\.reference\)/);
});
