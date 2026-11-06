'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync(require('node:path').join(__dirname,'../public/app.js'),'utf8');
function extract(begin,end,globals={}){return vm.runInNewContext(src.slice(src.indexOf('function '+begin),src.indexOf(end,src.indexOf('function '+begin)))+'\n'+begin+';',globals)}
const duplicate=extract('duplicateRoomRecords','function duplicateRoom(',{quoteRoomKey:s=>String(s).trim().toUpperCase()});
const rooms=[{id:'a',title:'MASTER',subtitle:'Plan lavabo',manual:[{label:'Pose',price:40}]},{id:'b',title:'MASTER',subtitle:'Douche'},{id:'c',title:'Invités'}];
const selected=[{id:'tap',roomId:'a',quantity:2,configuration:{finish:'BS'},dossierImage:'custom',quoteUnitOverride:200},{id:'body',roomId:'a',accessoryFor:'tap',hideFromDossier:true},{id:'shower',roomId:'b',price:800},{id:'guest',roomId:'c'}];
function copy(){let n=0;return duplicate(rooms,selected,'b','VERSION 2',()=>`new-${++n}`)}
test('A whole room duplicates all its sub-spaces once, with independent nested data and links',()=>{
 const before=JSON.stringify({rooms,selected});const result=copy();
 assert.deepEqual(Array.from(result.rooms,r=>r.title),['MASTER','MASTER','VERSION 2','VERSION 2','Invités']);
 assert.deepEqual(Array.from(result.rooms.slice(2,4),r=>r.subtitle),['Plan lavabo','Douche']);
 const copies=result.selected.slice(4);assert.equal(copies.length,3);
 assert.equal(copies[1].accessoryFor,copies[0].id);assert.equal(copies[1].hideFromDossier,true);
 assert.equal(copies[0].quantity,2);assert.equal(copies[0].quoteUnitOverride,200);assert.equal(copies[0].dossierImage,'custom');
 copies[0].configuration.finish='CH';result.rooms[2].manual[0].price=90;
 assert.equal(JSON.stringify({rooms,selected}),before);
 const all=[...result.rooms,...result.selected].map(r=>r.id);assert.equal(new Set(all).size,all.length);
});
test('Unknown rooms, duplicate names and ID collisions are rejected before mutation',()=>{
 assert.throws(()=>duplicate(rooms,selected,'unknown','New',()=>1),/introuvable/);
 assert.throws(()=>duplicate(rooms,selected,'a',' master ',()=>1),/existe/);
 assert.throws(()=>duplicate(rooms,selected,'a','New',()=> 'tap'),/unique/);
});
test('Room without products can still be copied and saved as JSON',()=>{
 const result=duplicate(rooms,[],'c','Invités 2',()=> 'empty-copy');
 assert.equal(JSON.parse(JSON.stringify(result)).rooms.at(-1).id,'empty-copy');assert.equal(result.selected.length,0);
});
const groups=extract('orderedPresentationGroups','// Sum the pictured selection',{isRealSelectedProduct:p=>!!p.designation&&!p.suggestionOnly});
test('Mixed product descriptions never create or reorder sub-spaces, with or without a drag flag',()=>{
 const products=['Armoire de toilette','Mitigeur lavabo','Meuble','Douche'].map((designation,i)=>({id:String(i),designation}));
 const room={id:'a',title:'MASTER / VERSION 1',subtitle:'Mon espace lavabo'};
 for(const articleOrderCustomized of [undefined,true]){
  const g=groups([...products,{designation:'Suggestion',suggestionOnly:true}],{room:{...room,articleOrderCustomized}});
  assert.equal(g.length,1);assert.equal(g[0].label,room.subtitle);assert.equal(g[0].intro,'');
  assert.deepEqual(Array.from(g[0].items,p=>p.id),['0','1','2','3']);
 }
 assert.equal(groups(products,{room:{title:'Chambre'}})[0].label,'Chambre');
});
