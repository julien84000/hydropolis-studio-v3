'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {load}=require('../scripts/audit-brand-pricing');

const dir=path.join(__dirname,'..','public');
function loadScript(name,globals={}){
  const window={};
  vm.runInNewContext(fs.readFileSync(path.join(dir,name),'utf8'),{window,Map,Uint8Array,...globals});
  return window;
}

test('V11.63.3 Hidrobox: reopening an imported non-default SKU restores ALL original selectors',()=>{
  const api=loadScript('brand-configurators.js').HydroBrandCatalogs;
  const groups=load('Hidrobox').groups;
  const group=groups.find(g=>g.variants.length>1&&g.variants.some(v=>
    ['material','width','length','finish','colorGroup'].some(key=>
      String(v[key]||'')!==String(g.variants[0][key]||''))));
  assert.ok(group,'A Hidrobox group must have a genuine configurable variant');
  const first=group.variants[0];
  const wanted=group.variants.find(v=>v.reference!==first.reference&&
    ['material','width','length','finish','colorGroup'].some(k=>String(v[k]||'')!==String(first[k]||'')));
  assert.ok(wanted,'The fixture must not use the first reference');
  const draft=api.initialHidroboxDraft(groups,{manufacturer:'Hidrobox',configGroup:'obsolete',collection:group.collection,reference:wanted.reference});
  assert.equal(draft.group,group.id,'An obsolete group ID must not override an exact supplier reference');
  for(const key of ['material','width','length','finish','colorGroup','reference'])
    assert.equal(draft[key],wanted[key]||'',key+' changed while reopening');
  const restored=groups.find(g=>g.id===draft.group).variants.find(v=>v.reference===draft.reference);
  assert.equal(api.verifiedPublicPrice('Hidrobox',restored),wanted.price);
  assert.equal(restored.rawPrice,wanted.rawPrice);
  assert.equal(restored.price,Math.round(restored.rawPrice*104)/100,'Uplift is applied once, not on reopening');
});

test('V11.63.3 existing Bette/Carrodrain exact SKU restoration remains unchanged',()=>{
  const api=loadScript('brand-configurators.js').HydroBrandCatalogs;
  for(const name of ['Bette','Carrodrain']){
    const groups=load(name).groups;
    const group=groups.find(g=>g.variants.length>1);
    const variant=group.variants[group.variants.length-1];
    const restored=api.initialExactVariant(groups,{configGroup:'stale',reference:variant.reference});
    assert.equal(restored.group.id,group.id,name+' group');
    assert.equal(restored.variant.reference,variant.reference,name+' SKU');
  }
});

function guide(fakeFetch){
  return loadScript('manufacturer-guide.js',{fetch:fakeFetch,console:{warn(){}}}).HydroManufacturerGuide;
}

test('V11.63.3 supplier media requests are isolated: Hotbath outage cannot blank Zucchetti/Lefroy Brooks',async()=>{
  const requests=[];
  const collectionMedia={collections:{Zucchetti:{'Octo X':{image:'https://assets.zucchettidesign.it/uploads/test.jpg',url:'https://www.zucchettidesign.it/en/zucchetti/octo-x'}},'Lefroy Brooks':{}},models:{}};
  const api=guide(url=>{
    requests.push(url);
    return Promise.resolve(url.includes('hotbath')
      ?{ok:false,status:503}
      :{ok:true,json:async()=>collectionMedia});
  });
  const loaded=await api.getMedia();
  assert.equal(loaded.collections,collectionMedia);
  assert.equal(loaded.hotbath.collections!==undefined,true);
  assert.equal(api.findCollectionVisual('Zucchetti','Octo X',loaded).image,'https://assets.zucchettidesign.it/uploads/test.jpg');
  assert.equal(api.displayCollection('Zucchetti','Zucchetti'),'Références sans collection attribuée');
  // The failed index is retryable on the next open rather than cached permanently.
  await api.getMedia();
  assert.equal(requests.filter(u=>u.includes('hotbath')).length,2);
});

test('V11.63.3 supplier media requests are isolated: Zucchetti/Lefroy outage preserves Hotbath',async()=>{
  const officialMedia={collections:{Archie:{url:'https://hotbath.it/fr/prods/1471/3521',image:''}},collectionImages:{Archie:'https://hotbath.com/images/compano/AR003/AR003IX_02.png'}};
  const api=guide(url=>Promise.resolve(url.includes('hotbath')
    ?{ok:true,json:async()=>officialMedia}
    :{ok:false,status:500}));
  const loaded=await api.getMedia();
  assert.equal(loaded.hotbath,officialMedia);
  assert.match(api.findCollectionVisual('Hotbath','Archie',loaded).image,/hotbath.com\/images\/compano/);
});
