'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {duplicateSelected}=require('../public/room-article-duplicate.js');
const seed=[
 {id:'tap',roomId:'main',reference:'HOT-100',designation:'Mitigeur',quantity:2,quoteUnitOverride:490,
  configuration:{finish:'BS',options:['A']},customImage:true,hideFromDossier:false},
 {id:'body',roomId:'main',reference:'BODY',designation:'Corps encastré',accessoryFor:'tap',
  quantity:2,requiredRoughIn:true,price:35,totalPrice:35},
 {id:'nested',roomId:'main',reference:'NESTED',designation:'Sous-composant',accessoryFor:'body',
  quantity:2,price:5,totalPrice:5},
 {id:'sink',roomId:'main',reference:'SINK',designation:'Vasque',price:150,totalPrice:150},
 {id:'mirror',roomId:'guest',reference:'MIRROR',designation:'Miroir',price:200,totalPrice:200},
 {id:'light',roomId:'guest',reference:'LIGHT',designation:'Applique',price:90,totalPrice:90}
];
const ids=rows=>Array.from(rows,p=>p.id);
const room=rows=>Array.from(rows,p=>[p.id,p.roomId]);
const quote=rows=>rows.filter(p=>p.roomId==='guest').map(p=>p.id);
test('Copies the entire linked configured group before an arbitrary article in another room',()=>{
 const original=JSON.stringify(seed);let n=0;
 const result=duplicateSelected(seed,['main','guest'],'tap','guest','light',()=> 'copy-'+(++n));
 assert.deepEqual(ids(result.copies),['copy-1','copy-2','copy-3']);
 assert.deepEqual(ids(result.selected),['tap','body','nested','sink','mirror','copy-1','copy-2','copy-3','light']);
 assert.deepEqual(quote(result.selected),['mirror','copy-1','copy-2','copy-3','light']);
 assert.deepEqual(result.copies.map(p=>p.roomId),['guest','guest','guest']);
 assert.equal(result.copies[1].accessoryFor,'copy-1');
 assert.equal(result.copies[2].accessoryFor,'copy-2');
 assert.equal(result.copies[0].quantity,2);
 assert.equal(result.copies[0].quoteUnitOverride,490);
 assert.equal(result.copies[0].hideFromDossier,false);
 result.copies[0].configuration.finish='CH';result.copies[0].configuration.options.push('B');
 assert.equal(seed[0].configuration.finish,'BS');
 assert.deepEqual(seed[0].configuration.options,['A']);
 assert.equal(JSON.stringify(seed),original,'Source must not be mutated');
 assert.equal(new Set(ids(result.selected)).size,result.selected.length);
});
test('Can insert at the start, after a specific article or at end, with exact quote order',()=>{
 let n=0;const generate=()=> 'id-'+(++n);
 const begin=duplicateSelected(seed,['main','guest'],'tap','guest','mirror',generate);
 assert.deepEqual(quote(begin.selected).slice(0,3),ids(begin.copies));
 const after=duplicateSelected(seed,['main','guest'],'tap','main','sink',generate);
 assert.deepEqual(ids(after.selected.slice(0,3)),['tap','body','nested']);
 assert.equal(after.selected[3].id,after.copies[0].id);
 const end=duplicateSelected(seed,['main','guest'],'tap','guest',null,generate);
 assert.deepEqual(ids(end.selected.slice(-3)),ids(end.copies));
});
test('Rejects invalid placement, ID collision, missing article and standalone compulsory components',()=>{
 const base=()=> 'copy-id';
 assert.throws(()=>duplicateSelected(seed,['main','guest'],'nope','guest',null,base),/introuvable/);
 assert.throws(()=>duplicateSelected(seed,['main','guest'],'tap','missing',null,base),/introuvable/);
 assert.throws(()=>duplicateSelected(seed,['main','guest'],'tap','guest','sink',base),/invalide/);
 assert.throws(()=>duplicateSelected(seed,['main','guest'],'body','guest',null,base),/principal/);
 assert.throws(()=>duplicateSelected(seed,['main','guest'],'tap','guest',null,()=> 'tap'),/unique/);
 assert.deepEqual(room(seed),[['tap','main'],['body','main'],['nested','main'],['sink','main'],['mirror','guest'],['light','guest']]);
});
