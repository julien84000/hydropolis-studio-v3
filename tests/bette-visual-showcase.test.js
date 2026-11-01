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
test('Bette stays within Hydropolis and imports a manufacturer image without redirecting the client',()=>{
 assert.match(js,/fetchExactBetteImage\(g,exact\)/);
 assert.match(js,/officialBettePreview\(g,exact\)/);
 assert.match(js,/exactRender\?\.image/);
 assert.match(js,/exactRender\?\.scope/);
 assert.doesNotMatch(js,/<a class="bette-3d-link"/);
 assert.match(js,/Visuel constructeur importé automatiquement/);
});
test('Illustrative category images do not masquerade as exact configured SKU photographs',()=>{
 assert.match(js,/representativeScope:categoryRepresentative\?'category'/);
 assert.match(js,/Illustration Bette de catégorie · non contractuelle/);
 assert.match(js,/Illustration de catégorie Bette · non contractuelle/);
 assert.match(js,/exactRender\?\.image\?'Capture vérifiée du configurateur 3D Bette/);
 assert.match(js,/verifiedPublicPrice\('Bette',selected\)/);
 assert.match(js,/commitConfigured\(configured,roomId,'betteConfiguration'/);
});
test('Model and colour visual choices keep actual select controls and tariff reference',()=>{
 assert.match(js,/choiceTiles\('bcModel',models,draft\.model\)/);
 assert.match(js,/choiceTiles\('bcColor',colors,draft\.color\)/);
 assert.match(js,/wireChoices\(overlay\)/);
 assert.match(js,/const refs=rows\.map\(v=>v\.reference\)/);
});
