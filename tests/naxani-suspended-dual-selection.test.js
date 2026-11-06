'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ui=fs.readFileSync(path.join(__dirname,'../public/naxani-modular-configurator.js'),'utf8');

test('Naxani: syntax and dual-basin selection exposed for integrated and suspended types',()=>{
 assert.doesNotThrow(()=>new Function(ui));
 assert.match(ui,/const basinSelectable=p=>\['plan-integre','suspendu'\]/);
 assert.match(ui,/if\(basinSelectable\(p\)\)\{/);
 assert.match(ui,/data-input="standaloneSinkCount"/);
 assert.match(ui,/beginMain\(next,basinSelectable\(p\)\)/);
});

test('Naxani: preserve tariff SKUs and width choices, without inventing a suspended monobloc',()=>{
 assert.match(ui,/const widths=\[\.\.\.new Set\(alternatives\.map\(width\)/);
 assert.match(ui,/const exact=collectionRows\(\)\.filter/);
 assert.match(ui,/suspendedPair=p=>p\?\.productType==='suspendu'&&basinCount===2/);
 assert.match(ui,/const units=isPair\?\[p,p\]:\[p\]/);
 assert.match(ui,/Pas un plan monobloc double vasque/);
 assert.match(ui,/const drains=drainRef&&byRef\.has\(drainRef\)/);
});
