'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {quoteSectionTotals,pageRemovalAssignments}=require('../public/dossier-editor-v116416');

const group={key:'r:LAVABO'};
const make=(key,start,count)=>({key,group,items:Array.from({length:count},(_,i)=>({id:'item-'+(start+i)}))});

test('Quote black-band subtotals sum discounted line quantities without changing prices',()=>{
  const rows=[
    {room:'Bain',netUnit:90,qty:2},
    {room:'Bain',netUnit:35,qty:1},
    {room:'Douche',netUnit:25,qty:2}
  ];
  const snapshot=JSON.stringify(rows);
  const subtotals=quoteSectionTotals(rows);
  assert.equal(subtotals.get('BAIN'),215);
  assert.equal(subtotals.get('DOUCHE'),50);
  assert.equal(JSON.stringify(rows),snapshot);
});

test('Delete one dossier page and reassign every item into a free page',()=>{
  const pages=[make('r:LAVABO:0',0,4),make('r:LAVABO:1',4,2)];
  const snapshot=JSON.stringify(pages);
  const result=pageRemovalAssignments(pages,'r:LAVABO:1');
  assert.equal(result.remainingPages,1);
  assert.equal(Object.keys(result.assignments).length,6);
  assert.equal(new Set(Object.keys(result.assignments)).size,6);
  assert(Object.values(result.assignments).every(k=>k==='r:LAVABO:0'));
  assert.equal(JSON.stringify(pages),snapshot);
});

test('Delete populated page when no room exists: create new fallback page without losing items',()=>{
  const pages=[make('r:LAVABO:0',0,6),make('r:LAVABO:1',6,5)];
  const result=pageRemovalAssignments(pages,'r:LAVABO:0');
  assert.equal(Object.keys(result.assignments).length,11);
  assert(!Object.values(result.assignments).includes('r:LAVABO:0'));
  assert.equal(result.moves.length,6);
  assert(result.moves.some(x=>x.to==='r:LAVABO:2'));
  assert.equal(result.remainingPages,2);
});

test('Missing deleted page returns null and leaves assignments untouched',()=>{
  const pages=[make('r:LAVABO:0',0,3)];
  assert.equal(pageRemovalAssignments(pages,'unknown'),null);
  const result=pageRemovalAssignments(pages,'r:LAVABO:0');
  assert.equal(result.moves.length,3);
  assert.equal(new Set(result.moves.map(m=>m.to)).size,1);
  assert.equal(result.remainingPages,1);
});
