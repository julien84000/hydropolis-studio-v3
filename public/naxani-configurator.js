/* Naxani 2026: manufacturer collections + exact price-list SKU visual configurator.
 * Generic photos represent collections; actual finish must be confirmed against tariff.
 * No automatically invented basin compatibility or SKU-level prices.
 */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroNaxaniConfigurator=api;
})(typeof window==='object'?window:null,function(root){
 'use strict';
 const FAMILIES=[
  {tab:'Meubles',id:'laque',label:'Laqués',group:'laque'},
  {tab:'Meubles',id:'bois-massif',label:'Bois massif',group:'bois-massif'},
  {tab:'Meubles',id:'complement',label:'Compléments',group:'complement'},
  {tab:'Lavabos',id:'plan-integre',label:'Plans vasque intégrés',group:'plan-integre'},
  {tab:'Lavabos',id:'vasque-poser',label:'Vasques à poser',group:'vasque-poser'},
  {tab:'Lavabos',id:'suspendu',label:'Lavabos suspendus',group:'suspendu'},
  {tab:'Lavabos',id:'tops',label:'Plans pour vasques à poser',group:'plan-solid'}
 ];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const euro=n=>Number(n||0).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
 const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const uid=v=>String(v||'').replace(/[^0-9a-z-]/gi,'-');
 const catalog=()=>root?.HydroNaxani2026||{rows:[],compatibilities:{}};
 const isFurniture=p=>['laque','bois-massif'].includes(p?.productType);
 const groupFor=f=>f==='tops'?['plan-solid','plan-mdf']:[f];
 const byKey=rows=>new Map(rows.map(r=>[r.reference,r]));
 const numbers=arr=>[...new Set(arr.filter(x=>Number.isFinite(x)).map(Number))].sort((a,b)=>a-b);
 const widthEqual=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<0.06;
 function compatible(meuble,plan,data=catalog()){
  if(!meuble||!plan||plan.productType!=='plan-integre')return false;
  if(!widthEqual(Number(meuble.naWidth),Number(plan.naWidth)))return false;
  const rule=data.compatibilities?.[norm(meuble.collection)];
  if(rule?.excluded?.some(name=>norm(name)===norm(plan.collection)))return false;
  return true;
 }
 function quote(refs,rows){const index=byKey(rows),items=refs.map(k=>index.get(k)).filter(Boolean);return {items,total:items.reduce((n,r)=>n+Number(r.price),0)}}
 function open(rows,roomId,onAdd,initial=null){
  if(!root?.document||!Array.isArray(rows)||!rows.length)return Promise.reject(Error('Tarif Naxani 2026 non chargé'));
  const data=catalog(),indexed=byKey(rows);let tab='Meubles',family='bois-massif',collection='',reference='',width=null;
  let mode='integrated',planRef='',topRef='',basinRef='',drainRef='',search='',busy=false;
  if(initial){family=initial.productType==='plan-solid'||initial.productType==='plan-mdf'?'tops':initial.productType;tab=FAMILIES.find(x=>x.id===family)?.tab||'Meubles';collection=initial.collection;reference=initial.reference;width=initial.naWidth;}
  root.document.querySelector('.nax-modal')?.remove();
  const ov=document.createElement('div');ov.className='nax-modal';ov.setAttribute('role','dialog');ov.setAttribute('aria-label','Configurateur Naxani');ov.setAttribute('aria-modal','true');
  ov.innerHTML='<div class="nax-shell"><header class="nax-header"><div><span class="nax-eyebrow">NAXANI · MOBILIER DE BAIN</span><h2>Configurer Naxani</h2><p>Collections → dimensions → référence tarifée → plan vasque et accessoires</p></div><button class="nax-close" aria-label="Fermer">×</button></header><div class="nax-body"><aside class="nax-nav"></aside><main class="nax-catalogue"><div class="nax-toolbar"><strong class="nax-crumb"></strong><input class="nax-search" type="search" placeholder="Rechercher collection ou référence"></div><div class="nax-cards"></div></main><section class="nax-detail"></section></div></div>';
  document.body.appendChild(ov);
  const $=q=>ov.querySelector(q),$$=q=>[...ov.querySelectorAll(q)];
  const selected=()=>indexed.get(reference);
  const groupRows=()=>rows.filter(r=>groupFor(family).includes(r.productType)||(family==='tops'&&r.productType==='plan-mdf'));
  const close=()=>{ov.remove();document.removeEventListener('keydown',onKey);};
  const onKey=e=>{if(e.key==='Escape')close()};
  document.addEventListener('keydown',onKey);$('.nax-close').onclick=close;
  const cardImage=rs=>rs.find(r=>r.image)?.image||'';
  const imgTag=(url,alt)=>url?'<img src="'+esc(url)+'" loading="lazy" alt="'+esc(alt)+'">':'<span class="nax-photo-empty">Photo de collection non disponible</span>';
  function resetConfiguration(){mode='integrated';planRef='';topRef='';basinRef='';drainRef='';}
  function groupSelect(){
   const candidates=groupRows().filter(r=>r.collection===collection);
   if(!candidates.length){const first=groupRows()[0];collection=first?.collection||'';}
   const list=groupRows().filter(r=>r.collection===collection);
   if(!list.some(r=>r.reference===reference)){
    const byWidth=width==null?list:list.filter(r=>widthEqual(Number(r.naWidth),Number(width)));
    reference=(byWidth.length?byWidth:list)[0]?.reference||'';resetConfiguration();
   }
   width=selected()?.naWidth??null;
  }
  function drawNav(){
   $('.nax-nav').innerHTML=['Meubles','Lavabos'].map(t=>'<div class="nax-menu-title">'+esc(t)+'</div>'+
    FAMILIES.filter(x=>x.tab===t).map(x=>'<button data-family="'+esc(x.id)+'" class="'+(x.id===family?'selected':'')+'">'+esc(x.label)+'</button>').join('')).join('');
   $$('[data-family]').forEach(b=>b.onclick=()=>{family=b.dataset.family;tab=FAMILIES.find(x=>x.id===family)?.tab||'Meubles';collection='';reference='';width=null;search='';resetConfiguration();render();});
  }
  function drawCards(){
   const q=norm(search),all=groupRows(),groups=[...new Set(all.map(x=>x.collection))].filter(name=>!q||norm(name).includes(q)||all.some(x=>x.collection===name&&x.reference.includes(search)));
   $('.nax-crumb').textContent=tab+' › '+(FAMILIES.find(x=>x.id===family)?.label||'');
   $('.nax-search').value=search;
   $('.nax-cards').innerHTML=groups.map(name=>{
    const variants=all.filter(r=>r.collection===name),img=cardImage(variants),min=Math.min(...variants.map(r=>Number(r.price)||Infinity));
    return '<button type="button" class="nax-card '+(name===collection?'active':'')+'" data-collection="'+esc(name)+'">'+
      '<div class="nax-card-image">'+imgTag(img,name)+'</div><b>'+esc(name)+'</b><small>'+variants.length+' références tarifées</small>'+
      (Number.isFinite(min)?'<span>Dès '+euro(min)+' HT</span>':'')+'</button>';
   }).join('')||'<p class="nax-empty">Aucun modèle dans cette rubrique.</p>';
   $$('[data-collection]').forEach(b=>b.onclick=()=>{collection=b.dataset.collection;reference='';width=null;resetConfiguration();render();});
  }
  function options(list,selectedValue){return list.map(p=>'<option value="'+esc(p.reference)+'"'+(selectedValue===p.reference?' selected':'')+'>'+esc(p.collection)+' · '+(p.naWidth?esc(p.naWidth)+' cm · ':'')+esc(p.reference)+' · '+euro(p.price)+' HT</option>').join('');}
  function variantSelect(list,value,kind){return '<select data-input="'+kind+'">'+options(list,value)+'</select>';}
  const priceLine=p=>p?'<div><span>'+esc(p.designation)+'</span><b>'+euro(p.price)+'</b></div>':'';
  function updateBundle(main){
   if(!isFurniture(main))return {items:main?[main]:[],valid:!!main,reason:''};
   const sink=mode==='integrated'?indexed.get(planRef):indexed.get(basinRef),top=mode==='separate'?indexed.get(topRef):null;
   if(!sink)return {items:[main],valid:false,reason:'Sélectionnez un plan vasque compatible ou un ensemble plan + vasque.'};
   if(mode==='integrated'&&!compatible(main,sink,data))return {items:[main],valid:false,reason:'Plan vasque incompatible avec ce meuble ou cette largeur.'};
   if(mode==='separate'&&(!top||!widthEqual(Number(main.naWidth),Number(top.naWidth))))return {items:[main],valid:false,reason:'Choisissez un plan de travail adapté à la largeur du meuble.'};
   return {items:[main,...(top?[top]:[]),sink,...(drainRef&&indexed.has(drainRef)?[indexed.get(drainRef)]:[])],valid:true,reason:''};
  }
  function drawDetail(){
   const p=selected();
   if(!p){$('.nax-detail').innerHTML='<p class="nax-empty">Sélectionnez une collection et une référence.</p>';return;}
   const variants=groupRows().filter(x=>x.collection===collection);
   const widths=numbers(variants.map(x=>x.naWidth).filter(x=>x!=null));
   const showingWidths=widths.length>0;
   let html='<div class="nax-mainphoto">'+imgTag(p.image,collection)+'</div><div class="nax-photonote">Photo officielle illustrative de la collection ; la finition et les dimensions peuvent différer.</div>'+
    '<span class="nax-eyebrow">'+esc(FAMILIES.find(x=>x.id===family)?.label||'')+'</span><h3>'+esc(collection)+'</h3>'+
    (showingWidths?'<label>Largeur / configuration<select data-input="width">'+widths.map(w=>'<option value="'+w+'"'+(widthEqual(w,Number(p.naWidth))?' selected':'')+'>'+w+' cm</option>').join('')+'</select></label>':'')+
    '<label>Référence et prix exacts du tarif 2026'+variantSelect(variants.filter(x=>!showingWidths||widthEqual(Number(x.naWidth),Number(p.naWidth))),reference,'reference')+'</label>'+
    '<p class="nax-supplier">Référence : <b>'+esc(p.reference)+'</b> · Tarif HT : <b>'+euro(p.price)+'</b> · PDF p. '+p.sourcePage+'</p>';
   if(isFurniture(p)){
    const matches=rows.filter(x=>compatible(p,x,data)),tops=rows.filter(x=>['plan-solid','plan-mdf'].includes(x.productType)&&widthEqual(Number(x.naWidth),Number(p.naWidth)));
    if(!matches.some(x=>x.reference===planRef))planRef=matches[0]?.reference||'';
    if(!tops.some(x=>x.reference===topRef))topRef=tops[0]?.reference||'';
    const basins=rows.filter(x=>x.productType==='vasque-poser');if(!basins.some(x=>x.reference===basinRef))basinRef=basins[0]?.reference||'';
    html+='<div class="nax-assembly"><h4>Composer l’ensemble lavabo</h4><div class="nax-modes">'+
    '<button class="'+(mode==='integrated'?'active':'')+'" data-mode="integrated">Plan vasque intégré</button>'+
    '<button class="'+(mode==='separate'?'active':'')+'" data-mode="separate">Plan + vasque à poser</button></div>';
    if(mode==='integrated')html+='<label>Plans vasque compatibles ('+matches.length+')'+(matches.length?variantSelect(matches,planRef,'plan'):'<span class="nax-warning">Aucun plan correspondant aux dimensions et exclusions du tarif. Aucune compatibilité supposée.</span>')+'</label>';
    else html+='<label>Top / plan de travail ('+tops.length+')'+(tops.length?variantSelect(tops,topRef,'top'):'<span class="nax-warning">Aucun plan Naxani de cette largeur identifié.</span>')+'</label>'+
     '<label>Vasque à poser'+variantSelect(basins,basinRef,'basin')+'</label>';
    html+='</div>';
   }
   const needsWaste=isFurniture(p)||p.productType==='vasque-poser'||p.productType==='plan-integre'||p.productType==='suspendu';
   if(needsWaste){
    const drain=rows.filter(x=>x.productType==='bonde');
    html+='<label>Bonde / siphon (optionnel)<select data-input="drain"><option value="">Sans bonde ajoutée</option>'+options(drain,drainRef)+'</select></label>';
   }
   const bundle=updateBundle(p);
   if(!isFurniture(p)&&drainRef&&indexed.has(drainRef))bundle.items.push(indexed.get(drainRef));
   const amount=bundle.items.reduce((s,x)=>s+Number(x.price),0);
   html+='<div class="nax-totals"><strong>Récapitulatif HT</strong>'+bundle.items.map(priceLine).join('')+
    '<div class="nax-grand"><span>Total public HT</span><b>'+euro(amount)+'</b></div>'+
    '<small>Conditions d’achat Naxani non communiquées : aucune remise fournisseur présumée. Les composants sont ajoutés en lignes distinctes.</small></div>'+
    (!bundle.valid?'<div class="nax-warning">'+esc(bundle.reason)+'</div>':'')+
    '<a class="nax-official" href="'+esc(p.manufacturerUrl||'https://naxani.com/productos/muebles-de-bano/')+'" target="_blank" rel="noopener noreferrer">Voir les photos et caractéristiques de la collection Naxani</a>'+
    '<button type="button" class="nax-add" '+(!bundle.valid||busy?'disabled':'')+'>'+(busy?'Ajout en cours…':'Ajouter la composition au projet')+'</button>';
   $('.nax-detail').innerHTML=html;
   $$('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;render()});
   $$('[data-input]').forEach(el=>el.onchange=()=>{
    const k=el.dataset.input,v=el.value;
    if(k==='width'){const t=variants.find(r=>widthEqual(Number(r.naWidth),Number(v)));reference=t?.reference||'';resetConfiguration();}
    if(k==='reference'){reference=v;resetConfiguration();}
    if(k==='plan')planRef=v;
    if(k==='top')topRef=v;
    if(k==='basin')basinRef=v;
    if(k==='drain')drainRef=v;
    render(false);
   });
   $('.nax-add').onclick=async()=>{
    if(busy||!bundle.valid)return;
    busy=true;$('.nax-add').disabled=true;
    try{
     await onAdd({...p,naxaniAssembly:{references:bundle.items.map(x=>x.reference),mode:isFurniture(p)?mode:'standalone',total:amount,source:'PDF Naxani 2026'}},roomId);
     close();
    }catch(e){busy=false;render(false);root.alert('Naxani : '+(e?.message||e));}
   };
  }
  function render(reset=true){
   groupSelect();drawNav();drawCards();drawDetail();
   if(reset)$('.nax-search').value='';
   $('.nax-search').oninput=e=>{search=e.target.value;drawCards();};
  }
  render();
  return Promise.resolve(true);
 }
 function install(){
  if(!root?.HydroManufacturerGuide)return false;
  const guide=root.HydroManufacturerGuide,prior=guide.open;
  if(prior?.__naxani2026)return true;
  const override=(brand,rows,roomId,onAdd)=>brand==='Naxani'?open(rows,roomId,onAdd):prior(brand,rows,roomId,onAdd);
  override.__naxani2026=true;guide.open=override;return true;
 }
 if(root)install();
 return {open,install,compatible,quote,FAMILIES,eligible:p=>p?.manufacturer==='Naxani'};
});