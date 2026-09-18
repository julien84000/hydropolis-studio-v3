const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('public/app.js','utf8');
const start=source.indexOf('function isRecorBathLinkedAccessory');
const end=source.indexOf('function incompleteRecorBaths',start);
assert(start>=0 && end>start,'Recor project helper block not found');

const bath={id:'bath-1',roomId:'room-1',manufacturer:'Recor',category:'Bain',collection:'Baignoires sur pieds',reference:'ROLLTOP',designation:'Roll Top bath'};
const foot={id:'foot-1',roomId:'room-1',accessoryFor:'bath-1',manufacturer:'Recor',collection:'Pieds Recor',reference:'FOOT-A',designation:'Pieds Ball & Claw',finish:'Chrome',totalPrice:200};
const waste={id:'waste-1',roomId:'room-1',accessoryFor:'bath-1',manufacturer:'Recor',collection:'Accessoires Recor',reference:'WASTE-A',designation:'Vidage baignoire',finish:'Chrome',totalPrice:90};
const unrelated={manufacturer:'Recor',collection:'Pieds Recor',reference:'FOOT-OTHER',designation:'Autres pieds',totalPrice:250};

const ctx={
  state:{selected:[bath,foot,waste]},
  normalizeText:s=>String(s||'').toLowerCase(),
  isRecorBathRequiringFeet:p=>p===bath,
  recorModelName:()=> 'Roll Top',
  recorCompatibleFeet:()=>[foot,unrelated],
  recorCompatibleWastes:()=>[waste],
  recorOptionDisplay:item=>`${item.designation}${item.finish?` · ${item.finish}`:''}`,
  recorChoiceVisual:item=>`<img data-ref="${item.reference}">`,
  articleMerchandisePrice:item=>Number(item.totalPrice||0),
  euro:n=>`${Number(n||0).toFixed(2)} €`,
  esc:s=>String(s??'')
};
vm.createContext(ctx);
vm.runInContext(source.slice(start,end),ctx);

assert.equal(ctx.isRecorBathLinkedAccessory(foot),true,'selected Recor feet must be a linked accessory');
assert.equal(ctx.isRecorBathLinkedAccessory(waste),true,'selected Recor waste must be a linked accessory');
const html=ctx.recorBathOptions(bath,'room-1');
assert(html.includes('Configuration Recor ✓'),'validated summary missing');
assert(html.includes('FOOT-A'),'selected feet missing');
assert(html.includes('WASTE-A'),'selected waste missing');
assert(!html.includes('FOOT-OTHER'),'unselected Recor choices must disappear after validation');
assert(!html.includes('+ Choisir'),'full choice controls must disappear after validation');
assert(html.includes('edit-recor-config'),'edit configuration action missing');

console.log('Recor V11.33 project view OK · validated selection compacted, unselected options hidden');
