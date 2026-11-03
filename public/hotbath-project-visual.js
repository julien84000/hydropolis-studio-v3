/* Compact reversible Hotbath photo tabs on already-selected project items.
 * Project storage owns hotbathVisualMode, photo source and commercial fields.
 */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroHotbathProjectVisual=api;
})(typeof window==='object'?window:null,function(root){
'use strict';
let pending=new Set();
function mount(selected,save,refresh){
 if(!root?.document)return 0;
 const resolver=root.HydroHotbathFinishMedia;
 if(!resolver)return 0;
 const byId=new Map((selected||[]).filter(p=>resolver.hotbath(p)).map(p=>[String(p.id),p]));
 let mounted=0;
 root.document.querySelectorAll('#roomsEditor .room-product .room-prod-img > label[data-id]').forEach(label=>{
  const p=byId.get(String(label.dataset.id));if(!p)return;
  const slot=label.parentElement;
  const prior=slot.querySelector('.hotbath-photo-controls');
  if(prior)prior.remove();
  const visual=resolver.view(p);
  const img=label.querySelector('img');
  if(img&&visual.src&&img.getAttribute('src')!==visual.src)img.setAttribute('src',visual.src);
  if(!img&&visual.src){
    // Preserve the existing upload control: only insert the manufacturer photo
    // immediately before the file input, never replace the label.
    const inserted=root.document.createElement('img');
    inserted.className='room-live-image';
    inserted.src=visual.src;
    inserted.alt=p.designation||p.reference||'Hotbath';
    label.insertBefore(inserted,label.querySelector('input'));
  }
  const holder=root.document.createElement('div');
  holder.className='hotbath-photo-controls';
  const group=root.document.createElement('div');
  group.className='hotbath-photo-tabs';
  group.setAttribute('role','group');
  group.setAttribute('aria-label','Visuel Hotbath '+String(p.reference||''));
  const caption=root.document.createElement('small');
  caption.className='hotbath-photo-caption'+(visual.simulated?' simulated':'');
  caption.textContent=visual.caption;
  for(const [mode,name] of [['photo','Photo'],['simulation','Simuler finition']]){
    const button=root.document.createElement('button');
    button.type='button';button.className='hotbath-photo-mode';
    button.dataset.mode=mode;button.dataset.id=String(p.id);
    button.textContent=name;
    const active=(mode==='simulation')===visual.simulated;
    if(active)button.classList.add('active');
    button.setAttribute('aria-pressed',String(active));
    if(mode==='simulation'&&!resolver.supports(p)){
      button.disabled=true;
      button.title='Disponible pour les photos fabricant du même modèle sur fond neutre avec une finition prise en charge';
    }
    button.onclick=async()=>{
      if(pending.has(p.id))return;
      if(mode==='simulation'){
        const url=resolver.urlFor(p);
        if(!url)return;
        pending.add(p.id);button.disabled=true;caption.textContent='Vérification de la simulation…';
        try{
          const response=await root.fetch(url,{credentials:'same-origin'});
          if(!response.ok){
            const json=await response.json().catch(()=>({}));
            throw Error(json.detail||json.error||'Simulation non disponible pour ce visuel');
          }
          if(!/^image\//i.test(response.headers.get('content-type')||''))
            throw Error('Format de simulation non reconnu');
        }catch(e){
          caption.textContent=e.message||'Simulation impossible : photo conservée';
          button.disabled=false;
          pending.delete(p.id);
          return;
        }
        pending.delete(p.id);
      }
      if(resolver.setMode(p,mode)){
        save?.();refresh?.();
      }
    };
    group.appendChild(button);
  }
  holder.append(group,caption);slot.appendChild(holder);
  if(img&&visual.simulated){
    img.addEventListener('error',()=>{
      if(!resolver.isSimulation(p))return;
      resolver.setMode(p,'photo');save?.();refresh?.();
    },{once:true});
  }
  mounted++;
 });
 return mounted;
}
return {mount};
});
