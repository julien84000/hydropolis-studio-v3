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
const NEO_BIM='https://hidrobox.com/wp-content/uploads/2025/01/BIMobject-Shower-tray-Neo-Plus.zip';
const NEO_3D='https://hidrobox.com/wp-content/uploads/2025/05/Neo-Plus-80x140x3-1.zip';
/* Hidrobox.com/fr/produits/ — nine current manufacturer product classes,
 * in the exact order shown in the official French product navigation. */
const CATEGORY=[
 {key:'receveurs',name:'Receveurs de douche',img:'https://hidrobox.com/wp-content/uploads/2025/03/01_Platos-de-ducha_Hidrobox.png',url:HOUSE+'produit/receveurs-de-douche/'},
 {key:'panneaux',name:'Panneaux',img:'https://hidrobox.com/wp-content/uploads/2025/05/02_Paneles_Hidrobox.png',url:HOUSE+'produit/panneaux/'},
 {key:'accessoires',name:'Accessoires',img:'https://hidrobox.com/wp-content/uploads/2025/03/ACCESORIOS-HIDROBOX-1.png',url:HOUSE+'produit/accessoires/'},
 {key:'vasques-suspendues',name:'Vasques suspendus',img:'https://hidrobox.com/wp-content/uploads/2025/05/04_Lavabos-suspendidos_Hidrobox-1.png',url:HOUSE+'produit/vasques-suspendus/'},
 {key:'vasques-a-poser',name:'Vasques à poser',img:'https://hidrobox.com/wp-content/uploads/2025/03/05_Lavabos-de-apoyo_Hidrobox.png',url:HOUSE+'produit/vasques-a-poser/'},
 {key:'vasques-sur-pied',name:'Vasques sur pied',img:'https://hidrobox.com/wp-content/uploads/2025/05/06_Lavabos-a-suelo_Hidrobox.png',url:HOUSE+'produit/vasques-sur-pied/'},
 {key:'plans',name:'Plans de travail',img:'https://hidrobox.com/wp-content/uploads/2025/03/pro4.png',url:HOUSE+'produit/plans-de-travail/'},
 {key:'bains-ilot',name:'Baignoires îlot',img:'https://hidrobox.com/wp-content/uploads/2025/03/08_Baneras-exentas_Hidrobox.png',url:HOUSE+'produit/baignoires-ilot/'},
 {key:'bains-encastres',name:'Baignoires encastrées',img:'https://hidrobox.com/wp-content/uploads/2025/05/09_Baneras-encastradas_Hidrobox.png',url:HOUSE+'produit/baignoires-encastrees/'}
];
const SHOWER_MODELS=['neo plus','line','twins','quadro','one','pure','arq','loovers','unique','iconik','falcon'];

/* Official Hidrobox French product categories and collections, verified on 29/10/2026.
 * Beta Evoque is shown in BOTH bath categories on the source website; there
 * remains only one underlying tariff group. Intim is marked private there. */
