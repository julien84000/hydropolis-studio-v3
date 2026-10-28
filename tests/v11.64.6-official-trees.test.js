'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {load}=require('../scripts/audit-brand-pricing');
const publicRoot=path.join(__dirname,'..','public');
const ctx={window:{},Map,Uint8Array};
vm.runInNewContext(fs.readFileSync(path.join(publicRoot,'brand-configurators.js'),'utf8'),ctx);
const api=ctx.window.HydroBrandCatalogs;

test('Official Bette main sections, French faceted links and original 62,264 priced variants are preserved',()=>{
 const tree=api.betteTree;
 assert.deepEqual(Array.from(tree,x=>x.name),['Baignoires','Receveurs de douche','Vasques','Équipement et encastrement','Gammes design','Nouveautés']);
 for(const t of tree)assert.match(t.url,/^https:\/\/www\.my-bette\.com\/fr\/produits\//);
 assert.equal(tree[0].sections.map(s=>s.name).join(','),'Type,Forme,Fonction');
 assert.equal(tree[1].sections.map(s=>s.name).join(','),'Type,Forme');
 assert.equal(tree[2].sections.map(s=>s.name).join(','),'Type,Forme');
 const data=load('Bette');
 assert.equal(data.groups.length,93);
 assert.equal(data.groups.reduce((sum,g)=>sum+g.variants.length,0),62264);
 const by={};for(const g of data.groups){const type=api.betteType(g);by[type]=(by[type]||0)+1;}
 console.log('BETTE_OFFICIAL_TYPE_COVERAGE',JSON.stringify({by,examples:data.groups.slice(0,28).map(g=>({id:g.id,family:g.family,category:g.category,variantCategory:g.variants[0]?.category,kind:api.betteType(g)}))}));
 assert.equal(Object.values(by).reduce((a,b)=>a+b,0),93,'no Bette tariff group hidden');
 const basin=data.groups.find(g=>g.id==='betteaqua-vasque-a-encastrer');
 assert.equal(api.betteFacetMatches(basin,'vasques-a-encastrer'),true);
 assert.equal(api.betteFacetMatches(basin,'vasques-a-poser'),false);
 assert.equal(api.betteFacetMatches(data.groups.find(g=>g.id==='betteair'),'baignoires-ilot'),false);

});

test('Carrodrain official groups include all 13 site models, 635 exact priced supplier variants unchanged',()=>{
 const tree=Array.from(api.carrodrainTree,x=>x.id);
 assert.deepEqual(tree,['Essentials','Invisibles','Liquids','Accessoires']);
 const models=ctx.window.HydroCarrodrainConfigurator.models;
 assert.equal(models.filter(m=>['Essentials','Invisibles','Liquids'].includes(m.family)).length,13);
 assert.equal(models.find(m=>m.id==='kerlox').family,'Accessoires');
 assert.equal(load('Carrodrain').groups.reduce((sum,g)=>sum+g.variants.length,0),635);
 assert.equal(api.verifiedPublicPrice('Carrodrain',{reference:'100403',price:175}),175);
});

test('Hidrobox official nine product categories and 2026 source tariff remain independent',()=>{
 const win={HydroHidroboxConfigurator:{groups:async()=>[]}};
 vm.runInNewContext(fs.readFileSync(path.join(publicRoot,'hidrobox-neo-plus-2026.js'),'utf8'),{window:win});
 vm.runInNewContext(fs.readFileSync(path.join(publicRoot,'hidrobox-guided.js'),'utf8'),{window:win});
 const cfg=win.HydroHidroboxConfigurator;
 assert.equal(cfg.officialCategories.length,9);
 assert.equal(cfg.officialProductTree.length,9);
 assert.deepEqual(Array.from(cfg.officialCategories,x=>x.key),['receveurs','panneaux','accessoires','vasques-suspendues','vasques-a-poser','vasques-sur-pied','plans','bains-ilot','bains-encastres']);
 assert.equal(cfg.officialCollections.filter(x=>x.key==='beta-evoque').length,2);
 const groups=load('Hidrobox').groups;
 assert.equal(groups.length,27);
 assert.equal(groups.reduce((sum,g)=>sum+g.variants.length,0),4479);
 for(const g of groups)assert.ok(g.variants.every(v=>Math.round(v.rawPrice*104)/100===v.price),g.id);
});
