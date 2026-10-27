/* Hydropolis Hidrobox guided configurator 11.62.2.
 * Product-family > collection > options/size > real supplier reference/price.
 * All priced Neo Plus variants use official 2026 list source and +4% pricing rule.
 */
(function(root){
'use strict';
const base=root.HydroHidroboxConfigurator;
const catalogue=root.HydroNeoPlus2026;
if(!base||!catalogue)return;
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const eu=n=>Number(n).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
const HOUSE='https://hidrobox.com/fr/';
const TECH='https://hidrobox.com/wp-content/uploads/2025/01/ES_NeoPlus_FactSheet.pdf';
const MANUAL='https://hidrobox.com/wp-content/uploads/2025/07/mus_247_NeoPlus_Shower_Tray_0223-03.pdf';
const CATEGORY=[
  {key:'receveurs',name:'Receveurs de douche',img:'https://hidrobox.com/wp-content/uploads/2025/03/01_Platos-de-ducha_Hidrobox.png',url:HOUSE+'produit/receveurs-de-douche/'},
  {key:'panneaux',name:'Panneaux',img:'https://hidrobox.com/wp-content/uploads/2025/05/02_Paneles_Hidrobox.png',url:HOUSE+'produit/panneaux/'},
  {key:'vasques-a-poser',name:'Vasques à poser',img:'https://hidrobox.com/wp-content/uploads/2025/03/05_Lavabos-de-apoyo_Hidrobox.png',url:HOUSE+'produit/vasques-a-poser/'},
  {key:'vasques-suspendues',name:'Vasques suspendues',img:'https://hidrobox.com/wp-content/uploads/2025/05/04_Lavabos-suspendidos_Hidrobox-1.png',url:HOUSE+'produit/vasques-suspendus/'},
  {key:'vasques-sur-pied',name:'Vasques sur pied',img:'https://hidrobox.com/wp-content/uploads/2025/05/06_Lavabos-a-suelo_Hidrobox.png',url:HOUSE+'produit/vasques-sur-pied/'},
  {key:'plans',name:'Plans de travail',img:'https://hidrobox.com/wp-content/uploads/2025/03/pro4.png',url:HOUSE+'produit/plans-de-travail/'},
  {key:'bains-ilot',name:'Baignoires îlot',img:'https://hidrobox.com/wp-content/uploads/2025/03/08_Baneras-exentas_Hidrobox.png',url:HOUSE+'produit/baignoires-ilot/'},
  {key:'bains-encastres',name:'Baignoires encastrées',img:'https://hidrobox.com/wp-content/uploads/2025/05/09_Baneras-encastradas_Hidrobox.png',url:HOUSE+'produit/baignoires-encastrees/'},
  {key:'accessoires',name:'Accessoires',img:'https://hidrobox.com/wp-content/uploads/2025/03/ACCESORIOS-HIDROBOX-1.png',url:HOUSE+'produit/accessoires/'},
  {key:'autres',name:'Autres références tarifées',img:'',url:HOUSE},
  {key:'toutes',name:'Toutes les collections tarifées',img:'',url:HOUSE}
];
const SHOWER_MODELS=['neo plus','line','twins','quadro','one','pure','arq','loovers','unique','iconik','falcon'];

/* Official Hidrobox 2026 categories, verified from the brand's own category pages. */
const HIDROBOX_ALL_OFFICIAL=[
 ...['neo-plus','line','twins','quadro','one','pure','arq','loovers','unique','iconik','falcon'].map(slug=>({key:slug,name:slug.split('-').map(v=>v[0].toUpperCase()+v.slice(1)).join(' '),category:'receveurs',url:HOUSE+'collections/'+slug+'/'})),
 {key:'paneles',name:'Panneaux muraux',category:'panneaux'},
 {key:'estantes',name:'Étagères',category:'accessoires'},
 {key:'hornacinas',name:'Niches',category:'accessoires'},
 {key:'totems',name:'Totems',category:'accessoires'},
 ...['program','program-colour','lom','guest','swap','titan','soul','civit','intim'].map(slug=>({key:slug,name:slug.split('-').map(v=>v[0].toUpperCase()+v.slice(1)).join(' '),category:'vasques-suspendues'})),
 {key:'spot',name:'Spot',category:'vasques-a-poser'},
 {key:'fs',name:'FS',category:'vasques-sur-pied'},
 {key:'artop',name:'Artop',category:'plans'},
 {key:'space',name:'Space',category:'bains-ilot'},
 {key:'beta-essential',name:'Beta Essential',category:'bains-ilot'},
 {key:'beta-evoque',name:'Beta Evoque',category:'bains-ilot'},
 {key:'beta-fusion',name:'Beta Fusion',category:'bains-encastres'}
].map(x=>({...x,url:x.url||(x.key==='intim'||x.key==='falcon'?HOUSE+'produit/'+(x.key==='falcon'?'receveurs-de-douche/':'vasques-suspendus/'):HOUSE+'collections/'+x.key+'/')}));
const HIDROBOX_OFFICIAL_BY_NAME=new Map(HIDROBOX_ALL_OFFICIAL.map(x=>[x.name.toLowerCase(),x]));

const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function groupCategory(g){
 const name=norm(g.collection||g.family||g.model||g.id),category=norm(g.category);
 const official=HIDROBOX_ALL_OFFICIAL.find(x=>norm(x.name)===name||norm(x.key)===name);
 if(official){
   if(official.key==='beta-evoque'&&/encastr/.test(category))return 'bains-encastres';
   return official.category;
 }
 if(SHOWER_MODELS.some(n=>name===n||name.startsWith(n+' '))||/receveur|douche|shower tray/.test(category))return 'receveurs';
 if(/panneau|panel/.test(name+' '+category))return 'panneaux';
 if(/accessoire|etager|niche/.test(name+' '+category))return 'accessoires';
 if(/vasque|lavabo|basin/.test(name+' '+category)){
  if(/suspend|mur|wall/.test(name+' '+category))return 'vasques-suspendues';
  if(/sur pied|totem|freestanding/.test(name+' '+category))return 'vasques-sur-pied';
  return 'vasques-a-poser';
 }
 if(/plan|plateau|countertop|worktop/.test(name+' '+category))return 'plans';
 if(/bain|baignoire|bathtub|bath/.test(name+' '+category))return /encastr|built/.test(name+' '+category)?'bains-encastres':'bains-ilot';
 return 'autres';
}
const SHOWER_CATALOG=['Neo Plus','Line','Twins','Quadro','One','Pure','Arq','Loovers','Unique','Iconik','Falcon'];
let overlay=null,room='',groups=[],stage='families',cat='receveurs',chosenGroup=null,original=null,neo={form:'rectangle',material:'Kromat',group:'BAS',width:90,length:120,texture:'Lisse',color:'Bianco',grille:'Point Inox',bonde:'Horizontale standard'};
function close(){overlay?.remove();overlay=null}
function shell(title,content,wide=false){
 if(!overlay){overlay=document.createElement('div');overlay.id='hidroboxGuided';overlay.className='recor-configurator-overlay';document.body.appendChild(overlay);overlay.addEventListener('click',e=>{if(e.target===overlay)close()});}
 overlay.innerHTML='<section class="recor-configurator hidrobox-guide'+(wide?' hidrobox-guide-wide':'')+'" role="dialog" aria-modal="true" aria-label="Hidrobox">'+
  '<div class="recor-config-head"><div><div class="eyebrow">Hidrobox · configurateur guidé</div><h2>'+escape(title)+'</h2><p>Famille → collection → configuration → référence et prix</p></div><button class="icon hidrobox-close" type="button" aria-label="Fermer">×</button></div>'+content+'</section>';
 overlay.querySelector('.hidrobox-close').onclick=close;
}
function tiles(rows,kind){
 return '<div class="hidrobox-guide-grid">'+rows.map(x=>{
  const picture=x.img?'<img src="'+escape(x.img)+'" alt="" loading="lazy" onerror="this.style.display=\'none\'">':'<div class="hidrobox-guide-no-image">HIDROBOX</div>';
  return '<button type="button" class="hidrobox-guide-tile" data-kind="'+escape(kind)+'" data-choice="'+escape(x.key)+'">'+picture+'<span class="hidrobox-guide-tile-name">'+escape(x.name)+'</span>'+(x.note?'<small>'+escape(x.note)+'</small>':'')+'</button>';
 }).join('')+'</div>';
}
function families(){
 stage='families';
 shell('Choisir un type de produit',tiles(CATEGORY.filter(c=>c.key!=='autres'||groups.some(g=>groupCategory(g)==='autres')),'family')+
 '<p class="hidrobox-guide-note">Les catégories reprennent la navigation du fabricant. Les collections sans prix importé restent accessibles sur son site.</p>',true);
 overlay.querySelectorAll('[data-kind=family]').forEach(b=>b.onclick=()=>{cat=b.dataset.choice;collections()});
}
function collections(){
 stage='collections';const family=CATEGORY.find(x=>x.key===cat);
 const priced=cat==='toutes'?groups:groups.filter(x=>groupCategory(x)===cat);
 const cards=priced.map(g=>({key:g.id,name:g.collection||g.family||g.model||g.id,img:CATEGORY.find(c=>c.key===groupCategory(g))?.img||family?.img,note:(g.variants?.length||0)+' déclinaisons · tarif source'}));

 const have=new Set(cards.map(x=>norm(x.name)));
 const officialEntries=HIDROBOX_ALL_OFFICIAL.filter(x=>x.category===cat||cat==='toutes');
 for(const entry of officialEntries){
   if(have.has(norm(entry.name)))continue;
   cards.push({key:'official-'+entry.key,name:entry.name,img:CATEGORY.find(c=>c.key===entry.category)?.img,note:'Collection officielle · tarif non importé'});
 }

 shell(family?.name||'Collections','<button class="hidrobox-back" type="button">← Familles</button>'+tiles(cards,'collection')+
 '<p class="hidrobox-guide-note">Illustrations de familles provenant du site Hidrobox. Les visuels exacts de chaque collection restent à associer.</p>'+
 '<a class="hidrobox-official-link" href="'+escape(family?.url||HOUSE)+'" target="_blank" rel="noopener noreferrer">Voir toutes les collections sur le site officiel</a>',true);
 overlay.querySelector('.hidrobox-back').onclick=families;
 overlay.querySelectorAll('[data-kind=collection]').forEach(b=>b.onclick=()=>{
   const key=b.dataset.choice;
   const group=groups.find(x=>x.id===key);
   if(norm(group?.collection||group?.id||key)==='neo plus'||key==='neo-plus-official'||norm(group?.collection)==='neo plus'){neoPage();return;}
   if(!group){
     const entry=HIDROBOX_ALL_OFFICIAL.find(x=>'official-'+x.key===key);
     if(entry)root.open(entry.url,'_blank','noopener');
     return;
   }
   universalPage(group);
 });
}

/* Manufacturer-direct technical sheets, only where their URLs were verified. */
const HIDROBOX_DOCUMENTS={
  'neo plus':{technical:'https://hidrobox.com/wp-content/uploads/2025/01/ES_NeoPlus_FactSheet.pdf',manual:'https://hidrobox.com/wp-content/uploads/2025/07/mus_247_NeoPlus_Shower_Tray_0223-03.pdf'},
  line:{technical:'https://hidrobox.com/wp-content/uploads/2025/05/ES_Line_FactSheet.pdf',manual:'https://hidrobox.com/wp-content/uploads/2025/07/mus_220_Line_Shower_Tray_0223-07.pdf'},
  twins:{technical:'https://hidrobox.com/wp-content/uploads/ES_Twins_Showertray_Factsheet_2026-1.pdf',manual:'https://hidrobox.com/wp-content/uploads/2025/07/mus_240_Twin_Shower_Tray_0624-07.pdf'},
  quadro:{technical:'https://hidrobox.com/wp-content/uploads/ES_Quadro_Showertray_Factsheet_2026.pdf',manual:'https://hidrobox.com/wp-content/uploads/2025/07/mus_221_Quadro_Shower_Tray_0223-07.pdf'},
  one:{technical:'https://hidrobox.com/wp-content/uploads/ES_One_Showertray_Factsheet_2026.pdf',manual:'https://hidrobox.com/wp-content/uploads/2025/07/mus_213_One_Shower_Tray_0223-12.pdf'},
  pure:{technical:'https://hidrobox.com/wp-content/uploads/ES_Pure_Showertray_Factsheet_2026.pdf',manual:'https://hidrobox.com/wp-content/uploads/2025/07/mus_270_Pure_Shower_Tray_0223-01.pdf'},
  loovers:{technical:'https://hidrobox.com/wp-content/uploads/ES_Loovers_Showertray_Factsheet_2026.pdf',manual:'https://hidrobox.com/wp-content/uploads/2025/07/mus_297_Loovers_Shower_Tray_0325-01.pdf'},
  unique:{technical:'https://hidrobox.com/wp-content/uploads/ES_Unique_Showertray_Factsheet_2026.pdf',manual:'https://hidrobox.com/wp-content/uploads/2025/07/mus_218_Unique_Shower_Tray_0223-06.pdf'},
  iconik:{technical:'https://hidrobox.com/wp-content/uploads/ES_Iconik_Showertray_Factsheet_2026.pdf',manual:'https://hidrobox.com/wp-content/uploads/2025/07/mus_269_Iconik_Shower_Tray_0323-03.pdf'},
  program:{technical:'https://hidrobox.com/wp-content/uploads/2025/05/ES_Program_FactSheet.pdf',manual:'https://hidrobox.com/wp-content/uploads/2025/07/mus_226_Program_Washbasin_0125-9.pdf'},
  'program colour':{technical:'https://hidrobox.com/wp-content/uploads/2025/05/ES_ProgramColour_FactSheet.pdf',manual:'https://hidrobox.com/wp-content/uploads/2025/07/mus_243_Program_Colour_Washbasin_0323-3.pdf'},
  lom:{technical:'https://hidrobox.com/wp-content/uploads/ES_Lom_Washbasin_Factsheet_2026.pdf',manual:'https://hidrobox.com/wp-content/uploads/2025/07/mus_278_Lom_Washbasin_0323-1.pdf'},
  guest:{technical:'https://hidrobox.com/wp-content/uploads/ES_Guest_Washbasin_Factsheet_2026.pdf',manual:'https://hidrobox.com/wp-content/uploads/2025/07/mus_262_Guest_Washbasin_0324-4.pdf'},
  swap:{technical:'https://hidrobox.com/wp-content/uploads/ES_Swap_Washbasin_Factsheet_2026.pdf',manual:'https://hidrobox.com/wp-content/uploads/2025/07/Mus_272_Swap_Washbasin_0425-2.pdf'},
  titan:{technical:'https://hidrobox.com/wp-content/uploads/ES_Titan_Washbasin_Factsheet_2026.pdf',manual:'https://hidrobox.com/wp-content/uploads/2025/07/mus_283_Titan_Washbasin_0524-3.pdf'},
  soul:{technical:'https://hidrobox.com/wp-content/uploads/ES_Soul_Washbasin_Factsheet_2026.pdf',manual:'https://hidrobox.com/wp-content/uploads/2025/07/mus_296_Soul_Washbasin_0725-2.pdf'},
  civit:{technical:'https://hidrobox.com/wp-content/uploads/ES_Civit_Washbasin_Factsheet_2026.pdf',manual:'https://hidrobox.com/wp-content/uploads/2025/07/mus_280_Civit_Washbasin_0424-2.pdf'},
  spot:{technical:'https://hidrobox.com/wp-content/uploads/ES_Spot_Washbasin_Factsheet_2026.pdf'},
  fs:{technical:'https://hidrobox.com/wp-content/uploads/ES_FS_Washbasin_Factsheet_2026.pdf',manual:'https://hidrobox.com/wp-content/uploads/2025/07/mus_228_FS_Washbasin_0125-6.pdf'},
  artop:{technical:'https://hidrobox.com/wp-content/uploads/ES_Artop_Washbasin_Factsheet_2026.pdf',manual:'https://hidrobox.com/wp-content/uploads/2025/07/mus_242_Artop_0323-3.pdf'},
  space:{technical:'https://hidrobox.com/wp-content/uploads/ES_Space_Bathtubs_Factsheet_2026.pdf',manual:'https://hidrobox.com/wp-content/uploads/2025/07/Mus_142_Space_Bathtubs_0623-8.pdf'},
  'beta essential':{technical:'https://hidrobox.com/wp-content/uploads/ES_Beta-Essential_Bathtubs_Factsheet_2026.pdf',manual:'https://hidrobox.com/wp-content/uploads/2025/07/Mus_144_Beta_Essential_Bathtubs_0723-10.pdf'},
  'beta evoque':{technical:'https://hidrobox.com/wp-content/uploads/ES_Beta-Evoque_Bathtubs_Factsheet_2026.pdf',manual:'https://hidrobox.com/wp-content/uploads/2025/07/Mus_294_Beta_Evoque_Bathtubs_1224-1.pdf'},
  'beta fusion':{technical:'https://hidrobox.com/wp-content/uploads/ES_Beta-Fusion_Bathtubs_Factsheet_2026.pdf',manual:'https://hidrobox.com/wp-content/uploads/2025/07/Mus_145_Beta_Fusion_Bathtubs_0723-7.pdf'},
  'panneaux muraux':{technical:'https://hidrobox.com/wp-content/uploads/ES_Paneles_Accessories_Factsheet_2026.pdf',manual:'https://hidrobox.com/wp-content/uploads/2025/07/mus_179_Paneles_0323-07.pdf'},
  'paneles':{technical:'https://hidrobox.com/wp-content/uploads/ES_Paneles_Accessories_Factsheet_2026.pdf',manual:'https://hidrobox.com/wp-content/uploads/2025/07/mus_179_Paneles_0323-07.pdf'},
  etageres:{technical:'https://hidrobox.com/wp-content/uploads/ES_Estantes-para-ducha_Accessories_Factsheet_2026.pdf'},
  estantes:{technical:'https://hidrobox.com/wp-content/uploads/ES_Estantes-para-ducha_Accessories_Factsheet_2026.pdf'},
  niches:{technical:'https://hidrobox.com/wp-content/uploads/ES_Hornacinas-independientes_Accessories_Factsheet_2026.pdf'},
  hornacinas:{technical:'https://hidrobox.com/wp-content/uploads/ES_Hornacinas-independientes_Accessories_Factsheet_2026.pdf'},
  totems:{technical:'https://hidrobox.com/wp-content/uploads/ES_Totems_Accessories_Factsheet_2026.pdf',manual:'https://hidrobox.com/wp-content/uploads/2025/07/mus_181_Totem_Auxiliar_Exento_0624-05.pdf'}

};
const FACE_KEYS=[
 ['model','Modèle'],['type','Type'],['shape','Forme'],['form','Forme'],
 ['material','Matière'],['width','Largeur / tranche tarifaire'],['length','Longueur / tranche tarifaire'],
 ['height','Hauteur'],['diameter','Diamètre'],['finish','Finition / texture'],
 ['colorGroup','Groupe de couleur'],['color','Couleur'],['option','Option'],['installation','Pose']
];
const universalDraft={};
const cleanVal=v=>String(v??'');
const onlyValues=(rows,key)=>[...new Set(rows.map(v=>cleanVal(v[key])))].filter(Boolean);
const officialPdf=url=>/^https:\/\/hidrobox\.com\/wp-content\/uploads\/[^#?]+\.pdf$/i.test(String(url||''))?url:'';
const officialImage=url=>/^https:\/\/(?:www\.)?hidrobox\.com\/[^"'<>]+/i.test(String(url||''))?url:'';
function officialCollection(g){
  const raw=norm(g.collection||g.family||g.model||g.id);
  const found=HIDROBOX_ALL_OFFICIAL.find(x=>norm(x.name)===raw||norm(x.key)===raw);
  return found?.url||CATEGORY.find(c=>c.key===groupCategory(g))?.url||HOUSE;
}
function universalSelection(g){
  let rows=g.variants||[],fields=[];
  for(const [key,label] of FACE_KEYS){
    const options=onlyValues(rows,key);
    if(options.length<2){if(options.length===1)fields.push({key,label,options,chosen:options[0],static:true});continue}
    if(!options.includes(universalDraft[key]))universalDraft[key]=options[0];
    const chosen=universalDraft[key];rows=rows.filter(v=>cleanVal(v[key])===chosen);
    fields.push({key,label,options,chosen});
  }
  const refs=[...new Set(rows.map(x=>String(x.reference||'')).filter(Boolean))];
  if(!refs.includes(universalDraft.reference))universalDraft.reference=refs[0]||'';
  const selected=rows.find(x=>String(x.reference)===universalDraft.reference)||null;
  return {selected,fields,refs,rows};
}
function centimeterRange(str){
  const m=String(str||'').trim().replace(/[–—]/g,'-').match(/^(\d{2,3})(?:\s*-\s*(\d{2,3}))?$/);
  if(!m)return null;
  const first=Number(m[1]),last=Number(m[2]||m[1]);
  return first>=40&&last<=230&&first<=last?{first,last}:null;
}
function dimensionFields(selected){
  const vals={width:centimeterRange(selected?.width),length:centimeterRange(selected?.length)};
  const inputs=[];
  for(const key of ['width','length']){
    if(!vals[key])continue;
    if(!Number.isInteger(Number(universalDraft['exact'+key]))||
       Number(universalDraft['exact'+key])<vals[key].first||Number(universalDraft['exact'+key])>vals[key].last)
       universalDraft['exact'+key]=vals[key].first;
    inputs.push('<label>'+ (key==='width'?'Largeur réelle (cm)':'Longueur réelle (cm)')+
      '<input type="number" id="huExact'+key+'" min="'+vals[key].first+'" max="'+vals[key].last+
      '" step="1" value="'+Number(universalDraft['exact'+key])+'"></label>');
  }
  return inputs.length?'<h4 class="hidrobox-universal-subtitle">Dimensions réelles de fabrication</h4><p class="hidrobox-guide-note">Les tranches servent au tarif ; les dimensions réelles sont conservées pour la commande.</p><div class="hidrobox-fields">'+inputs.join('')+'</div>':'';
}
function universalPage(g){
 stage='group';chosenGroup=g;
 const name=g.collection||g.family||g.model||g.id;
 const {selected,fields,refs}=universalSelection(g);
 const family=CATEGORY.find(c=>c.key===groupCategory(g));
 const n=norm(name),assets=HIDROBOX_DOCUMENTS[n]||{};
 const url=officialCollection(g);
 const mainImage=officialImage(selected?.image)||officialImage(g.image)||family?.img||'';
 const opts=fields.filter(x=>!x.static).map(f=>'<label>'+escape(f.label)+
    '<select data-facet="'+escape(f.key)+'">'+choices(f.options,f.chosen)+'</select></label>').join('');
 const flat=fields.filter(x=>x.static).map(f=>escape(f.label)+': '+escape(f.chosen)).join(' · ');
 const refsControl=refs.length>1?'<label>Référence finale<select id="huReference">'+choices(refs,universalDraft.reference)+'</select></label>':'';
 const price=Number(selected?.price),raw=Number(selected?.rawPrice);
 const canAdd=selected&&Number.isFinite(price)&&price>0&&selected.reference;
 const tech=officialPdf(selected?.technicalSheetUrl||g.technicalSheetUrl||assets.technical);
 const manual=officialPdf(selected?.installationGuideUrl||g.installationGuideUrl||assets.manual);
 const docs='<div class="hidrobox-downloads"><a href="'+escape(url)+'" target="_blank" rel="noopener noreferrer">Voir la collection</a>'+
   (tech?'<a href="'+escape(tech)+'" target="_blank" rel="noopener noreferrer">Fiche technique</a>':'')+
   (manual?'<a href="'+escape(manual)+'" target="_blank" rel="noopener noreferrer">Notice de pose</a>':'')+'</div>';
 const markup='<button type="button" class="hidrobox-back">← Collections</button>'+
   '<div class="hidrobox-neo-hero">'+(mainImage?'<img src="'+escape(mainImage)+'" alt="'+escape(name)+'" loading="lazy" onerror="this.style.display=\'none\'">':'')+
   '<div><div class="eyebrow">'+escape(family?.name||'Hidrobox')+'</div><h3>'+escape(name)+'</h3>'+
   '<p>'+escape((g.variants||[]).length)+' variantes issues du tarif 2026. Configurez progressivement les caractéristiques, sans masquer les références restantes.</p>'+
   docs+'<small>'+escape(mainImage?(selected?.image||g.image?'Visuel fabricant, variante à vérifier':'Visuel officiel de famille · variante non contractuelle'):'Visuel non disponible')+'</small></div></div>'+
   '<h4 class="hidrobox-universal-subtitle">Caractéristiques tarifaires</h4>'+
   (flat?'<p class="hidrobox-guide-note">'+flat+'</p>':'')+
   '<div class="hidrobox-fields">'+opts+refsControl+'</div>'+dimensionFields(selected)+
   '<div class="hidrobox-result"><div><b>'+(canAdd?eu(price)+' HT':'Tarif indisponible')+'</b>'+
   '<span>Réf. '+escape(selected?.reference||'—')+' · '+escape(selected?.designation||'')+'</span>'+
   '<small>'+(canAdd?(Number.isFinite(raw)&&raw>0?'Prix source '+eu(raw)+' HT +4 %. ':'')+'Remise achat 50 % en calcul de marge.':'Aucun prix extrapolé sans référence tarifaire.')+'</small></div>'+
   '<button class="btn primary" id="huAdd" type="button"'+(canAdd?'':' disabled')+'>Ajouter au projet</button></div>';
 shell(String(name)+' · configuration',markup,true);
 overlay.querySelector('.hidrobox-back').onclick=collections;
 overlay.querySelectorAll('[data-facet]').forEach(e=>e.addEventListener('change',()=>{
   universalDraft[e.dataset.facet]=e.value;universalDraft.reference='';
   for(const key of ['exactwidth','exactlength'])delete universalDraft[key];
   universalPage(g);
 }));
 overlay.querySelector('#huReference')?.addEventListener('change',e=>{universalDraft.reference=e.target.value;universalPage(g)});
 overlay.querySelector('#huExactwidth')?.addEventListener('change',e=>{universalDraft.exactwidth=Number(e.target.value);universalPage(g)});
 overlay.querySelector('#huExactlength')?.addEventListener('change',e=>{universalDraft.exactlength=Number(e.target.value);universalPage(g)});
 overlay.querySelector('#huAdd')?.addEventListener('click',()=>{
   const {selected:row}=universalSelection(g);
   if(!row||!Number.isFinite(Number(row.price))||Number(row.price)<=0)return;
   const dimInfo={};
   for(const key of ['width','length']){
     const range=centimeterRange(row[key]);
     if(range){
       const exact=Number(universalDraft['exact'+key]);
       if(!Number.isInteger(exact)||exact<range.first||exact>range.last){alert('Dimension '+key+' invalide.');return;}
       dimInfo[key+'Cm']=exact;
     }
   }
   const dimLabels=[dimInfo.widthCm?'Larg. '+dimInfo.widthCm+' cm':'',dimInfo.lengthCm?'Long. '+dimInfo.lengthCm+' cm':''].filter(Boolean);
   const designation=[row.designation||name,...dimLabels].join(' · ');
   const exactImage=officialImage(row.image),representative=officialImage(g.image)||family?.img||'';
   const item={manufacturer:'Hidrobox',collection:name,reference:row.reference,base:row.reference,designation,
      category:row.category||original?.category||family?.name||'Sanitaire',material:row.material||'',
      finish:row.finish||row.colorGroup||'',price:Number(row.price),totalPrice:Number(row.price),
      rawTariffPrice:Number(row.rawPrice)||0,listPriceUpliftPct:4,purchaseDiscount:50,currency:'€',vat:'HT',
      source:'HIDROBOX_TARIF_FR_V0226_19-02-2026.pdf',sourceYear:2026,manufacturerUrl:url,
      image:exactImage||representative,imageSource:exactImage?'Visuel fabricant de la référence':'Illustration officielle de famille · finition non contractuelle',
      technicalSheetUrl:tech,technicalSheetLabel:'Fiche technique Hidrobox',installationGuideUrl:manual,
      installationGuideLabel:'Notice de pose Hidrobox',configuratorType:'hidrobox-configured'};
   try{
     const record=createSelectedProductRecord(item,room,'');
     if(!record)throw Error('Création du produit impossible');
     Object.assign(record,item,{hidroboxConfiguration:{group:g.id,collection:name,reference:row.reference,
       widthTier:row.width||'',lengthTier:row.length||'',...dimInfo,material:row.material||'',
       finish:row.finish||'',colorGroup:row.colorGroup||'',shape:row.shape||row.form||''}});
     const ids=commitSelectedRecords([record],{showProject:false});
     if(!ids?.length)throw Error('Enregistrement impossible');
     close();showView('project');
   }catch(e){alert('Ajout impossible : '+e.message)}
 });
}

function values(arr){return arr.map(n=>String(n))}
function choices(vals,selected){return vals.map(v=>'<option value="'+escape(v)+'"'+(String(v)===String(selected)?' selected':'')+'>'+escape(v)+'</option>').join('')}
const NUMS=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
function sizeRanges(){
 const f=catalogue.FORMATS.find(x=>x.key===neo.form);
 const widths=f.widths||NUMS(f.widthMin,f.widthMax);
 const lengths=f.lengths||NUMS(f.lengthMin,f.lengthMax);
 const currentW=Number(neo.width),currentL=Number(neo.length);
 if(!widths.includes(currentW))neo.width=widths[0];
 const available=lengths.filter(length=>{
   if(neo.form==='rectangle'){if(neo.width>130)return length>=120&&length<=140;if(neo.width>110)return length>=120&&length<=180;if(neo.width>90)return length>=100;return length>=80;}
   if(neo.form==='angular'||neo.form==='pentagonal')return length===Number(neo.width);
   return true;
 });
 if(!available.includes(Number(currentL)))neo.length=available[0];
 return {widths,lengths:available};
}
function neoPage(){
 stage='neo';const d=catalogue.FORMATS.find(x=>x.key===neo.form)||catalogue.FORMATS[0];
 if(neo.material==='Scene'){neo.group='BLA';neo.color='Blanc';}
 if(neo.material==='Kromat'&&neo.group==='BLA')neo.group='BAS';
 const colors=catalogue.COLORS[neo.group]||[];
 if(!colors.includes(neo.color))neo.color=colors[0];
 const ranges=sizeRanges();
 const line=catalogue.lookup(neo);
 const colorGroups=neo.material==='Scene'?['BLA']:['BAS','TRE','SPE'];
 const opts=(id,label,list,current,disabled=false)=>'<label>'+escape(label)+'<select id="'+id+'"'+(disabled?' disabled':'')+'>'+choices(list,current)+'</select></label>';
 const pict=CATEGORY[0].img;
 const config='<button class="hidrobox-back" type="button">← Collections</button>'+
 '<div class="hidrobox-neo-hero"><img src="'+escape(pict)+'" alt="Illustration receveurs de douche Hidrobox" loading="lazy">'+
 '<div><div class="eyebrow">Receveur de douche · Neo Plus</div><h3>NEO PLUS</h3><p>Scene Solid Surface ou Kromat. Fabriqué au centimètre selon les plages du tarif 2026.</p>'+
 '<a href="'+HOUSE+'collections/neo-plus/" target="_blank" rel="noopener noreferrer">Produit officiel</a><div class="hidrobox-downloads">'+
 '<a href="'+TECH+'" target="_blank" rel="noopener noreferrer">Fiche technique PDF</a>'+
 '<a href="'+MANUAL+'" target="_blank" rel="noopener noreferrer">Notice de pose PDF</a></div>'+
 '<small>Illustration issue de la catégorie receveurs, non contractuelle pour ce modèle et sa finition.</small></div></div>'+
 '<div class="hidrobox-fields">'+opts('hnForm','Forme',catalogue.FORMATS.map(f=>f.key),neo.form)+
 opts('hnMaterial','Matière',['Kromat','Scene'],neo.material)+
 opts('hnWidth','Largeur exacte (cm)',values(ranges.widths),neo.width)+
 opts('hnLength','Longueur exacte (cm)',values(ranges.lengths),neo.length)+
 opts('hnTexture','Texture',['Lisse','Ardoise'],neo.texture)+
 opts('hnGroup','Groupe de couleurs',colorGroups,neo.group)+
 opts('hnColor','Couleur',colors,neo.color)+
 opts('hnGrille','Grille',['Point Inox','Point Basic','Point Trend','Point Special','Star Inox','Star Basic','Star Trend','Star Special','Radiance Steel','Radiance Gunmetal','Radiance Gold','Radiance Rame'],neo.grille)+
 opts('hnBonde','Bonde',['Horizontale standard','Verticale','Horizontale extraplate','Horizontale Plus'],neo.bonde)+'</div>'+
 '<p class="hidrobox-guide-note">Formes : '+catalogue.FORMATS.map(f=>escape(f.label)).join(' · ')+'. Les finitions spéciales RAL/NCS nécessitent un contrôle du tarif exact.</p>'+
 '<div class="hidrobox-result"><div><b>'+(line.ok?eu(line.price)+' HT':'Prix à confirmer')+'</b><span>'+(line.ok?'Réf. '+escape(line.reference)+' · Tranche '+escape(line.tier):escape(line.reason))+'</span>'+
 '<small>'+(line.ok?'Prix source '+eu(line.rawPrice)+' HT, majoration 4 %. Remise d’achat fournisseur 50 % appliquée dans la marge.':'Aucun prix inventé : choisissez une configuration tarifée ou consultez Hidrobox.')+'</small></div>'+
 '<button class="btn primary" id="hnAdd" type="button"'+(line.ok?'':' disabled')+'>Ajouter la configuration</button></div>';
 shell('Neo Plus · configuration',config,true);
 overlay.querySelector('.hidrobox-back').onclick=collections;
 const keys={hnForm:'form',hnMaterial:'material',hnWidth:'width',hnLength:'length',hnTexture:'texture',hnGroup:'group',hnColor:'color',hnGrille:'grille',hnBonde:'bonde'};
 Object.entries(keys).forEach(([id,key])=>overlay.querySelector('#'+id)?.addEventListener('change',e=>{
   neo[key]=e.target.value;
   if(key==='form'){neo.width=0;neo.length=0;}
   if(key==='material'){neo.group=neo.material==='Scene'?'BLA':'BAS';neo.color=neo.material==='Scene'?'Blanc':'Bianco';}
   if(key==='group')neo.color='';
   neoPage();
 }));
 overlay.querySelector('#hnAdd')?.addEventListener('click',()=>{
   const chosen=catalogue.lookup(neo);if(!chosen.ok)return;
   const image=CATEGORY[0].img;
   const item={manufacturer:'Hidrobox',collection:'Neo Plus',reference:chosen.reference,base:chosen.reference,designation:'Neo Plus · '+catalogue.FORMATS.find(x=>x.key===neo.form).label+' · '+chosen.referenceDimensions+' · '+neo.material+' · '+neo.texture+' · '+neo.color+' · Grille '+neo.grille+' · Bonde '+neo.bonde,
     category:'Receveur de douche',finish:neo.color+' · '+neo.texture,price:chosen.price,totalPrice:chosen.price,rawTariffPrice:chosen.rawPrice,listPriceUpliftPct:4,
     purchaseDiscount:50,currency:'€',vat:'HT',source:chosen.source,sourceYear:2026,manufacturerUrl:HOUSE+'collections/neo-plus/',
     image,imageSource:'Illustration de catégorie Hidrobox · finition non contractuelle',
     technicalSheetUrl:TECH,technicalSheetLabel:'Fiche technique Neo Plus',technicalSheetType:'application/pdf',
     installationGuideUrl:MANUAL,installationGuideLabel:"Notice d'installation Neo Plus",
     configuratorType:'hidrobox-configured'};
   try{
     const record=createSelectedProductRecord(item,room,'');
     if(!record)throw Error('Impossible de préparer le produit');
     Object.assign(record,item,{hidroboxConfiguration:{...chosen,selectedShape:neo.form,selectedWidthCm:+neo.width,selectedLengthCm:+neo.length,selectedColour:neo.color,selectedGrille:neo.grille,selectedBonde:neo.bonde}});
     const ids=commitSelectedRecords([record],{showProject:false});if(!ids?.length)throw Error('Impossible d’ajouter le produit');
     close();showView('project');
   }catch(e){alert('Configuration non ajoutée : '+e.message);}
 });
}
async function open(p,roomId){
 room=roomId;original=p||{};
 groups=await base.groups();
 for(const key of Object.keys(universalDraft))delete universalDraft[key];
 cat='receveurs';stage='families';chosenGroup=null;
 families();
}
root.HydroHidroboxConfigurator={...base,open,close,neoPlus:catalogue};
})(window);
