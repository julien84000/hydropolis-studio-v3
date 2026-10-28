(function(root){
  'use strict';
  const cfgCache=new Map();
  const BRAND_META={
    Bette:{chunks:Array.from({length:3},(_,i)=>`/brand-data/bette-config-${String(i+1).padStart(2,'0')}.b64`),title:'Bette',subtitle:'Produit · dimension · couleur · version'},
    Carrodrain:{chunks:['/brand-data/carrodrain-config-01.b64'],title:'Carrodrain',subtitle:'Collection · LOW/PRO · longueur · finition'},
    Hidrobox:{chunks:['/brand-data/hidrobox-config-01.b64'],title:'Hidrobox',subtitle:'Collection · matière · dimensions · finition · couleur'}
  };

  // A collection photo must never silently stand for an exact variant.
  const OFFICIAL_HOSTS={Bette:'my-bette.com',Carrodrain:'carrodrain.com',Hidrobox:'hidrobox.com'};
  const OFFICIAL_HOME={Bette:'https://www.my-bette.com/fr/',Carrodrain:'https://carrodrain.com/en/',Hidrobox:'https://hidrobox.com/fr/'};
  function official(brand,value){
    const str=String(value||'').trim(),m=/^https:\/\/([^/?#:]+)/i.exec(str);
    if(!m)return '';
    const host=m[1].toLowerCase(),allowed=OFFICIAL_HOSTS[brand];
    return host===allowed||host.endsWith('.'+allowed)?str:'';
  }
  function trustedImage(value){
    const url=String(value||'').trim();
    return /^(https:\/\/|\/(?!\/)|images\/)/i.test(url)?url:'';
  }
  function verifiedPublicPrice(brand,variant){
    const amount=Number(variant?.price);
    if(!Number.isFinite(amount)||amount<=0)throw new Error('Prix public HT non vérifié pour cette référence fabricant.');
    if(brand==='Hidrobox'){
      const raw=Number(variant?.rawPrice);
      if(!Number.isFinite(raw)||raw<=0)throw new Error('Tarif source Hidrobox manquant : prix non enregistré.');
      const expected=Math.round(raw*104)/100;
      if(Math.abs(amount-expected)>0.005)throw new Error('Hidrobox : le prix affiché ne correspond pas à +4 % du tarif source.');
    }
    return amount;
  }
  function mediaFor(brand,p,g,v){
    const model=brand==='Carrodrain'?carrodrainVisual(g):null;
    const supplierDocs=model?root.HydroCarrodrainDocuments?.resolve(model.id,v?.version):null;
    const manufacturerUrl=model?.url||official(brand,v?.manufacturerUrl)||official(brand,g?.manufacturerUrl)||official(brand,p?.manufacturerUrl)||OFFICIAL_HOME[brand];
    const technicalSheetUrl=official(brand,v?.technicalSheetUrl)||supplierDocs?.technicalSheetUrl||official(brand,g?.technicalSheetUrl)||official(brand,p?.technicalSheetUrl)||'';
    const installationGuideUrl=supplierDocs?.installationGuideUrl||'';
    const image=trustedImage(v?.image);
    const representativeImage=!image?trustedImage(model?.image||g?.image||p?.image):'';
    return {manufacturerUrl,technicalSheetUrl,installationGuideUrl,technicalScope:supplierDocs?.technicalScope||'',installationScope:supplierDocs?.installationScope||'',image,representativeImage};
  }
  function mediaPreview(brand,p,g,v){
    const m=mediaFor(brand,p,g,v),src=m.image||m.representativeImage;
    const photo=src
      ?'<img src="'+esc(src)+'" alt="Visuel '+esc(g?.family||g?.collection||g?.model||brand)+'" loading="lazy" style="width:108px;height:108px;object-fit:contain;background:#fff;border:1px solid #e2e2e2;border-radius:8px">'
      :'<div style="display:flex;align-items:center;justify-content:center;max-width:130px;min-height:86px;padding:8px;text-align:center;border:1px solid #e2e2e2;border-radius:8px;font-size:12px">Visuel exact à rechercher</div>';
    const note=m.image?'Visuel de la référence sélectionnée':m.representativeImage?'Visuel de collection · finition non garantie':'La photo fabricant sera recherchée après ajout';
    const tech=m.technicalSheetUrl?' · <a href="'+esc(m.technicalSheetUrl)+'" target="_blank" rel="noopener noreferrer">'+(m.technicalScope==='exact-version'?'Fiche technique '+esc(v?.version||''):'Fiche technique fabricant · famille')+'</a>':'';
    const install=m.installationGuideUrl?' · <a href="'+esc(m.installationGuideUrl)+'" target="_blank" rel="noopener noreferrer">Notice de pose · famille</a>':'';
    return '<div class="brand-config-media" style="display:flex;flex-direction:column;align-items:center;gap:6px">'+photo+'<small style="font-size:11px;text-align:center">'+esc(note)+'<br><a href="'+esc(m.manufacturerUrl)+'" target="_blank" rel="noopener noreferrer">Voir le produit chez '+esc(brand)+'</a>'+tech+install+'</small></div>';
  }

  // Official Carrodrain storefront model images (collection illustrations).
  // Source: https://carrodrain.com/en/products/<model>, Open Graph image.
  // These are not asserted to be photographs of every chosen colour/size.
  const CARRODRAIN_MODELS=[
    {id:'cayman',name:'Cayman',family:'Essentials',subtitle:'Caniveau linéaire discret',image:'https://carrodrain.com/cdn/shop/files/DouchegootCayman_1200x1200.jpg?v=1717584240',url:'https://carrodrain.com/en/products/cayman'},
    {id:'caymanmono',name:'Cayman Mono',family:'Essentials',subtitle:'Grille MONO en inox massif',image:'https://carrodrain.com/cdn/shop/files/DouchegootCayman-Monowebsite_1200x1200.jpg?v=1714061905',url:'https://carrodrain.com/en/products/cayman-mono'},
    {id:'twiggi',name:'Twiggi',family:'Essentials',subtitle:'Caniveau mural à prolonger',image:'https://carrodrain.com/cdn/shop/files/Douchegoot_Carrodrain_Twiggi_1200x1200.jpg?v=1717585302',url:'https://carrodrain.com/en/products/twiggi'},
    {id:'quattro',name:'Quattro',family:'Essentials',subtitle:'Évacuation carrée',image:'https://carrodrain.com/cdn/shop/files/Carrodrain_Quattro_doucheput_2_1200x1200.jpg?v=1759420000',url:'https://carrodrain.com/en/products/quattro'},
    {id:'disco',name:'Disco',family:'Essentials',subtitle:'Évacuation ronde',image:'https://carrodrain.com/cdn/shop/files/Carrodrain_Disco_Ginger_doucheput_1200x1200.jpg?v=1759412640',url:'https://carrodrain.com/en/products/disco'},
    {id:'invisible',name:'Invisible',family:'Invisibles',subtitle:'Caniveau linéaire à carreler',image:'https://carrodrain.com/cdn/shop/files/Betegelbare_douchegoot_Carrodrain_Invisible_1200x1200.jpg?v=1717585624',url:'https://carrodrain.com/en/products/invisible'},
    {id:'invisiblequattro',name:'Invisible Quattro',family:'Invisibles',subtitle:'Carré à carreler',image:'https://carrodrain.com/cdn/shop/files/CD_Invisible_quattro_3_1200x1200.jpg?v=1759486059',url:'https://carrodrain.com/en/products/invisible-quattro'},
    {id:'invisibledisco',name:'Invisible Disco',family:'Invisibles',subtitle:'Rond à carreler',image:'https://carrodrain.com/cdn/shop/files/Carrodrain_Invisible_Disco_doucheput_1200x1200.jpg?v=1759417235',url:'https://carrodrain.com/en/products/invisible-disco'},
    {id:'liquid',name:'Liquid',family:'Liquids',subtitle:'Linéaire pour sols coulés',image:'https://carrodrain.com/cdn/shop/files/Douchegoot_voor_gietvloer_Liquid_White_bis_1200x1200.jpg?v=1740569015',url:'https://carrodrain.com/en/products/liquid'},
    {id:'liquidmono',name:'Liquid Mono',family:'Liquids',subtitle:'MONO pour sols coulés',image:'https://carrodrain.com/cdn/shop/files/DouchegootLiquid_Mono_Inox_1200x1200.jpg?v=1756030841',url:'https://carrodrain.com/en/products/liquid-mono'},
    {id:'liquidquattro',name:'Liquid Quattro',family:'Liquids',subtitle:'Carré pour sols coulés',image:'https://carrodrain.com/cdn/shop/files/DSC_8070_CMYK_GCR_1200x1200.jpg?v=1758709575',url:'https://carrodrain.com/en/products/liquid-quattro'},
    {id:'liquiddisco',name:'Liquid Disco',family:'Liquids',subtitle:'Rond pour sols coulés',image:'https://carrodrain.com/cdn/shop/files/Carrodrain_Liquid_Disco_doucheput_voor_gietvloer_1200x1200.jpg?v=1759417333',url:'https://carrodrain.com/en/products/liquid-disco'},
    {id:'liquidsnake',name:'Liquid Snake',family:'Liquids',subtitle:'Ligne organique pour sols coulés',image:'https://carrodrain.com/cdn/shop/files/CarrodraindesigndouchegootInox_1200x1200.jpg?v=1748873206',url:'https://carrodrain.com/en/products/liquid-snake'},
    {id:'kerlox',name:'Kerlox',family:'Accessoires',subtitle:'Membrane d’étanchéité',image:'https://carrodrain.com/cdn/shop/products/kerloxsaniperfo_3_1200x1200.jpg?v=1594892994',url:'https://carrodrain.com/en/products/waterproof-membrane-kerlox'}
  ];
  const CARRODRAIN_BY_ID=new Map(CARRODRAIN_MODELS.map(m=>[m.id,m]));
  const caroClean=x=>String(x||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
  const CARRODRAIN_ALIASES={
    invisibleline:'invisible',liquidline:'liquid',quattro100:'quattro',disco125:'disco',
    invisiblequattro100:'invisiblequattro',invisibledisco125:'invisibledisco',
    liquidquattro100:'liquidquattro',liquiddisco125:'liquiddisco',
    caymanmono:'caymanmono',liquidsnake:'liquidsnake'
  };
  function carrodrainVisual(group){
    for(const raw of [group?.id,group?.model,group?.collection]){
      const key=caroClean(raw).replace(/(?:low|pro)$/,'');
      if(CARRODRAIN_BY_ID.has(key))return CARRODRAIN_BY_ID.get(key);
      if(CARRODRAIN_BY_ID.has(CARRODRAIN_ALIASES[key]))return CARRODRAIN_BY_ID.get(CARRODRAIN_ALIASES[key]);
    }
    return null;
  }
  function carrodrainGallery(groups,chosenGroup,selectedFamily){
    const cards=CARRODRAIN_MODELS.map(m=>{
      const g=(groups||[]).find(g=>carrodrainVisual(g)?.id===m.id);
      const common='<img src="'+esc(m.image)+'" alt="Carrodrain '+esc(m.name)+'" loading="lazy" decoding="async" onerror="this.style.display=\'none\'"><span class="carrodrain-gallery-caption"><b>'+esc(m.name)+'</b><small>'+esc(m.subtitle)+'</small></span>';
      const active=g&&g.id===chosenGroup?' is-active':'';
      const item=g
        ?'<button type="button" class="carrodrain-gallery-card'+active+'" data-carrodrain-group="'+esc(g.id)+'" aria-label="Configurer '+esc(m.name)+'">'+common+'</button>'
        :'<a class="carrodrain-gallery-card" href="'+esc(m.url)+'" target="_blank" rel="noopener noreferrer" aria-label="Voir '+esc(m.name)+' sur Carrodrain">'+common+'<em>Hors tarif importé · Voir chez Carrodrain</em></a>';
      return {family:m.family,markup:item};
    });
    const families=selectedFamily?[selectedFamily]:['Essentials','Invisibles','Liquids','Accessoires'];
    const priced=CARRODRAIN_MODELS.filter(m=>(groups||[]).some(g=>carrodrainVisual(g)?.id===m.id)).length;
    return '<div class="carrodrain-gallery-intro">'+priced+' collections tarifées sur '+CARRODRAIN_MODELS.length+' présentées. Les collections sans grille ne peuvent pas être ajoutées automatiquement. Visuels officiels de gamme, non contractuels pour la finition choisie.</div>'
      +families.map(f=>'<section class="carrodrain-gallery-section"><h3>'+esc(f)+'</h3><div class="carrodrain-gallery-grid">'+cards.filter(x=>x.family===f).map(x=>x.markup).join('')+'</div></section>').join('');
  }
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
    })().catch(e=>{cfgCache.delete(key);throw e});cfgCache.set(key,job);return job;
  }
  async function loadJson(meta){
    if(meta?.chunks)return loadChunks(meta.chunks);
    const url=String(meta||'');if(cfgCache.has(url))return cfgCache.get(url);
    const job=(async()=>{const r=await fetch(url,{cache:'no-cache'});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()})().catch(e=>{cfgCache.delete(url);throw e});cfgCache.set(url,job);return job;
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

  /* Official French manufacturer taxonomy. No filter is claimed as a verified
   * SKU property unless supported by the original supplier tariff fields. */
  const BETTE_TREE=[
   {id:'baths',name:'Baignoires',url:'https://www.my-bette.com/fr/produits/baignoires',sections:[
     {name:'Type',items:[['Baignoires encastrables','baignoires-encastrable'],['Baignoires sous plan','baignoires-sous-plan'],['Baignoires îlot','baignoires-ilot'],['Baignoires avec tablier','baignoires-avec-tablier']]},
     {name:'Forme',items:[['Rectangulaires','baignoires-rectangulaires'],['Ovales','baignoires-ovales'],["D’angle",'baignoires-d-angle']]},
     {name:'Fonction',items:[['Balnéo','baignoires-baln%C3%A9o'],['Compactes','baignoires-compactes'],['Baignoires-douches','baignoire-douche'],['1 personne','baignoires-1-personne'],['2 personnes','baignoires-2-personnes']]}]},
   {id:'showers',name:'Receveurs de douche',url:'https://www.my-bette.com/fr/produits/receveurs-de-douche',sections:[
     {name:'Type',items:[['Extra-plats','receveur-de-douche-extra-plat'],['Surélevés','receveurs-de-douche-sureleves']]},
     {name:'Forme',items:[['Rectangulaires','receveurs-de-douche-rectangulaires'],['Quart de rond','receveurs-de-douche-en-quart-de-rond'],['Pentagonaux','receveurs-de-douche-pentagonaux']]}]},
   {id:'basins',name:'Vasques',url:'https://www.my-bette.com/fr/produits/vasques',sections:[
     {name:'Type',items:[['À encastrer','vasques-a-encastrer'],['Sous plan','vasques-sous-plan'],['Murales','vasques-murales'],['À poser','vasques-a-poser'],['En îlot','vasques-en-ilot']]},
     {name:'Forme',items:[['Rondes','vasques-rondes'],['Rectangulaires ou carrées','vasques-rectangulaires-ou-carrees']]}]},
   {id:'equipment',name:'Équipement et encastrement',url:'https://www.my-bette.com/fr/produits/equipement-encastrement',sections:[]},
   {id:'design',name:'Gammes design',url:'https://www.my-bette.com/fr/produits/gammes-design',sections:[{name:'Gammes officielles',items:[['BetteSuno','bettesuno'],['BetteArt','betteart'],['BetteLux','bettelux'],['BetteLoft','betteloft'],['BetteComodo','bettecomodo'],['BetteOne','betteone']]}]},
   {id:'news',name:'Nouveautés',url:'https://www.my-bette.com/fr/produits/nouveautes',sections:[]}
  ];
  function betteType(g){
   const v=g?.variants?.[0]||{};
   const words=[v.category,g.category,v.type,g.type,v.designation,g.family].filter(Boolean).join(' ').toLowerCase();
   if(/receveur|douche|shower|betteair/.test(words))return 'showers';
   if(/baignoire|bain|bath|balnéo/.test(words))return 'baths';
   if(/vasque|lavabo|lavatory|washbasin|basin/.test(words))return 'basins';
   if(/accessoire|vidage|encastrement|equipement|pieds|support/.test(words))return 'equipment';
   return 'unclassified';
  }
  // A supplier tariff family is filtered into an official facet only when
  // its own name explicitly establishes the match. No shape/type inference
  // from photographs or neighbouring products.
  const BETTE_FACET_MATCH={
    'vasques-a-encastrer':/vasque.*encastr/i,
    'vasques-sous-plan':/vasque.*sous.plan/i,
    'vasques-murales':/vasque.*mural/i,
    'vasques-a-poser':/vasque.*poser/i,
    'vasques-en-ilot':/vasque.*ilot/i,
    'vasques-rondes':/vasque.*rond/i,
    'vasques-rectangulaires-ou-carrees':/vasque.*(?:rectang|carre)/i,
    'baignoires-compactes':/compact/i,
    'baignoire-douche':/bain.*douche/i,
    'bettesuno':/^bettesuno/i,'betteart':/^betteart/i,'bettelux':/^bettelux/i,
    'betteloft':/^betteloft/i,'bettecomodo':/^bettecomodo/i,'betteone':/^betteone/i
  };
  const betteFacetMatches=(g,slug)=>{
    const pattern=BETTE_FACET_MATCH[slug];
    if(!pattern)return false;
    const name=String(g?.family||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    return pattern.test(name);
  };
  const CARRODRAIN_TREE=[
   {id:'Essentials',name:'Essentials',description:'Caniveaux et siphons essentiels'},
   {id:'Invisibles',name:'Invisibles',description:'Solutions à carreler et invisibles'},
   {id:'Liquids',name:'Liquids',description:'Solutions pour sols coulés'},
   {id:'Accessoires',name:'Accessoires',description:'Étanchéité et accessoires · hors gammes principales'}
  ];
  function choiceTiles(id,values,current,labeler=v=>v){
   if(values.length<2||values.length>18)return '';
   return '<div class="brand-visual-choice" role="group" aria-label="'+esc(id)+'">'+values.map(v=>
    '<button type="button" data-brand-choice="'+esc(id)+'" data-brand-value="'+esc(v)+'" aria-pressed="'+(String(current)===String(v))+'">'+esc(labeler(v))+'</button>').join('')+'</div>';
  }
  function wireChoices(overlay){
   overlay.querySelectorAll('[data-brand-choice]').forEach(b=>b.onclick=()=>{
    const el=overlay.querySelector('#'+b.dataset.brandChoice);
    if(!el)return;el.value=b.dataset.brandValue;el.dispatchEvent(new Event('change',{bubbles:true}));
   });
  }
  function initialExactVariant(groups,product){
    const ref=String(product?.reference||'').trim();
    let group=groups.find(g=>g.id===product?.configGroup);
    // A catalogue card may have been moved to a different group. Prefer the
    // supplier's exact reference over an obsolete, cached group identifier.
    if(ref&&!(group?.variants||[]).some(v=>String(v.reference)===ref)){
      const match=groups.find(g=>(g.variants||[]).some(v=>String(v.reference)===ref));
      if(match)group=match;
    }
    const variant=ref?(group?.variants||[]).find(v=>String(v.reference)===ref)||null:null;
    return {group,variant};
  }
  async function openBette(p,roomId){
    const data=await loadJson(BRAND_META.Bette);const groups=data.groups||[];if(!groups.length)throw new Error('Catalogue Bette vide.');
    const original=initialExactVariant(groups,p);
    const selected=original.variant;
    const draft={group:original.group?.id||p?.configGroup||'',model:selected?.model||'',dim:selected?dimLabel(selected):'',color:selected?.color||'Standard',option:selected?.option||'Standard',reference:selected?.reference||''};
    if(!groups.some(g=>g.id===draft.group))draft.group=groups.find(g=>g.family===p?.collection)?.id||groups[0].id;
    let overlay,step='families',kind='showers',groupSection='all';
    const category=(id)=>BETTE_TREE.find(x=>x.id===id)||BETTE_TREE[0];
    const openFamilies=()=>{
      step='families';
      const content='<div class="brand-path"><b>Produits Bette</b></div><div class="brand-category-grid">'+BETTE_TREE.map(x=>'<button type="button" data-bette-family="'+esc(x.id)+'"><b>'+esc(x.name)+'</b><small>Rubrique du site officiel</small></button>').join('')+'</div>'+
       (selected?'<button type="button" class="brand-restore-sku" data-bette-restore>Reprendre la configuration enregistrée · '+esc(selected.reference)+'</button>':'')+
       '<a class="brand-site-link" href="https://www.my-bette.com/fr/produits/" target="_blank" rel="noopener noreferrer">Catalogue officiel Bette</a>';
      overlay=overlay||mount(shell('Bette',content));overlay.innerHTML=shell('Bette',content);
      overlay.querySelector('.brand-config-close').onclick=close;overlay.querySelector('.brand-config-cancel').onclick=close;overlay.querySelector('.brand-config-confirm').style.display='none';
      overlay.querySelectorAll('[data-bette-family]').forEach(x=>x.onclick=()=>{kind=x.dataset.betteFamily;groupSection='all';openSections()});
      overlay.querySelector('[data-bette-restore]')?.addEventListener('click',()=>{step='config';render()});
    };
    const openFacet=(section,slug,label)=>{
      step='facet';const cat=category(kind);
      const all=kind==='design'?groups:groups.filter(g=>betteType(g)===kind),matching=all.filter(g=>betteFacetMatches(g,slug)),verified=matching.length>0;
      const shown=verified?matching:all;
      const subtitle=verified?'Le nom fabricant permet de retrouver '+matching.length+' famille(s) de cette sous-catégorie. Les autres familles restent dans le catalogue général.':
       'Le tarif ne contient pas de balise certifiant ce sous-filtre. Voici les familles de la catégorie principale, sans prétendre à un filtrage exact.';
      const content='<div class="brand-path"><button type="button" data-bette-back="sections">'+esc(cat.name)+'</button><span>›</span><b>'+esc(label)+'</b></div>'+
        '<p class="brand-note">'+esc(subtitle)+'</p><div class="brand-category-grid">'+shown.map(g=>
        '<button type="button" data-bette-group="'+esc(g.id)+'"><b>'+esc(g.family||g.id)+'</b><small>'+g.variants.length+' variantes tarifées</small></button>').join('')+'</div>'+
        '<a class="brand-site-link" href="'+esc(cat.url+'/'+slug)+'" target="_blank" rel="noopener noreferrer">Voir cette sous-catégorie sur le site officiel</a>';
      overlay=overlay||mount(shell('Bette',content));overlay.innerHTML=shell('Bette',content);
      overlay.querySelector('.brand-config-close').onclick=close;overlay.querySelector('.brand-config-cancel').onclick=close;
      overlay.querySelector('.brand-config-confirm').style.display='none';
      overlay.querySelector('[data-bette-back]').onclick=openSections;
      overlay.querySelectorAll('[data-bette-group]').forEach(x=>x.onclick=()=>{
        if(draft.group!==x.dataset.betteGroup){draft.group=x.dataset.betteGroup;draft.model=draft.dim=draft.color=draft.option=draft.reference='';}
        step='config';render()
      });
    };
    const openSections=()=>{
      step='sections';const cat=category(kind);
      const designSlugs=BETTE_TREE.find(x=>x.id==='design')?.sections?.[0]?.items.map(x=>x[1])||[];
      const dataGroups=kind==='design'?groups.filter(g=>designSlugs.some(slug=>betteFacetMatches(g,slug))):groups.filter(g=>betteType(g)===kind);
      const sections=cat.sections.map(x=>'<section class="brand-official-facets"><h3>'+esc(x.name)+'</h3><div class="brand-official-links">'+x.items.map(([name,slug])=>
         '<button type="button" data-bette-facet="'+esc(slug)+'" data-bette-facet-group="'+esc(x.name)+'">'+esc(name)+'</button>').join('')+'</div></section>').join('');
      const content='<div class="brand-path"><button data-bette-back="families">Produits</button><span>›</span><b>'+esc(cat.name)+'</b></div>'+
        '<p class="brand-note">Les filtres de type et de forme ci-dessous ouvrent les pages officielles. Le tarif importé ne contient pas toujours ces classifications : aucune correspondance n’est devinée.</p>'+sections+
        '<div class="brand-official-facets"><h3>Familles tarifées disponibles</h3><p class="brand-note">'+dataGroups.length+' familles classées à partir de la catégorie fournisseur.</p><div class="brand-category-grid">'+dataGroups.map(g=>
         '<button type="button" data-bette-group="'+esc(g.id)+'"><b>'+esc(g.family||g.id)+'</b><small>'+g.variants.length+' variantes tarifées</small></button>').join('')+
         '<button type="button" data-bette-unclassified><b>Autres références du tarif</b><small>Familles sans classement constructeur certifié</small></button></div></div>'+
         '<a class="brand-site-link" href="'+esc(cat.url)+'" target="_blank" rel="noopener noreferrer">Voir '+esc(cat.name)+' chez Bette</a>';
      overlay=overlay||mount(shell('Bette',content));overlay.innerHTML=shell('Bette',content);
      overlay.querySelector('.brand-config-close').onclick=close;overlay.querySelector('.brand-config-cancel').onclick=close;overlay.querySelector('.brand-config-confirm').style.display='none';
      overlay.querySelector('[data-bette-back]').onclick=openFamilies;
      overlay.querySelectorAll('[data-bette-facet]').forEach(button=>button.onclick=()=>openFacet(button.dataset.betteFacetGroup,button.dataset.betteFacet,button.textContent));
      overlay.querySelectorAll('[data-bette-group]').forEach(x=>x.onclick=()=>{if(draft.group!==x.dataset.betteGroup){draft.group=x.dataset.betteGroup;draft.model=draft.dim=draft.color=draft.option=draft.reference='';}step='config';render()});
      overlay.querySelector('[data-bette-unclassified]').onclick=()=>{step='unclassified';openUnclassified()};
    };
    const openUnclassified=()=>{
      const unknown=groups.filter(g=>betteType(g)==='unclassified');
      const content='<div class="brand-path"><button data-bette-back="sections">Produits</button><span>›</span><b>Autres références du tarif</b></div>'+
       '<p class="brand-note">Familles sans catégorie attestée par le tarif. Elles restent accessibles sans attribution fictive à une rubrique du site.</p>'+
       '<div class="brand-category-grid">'+unknown.map(g=>'<button type="button" data-bette-group="'+esc(g.id)+'"><b>'+esc(g.family||g.id)+'</b><small>'+g.variants.length+' variantes</small></button>').join('')+'</div>';
      overlay=overlay||mount(shell('Bette',content));overlay.innerHTML=shell('Bette',content);
      overlay.querySelector('.brand-config-close').onclick=close;overlay.querySelector('.brand-config-cancel').onclick=close;overlay.querySelector('.brand-config-confirm').style.display='none';
      overlay.querySelector('[data-bette-back]').onclick=openSections;
      overlay.querySelectorAll('[data-bette-group]').forEach(x=>x.onclick=()=>{if(draft.group!==x.dataset.betteGroup){draft.group=x.dataset.betteGroup;draft.model=draft.dim=draft.color=draft.option=draft.reference='';}step='config';render()});
    };
    const render=()=>{
      const g=groups.find(x=>x.id===draft.group)||groups[0],all=g.variants||[];
      const models=uniq(all.map(v=>v.model));draft.model=chosen(draft.model,models);let rows=all.filter(v=>v.model===draft.model);
      const dims=uniq(rows.map(dimLabel));draft.dim=chosen(draft.dim,dims);rows=rows.filter(v=>dimLabel(v)===draft.dim);
      const colors=uniq(rows.map(v=>v.color||'Standard'));draft.color=chosen(draft.color,colors);rows=rows.filter(v=>(v.color||'Standard')===draft.color);
      const opts=uniq(rows.map(v=>v.option||'Standard'));draft.option=chosen(draft.option,opts);rows=rows.filter(v=>(v.option||'Standard')===draft.option);
      const refs=rows.map(v=>v.reference);draft.reference=chosen(draft.reference,refs);const exact=rows.find(v=>v.reference===draft.reference)||rows[0];
      const body=`<div class="brand-path"><button class="bette-back-to-families" type="button">← Familles</button><span>›</span><b>${esc(g.family)}</b></div><div class="recor-config-section"><div class="recor-config-title"><b>1. Produit</b><span>Famille Bette</span></div><div class="v1146-field-grid">${field('bcGroup','Produit',groups.map(x=>x.id),g.id,id=>groups.find(x=>x.id===id)?.family||id)}${field('bcModel','Version',models,draft.model)}${field('bcDim','Dimensions',dims,draft.dim)}${field('bcColor','Couleur',colors,draft.color)}${field('bcOption','Option / équipement',opts,draft.option)}${field('bcRef','Référence finale',refs,draft.reference)}</div></div>
      <div class="recor-config-summary">${mediaPreview('Bette',p,g,exact)}<div><b>${money(exact?.price)} HT</b><span>${esc(exact?.designation||g.family)}</span><small>Réf. ${esc(exact?.reference||'—')} · tarif Bette</small></div></div>`;
      overlay=overlay||mount(shell('Bette',body));if(overlay.innerHTML!==shell('Bette',body))overlay.innerHTML=shell('Bette',body);
      overlay.querySelector('.brand-config-close').onclick=close;overlay.querySelector('.brand-config-cancel').onclick=close;
      overlay.querySelector('.bette-back-to-families').onclick=openFamilies;
      const map={bcGroup:'group',bcModel:'model',bcDim:'dim',bcColor:'color',bcOption:'option',bcRef:'reference'};
      Object.entries(map).forEach(([id,key])=>{const el=overlay.querySelector('#'+id);if(el)el.onchange=()=>{draft[key]=el.value;if(key==='group'){draft.model=draft.dim=draft.color=draft.option=draft.reference=''}else if(key==='model'){draft.dim=draft.color=draft.option=draft.reference=''}else if(key==='dim'){draft.color=draft.option=draft.reference=''}else if(key==='color'){draft.option=draft.reference=''}else if(key==='option'){draft.reference=''}render()}});
      overlay.querySelector('.brand-config-confirm').onclick=()=>{try{
        const selected=rows.find(v=>v.reference===draft.reference)||exact;if(!selected)throw new Error('Référence Bette introuvable.');
        const price=verifiedPublicPrice('Bette',selected);
        const media=mediaFor('Bette',p,g,selected);
        const configured={manufacturer:'Bette',collection:g.family,reference:selected.reference,base:selected.reference,designation:selected.designation,category:selected.category,finish:[selected.color,selected.option].filter(Boolean).join(' · '),price,totalPrice:price,currency:'€',vat:'HT',source:'TARIF BETTE.csv',sourceYear:2026,manufacturerUrl:media.manufacturerUrl,image:media.image||media.representativeImage,imageSource:media.image?'Visuel exact fabricant':'Visuel de collection · finition illustrative',imageFinishMatch:media.image?'exact':media.representativeImage?'collection':'missing',technicalSheetUrl:media.technicalSheetUrl,purchaseDiscount:50,configuratorType:'bette-configured'};
        commitConfigured(configured,roomId,'betteConfiguration',{group:g.id,family:g.family,model:selected.model,lengthMm:selected.lengthMm,widthMm:selected.widthMm,heightMm:selected.heightMm,color:selected.color,option:selected.option,reference:selected.reference});
      }catch(e){overlay.querySelector('.recor-config-error').textContent=e.message||String(e)}};
    };
    openFamilies();
  }

  async function openCarrodrain(p,roomId){
    const data=await loadJson(BRAND_META.Carrodrain);const groups=data.groups||[];if(!groups.length)throw new Error('Catalogue Carrodrain vide.');
    const original=initialExactVariant(groups,p),selected=original.variant;
    const draft={group:original.group?.id||p?.configGroup||'',version:selected?.version||'',length:selected?.length||'',finish:selected?.finish||'',reference:selected?.reference||''};
    if(!groups.some(g=>g.id===draft.group))draft.group=groups.find(g=>g.model===p?.collection)?.id||groups[0].id;
    let overlay,mode='families',family='Essentials';
    const familyView=()=>{
      mode='families';const cards=CARRODRAIN_TREE.map(x=>{
        const names=CARRODRAIN_MODELS.filter(m=>m.family===x.id);
        return '<button type="button" class="carrodrain-family-card" data-carrodrain-family="'+esc(x.id)+'">'+
          (names[0]?.image?'<img src="'+esc(names[0].image)+'" alt="" loading="lazy">':'')+
          '<b>'+esc(x.name)+'</b><small>'+esc(x.description)+' · '+names.length+' modèles</small></button>';
      }).join('');
      const body='<div class="brand-path"><strong>Carrodrain</strong><span>›</span><strong>Gammes de produits</strong></div>'+
        '<div class="carrodrain-family-grid">'+cards+'</div>'+
        '<p class="brand-note">Essentials, Invisibles et Liquids sont les trois familles du site Carrodrain. Les accessoires sont regroupés séparément pour faciliter la consultation.</p>'+
        (selected?'<button class="brand-restore-sku" type="button" data-carrodrain-restore>Reprendre la configuration enregistrée · '+esc(selected.reference)+'</button>':'')+
        '<a class="brand-site-link" href="https://carrodrain.com/fr" target="_blank" rel="noopener noreferrer">Site officiel Carrodrain</a>';
      overlay=overlay||mount(shell('Carrodrain',body));overlay.innerHTML=shell('Carrodrain',body);
      overlay.querySelector('.recor-configurator').classList.add('carrodrain-gallery-modal');
      overlay.querySelector('.brand-config-close').onclick=close;overlay.querySelector('.brand-config-cancel').onclick=close;
      overlay.querySelector('.brand-config-confirm').style.display='none';
      overlay.querySelectorAll('[data-carrodrain-family]').forEach(el=>el.onclick=()=>{family=el.dataset.carrodrainFamily;mode='gallery';gallery()});
      overlay.querySelector('[data-carrodrain-restore]')?.addEventListener('click',()=>{family=carrodrainVisual(groups.find(g=>g.id===draft.group))?.family||'Essentials';mode='configure';render()});
    };
    const gallery=()=>{
      const body='<div class="brand-path"><button type="button" data-carrodrain-back="families">Gammes</button><span>›</span><b>'+esc(family)+'</b></div>'+
       carrodrainGallery(groups,draft.group,family);
      overlay=overlay||mount(shell('Carrodrain',body));
      overlay.innerHTML=shell('Carrodrain',body);
      overlay.querySelector('.recor-configurator').classList.add('carrodrain-gallery-modal');
      overlay.querySelector('.brand-config-close').onclick=close;
      overlay.querySelector('.brand-config-cancel').onclick=close;
      overlay.querySelector('.brand-config-confirm').style.display='none';
      overlay.querySelector('[data-carrodrain-back]').onclick=familyView;
      overlay.querySelectorAll('[data-carrodrain-group]').forEach(el=>el.onclick=()=>{
        const changed=draft.group!==el.dataset.carrodrainGroup;
        draft.group=el.dataset.carrodrainGroup;
        if(changed)draft.version=draft.length=draft.finish=draft.reference='';
        mode='configure';render();
      });
    };
    const render=()=>{
      if(mode==='gallery'){gallery();return;}
      const g=groups.find(x=>x.id===draft.group)||groups[0],all=g.variants||[];
      const versions=uniq(all.map(v=>v.version));draft.version=chosen(draft.version,versions);let rows=all.filter(v=>v.version===draft.version);
      const lengths=uniq(rows.map(v=>v.length));draft.length=chosen(draft.length,lengths);rows=rows.filter(v=>v.length===draft.length);
      const finishes=uniq(rows.map(v=>v.finish||'À carreler'));draft.finish=chosen(draft.finish,finishes);rows=rows.filter(v=>(v.finish||'À carreler')===draft.finish);
      const refs=rows.map(v=>v.reference);draft.reference=chosen(draft.reference,refs);const exact=rows.find(v=>v.reference===draft.reference)||rows[0];
      const body=`<div class="brand-path"><button type="button" class="carrodrain-back-to-gallery">← ${esc(family)}</button><span>›</span><b>${esc(g.model||g.id)}</b></div><div class="recor-config-section"><div class="recor-config-title"><b>1. Collection</b><span>Caniveau Carrodrain</span></div><div class="v1146-field-grid">${field('ccGroup','Collection',groups.map(x=>x.id),g.id,id=>groups.find(x=>x.id===id)?.model||id)}${field('ccVersion','Version',versions,draft.version)}${field('ccLength','Longueur / format',lengths,draft.length,v=>/^\d+$/.test(v)?`${Number(v)/10} cm`:v)}${field('ccFinish','Finition',finishes,draft.finish)}${field('ccRef','Référence finale',refs,draft.reference)}</div></div>
      <div class="recor-config-summary">${mediaPreview('Carrodrain',p,g,exact)}<div><b>${money(exact?.price)} HT</b><span>${esc([g.model,draft.version,draft.length,draft.finish].filter(Boolean).join(' · '))}</span><small>Réf. ${esc(exact?.reference||'—')} · tarif Carrodrain 2027</small></div></div>`;
      overlay=overlay||mount(shell('Carrodrain',body));if(overlay.innerHTML!==shell('Carrodrain',body))overlay.innerHTML=shell('Carrodrain',body);
      overlay.querySelector('.brand-config-close').onclick=close;overlay.querySelector('.brand-config-cancel').onclick=close;
      overlay.querySelector('.recor-configurator').classList.remove('carrodrain-gallery-modal');
      overlay.querySelector('.carrodrain-back-to-gallery').onclick=()=>{mode='gallery';gallery()};
      const map={ccGroup:'group',ccVersion:'version',ccLength:'length',ccFinish:'finish',ccRef:'reference'};
      Object.entries(map).forEach(([id,key])=>{const el=overlay.querySelector('#'+id);if(el)el.onchange=()=>{draft[key]=el.value;if(key==='group'){draft.version=draft.length=draft.finish=draft.reference=''}else if(key==='version'){draft.length=draft.finish=draft.reference=''}else if(key==='length'){draft.finish=draft.reference=''}else if(key==='finish'){draft.reference=''}render()}});
      const versionTiles=choiceTiles('ccVersion',versions,draft.version);
      const finishTiles=choiceTiles('ccFinish',finishes,draft.finish);
      const fields=overlay.querySelector('.v1146-field-grid');
      if(versionTiles)overlay.querySelector('#ccVersion')?.closest('label')?.insertAdjacentHTML('afterend',versionTiles);
      if(finishTiles)overlay.querySelector('#ccFinish')?.closest('label')?.insertAdjacentHTML('afterend',finishTiles);
      wireChoices(overlay);
      overlay.querySelector('.brand-config-confirm').onclick=()=>{try{
        const selected=rows.find(v=>v.reference===draft.reference)||exact;if(!selected)throw new Error('Référence Carrodrain introuvable.');
        const price=verifiedPublicPrice('Carrodrain',selected);
        const media=mediaFor('Carrodrain',p,g,selected);
        const configured={manufacturer:'Carrodrain',collection:g.model,reference:selected.reference,base:selected.reference,designation:[g.model,selected.version,selected.length,selected.finish].filter(Boolean).join(' · '),category:'Caniveau de douche',finish:selected.finish||'',price,totalPrice:price,currency:'€',vat:'HT',source:'CD.L2027.pdf',sourceYear:2027,manufacturerUrl:media.manufacturerUrl,image:media.image||media.representativeImage,imageSource:media.image?'Visuel exact fabricant':'Visuel de collection Carrodrain · finition illustrative',imageFinishMatch:media.image?'exact':'collection',technicalSheetUrl:media.technicalSheetUrl,technicalSheetLabel:media.technicalScope==='exact-version'?'Fiche technique Carrodrain '+selected.version:'Fiche technique Carrodrain · famille',installationGuideUrl:media.installationGuideUrl,installationGuideLabel:'Notice de pose Carrodrain · famille',purchaseDiscount:50,configuratorType:'carrodrain-configured'};
        commitConfigured(configured,roomId,'carrodrainConfiguration',{group:g.id,model:g.model,version:selected.version,length:selected.length,finish:selected.finish,reference:selected.reference});
      }catch(e){overlay.querySelector('.recor-config-error').textContent=e.message||String(e)}};
    };
    familyView();
  }

  function initialHidroboxDraft(groups,product){
    const original=initialExactVariant(groups,product),v=original.variant;
    // An existing Hidrobox product can represent any of the 4,479
    // configured rows. Reopening must not silently reset it to the first
    // material, dimension, finish, colour or price in its family.
    let group=original.group?.id||product?.configGroup||'';
    if(!groups.some(g=>g.id===group))group=groups.find(g=>g.collection===product?.collection)?.id||groups[0]?.id||'';
    return {group,material:v?.material||'',width:v?.width||'',length:v?.length||'',finish:v?.finish||'',colorGroup:v?.colorGroup||'',reference:v?.reference||''};
  }
  async function openHidrobox(p,roomId){
    const data=await loadJson(BRAND_META.Hidrobox);const groups=data.groups||[];if(!groups.length)throw new Error('Catalogue Hidrobox vide.');
    const draft=initialHidroboxDraft(groups,p);
    let overlay;
    const displayBlank=v=>v||'Non précisé dans la matrice';
    const render=()=>{
      const g=groups.find(x=>x.id===draft.group)||groups[0],all=g.variants||[];let rows=all;
      const cascade=(fieldName,draftKey)=>{const vals=uniq(rows.map(v=>v[fieldName]||''));draft[draftKey]=chosen(draft[draftKey],vals);rows=rows.filter(v=>(v[fieldName]||'')===draft[draftKey]);return vals};
      const materials=cascade('material','material'),widths=cascade('width','width'),lengths=cascade('length','length'),finishes=cascade('finish','finish'),colors=cascade('colorGroup','colorGroup');
      const refs=rows.map(v=>v.reference);draft.reference=chosen(draft.reference,refs);const exact=rows.find(v=>v.reference===draft.reference)||rows[0];
      const colorLabel=v=>({'BLA':'Blanc / Scene','BAS':'Kromat · Standard Basics','TRE':'Kromat · Standard Trends','SPE':'Kromat · Specials RAL/NCS','':''}[v]||v);
      const body=`<div class="recor-config-section"><div class="recor-config-title"><b>1. Produit</b><span>Matrice tarifaire Hidrobox 2026</span></div><div class="v1146-field-grid">${field('hcGroup','Collection',groups.map(x=>x.id),g.id,id=>groups.find(x=>x.id===id)?.collection||id)}${materials.some(Boolean)?field('hcMaterial','Matière',materials,draft.material,displayBlank):''}${widths.some(Boolean)?field('hcWidth','Largeur',widths,draft.width,displayBlank):''}${lengths.some(Boolean)?field('hcLength','Longueur',lengths,draft.length,displayBlank):''}${finishes.some(Boolean)?field('hcFinish','Texture / finition',finishes,draft.finish,displayBlank):''}${colors.some(Boolean)?field('hcColor','Groupe couleur',colors,draft.colorGroup,colorLabel):''}${field('hcRef','Référence finale',refs,draft.reference)}</div></div>
      <div class="recor-config-summary">${mediaPreview('Hidrobox',p,g,exact)}<div><b>${money(exact?.price)} HT</b><span>${esc([g.collection,draft.material,draft.width,draft.length,draft.finish,colorLabel(draft.colorGroup)].filter(Boolean).join(' · '))}</span><small>Réf. ${esc(exact?.reference||'—')} · tarif source ${money(exact?.rawPrice)} + 4 %</small></div></div>
      <p class="sbordoni-image-note">Le prix public Hydropolis applique automatiquement +4 % au tarif Hidrobox fourni. La remise d’achat fournisseur reste gérée séparément à 50 %.</p>`;
      overlay=overlay||mount(shell('Hidrobox',body));if(overlay.innerHTML!==shell('Hidrobox',body))overlay.innerHTML=shell('Hidrobox',body);
      overlay.querySelector('.brand-config-close').onclick=close;overlay.querySelector('.brand-config-cancel').onclick=close;
      const map={hcGroup:'group',hcMaterial:'material',hcWidth:'width',hcLength:'length',hcFinish:'finish',hcColor:'colorGroup',hcRef:'reference'};
      Object.entries(map).forEach(([id,key])=>{const el=overlay.querySelector('#'+id);if(el)el.onchange=()=>{draft[key]=el.value;const order=['group','material','width','length','finish','colorGroup','reference'],idx=order.indexOf(key);for(let i=idx+1;i<order.length;i++)draft[order[i]]='';render()}});
      overlay.querySelector('.brand-config-confirm').onclick=()=>{try{
        const selected=rows.find(v=>v.reference===draft.reference)||exact;if(!selected)throw new Error('Référence Hidrobox introuvable.');
        const colorLabel2=({'BLA':'Blanc / Scene','BAS':'Kromat · Standard Basics','TRE':'Kromat · Standard Trends','SPE':'Kromat · Specials RAL/NCS'}[selected.colorGroup]||selected.colorGroup||'');
        const designation=[g.collection,selected.material,selected.width&&`Larg. ${selected.width} cm`,selected.length&&`Long. ${selected.length} cm`,selected.finish,colorLabel2].filter(Boolean).join(' · ');
        const price=verifiedPublicPrice('Hidrobox',selected);
        const media=mediaFor('Hidrobox',p,g,selected);
        const configured={manufacturer:'Hidrobox',collection:g.collection,reference:selected.reference,base:selected.reference,designation,category:g.category,finish:[selected.finish,colorLabel2].filter(Boolean).join(' · '),price,totalPrice:price,currency:'€',vat:'HT',source:'HIDROBOX_TARIF_FR_V0226_19-02-2026.pdf',sourceYear:2026,rawTariffPrice:selected.rawPrice,listPriceUpliftPct:4,manufacturerUrl:media.manufacturerUrl,image:media.image,technicalSheetUrl:media.technicalSheetUrl,purchaseDiscount:50,configuratorType:'hidrobox-configured'};
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
  root.HydroBrandCatalogs={load:loadCatalogs,verifiedPublicPrice,initialExactVariant,initialHidroboxDraft,betteTree:BETTE_TREE,betteType,betteFacetMatches,carrodrainTree:CARRODRAIN_TREE};
  root.HydroBetteConfigurator={eligible:p=>eligibleBrand('Bette',p),open:openBette,close};
  root.HydroCarrodrainConfigurator={eligible:p=>eligibleBrand('Carrodrain',p),open:openCarrodrain,close,models:CARRODRAIN_MODELS};
  root.HydroHidroboxConfigurator={eligible:p=>eligibleBrand('Hidrobox',p),open:openHidrobox,close,groups:async()=>((await loadJson(BRAND_META.Hidrobox)).groups||[])};
})(window);