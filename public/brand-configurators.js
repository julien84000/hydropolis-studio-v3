(function(root){
  'use strict';
  const cfgCache=new Map();
  const BRAND_META={
    Bette:{chunks:Array.from({length:3},(_,i)=>`/brand-data/bette-config-${String(i+1).padStart(2,'0')}.b64`),title:'Bette',subtitle:'Produit · dimension · couleur · version'},
    Carrodrain:{chunks:['/brand-data/carrodrain-config-01.b64'],title:'Carrodrain',subtitle:'Collection · LOW/PRO · longueur · finition'},
    Hidrobox:{chunks:['/brand-data/hidrobox-config-01.b64'],title:'Hidrobox',subtitle:'Collection · matière · dimensions · finition · couleur'}
  };
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const money=v=>`${Number(v||0).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})} €`;
  const uniq=a=>[...new Set((a||[]).filter(v=>v!==undefined&&v!==null).map(v=>String(v)))];
  const option=(v,label,selected)=>`<option value="${esc(v)}" ${String(v)===String(selected)?'selected':''}>${esc(label??v)}</option>`;
  function b64Bytes(value){
    const bin=atob(value.replace(/\s+/g,'')),out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out;
  }
  async function loadChunks(chunks){
    const key=(chunks||[]).join('|');if(cfgCache.has(key))return cfgCache.get(key);
    const job=(async()=>{
      if(typeof DecompressionStream!=='function')throw new Error('Ce navigateur ne sait pas décompresser les données configurateur.');
      const parts=await Promise.all((chunks||[]).map(async url=>{const r=await fetch(url,{cache:'no-cache'});if(!r.ok)throw new Error(`HTTP ${r.status} · ${url}`);return r.text()}));
      const bytes=b64Bytes(parts.join(''));
      return JSON.parse(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text());
    })();cfgCache.set(key,job);return job;
  }
  async function loadJson(meta){
    if(meta?.chunks)return loadChunks(meta.chunks);
    const url=String(meta||'');if(cfgCache.has(url))return cfgCache.get(url);
    const job=(async()=>{const r=await fetch(url,{cache:'no-cache'});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()})();cfgCache.set(url,job);return job;
  }
  function close(){document.getElementById('brandConfigurator')?.remove();}
  function room(roomId){return typeof normalizedRoomId==='function'?normalizedRoomId(roomId):roomId;}
  function commitConfigured(configured,roomId,configurationKey,configuration){
    const rec=createSelectedProductRecord(configured,room(roomId),'');
    if(!rec)throw new Error('Impossible de préparer la configuration.');
    Object.assign(rec,configured,{[configurationKey]:configuration,catalogPrice:configured.price,catalogTotalPrice:configured.totalPrice});
    const ids=commitSelectedRecords([rec],{showProject:false});
    if(!ids.length)throw new Error('Impossible d’ajouter la configuration au projet.');
    close();showView('project');
  }
  function shell(brand,body,footer=''){
    const meta=BRAND_META[brand];
    return `<div class="recor-configurator" role="dialog" aria-modal="true" aria-labelledby="brandConfigTitle">
      <div class="recor-config-head"><div><div class="eyebrow">${esc(brand)} · configuration guidée</div><h2 id="brandConfigTitle">${esc(meta.title)}</h2><p>${esc(meta.subtitle)}</p></div><button type="button" class="icon brand-config-close" aria-label="Fermer">×</button></div>
      ${body}${footer}<div class="recor-config-error" aria-live="polite"></div>
      <div class="recor-config-actions"><button type="button" class="btn ghost brand-config-cancel">Annuler</button><button type="button" class="btn primary brand-config-confirm">Ajouter la configuration</button></div>
    </div>`;
  }
  function mount(html){
    close();const overlay=document.createElement('div');overlay.id='brandConfigurator';overlay.className='recor-configurator-overlay';overlay.innerHTML=html;document.body.appendChild(overlay);
    overlay.querySelector('.brand-config-close').onclick=close;overlay.querySelector('.brand-config-cancel').onclick=close;overlay.addEventListener('click',e=>{if(e.target===overlay)close()});return overlay;
  }
  function field(id,label,values,current,labeler=v=>v){
    if(!values.length)return '';
    return `<label>${esc(label)}<select id="${id}">${values.map(v=>option(v,labeler(v),current)).join('')}</select></label>`;
  }
  function dimLabel(v){return [v.lengthMm&&`${v.lengthMm} mm`,v.widthMm&&`${v.widthMm} mm`,v.heightMm&&`${v.heightMm} mm`].filter(Boolean).join(' × ')||'Dimension non renseignée';}
  function chosen(select,values){const cur=select;return values.includes(cur)?cur:(values[0]??'');}

  async function openBette(p,roomId){
    const data=await loadJson(BRAND_META.Bette);const groups=data.groups||[];if(!groups.length)throw new Error('Catalogue Bette vide.');
    const draft={group:p?.configGroup||'',model:'',dim:'',color:'',option:'',reference:''};
    if(!groups.some(g=>g.id===draft.group))draft.group=groups.find(g=>g.family===p?.collection)?.id||groups[0].id;
    let overlay;
    const render=()=>{
      const g=groups.find(x=>x.id===draft.group)||groups[0],all=g.variants||[];
      const models=uniq(all.map(v=>v.model));draft.model=chosen(draft.model,models);let rows=all.filter(v=>v.model===draft.model);
      const dims=uniq(rows.map(dimLabel));draft.dim=chosen(draft.dim,dims);rows=rows.filter(v=>dimLabel(v)===draft.dim);
      const colors=uniq(rows.map(v=>v.color||'Standard'));draft.color=chosen(draft.color,colors);rows=rows.filter(v=>(v.color||'Standard')===draft.color);
      const opts=uniq(rows.map(v=>v.option||'Standard'));draft.option=chosen(draft.option,opts);rows=rows.filter(v=>(v.option||'Standard')===draft.option);
      const refs=rows.map(v=>v.reference);draft.reference=chosen(draft.reference,refs);const exact=rows.find(v=>v.reference===draft.reference)||rows[0];
      const body=`<div class="recor-config-section"><div class="recor-config-title"><b>1. Produit</b><span>Famille Bette</span></div><div class="v1146-field-grid">${field('bcGroup','Produit',groups.map(x=>x.id),g.id,id=>groups.find(x=>x.id===id)?.family||id)}${field('bcModel','Version',models,draft.model)}${field('bcDim','Dimensions',dims,draft.dim)}${field('bcColor','Couleur',colors,draft.color)}${field('bcOption','Option / équipement',opts,draft.option)}${field('bcRef','Référence finale',refs,draft.reference)}</div></div>
      <div class="recor-config-summary"><div></div><div><b>${money(exact?.price)} HT</b><span>${esc(exact?.designation||g.family)}</span><small>Réf. ${esc(exact?.reference||'—')} · tarif Bette</small></div></div>`;
      overlay=overlay||mount(shell('Bette',body));if(overlay.innerHTML!==shell('Bette',body))overlay.innerHTML=shell('Bette',body);
      overlay.querySelector('.brand-config-close').onclick=close;overlay.querySelector('.brand-config-cancel').onclick=close;
      const map={bcGroup:'group',bcModel:'model',bcDim:'dim',bcColor:'color',bcOption:'option',bcRef:'reference'};
      Object.entries(map).forEach(([id,key])=>{const el=overlay.querySelector('#'+id);if(el)el.onchange=()=>{draft[key]=el.value;if(key==='group'){draft.model=draft.dim=draft.color=draft.option=draft.reference=''}else if(key==='model'){draft.dim=draft.color=draft.option=draft.reference=''}else if(key==='dim'){draft.color=draft.option=draft.reference=''}else if(key==='color'){draft.option=draft.reference=''}else if(key==='option'){draft.reference=''}render()}});
      overlay.querySelector('.brand-config-confirm').onclick=()=>{try{
        const selected=(g.variants||[]).find(v=>v.reference===draft.reference)||exact;if(!selected)throw new Error('Référence Bette introuvable.');
        const configured={manufacturer:'Bette',collection:g.family,reference:selected.reference,base:selected.reference,designation:selected.designation,category:selected.category,finish:[selected.color,selected.option].filter(Boolean).join(' · '),price:selected.price,totalPrice:selected.price,currency:'€',vat:'HT',source:'TARIF BETTE.csv',sourceYear:2026,manufacturerUrl:g.manufacturerUrl||p?.manufacturerUrl||'https://www.my-bette.com/en',image:'',purchaseDiscount:50,configuratorType:'bette-configured'};
        commitConfigured(configured,roomId,'betteConfiguration',{group:g.id,family:g.family,model:selected.model,lengthMm:selected.lengthMm,widthMm:selected.widthMm,heightMm:selected.heightMm,color:selected.color,option:selected.option,reference:selected.reference});
      }catch(e){overlay.querySelector('.recor-config-error').textContent=e.message||String(e)}};
    };
    render();
  }

  async function openCarrodrain(p,roomId){
    const data=await loadJson(BRAND_META.Carrodrain);const groups=data.groups||[];if(!groups.length)throw new Error('Catalogue Carrodrain vide.');
    const draft={group:p?.configGroup||'',version:'',length:'',finish:'',reference:''};if(!groups.some(g=>g.id===draft.group))draft.group=groups.find(g=>g.model===p?.collection)?.id||groups[0].id;
    let overlay;
    const render=()=>{
      const g=groups.find(x=>x.id===draft.group)||groups[0],all=g.variants||[];
      const versions=uniq(all.map(v=>v.version));draft.version=chosen(draft.version,versions);let rows=all.filter(v=>v.version===draft.version);
      const lengths=uniq(rows.map(v=>v.length));draft.length=chosen(draft.length,lengths);rows=rows.filter(v=>v.length===draft.length);
      const finishes=uniq(rows.map(v=>v.finish||'À carreler'));draft.finish=chosen(draft.finish,finishes);rows=rows.filter(v=>(v.finish||'À carreler')===draft.finish);
      const refs=rows.map(v=>v.reference);draft.reference=chosen(draft.reference,refs);const exact=rows.find(v=>v.reference===draft.reference)||rows[0];
      const body=`<div class="recor-config-section"><div class="recor-config-title"><b>1. Collection</b><span>Caniveau Carrodrain</span></div><div class="v1146-field-grid">${field('ccGroup','Collection',groups.map(x=>x.id),g.id,id=>groups.find(x=>x.id===id)?.model||id)}${field('ccVersion','Version',versions,draft.version)}${field('ccLength','Longueur / format',lengths,draft.length,v=>/^\d+$/.test(v)?`${Number(v)/10} cm`:v)}${field('ccFinish','Finition',finishes,draft.finish)}${field('ccRef','Référence finale',refs,draft.reference)}</div></div>
      <div class="recor-config-summary"><div></div><div><b>${money(exact?.price)} HT</b><span>${esc([g.model,draft.version,draft.length,draft.finish].filter(Boolean).join(' · '))}</span><small>Réf. ${esc(exact?.reference||'—')} · tarif Carrodrain 2027</small></div></div>`;
      overlay=overlay||mount(shell('Carrodrain',body));if(overlay.innerHTML!==shell('Carrodrain',body))overlay.innerHTML=shell('Carrodrain',body);
      overlay.querySelector('.brand-config-close').onclick=close;overlay.querySelector('.brand-config-cancel').onclick=close;
      const map={ccGroup:'group',ccVersion:'version',ccLength:'length',ccFinish:'finish',ccRef:'reference'};
      Object.entries(map).forEach(([id,key])=>{const el=overlay.querySelector('#'+id);if(el)el.onchange=()=>{draft[key]=el.value;if(key==='group'){draft.version=draft.length=draft.finish=draft.reference=''}else if(key==='version'){draft.length=draft.finish=draft.reference=''}else if(key==='length'){draft.finish=draft.reference=''}else if(key==='finish'){draft.reference=''}render()}});
      overlay.querySelector('.brand-config-confirm').onclick=()=>{try{
        const selected=(g.variants||[]).find(v=>v.reference===draft.reference)||exact;if(!selected)throw new Error('Référence Carrodrain introuvable.');
        const configured={manufacturer:'Carrodrain',collection:g.model,reference:selected.reference,base:selected.reference,designation:[g.model,selected.version,selected.length,selected.finish].filter(Boolean).join(' · '),category:'Caniveau de douche',finish:selected.finish||'',price:selected.price,totalPrice:selected.price,currency:'€',vat:'HT',source:'CD.L2027.pdf',sourceYear:2027,manufacturerUrl:g.manufacturerUrl||p?.manufacturerUrl||'https://carrodrain.com/en',image:'',purchaseDiscount:50,configuratorType:'carrodrain-configured'};
        commitConfigured(configured,roomId,'carrodrainConfiguration',{group:g.id,model:g.model,version:selected.version,length:selected.length,finish:selected.finish,reference:selected.reference});
      }catch(e){overlay.querySelector('.recor-config-error').textContent=e.message||String(e)}};
    };
    render();
  }

  async function openHidrobox(p,roomId){
    const data=await loadJson(BRAND_META.Hidrobox);const groups=data.groups||[];if(!groups.length)throw new Error('Catalogue Hidrobox vide.');
    const draft={group:p?.configGroup||'',material:'',width:'',length:'',finish:'',colorGroup:'',reference:''};if(!groups.some(g=>g.id===draft.group))draft.group=groups.find(g=>g.collection===p?.collection)?.id||groups[0].id;
    let overlay;
    const displayBlank=v=>v||'Non précisé dans la matrice';
    const render=()=>{
      const g=groups.find(x=>x.id===draft.group)||groups[0],all=g.variants||[];let rows=all;
      const cascade=(fieldName,draftKey)=>{const vals=uniq(rows.map(v=>v[fieldName]||''));draft[draftKey]=chosen(draft[draftKey],vals);rows=rows.filter(v=>(v[fieldName]||'')===draft[draftKey]);return vals};
      const materials=cascade('material','material'),widths=cascade('width','width'),lengths=cascade('length','length'),finishes=cascade('finish','finish'),colors=cascade('colorGroup','colorGroup');
      const refs=rows.map(v=>v.reference);draft.reference=chosen(draft.reference,refs);const exact=rows.find(v=>v.reference===draft.reference)||rows[0];
      const colorLabel=v=>({'BLA':'Blanc / Scene','BAS':'Kromat · Standard Basics','TRE':'Kromat · Standard Trends','SPE':'Kromat · Specials RAL/NCS','':''}[v]||v);
      const body=`<div class="recor-config-section"><div class="recor-config-title"><b>1. Produit</b><span>Matrice tarifaire Hidrobox 2026</span></div><div class="v1146-field-grid">${field('hcGroup','Collection',groups.map(x=>x.id),g.id,id=>groups.find(x=>x.id===id)?.collection||id)}${materials.some(Boolean)?field('hcMaterial','Matière',materials,draft.material,displayBlank):''}${widths.some(Boolean)?field('hcWidth','Largeur',widths,draft.width,displayBlank):''}${lengths.some(Boolean)?field('hcLength','Longueur',lengths,draft.length,displayBlank):''}${finishes.some(Boolean)?field('hcFinish','Texture / finition',finishes,draft.finish,displayBlank):''}${colors.some(Boolean)?field('hcColor','Groupe couleur',colors,draft.colorGroup,colorLabel):''}${field('hcRef','Référence finale',refs,draft.reference)}</div></div>
      <div class="recor-config-summary"><div></div><div><b>${money(exact?.price)} HT</b><span>${esc([g.collection,draft.material,draft.width,draft.length,draft.finish,colorLabel(draft.colorGroup)].filter(Boolean).join(' · '))}</span><small>Réf. ${esc(exact?.reference||'—')} · tarif source ${money(exact?.rawPrice)} + 4 %</small></div></div>
      <p class="sbordoni-image-note">Le prix public Hydropolis applique automatiquement +4 % au tarif Hidrobox fourni. La remise d’achat fournisseur reste gérée séparément à 50 %.</p>`;
      overlay=overlay||mount(shell('Hidrobox',body));if(overlay.innerHTML!==shell('Hidrobox',body))overlay.innerHTML=shell('Hidrobox',body);
      overlay.querySelector('.brand-config-close').onclick=close;overlay.querySelector('.brand-config-cancel').onclick=close;
      const map={hcGroup:'group',hcMaterial:'material',hcWidth:'width',hcLength:'length',hcFinish:'finish',hcColor:'colorGroup',hcRef:'reference'};
      Object.entries(map).forEach(([id,key])=>{const el=overlay.querySelector('#'+id);if(el)el.onchange=()=>{draft[key]=el.value;const order=['group','material','width','length','finish','colorGroup','reference'],idx=order.indexOf(key);for(let i=idx+1;i<order.length;i++)draft[order[i]]='';render()}});
      overlay.querySelector('.brand-config-confirm').onclick=()=>{try{
        const selected=(g.variants||[]).find(v=>v.reference===draft.reference)||exact;if(!selected)throw new Error('Référence Hidrobox introuvable.');
        const colorLabel2=({'BLA':'Blanc / Scene','BAS':'Kromat · Standard Basics','TRE':'Kromat · Standard Trends','SPE':'Kromat · Specials RAL/NCS'}[selected.colorGroup]||selected.colorGroup||'');
        const designation=[g.collection,selected.material,selected.width&&`Larg. ${selected.width} cm`,selected.length&&`Long. ${selected.length} cm`,selected.finish,colorLabel2].filter(Boolean).join(' · ');
        const configured={manufacturer:'Hidrobox',collection:g.collection,reference:selected.reference,base:selected.reference,designation,category:g.category,finish:[selected.finish,colorLabel2].filter(Boolean).join(' · '),price:selected.price,totalPrice:selected.price,currency:'€',vat:'HT',source:'HIDROBOX_TARIF_FR_V0226_19-02-2026.pdf',sourceYear:2026,rawTariffPrice:selected.rawPrice,listPriceUpliftPct:4,manufacturerUrl:g.manufacturerUrl||p?.manufacturerUrl||'https://hidrobox.com/fr/',image:'',purchaseDiscount:50,configuratorType:'hidrobox-configured'};
        commitConfigured(configured,roomId,'hidroboxConfiguration',{group:g.id,collection:g.collection,material:selected.material,width:selected.width,length:selected.length,finish:selected.finish,colorGroup:selected.colorGroup,reference:selected.reference,rawTariffPrice:selected.rawPrice,price:selected.price,upliftPct:4,sourcePage:selected.sourcePage});
      }catch(e){overlay.querySelector('.recor-config-error').textContent=e.message||String(e)}};
    };
    render();
  }

  const CATALOG_SPECS={
    Bette:['/brand-data/bette-catalog-01.b64'],
    Carrodrain:['/brand-data/carrodrain-catalog-01.b64'],
    Hidrobox:['/brand-data/hidrobox-catalog-01.b64']
  };
  async function loadCatalogs(){
    const sets=await Promise.all(Object.entries(CATALOG_SPECS).map(async([brand,chunks])=>{
      const rows=await loadChunks(chunks);return Array.isArray(rows)?rows.map(x=>({...x,purchaseDiscount:50})):[];
    }));
    return sets.flat();
  }
  function eligibleBrand(brand,p){return !!p&&String(p.manufacturer||'').toLowerCase()===brand.toLowerCase()&&String(p.configuratorType||'').toLowerCase()===brand.toLowerCase();}
  root.HydroBrandCatalogs={load:loadCatalogs};
  root.HydroBetteConfigurator={eligible:p=>eligibleBrand('Bette',p),open:openBette,close};
  root.HydroCarrodrainConfigurator={eligible:p=>eligibleBrand('Carrodrain',p),open:openCarrodrain,close};
  root.HydroHidroboxConfigurator={eligible:p=>eligibleBrand('Hidrobox',p),open:openHidrobox,close};
})(window);