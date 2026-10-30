'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const script=fs.readFileSync(path.join(__dirname,'../public/hidrobox-neo-plus-2026.js'),'utf8');
const window={};vm.runInNewContext(script,{window});
const neo=window.HydroNeoPlus2026;
test('Neo Plus Scene Blanc is available in Lisse and Ardoise',()=>{
 const base={form:'rectangle',width:80,length:120,material:'Scene',group:'BLA',color:'Blanc'};
 for(const texture of ['Lisse','Ardoise']){
  const v=neo.lookup({...base,texture});assert.equal(v.ok,true,texture);assert(v.reference?.startsWith('SNEC'));
 }
});
test('Neo Plus Scene coloured variants are not offered without manufacturer SKU',()=>{
 const base={form:'rectangle',width:80,length:120,material:'Scene',texture:'Lisse'};
 for(const [group,color] of [['BAS','Bianco'],['TRE','Brownie'],['SPE','RAL / NCS — à préciser']]){
  const v=neo.lookup({...base,group,color});assert.equal(v.ok,false,group);
  assert.match(v.reason,/Blanc/);assert.equal(v.reference,undefined);
 }
});
test('Neo Plus Kromat retains Basics and Trends, but not the Scene-only white tier',()=>{
 const base={form:'rectangle',width:80,length:120,material:'Kromat',texture:'Lisse'};
 for(const [group,color] of [['BAS','Bianco'],['TRE','Brownie']]){
  assert.equal(neo.lookup({...base,group,color}).ok,true,group);
 }
 assert.equal(neo.lookup({...base,group:'BLA',color:'Blanc'}).ok,false);
});