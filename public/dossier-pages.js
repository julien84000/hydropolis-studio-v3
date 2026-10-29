/* Dossier-only pagination. Product and quotation order are never mutated. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HydroDossierPages=api;})(typeof window==='object'?window:null,function(){
  function plan(groups,layout={}){
    const size=Number.isInteger(layout.pageSize)&&layout.pageSize>=1&&layout.pageSize<=6?layout.pageSize:5;
    const pages=[],byKey=new Map(),origins=new Map();
    for(const group of groups){
      group.items.forEach((item,index)=>{
        const key=group.key+':'+Math.floor(index/size);
        if(!byKey.has(key)){const page={key,group,items:[]};pages.push(page);byKey.set(key,page);}
        byKey.get(key).items.push(item);origins.set(String(item.id),group.key);
      });
    }
    const placements=pages.flatMap(page=>page.items.map(item=>({item,source:page})));
    pages.forEach(page=>{page.items=[];});
    // Resolve the complete saved arrangement at once: swaps must not depend on order.
    const deferred=[];
    for(const {item,source} of placements){
      const target=layout.assignments?.[String(item.id)];
      const group=typeof target==='string'&&groups.find(g=>target.startsWith(g.key+':')&&/^\d+$/.test(target.slice(g.key.length+1)));
      let destination=source;
      if(group){
        if(!byKey.has(target)){const page={key:target,group,items:[]};pages.push(page);byKey.set(target,page);}
        destination=byKey.get(target);
      }
      if(destination.items.length<6)destination.items.push(item);
      else deferred.push({item,source});
    }
    for(const {item,source} of deferred){
      let destination=pages.find(page=>page.group===source.group&&page.items.length<size);
      if(!destination){
        const index=Math.max(-1,...pages.filter(page=>page.group===source.group).map(page=>Number(page.key.slice(source.group.key.length+1))))+1;
        destination={key:source.group.key+':'+index,group:source.group,items:[]};pages.push(destination);
      }
      destination.items.push(item);
    }
    return {pages:pages.filter(page=>page.items.length).sort((a,b)=>groups.indexOf(a.group)-groups.indexOf(b.group)||Number(a.key.slice(a.group.key.length+1))-Number(b.key.slice(b.group.key.length+1))),origins};
  }
  return {plan};
});
