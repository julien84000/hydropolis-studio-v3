'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const script=fs.readFileSync(path.join(__dirname,'../public/hidrobox-neo-plus-2026.js'),'utf8');
const window={};vm.runInNewContext(script,{window});
const neo=window.HydroNeoPlus2026;
test('Neo Plus Scene also offers manufacturer color groups, not only white',()=>{
 const base={form:'rectangle',width:80,length:120,material:'Scene',texture:'Lisse'};
 const blanc=neo.lookup({...base,group:'BLA',color:'Blanc'});
 assert.equal(blanc.ok,true);
 const options=[['BAS','Bianco'],['TRE','Brownie'],['SPE','RAL / NCS — à préciser']];
 for(const [group,color] of options){
   const res=neo.lookup({...base,group,color});
   assert.equal(res.ok,false,group);
   assert(res.reference?.startsWith('SNEC'),group+' must still resolve genuine Scene base reference');
   assert.match(res.reason,/tarif|Supplément/i);
 }
 assert(neo.COLORS.BAS.includes('Bianco'));
 assert(neo.COLORS.TRE.includes('Brownie'));
});
test('Neo Plus Scene cannot be sold at white base tariff when non-white is selected',()=>{
 const base={form:'rectangle',width:90,length:120,material:'Scene',texture:'Ardoise'};
 const white=neo.lookup({...base,group:'BLA',color:'Blanc'});
 const other=neo.lookup({...base,group:'TRE',color:'Terra'});
 assert.equal(white.ok,true);
 assert.equal(other.ok,false);
 assert.equal(other.reference,white.reference);
 assert(other.reason.includes('Supplément'));
});
