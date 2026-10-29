'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {plan}=require('../public/dossier-pages');
const items=n=>Array.from({length:n},(_,i)=>({id:'a'+i,image:'image'+i}));
const groups=[{key:'r:Lavabo',items:items(13)}];
test('Existing dossiers retain five slots; six slots never lose or duplicate articles',()=>{
 assert.deepEqual(plan(groups).pages.map(p=>p.items.length),[5,5,3]);
 assert.deepEqual(plan(groups,{pageSize:6}).pages.map(p=>p.items.length),[6,6,1]);
});
test('Move to another page and new page survives JSON without mutating project',()=>{
 const before=JSON.stringify(groups);const layout={assignments:{a5:'r:Lavabo:0',a0:'r:Lavabo:3'}};
 const result=plan(groups,JSON.parse(JSON.stringify(layout)));
 assert.deepEqual(result.pages.map(p=>p.items.length),[5,4,3,1]);
 assert.equal(result.pages[3].items[0].id,'a0');assert.equal(result.pages[0].items.at(-1).id,'a5');
 assert.equal(JSON.stringify(groups),before);
});
test('A full-page swap works independently of iteration order',()=>{
 const g=[{key:'r:Lavabo',items:items(12)}];
 const assignments=Object.fromEntries(g[0].items.map((p,i)=>[p.id,'r:Lavabo:'+Math.floor(i/6)]));
 assignments.a0='r:Lavabo:1';assignments.a6='r:Lavabo:0';
 const pages=plan(g,{pageSize:6,assignments}).pages;
 assert.deepEqual(pages.map(p=>p.items.length),[6,6]);
 assert(pages[0].items.some(p=>p.id==='a6'));assert(pages[1].items.some(p=>p.id==='a0'));
});
test('Moves across spaces preserve origin, hide empty pages and enforce six maximum',()=>{
 const g=[{key:'r:A',items:items(1)},{key:'r:B',items:[{id:'b'}]}];
 const result=plan(g,{assignments:{a0:'r:B:0'}});
 assert.equal(result.pages.length,1);assert.equal(result.origins.get('a0'),'r:A');
 const bad=plan(groups,{assignments:Object.fromEntries(items(13).map(p=>[p.id,'r:Lavabo:0']))});
 assert(bad.pages.every(p=>p.items.length<=6));assert.equal(new Set(bad.pages.flatMap(p=>p.items.map(x=>x.id))).size,13);
 assert.deepEqual(plan(groups,{assignments:{a0:'unknown:999'}}).pages.map(p=>p.items.length),[5,5,3]);
});

test('Four articles can occupy one page or two pages in any split',()=>{
 const g=[{key:'r:A',items:items(4)}];
 assert.deepEqual(plan(g).pages.map(p=>p.items.length),[4]);
 assert.deepEqual(plan(g,{assignments:{a2:'r:A:1',a3:'r:A:1'}}).pages.map(p=>p.items.length),[2,2]);
 assert.deepEqual(plan(g,{assignments:{a3:'r:A:1'}}).pages.map(p=>p.items.length),[3,1]);
});
