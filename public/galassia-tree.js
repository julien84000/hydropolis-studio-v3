/* Galassia official navigation contract: never infer a supplier family from product text. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HydroGalassiaTree=api;})(typeof window==='object'?window:null,function(){
 'use strict';
 const unknown='__unmatched__';
 const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const collections=tree=>(tree?.collections||[]).map(c=>({slug:c.slug,name:c.name,groups:c.groups||[],hero:c.hero||'',url:c.url||''}));
 function collectionFor(tree,slugOrName){return collections(tree).find(c=>c.slug===slugOrName||normalize(c.name)===normalize(slugOrName))||null;}
 function pricedInGroup(rows,collection,group){
   return (rows||[]).filter(p=>p.officialStructureVerified===true&&p.manufacturerCollectionSlug===collection.slug&&p.manufacturerFamily===group.name);
 }
 function familySections(tree,collection,rows){
   const official=collection?.groups||[];
   const sections=official.map(group=>({name:group.name,items:group.items||[],prices:pricedInGroup(rows,collection,group).length,official:true}));
   const unmatched=(rows||[]).filter(p=>p.officialStructureVerified!==true&&p.manufacturerCollectionSlug===collection?.slug);
   if(unmatched.length)sections.push({name:'Références du tarif à rapprocher',items:[],prices:unmatched.length,official:false});
   return sections;
 }
 function models(tree,collection,section,rows){
   const array=rows||[];
   if(!section)return[];
   if(!section.official){
     const grouped=new Map();
     for(const p of array){
       if(p.officialStructureVerified===true||p.manufacturerCollectionSlug!==collection?.slug)continue;
       const key=String(p.base||p.reference);
       if(!grouped.has(key))grouped.set(key,{base:key,name:p.productType||p.designation||key,image:p.image||'',url:p.manufacturerUrl||'',variants:[]});
       grouped.get(key).variants.push(p);
     }
     return [...grouped.values()].sort((a,b)=>a.base.localeCompare(b.base,'fr',{numeric:true}));
   }
   return section.items.map(item=>({
    ...item,variants:array.filter(p=>p.officialStructureVerified===true&&p.manufacturerCollectionSlug===collection.slug&&p.manufacturerFamily===section.name&&p.manufacturerModelCode===item.base)
   }));
 }
 let loadPromise=null;
 function load(){
  if(!loadPromise)loadPromise=fetch('/galassia/official-tree.json',{cache:'no-cache'}).then(response=>{
   if(!response.ok)throw Error('Arborescence Galassia indisponible');
   return response.json();
  }).catch(error=>{loadPromise=null;throw error;});
  return loadPromise;
 }
 function verifiedModel(tree,p){
  if(!tree||!p||p.manufacturer!=='Galassia')return null;
  const base=String(p.base||p.reference||'').toUpperCase();
  const candidates=[];
  for(const collection of collections(tree)){
   for(const family of collection.groups){
    for(const item of family.items||[]){
     if(String(item.base||'').toUpperCase()===base){
      candidates.push({collection,family,item});
     }
    }
   }
  }
  if(candidates.length===1)return candidates[0];
  if(candidates.length>1){
   const same=candidates.filter(c=>c.collection.slug===p.manufacturerCollectionSlug);
   if(same.length===1)return same[0];
  }
  return null;
 }
 function enrich(p,tree){
  if(!p||p.manufacturer!=='Galassia')return p;
  const selected=verifiedModel(tree,p);
  if(!selected)return p;
  const {collection,family,item}=selected;
  p.manufacturerCollection=collection.name;
  p.manufacturerCollectionSlug=collection.slug;
  p.collection=collection.name;
  p.manufacturerFamily=family.name;
  p.manufacturerModel=item.name;
  p.manufacturerModelCode=item.base;
  p.officialStructureSource=item.url||family.source||collection.url||'';
  p.officialStructureVerified=true;
  p.classificationReviewRequired=false;
  p.sourceCategory=p.sourceCategory||p.category;
  p.category=family.name;
  p.productType=item.name;
  p.designation=item.name+' · '+p.reference;
  if(item.image&&/^https:\/\/www\.ceramicagalassia\.(?:it|com)\/public\//i.test(item.image)){
   p.image=item.image;
   p.imageSource='Photographie officielle du modèle (la finition peut différer)';
  }
  if(item.url&&/^https:\/\/www\.ceramicagalassia\.(?:it\/catalogo|com\/catalogue)\//i.test(item.url)){
   p.manufacturerUrl=item.url;
  }
  return p;
 }
 function unmatchedRows(rows){return (rows||[]).filter(p=>p.officialStructureVerified!==true);}
 function coverage(tree,rows){
  const official=collections(tree);
  const valid=(rows||[]).filter(p=>p.officialStructureVerified===true);
  return {collections:official.length,sections:official.reduce((n,c)=>n+c.groups.length,0),
   models:official.reduce((n,c)=>n+c.groups.reduce((z,g)=>z+g.items.length,0),0),
   matched:valid.length,unmatched:unmatchedRows(rows).length};
 }
 return {unknown,normalize,collections,collectionFor,pricedInGroup,familySections,models,unmatchedRows,coverage,load,verifiedModel,enrich};
});
