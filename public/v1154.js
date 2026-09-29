/* Hydropolis Studio V11.54 - supplier discount guard + UI integrity */
(()=>{
  'use strict';
  const MAKERS=['Sira Concrete','TDA','Vismaravetro'];
  function enforce(){
    try{
      if(!window.state)return;
      state.commercial=state.commercial||{};state.commercial.supplierDiscounts=state.commercial.supplierDiscounts||{};
      for(const m of MAKERS)state.commercial.supplierDiscounts[m]=50;
      for(const p of (state.selected||[]))if(MAKERS.includes(String(p.manufacturer||'')))p.purchaseDiscount=50;
      if(typeof saveProject==='function')saveProject();
    }catch(e){console.warn('[V11.54 discount guard]',e)}
  }
  window.HydropolisV1154={version:'11.54.0',supplierDiscounts:{'Sira Concrete':50,TDA:50,Vismaravetro:50},enforce};
  queueMicrotask(enforce);
})();
