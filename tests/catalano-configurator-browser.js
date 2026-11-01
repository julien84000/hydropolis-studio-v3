'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../public');
const rows=JSON.parse(fs.readFileSync(path.join(root,'catalog_catalano.json'),'utf8'));
const officialSfera=require('../catalano-product-media-server').seedsFor('Sfera');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1420,height:900},locale:'fr-FR'});
  const errors=[];page.on('pageerror',e=>errors.push(String(e.message)));
  await page.route('https://www.catalano.it/**',r=>r.abort());
  await page.setContent('<!doctype html><html lang="fr"><head><meta charset="utf-8"></head><body></body></html>');
  for(const file of ['galassia-configurator.css','catalano-configurator.css'])
   await page.addStyleTag({path:path.join(root,file)});
  for(const file of ['catalano-gallery.js','catalano-accessories.js','catalano-product-media.js','catalano-configurator.js'])
   await page.addScriptTag({path:path.join(root,file)});
  await page.evaluate(sfera=>window.HydroCatalanoProductMedia.setFixture('Sfera',sfera),{...officialSfera,ok:true});
  await page.evaluate(all=>{
   window.__rows=all;window.__saved=[];
   const callback=async(product,room,accessories)=>{window.__saved.push({reference:product.reference,room,extras:accessories.map(p=>p.reference)})};
   window.__openCatalano=initial=>{void window.HydroCatalanoConfigurator.open(initial,'room-master',window.__rows,callback,()=>'',()=>null)};
   window.__openCatalano(null);
  },rows);
  await page.waitForSelector('.catalano-modal .catalano-collections [data-catalano-collection="Zero"]');
  assert.equal(await page.locator('.catalano-modal .catalano-collections [data-catalano-collection]').count(),14);
  await page.locator('.catalano-modal [data-catalano-category="WC"]').click();
  await page.locator('.catalano-modal [data-catalano-model="011175|WC"]').click();
  await page.locator('.catalano-modal .catalano-variant').selectOption('0111750021');
  assert.equal(await page.locator('.catalano-modal .catalano-accessory-select[data-accessory="seat"]').inputValue(),'0551250021');
  assert.equal(await page.locator('.catalano-modal .catalano-accessory-select[data-accessory="mount"]').inputValue(),'9056160000');
  const note=await page.locator('.catalano-modal .galassia-selection').innerText();
  assert(note.includes('11')&&note.includes('0551250021')&&note.includes('9056160000'),note.slice(0,900));
  await page.locator('.catalano-modal .catalano-add').click();
  let state=await page.evaluate(()=>window.__saved);
  assert.deepEqual(state[0],{reference:'0111750021',room:'room-master',extras:['0551250021','9056160000']});
  assert.equal(await page.locator('.catalano-modal').count(),0);
  // Floor-mounted WC: a fixing installation style cannot be guessed.
  await page.evaluate(()=>window.__openCatalano(null));
  await page.locator('.catalano-modal [data-catalano-collection="Elice"]').click();
  await page.locator('.catalano-modal [data-catalano-category="WC"]').click();
  await page.locator('.catalano-modal [data-catalano-model="041454|WC"]').click();
  await page.locator('.catalano-modal .catalano-variant').selectOption('0414540021');
  assert.equal(await page.locator('.catalano-modal .catalano-accessory-select[data-accessory="seat"]').inputValue(),'0451250021');
  assert.equal(await page.locator('.catalano-modal .catalano-accessory-select[data-accessory="mount"]').inputValue(),'');
  await page.locator('.catalano-modal .catalano-accessory-select[data-accessory="mount"]').selectOption('9056080000');
  await page.locator('.catalano-modal .catalano-add').click();
  state=await page.evaluate(()=>window.__saved);
  assert.deepEqual(state[1],{reference:'0414540021',room:'room-master',extras:['0451250021','9056080000']});
  // Bidet is never presented with a WC seat.
  await page.evaluate(()=>window.__openCatalano({manufacturer:'Catalano',collection:'Zero',category:'WC',base:'011850',reference:'0118501001'}));
  await page.waitForSelector('.catalano-modal .catalano-variant');
  assert.equal(await page.locator('.catalano-modal .catalano-accessory-select').count(),0);
  // Official Catalano product images must NOT repeat the Sfera collection photo.
  await page.evaluate(()=>window.__openCatalano(null));
  await page.locator('.catalano-modal [data-catalano-collection="Sfera"]').click();
  await page.locator('.catalano-modal [data-catalano-category="WC"]').click();
  await page.locator('.catalano-modal [data-catalano-model="051950|WC"]').click();
  const bidetSrc=await page.locator('.catalano-modal .catalano-selection .galassia-photo img').getAttribute('src');
  assert(bidetSrc.includes('SFERA_bidet_terra_50x35_0519501001'),bidetSrc);
  assert((await page.locator('.catalano-modal .galassia-image-note').innerText()).includes('référence 0519501001'));
  await page.locator('.catalano-modal .catalano-variant').selectOption('0519501021');
  const blushSrc=await page.locator('.catalano-modal .catalano-selection .galassia-photo img').getAttribute('src');
  assert(blushSrc.includes('0519501021'),'Variant must use the correct manufacturer thumbnail');
  await page.locator('.catalano-modal [data-catalano-model="051165|WC"]').click();
  const wcSrc=await page.locator('.catalano-modal .catalano-selection .galassia-photo img').getAttribute('src');
  assert(wcSrc.includes('SFERA_wc_sospeso_55x35_0511650001'),'WC must not reuse bidet image');
  assert.notEqual(wcSrc,bidetSrc);
  await page.locator('.catalano-modal [data-catalano-model="053301|WC"]').click();
  assert.equal(await page.locator('.catalano-modal .catalano-selection .galassia-photo img').count(),0);
  assert((await page.locator('.catalano-modal .catalano-selection .galassia-photo').innerText()).includes('Visuel produit indisponible'));
  assert.equal(await page.locator('.catalano-modal .catalano-models .galassia-model-photo img[src*="Sfera_55-sospesi"]').count(),0);
  assert.equal(errors.length,0,'Uncaught browser errors: '+errors.join('; '));
  console.log('Catalano Chromium: 14 collections, WC colour matches, floor fixings, linked accessories, bidet exclusion OK');
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
