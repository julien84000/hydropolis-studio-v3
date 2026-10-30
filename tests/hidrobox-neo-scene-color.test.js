'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const script=fs.readFileSync(path.join(__dirname,'../public/hidrobox-neo-plus-2026.js'),'utf8');
const window={};vm.runInNewContext(script,{window});
const neo=window.HydroNeoPlus2026;
test('Neo Plus Scene accepts manufacturer white in smooth and slate texture',()=>{
 for(const texture of ['Lisse','Ardoise']){
  const result=neo.lookup({form:'rectangle',width:80,length:120,material:'Scene',texture,group:'BLA',color:'Blanc'});
  assert.equal(result.ok,true,texture);
  assert(result.reference.startsWith('SNEC'));
  assert.equal(result.material,'Scene');
  assert.equal(result.color,'Blanc');
 }
});
test('Neo Plus Scene does not offer Kromat colour ranges as manufacturer variants',()=>{
 const base={form:'rectangle',width:80,length:120,material:'Scene',texture:'Lisse'};
 for(const [group,color] of [['BAS','Bianco'],['TRE','Brownie'],['SPE','RAL / NCS — à préciser']]){
  const result=neo.lookup({...base,group,color});
  assert.equal(result.ok,false,group);
  assert.match(result.reason,/Scene.*blanch/i);
  assert.equal(result.reference,undefined,'no fake Scene coloured manufacturer SKU');
 }
});
test('Neo Plus Kromat retains standard colour options and blocks Scene white-only group',()=>{
 const base={form:'rectangle',width:80,length:120,material:'Kromat',texture:'Lisse'};
 for(const [group,color] of [['BAS','Bianco'],['TRE','Brownie']]){
  const result=neo.lookup({...base,group,color});
  assert.equal(result.ok,true,group);
  assert(result.reference.startsWith('SNEC'));
 }
 assert.equal(neo.lookup({...base,group:'BLA',color:'Blanc'}).ok,false);
});