const HIDROBOX_PRODUCT_TREE=[
 {category:'receveurs',collections:[['neo-plus','Neo Plus'],['line','Line'],['twins','Twins'],['one','One'],['pure','Pure'],['quadro','Quadro'],['arq','Arq'],['unique','Unique'],['iconik','Iconik'],['loovers','Loovers'],['falcon','Falcon']]},
 {category:'panneaux',collections:[['paneles','Paneles']]},
 {category:'accessoires',collections:[['estantes','Estantes'],['hornacinas','Hornacinas'],['totems','Totems']]},
 {category:'vasques-suspendues',collections:[['program','Program'],['program-colour','Program Colour'],['lom','Lom'],['guest','Guest'],['swap','Swap'],['titan','Titan'],['soul','Soul'],['civit','Civit'],['intim','Intim']]},
 {category:'vasques-a-poser',collections:[['spot','Spot']]},
 {category:'vasques-sur-pied',collections:[['fs','FS']]},
 {category:'plans',collections:[['artop','Artop']]},
 {category:'bains-ilot',collections:[['space','Space'],['beta-essential','Beta Essential'],['beta-evoque','Beta Evoque']]},
 {category:'bains-encastres',collections:[['beta-fusion','Beta Fusion'],['beta-evoque','Beta Evoque']]}
];
const HIDROBOX_ALL_OFFICIAL=HIDROBOX_PRODUCT_TREE.flatMap(branch=>branch.collections.map(([key,name])=>({
 key,name,category:branch.category,url:HOUSE+'collections/'+key+'/',
 private:key==='intim',tariffAlias:key==='paneles'?'panneaux-muraux':''
})));
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
  '<div class="recor-config-head"><div><div class="eyebrow">Hidrobox · catalogue officiel</div><h2>'+escape(title)+'</h2><p>Catégorie → collection → configuration → référence tarifée</p></div><button class="icon hidrobox-close" type="button" aria-label="Fermer">×</button></div>'+treePath()+content+'</section>';
 overlay.querySelector('.hidrobox-close').onclick=close;
 overlay.querySelector('[data-hidrobox-home]')?.addEventListener('click',families);
 overlay.querySelector('[data-hidrobox-category]')?.addEventListener('click',collections);
}
/* Media is verified by official COLLECTION, never assumed exact for a SKU. */
function officialCollectionMedia(slug){
 const media=root.HydroManufacturerMediaIndex?.get('Hidrobox',slug);
 return media&&media.scope==='collection'?media:null;
}
function officialGroupMedia(group){
 if(!group)return null;
 const entry=HIDROBOX_ALL_OFFICIAL.find(x=>groupFor(x)?.id===group.id);
 return entry?officialCollectionMedia(entry.key):null;
}
function tiles(rows,kind){
 return '<div class="hidrobox-guide-grid">'+rows.map(x=>{
  const picture=x.img?'<img src="'+escape(x.img)+'" alt="" loading="lazy" decoding="async" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><div class="hidrobox-collection-identity" style="display:none"><span>'+escape(String(x.name||'H').slice(0,2).toUpperCase())+'</span><small>VISUEL INDISPONIBLE</small></div>':
   kind==='collection'?'<div class="hidrobox-collection-identity"><span>'+escape(String(x.name||'H').split(' ').map(p=>p[0]||'').join('').slice(0,2).toUpperCase())+'</span><small>COLLECTION HIDROBOX</small></div>':
   '<div class="hidrobox-guide-no-image">HIDROBOX</div>';
  return '<button type="button" class="hidrobox-guide-tile" data-kind="'+escape(kind)+'" data-choice="'+escape(x.key)+'">'+picture+(x.collectionPhoto?'<span class="hidrobox-photo-scope">Photo fabricant · collection</span>':'')+'<span class="hidrobox-guide-tile-name">'+escape(x.name)+'</span>'+(x.note?'<small>'+escape(x.note)+'</small>':'')+'</button>';
 }).join('')+'</div>';
}
/* V11.64.4 — category tiles reuse the existing select and pricing logic. */
const VISUAL_OPTIONS=new Set(['model','type','shape','form','material','finish','colorGroup','color','option','installation','hnForm','hnMaterial','hnTexture','hnGroup','hnColor','hnBonde']);
function visualFacet(id,label,options,selected,attributes=''){
 const visual=VISUAL_OPTIONS.has(id)||VISUAL_OPTIONS.has(String(id).replace(/^huFacet/,''));
 const native='<select id="'+escape(id)+'" '+attributes+(visual&&options.length>=2&&options.length<=18?' hidden':'')+'>'+choices(options,selected)+'</select>';
 if(!visual||options.length<2||options.length>18)return '<label>'+escape(label)+native+'</label>';
 return '<div class="hidrobox-visual-field"><strong>'+escape(label)+'</strong>'+native+
  '<div class="hidrobox-visual-options" role="group" aria-label="'+escape(label)+'">'+options.map(v=>
   '<button type="button" class="hidrobox-visual-option" data-hidrobox-target="'+escape(id)+'" data-hidrobox-value="'+escape(v)+'" aria-pressed="'+(String(v)===String(selected))+'">'+escape(v)+'</button>').join('')+'</div></div>';
}
function wireVisualFacets(){
 overlay.querySelectorAll('[data-hidrobox-target]').forEach(button=>button.onclick=()=>{
  const select=overlay.querySelector('#'+button.dataset.hidroboxTarget);
  if(!select||select.disabled)return;
  select.value=button.dataset.hidroboxValue;
  select.dispatchEvent(new Event('change',{bubbles:true}));
 });
}
/* Official page taxonomy is authoritative for navigation; the supplier's
 * imported price sheet only controls whether a collection is configurable. */
