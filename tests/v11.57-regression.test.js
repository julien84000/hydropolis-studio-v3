'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');
const {ManufacturerAssetResolver}=require('../official-assets-server');
const siraModels=require('../public/sira_models.json').models;

const appSource=fs.readFileSync(path.join(__dirname,'..','public','app.js'),'utf8');

test('Sira uses an official generic model image when the live product page is unavailable',async t=>{
  const resolver=new ManufacturerAssetResolver({
    request:async()=>{const error=new Error('simulated upstream failure');error.response={status:502};throw error;},
    assertPublic:async()=>{}
  });
  t.after(()=>resolver.close());

  const model=siraModels.find(x=>x?.code&&x?.productUrl&&x?.image);
  assert.ok(model,'a Sira model with an official fallback image is required');

  const result=await resolver.sira({modelCode:model.code,color:'OB'});
  assert.equal(result.finishMatch,'generic');
  assert.equal(result.finishCode,'OB');
  assert.match(result.image,/^https:\/\/(?:www\.)?siraconcrete\.com\//i);
  assert.match(result.note,/pigment non garanti/i);
  assert.equal(result.images[0],result.image);
});

test('article dossier visibility is independent from quote inclusion',()=>{
  assert.match(appSource,/!p\.hideFromDossier/,'client dossier selection must honor hideFromDossier');
  assert.match(appSource,/class="dossier-visibility-check"/,'each project article needs a dossier visibility control');
  assert.match(appSource,/p\.hideFromDossier=!ch\.checked/,'the dossier visibility control must persist the item flag');

  const quoteStart=appSource.indexOf('function quoteRows(');
  assert.ok(quoteStart>=0,'quoteRows() must exist');
  const quoteEnd=appSource.indexOf('\nfunction ',quoteStart+20);
  const quoteSource=appSource.slice(quoteStart,quoteEnd>quoteStart?quoteEnd:quoteStart+12000);
  assert.match(quoteSource,/state\.selected\.filter\(isRealSelectedProduct\)/,'quoteRows() must include all real selected products');
  assert.doesNotMatch(quoteSource,/hideFromDossier/,'quoteRows() must never filter on dossier visibility');
});

test('PDF export waits for decodable visible images and aborts on unresolved failures',()=>{
  assert.match(appSource,/img\.naturalWidth>0/,'image readiness must require decoded image dimensions');
  assert.match(appSource,/const preload=await waitForDocumentImages\(6000\)/,'PDF export must inspect image preload status');
  assert.match(appSource,/preload\.failed\.length/,'PDF export must reject unresolved visible images');
  assert.match(appSource,/printStarted/,'PDF cleanup must distinguish pre-print failures from a started print flow');
});
