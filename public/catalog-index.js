/* Incremental indexes: lookups never scan the complete supplier catalogue. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.HydroCatalogIndex=factory();
})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  const key=p=>`${p?.manufacturer||''}|${p?.reference||''}${p?.manufacturer==='Resigres'?'|'+(p.category||''):''}`;
  function create(rows){
    const byKey=new Map(),byRef=new Map(),byMaker=new Map();let size=0;
    function sync(){
      if(rows.length<size){byKey.clear();byRef.clear();byMaker.clear();size=0;}
      for(;size<rows.length;size++){
        const p=rows[size];byKey.set(key(p),p);
        if(!byRef.has(p.reference))byRef.set(p.reference,p);
        if(!byMaker.has(p.manufacturer))byMaker.set(p.manufacturer,[]);
        byMaker.get(p.manufacturer).push(p);
      }
    }
    return {get(k){sync();return byKey.get(k)},reference(r){sync();return byRef.get(r)},
      maker(m){sync();return m?(byMaker.get(m)||[]):rows},sync};
  }
  return {create,key};
});