function groupFor(entry,allGroups=groups){
 return allGroups.find(g=>norm(g.id)===norm(entry.tariffAlias||entry.key)||
  norm(g.collection)===norm(entry.name));
}
function unmappedGroups(category){
 return groups.filter(g=>groupCategory(g)===category&&!HIDROBOX_ALL_OFFICIAL.some(entry=>groupFor(entry)?.id===g.id));
}
function treePath(){
 const parent=CATEGORY.find(x=>x.key===cat);
 const category=stage==='families'?'':'<span aria-hidden="true">›</span>'+
  (stage==='collections'?'<strong>'+escape(parent?.name||'Collections')+'</strong>':'<button type="button" data-hidrobox-category>'+escape(parent?.name||'Collections')+'</button>');
 const current=stage==='neo'?'Neo Plus':stage==='group'?chosenGroup?.collection||chosenGroup?.family||chosenGroup?.model||'Configuration':stage==='official'?chosenGroup?.name||'Collection':'';
 return '<nav class="hidrobox-tree-path" aria-label="Parcours du configurateur">'+
 (stage==='families'?'<strong>Produits Hidrobox</strong>':'<button type="button" data-hidrobox-home>Produits Hidrobox</button>')+
 category+(current?'<span aria-hidden="true">›</span><strong>'+escape(current)+'</strong>':'')+'</nav>';
}
function families(){
 stage='families';chosenGroup=null;
 const cards=CATEGORY.map(c=>({...c,note:HIDROBOX_ALL_OFFICIAL.filter(x=>x.category===c.key).length+' collections officielles'}));
 shell('Choisir une catégorie de produits',tiles(cards,'family')+
 '<p class="hidrobox-guide-note">Navigation basée sur les neuf catégories publiées sur hidrobox.com/fr/produits/. Les images de catégorie illustrent une famille, pas une référence tarifée.</p>'+
 '<a class="hidrobox-official-link" href="'+HOUSE+'produits/" target="_blank" rel="noopener noreferrer">Voir l’arborescence du fabricant</a>',true);
 overlay.querySelectorAll('[data-kind=family]').forEach(b=>b.onclick=()=>{cat=b.dataset.choice;collections()});
}
function collections(){
 stage='collections';chosenGroup=null;
 const family=CATEGORY.find(x=>x.key===cat);
 const official=HIDROBOX_ALL_OFFICIAL.filter(x=>x.category===cat);
 const cards=official.map(entry=>{
  const g=groupFor(entry);
  const media=officialCollectionMedia(entry.key);
  return {key:entry.key,name:entry.name,img:officialImage(media?.image)||officialImage(g?.image)||'',
   collectionPhoto:!!media,
   note:entry.private?'Collection privée sur le site du fabricant':g?(g.variants?.length||0)+' lignes du tarif source · à configurer':'Collection officielle · tarif non importé'};
 });
 const orphans=unmappedGroups(cat);
 const extra=orphans.length?
  '<section class="hidrobox-unmapped"><h3>Lignes tarifaires hors collections du site</h3><p class="hidrobox-guide-note">Ces postes sont regroupés dans le tarif mais ne correspondent pas à une collection unique du menu fabricant. Choisissez leur référence avec précaution.</p>'+
  tiles(orphans.map(g=>({key:g.id,name:g.collection||g.family||g.model||g.id,img:'',note:(g.variants?.length||0)+' lignes tarifées · groupe transversal'})),'unmapped')+'</section>':'';
 shell(family?.name||'Collections','<button class="hidrobox-back" type="button">← Catégories</button>'+
  tiles(cards,'collection')+extra+
  '<p class="hidrobox-guide-note">Photographies constructeur associées aux collections, non à chaque référence tarifaire : couleur, dimensions et finition peuvent différer. Une image absente ou indisponible ne sera jamais remplacée par celle d’une autre collection.</p>'+
  '<a class="hidrobox-official-link" href="'+escape(family?.url||HOUSE)+'" target="_blank" rel="noopener noreferrer">Consulter cette catégorie chez Hidrobox</a>',true);
 overlay.querySelector('.hidrobox-back').onclick=families;
 overlay.querySelectorAll('[data-kind=collection]').forEach(button=>button.onclick=()=>{
  const entry=official.find(x=>x.key===button.dataset.choice);
  if(!entry)return;
  if(entry.key==='neo-plus'){neoPage();return;}
  const group=groupFor(entry);
  if(group){universalPage(group);return;}
  officialInfo(entry);
 });
 overlay.querySelectorAll('[data-kind=unmapped]').forEach(button=>button.onclick=()=>{
  const group=orphans.find(x=>x.id===button.dataset.choice);
  if(group)universalPage(group);
 });
}
function officialInfo(entry){
 stage='official';chosenGroup=entry;
 const category=CATEGORY.find(c=>c.key===cat);
 const assets=HIDROBOX_DOCUMENTS[norm(entry.name)]||{};
 const tech=officialPdf(assets.technical);
 const docs=tech?'<a class="hidrobox-official-link" href="'+escape(tech)+'" target="_blank" rel="noopener noreferrer">Fiche technique fabricant</a>':'';
 const url=entry.private?category?.url:entry.url;
 const media=officialCollectionMedia(entry.key),photo=officialImage(media?.image);
 const photoMarkup=photo?'<div class="hidrobox-unpriced-photo"><img src="'+escape(photo)+'" alt="Collection '+escape(entry.name)+'" loading="lazy"><small>Photo constructeur de collection · variantes non garanties</small></div>':'';
 const markup='<button class="hidrobox-back" type="button">← Collections</button>'+
  '<section class="hidrobox-unpriced-collection">'+photoMarkup+'<div class="eyebrow">'+escape(category?.name||'Hidrobox')+'</div><h3>'+escape(entry.name)+'</h3>'+
  '<p>'+ (entry.private?'Cette collection est indiquée « Privé » dans le menu du fabricant.':"Cette collection figure au catalogue officiel, mais aucune référence et aucun tarif correspondants n’ont été importés.")+
  ' Vous pouvez consulter la documentation du fabricant, sans ajout automatique au devis.</p>'+
  '<div class="hidrobox-downloads"><a href="'+escape(url||HOUSE)+'" target="_blank" rel="noopener noreferrer">Voir sur Hidrobox</a>'+docs+'</div>'+
  '<strong>Aucun tarif disponible dans Hydropolis · aucune référence inventée</strong></section>';
 shell(entry.name+' · catalogue',markup,true);
 overlay.querySelector('.hidrobox-back').onclick=collections;
}

