'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {reorderSelected}=require('../public/room-article-dnd.js');
const root=path.resolve(__dirname,'../public');
const src=fs.readFileSync(path.join(root,'app.js'),'utf8');
const samples=[
 {id:'a',roomId:'r1',reference:'A',price:100,totalPrice:100},
 {id:'a-body',roomId:'r1',reference:'A-BODY',accessoryFor:'a',requiredRoughIn:true,price:35,totalPrice:35},
 {id:'b',roomId:'r1',reference:'B',price:200,totalPrice:200},
 {id:'c',roomId:'r2',reference:'C',price:300,totalPrice:300}
];
const visible=p=>!p.requiredRoughIn;
const total=records=>records.reduce((sum,p)=>sum+Number(p.totalPrice),0);
const ids=records=>records.map(p=>p.id);
test('An article dragged within its room moves before another and quote components follow their principal',()=>{
 const original=JSON.stringify(samples);
 const result=reorderSelected(samples,['r1','r2'],{r1:['b','a'],r2:['c']},'b','r1',visible);
 assert.deepEqual(ids(result),['b','a','a-body','c']);
 assert.equal(total(result),total(samples));
 assert.equal(JSON.stringify(samples),original,'No mutation of source records');
 assert.equal(result[2].accessoryFor,'a');
});
test('A complete article configuration can move to another room with the same prices and references',()=>{
 const result=reorderSelected(samples,['r1','r2'],{r1:['b'],r2:['c','a']},'a','r2',visible);
 assert.deepEqual(ids(result),['b','c','a','a-body']);
 assert.deepEqual(result.map(p=>p.roomId),['r1','r2','r2','r2']);
 assert.equal(total(result),total(samples));
 assert.deepEqual(result.map(p=>p.reference),['B','C','A','A-BODY']);
});
test('A visible accessory linked to a moved article follows its parent even if its old card stays in the source room',()=>{
 const all=samples.map(p=>p.id==='a-body'?{...p,requiredRoughIn:false}:p);
 const result=reorderSelected(all,['r1','r2'],{r1:['a-body','b'],r2:['c','a']},'a','r2',()=>true);
 assert.deepEqual(ids(result),['b','c','a','a-body']);
});
test('Reject moving a mandatory component alone and invalid or incomplete orders',()=>{
 assert.throws(()=>reorderSelected(samples,['r1','r2'],{r1:['a','b'],r2:['c']},'a-body','r2',visible),/produit principal/);
 assert.throws(()=>reorderSelected(samples,['r1','r2'],{r1:['b','b','a'],r2:['c']},'b','r1',visible),/incohérent/);
 assert.throws(()=>reorderSelected(samples,['r1','r2'],{r1:['a'],r2:['c']},'a','r1',visible),/Articles manquants/);
 assert.throws(()=>reorderSelected(samples,['r1','r2'],{r1:['a','b'],r2:['c']},'other','r2',visible),/inconnu/);
});
test('Project order resets conflicting dossier placements after a drag',()=>{
 assert.match(src,/Ordre des articles, du devis et du dossier photo mis à jour/);
 assert.match(src,/delete layout\.assignments\[id\]/);
});
test('Client dossier preserves exact user-chosen room article sequence in a single selection group',()=>{
 const begin=src.indexOf('function orderedPresentationGroups(');
 const end=src.indexOf('// Sum the pictured selection',begin);
 assert(begin>=0&&end>begin);
 const func=vm.runInNewContext(src.slice(begin,end)+'\norderedPresentationGroups;',{
  isRealSelectedProduct:p=>!!p.designation
 });
 const items=[
 {id:'shower',designation:'Douche'},
 {id:'basin',designation:'Lavabo'},
 {id:'shower2',designation:'Douchette'}
 ];
 const groups=func(items,{preserveArticleOrder:true});
 assert.equal(groups.length,1);
 assert.equal(groups[0].space,'PROJECT');
 assert.deepEqual(Array.from(groups[0].items,p=>p.id),['shower','basin','shower2']);
 const {plan}=require('../public/dossier-pages.js');
 assert.deepEqual(plan([{...groups[0],key:'r1:SELECTION'}]).pages[0].items.map(p=>p.id),['shower','basin','shower2']);
});
