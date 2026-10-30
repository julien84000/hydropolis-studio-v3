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
 function unmatchedRows(rows){return (rows||[]).filter(p=>p.officialStructureVerified!==true);}
 function coverage(tree,rows){
  const official=collections(tree);
  const valid=(rows||[]).filter(p=>p.officialStructureVerified===true);
  return {collections:official.length,sections:official.reduce((n,c)=>n+c.groups.length,0),
   models:official.reduce((n,c)=>n+c.groups.reduce((z,g)=>z+g.items.length,0),0),
   matched:valid.length,unmatched:unmatchedRows(rows).length};
 }
 return {unknown,normalize,collections,collectionFor,pricedInGroup,familySections,models,unmatchedRows,coverage};
});