/* Manufacturer-direct technical sheets, only where their URLs were verified. */
const HIDROBOX_DOCUMENTS={
  'neo plus':{technical:TECH,manual:MANUAL,bim:NEO_BIM,model3D:NEO_3D},
  line:{technical:'https://hidrobox.com/wp-content/uploads/2025/05/ES_Line_FactSheet.pdf',manual:'https://hidrobox.com/wp-content/uploads/2025/07/mus_220_Line_Shower_Tray_0223-07.pdf',bim:'https://hidrobox.com/wp-content/uploads/2025/05/BIMobject-Shower-tray-Line-X-Scene-Smooth.zip',model3D:'https://hidrobox.com/wp-content/uploads/2025/05/STL-Line-Hidrobox.zip'},
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
const officialZip=url=>/^https:\/\/hidrobox\.com\/wp-content\/uploads\/[^#?]+\.zip$/i.test(String(url||''))?url:'';
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
 const groupMedia=officialGroupMedia(g);
 const exactSelectedImage=officialImage(selected?.image),exactGroupImage=officialImage(g.image);
 const collectionImage=officialImage(groupMedia?.image);
 const mainImage=exactSelectedImage||exactGroupImage||collectionImage||family?.img||'';
 const imageScope=exactSelectedImage?'exact':collectionImage||exactGroupImage?'collection':'category';
 const opts=fields.filter(x=>!x.static).map(f=>visualFacet('huFacet'+f.key,f.label,f.options,f.chosen,'data-facet="'+escape(f.key)+'"')).join('');
 const flat=fields.filter(x=>x.static).map(f=>escape(f.label)+': '+escape(f.chosen)).join(' · ');
 const refsControl=refs.length>1?'<label>Référence finale<select id="huReference">'+choices(refs,universalDraft.reference)+'</select></label>':'';
 const price=Number(selected?.price),raw=Number(selected?.rawPrice);
 const canAdd=selected&&Number.isFinite(price)&&price>0&&selected.reference;
 const tech=officialPdf(selected?.technicalSheetUrl||g.technicalSheetUrl||assets.technical);
 const manual=officialPdf(selected?.installationGuideUrl||g.installationGuideUrl||assets.manual);
 const bim=officialZip(assets.bim),model3D=officialZip(assets.model3D);
 const docs='<div class="hidrobox-downloads"><a href="'+escape(url)+'" target="_blank" rel="noopener noreferrer">Voir la collection</a>'+
   (tech?'<a href="'+escape(tech)+'" target="_blank" rel="noopener noreferrer">Fiche technique</a>':'')+
   (manual?'<a href="'+escape(manual)+'" target="_blank" rel="noopener noreferrer">Notice de pose</a>':'')+
   (bim?'<a href="'+escape(bim)+'" target="_blank" rel="noopener noreferrer">Objet BIM constructeur · famille</a>':'')+
   (model3D?'<a href="'+escape(model3D)+'" target="_blank" rel="noopener noreferrer">Modèle 3D constructeur · exemple, dimensions à vérifier</a>':'')+'</div>';
 const markup='<button type="button" class="hidrobox-back">← Collections</button>'+
   '<div class="hidrobox-neo-hero">'+(mainImage?'<img src="'+escape(mainImage)+'" alt="'+escape(name)+'" loading="lazy" onerror="this.style.display=\'none\'">':'')+
   '<div><div class="eyebrow">'+escape(family?.name||'Hidrobox')+'</div><h3>'+escape(name)+'</h3>'+
   '<p>'+escape((g.variants||[]).length)+' variantes issues du tarif 2026. Configurez progressivement les caractéristiques, sans masquer les références restantes.</p>'+
   docs+'<small>'+escape(mainImage?(imageScope==='exact'?'Visuel associé à la référence sélectionnée':imageScope==='collection'?'Photo constructeur de la collection · finition/dimensions non contractuelles':'Illustration de catégorie · modèle et finition non garantis'):'Visuel non disponible')+'</small></div></div>'+
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
 wireVisualFacets();
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
   const exactImage=officialImage(row.image),groupCollectionImage=officialImage(officialGroupMedia(g)?.image),
    representative=officialImage(g.image)||groupCollectionImage||family?.img||'';
   const item={manufacturer:'Hidrobox',collection:name,reference:row.reference,base:row.reference,designation,
      category:row.category||original?.category||family?.name||'Sanitaire',material:row.material||'',
      finish:row.finish||row.colorGroup||'',price:Number(row.price),totalPrice:Number(row.price),
      rawTariffPrice:Number(row.rawPrice)||0,listPriceUpliftPct:4,purchaseDiscount:50,currency:'€',vat:'HT',
      source:'HIDROBOX_TARIF_FR_V0226_19-02-2026.pdf',sourceYear:2026,manufacturerUrl:url,
      image:exactImage||representative,
      imageSource:exactImage?'Visuel fabricant de la référence':groupCollectionImage?'Photographie constructeur de la collection · variante illustrative':'Illustration de catégorie Hidrobox · modèle et finition non contractuels',
      imageFinishMatch:exactImage?'exact':groupCollectionImage?'collection':'category',
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
 const opts=(id,label,list,current,disabled=false)=>visualFacet(id,label,list,current,disabled?'disabled':'');
 const pict=officialImage(officialCollectionMedia('neo-plus')?.image)||CATEGORY[0].img;
 const config='<button class="hidrobox-back" type="button">← Collections</button>'+
 '<div class="hidrobox-neo-hero"><img src="'+escape(pict)+'" alt="Illustration receveurs de douche Hidrobox" loading="lazy">'+
 '<div><div class="eyebrow">Receveur de douche · Neo Plus</div><h3>NEO PLUS</h3><p>Scene Solid Surface ou Kromat. Fabriqué au centimètre selon les plages du tarif 2026.</p>'+
 '<a href="'+HOUSE+'collections/neo-plus/" target="_blank" rel="noopener noreferrer">Produit officiel</a><div class="hidrobox-downloads">'+
 '<a href="'+TECH+'" target="_blank" rel="noopener noreferrer">Fiche technique PDF</a>'+
 '<a href="'+MANUAL+'" target="_blank" rel="noopener noreferrer">Notice de pose PDF</a>'+
 '<a href="'+NEO_BIM+'" target="_blank" rel="noopener noreferrer">Objet BIM constructeur · Neo Plus</a>'+
 '<a href="'+NEO_3D+'" target="_blank" rel="noopener noreferrer">Modèle 3D constructeur · 80 × 140 × 3 cm</a></div>'+
 '<small>Photo constructeur de la collection Neo Plus · dimensions, grille, couleur et finition non contractuelles.</small></div></div>'+
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
 wireVisualFacets();
  overlay.querySelector('#hnAdd')?.addEventListener('click',()=>{
   const chosen=catalogue.lookup(neo);if(!chosen.ok)return;
   const image=officialImage(officialCollectionMedia('neo-plus')?.image)||CATEGORY[0].img;
   const item={manufacturer:'Hidrobox',collection:'Neo Plus',reference:chosen.reference,base:chosen.reference,designation:'Neo Plus · '+catalogue.FORMATS.find(x=>x.key===neo.form).label+' · '+chosen.referenceDimensions+' · '+neo.material+' · '+neo.texture+' · '+neo.color+' · Grille '+neo.grille+' · Bonde '+neo.bonde,
     category:'Receveur de douche',finish:neo.color+' · '+neo.texture,price:chosen.price,totalPrice:chosen.price,rawTariffPrice:chosen.rawPrice,listPriceUpliftPct:4,
     purchaseDiscount:50,currency:'€',vat:'HT',source:chosen.source,sourceYear:2026,manufacturerUrl:HOUSE+'collections/neo-plus/',
     image,imageSource:'Photographie constructeur de collection Neo Plus · dimensions et finition non contractuelles',imageFinishMatch:'collection',
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
root.HydroHidroboxConfigurator={...base,open,close,neoPlus:catalogue,officialCategories:CATEGORY,officialCollections:HIDROBOX_ALL_OFFICIAL,officialProductTree:HIDROBOX_PRODUCT_TREE,tariffGroupFor:groupFor,officialCollectionMedia};
})(window);
