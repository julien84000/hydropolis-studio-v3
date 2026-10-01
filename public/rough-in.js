/* Required components are reconciled on add AND on every project load. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.HydroRoughIn=factory();
})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  const norm=v=>String(v||'').replace(/\s/g,'').toUpperCase();
  const qty=v=>Math.max(1,Math.min(999,Math.floor(Number(v)||1)));
  function reconcile(records,lookup,make){
    let changed=false;const remove=new Set(),add=[];
    const parents=new Map(records.filter(p=>p&&!p.accessoryFor&&!p.requiredRoughIn).map(p=>[p.id,p]));
    for(const p of records){
      if(p.requiredRoughIn&&!parents.has(p.accessoryFor)){remove.add(p);changed=true;}
    }
    for(const p of parents.values()){
      if(/lefroy\s*brooks/i.test(p.manufacturer||''))continue;
      const source=lookup(p)||p;
      const ref=String(source.internalReference||'').trim(),price=Number(source.internalPrice);
      // An unpriced or unverified component must never become a free quote line.
      if(!ref||!Number.isFinite(price)||price<=0)continue;
      const bodySource=lookup({manufacturer:p.manufacturer,reference:ref});
      if(/^alpi$/i.test(p.manufacturer||'')&&(!bodySource||Number(bodySource.price)!==price))continue;
      if(p.internalReference!==ref||p.internalPrice!==price){p.internalReference=ref;p.internalPrice=price;changed=true;}
      const base=Number(source.price),full=Number(source.totalPrice);
      if(Number.isFinite(base)&&full>base&&Math.abs(full-base-price)<.03){
        for(const field of ['price','totalPrice','catalogPrice','catalogTotalPrice']){
          if(Math.abs(Number(p[field])-full)<.03){p[field]=base;changed=true;}
        }
      }
      const linked=records.filter(x=>x.accessoryFor===p.id&&(x.requiredRoughIn||norm(x.reference)===norm(ref)));
      let child=linked.find(x=>norm(x.reference)===norm(ref));
      for(const x of linked){if(x!==child){remove.add(x);changed=true;}}
      if(!child){child=make({...bodySource,manufacturer:p.manufacturer,reference:ref,price,totalPrice:price,purchaseDiscount:source.purchaseDiscount??p.purchaseDiscount},p.roomId,p.id);add.push(child);changed=true;}
      const fields={reference:ref,roomId:p.roomId,accessoryFor:p.id,requiredRoughIn:true,mandatoryAccessory:true,
        quantity:qty(p.quantity),quantityPerParent:1,purchaseDiscount:source.purchaseDiscount??p.purchaseDiscount,
        designation:`Corps d’encastrement obligatoire – réf. ${ref}`};
      for(const [k,v] of Object.entries(fields)){if(child[k]!==v){child[k]=v;changed=true;}}
    }
    return {records:records.filter(p=>!remove.has(p)).concat(add),added:add,changed};
  }
  return {reconcile};
});
