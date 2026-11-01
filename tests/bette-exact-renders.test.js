'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const renders=require('../public/bette-exact-renders');
const good={reference:'8300-000',model:'BetteStarlet I',lengthMm:1650,widthMm:750,color:'Blanc',colorCode:'000',
 image:'/bette-renders/8300-000.png',scope:'verified-3d-screenshot',sourceUrl:'https://www.my-bette.com/fr/configurator?variant=11585&product=11584'};
test('Bette screenshots bind only to supplier SKU, supplier dimensions and manufacturer configuration',()=>{
 const sku={reference:'8300-000',lengthMm:1650,widthMm:750,color:'Blanc'};
 assert(renders.eligible(good,sku));
 for(const bad of [
   {...sku,reference:'8310-000'},
   {...sku,lengthMm:1700},
   {...sku,widthMm:800},
   {...sku,color:'Noir'},
   {...sku,color:'Blush'}
 ])assert(!renders.eligible(good,bad),JSON.stringify(bad));
 for(const bad of [
   {...good,scope:'model-only'}, {...good,colorCode:'999'},
   {...good,image:'https://attacker.example/a.png'},
   {...good,sourceUrl:'https://evil.example/fr/configurator?variant=11585&product=11584'},
   {...good,image:'/bette-renders/8300-001.png'}
 ])assert(!renders.eligible(bad,sku),JSON.stringify(bad));
});
test('An absent exact screenshot stays an illustrative model photo; it never invents a match',async()=>{
 const fixture={ '8300-000':good };
 const ok=await renders.find({reference:'8300-000',lengthMm:1650,widthMm:750,color:'Blanc'},async()=>({ok:true,json:async()=>fixture}));
 assert(ok&&ok.scope==='verified-3d-screenshot');
 const bad=await renders.find({reference:'8300-000',lengthMm:1750,widthMm:750,color:'Blanc'});
 assert.equal(bad,null);
});
test('3D source browser automation and client preview are connected, with no external configuration link',()=>{
 const importer=fs.readFileSync(path.join(__dirname,'../scripts/bette-capture-exact.js'),'utf8');
 const js=fs.readFileSync(path.join(__dirname,'../public/brand-configurators.js'),'utf8');
 assert.match(importer,/imageHasDetail\(shot\)/);
 assert.match(importer,/verifiedRequest\(request\)/);
 assert.match(importer,/request\.reference/);
 assert.match(js,/fetchExactBetteImage\(g,exact\)/);
 assert.match(js,/exactRender\?\.image/);
 assert.doesNotMatch(js,/<a class="bette-3d-link"/);
});