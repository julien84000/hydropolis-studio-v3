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
let overlay=null,room='',groups=[],stage='families',cat='receveurs',chosenGroup=null,original=null,groupsLoading=false,groupsError='',navigationToken=0,neo={form:'rectangle',material:'Kromat',group:'BAS',width:90,length:120,texture:'Lisse',color:'Bianco',grille:'Point Inox',bonde:'Horizontale standard'};
function close(){navigationToken++;overlay?.remove();overlay=null}
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
   '<button type="button" class="hidrobox-visual-option" data-hidrobox-target="'+escape(id)+'" data-hidrobox-value="'+escape(v)+'" aria-pressed="'+(String(v)===String(selected))+'">'+(id==='hnForm'&&root.HydroTariffPictures?.['neo-'+v]?'<img src="'+root.HydroTariffPictures['neo-'+v]+'" alt="" width="120" height="100" style="display:block;object-fit:contain">':'')+escape(id==='hnForm'?(catalogue.FORMATS.find(f=>f.key===v)?.label||v):v)+'</button>').join('')+'</div></div>';
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
  (groupsLoading?'<p class="hidrobox-guide-note" role="status">Chargement des références tarifaires en cours. Les familles restent accessibles.</p>':groupsError?'<p class="hidrobox-guide-note" role="status">Tarifs momentanément indisponibles : navigation et collections consultables, ajout au projet suspendu.</p>':'')+
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
   note:entry.private?'Collection privée sur le site du fabricant':groupsLoading?'Chargement des tarifs · collection consultable':g?(g.variants?.length||0)+' lignes du tarif source · à configurer':groupsError?'Tarifs momentanément indisponibles':'Collection officielle · tarif non importé'};
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
 const explanation=groupsLoading?'Les références tarifaires de la collection sont en cours de chargement. La navigation reste possible ; la configuration sera accessible dès la fin du chargement.':groupsError?'Le tarif est temporairement indisponible. La collection est consultable sur le site fabricant, mais aucun prix ni ajout au devis ne peut être proposé pour le moment.':entry.private?'Cette collection est indiquée « Privé » dans le menu du fabricant.':"Cette collection figure au catalogue officiel, mais aucune référence et aucun tarif correspondants n’ont été importés.";
 const markup='<button class="hidrobox-back" type="button">← Collections</button>'+
  '<section class="hidrobox-unpriced-collection">'+photoMarkup+'<div class="eyebrow">'+escape(category?.name||'Hidrobox')+'</div><h3>'+escape(entry.name)+'</h3>'+
  '<p>'+explanation+
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
let tariffExtrasPromise=null,programDraft=null,programFamily='';
function loadTariffExtras(){
 if(!tariffExtrasPromise)tariffExtrasPromise=Promise.all(['hidrobox-program-data.js','hidrobox-tariff-pictures.js','hidrobox-program-2026.js'].map(file=>new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='/'+file;script.onload=resolve;script.onerror=()=>reject(Error('Chargement du tarif Program impossible'));document.head.appendChild(script);
 }))).catch(e=>{tariffExtrasPromise=null;throw e});
 return tariffExtrasPromise;
}
function programPage(g){
 stage='group';chosenGroup=g;
 if(!root.HydroProgram2026||!root.HydroProgramData||!root.HydroTariffPictures){
  const token=navigationToken;shell('Program','<p role="status">Chargement du tarif et des pictogrammes Program…</p>',true);
  loadTariffExtras().then(()=>{if(overlay&&navigationToken===token&&chosenGroup===g)programPage(g)}).catch(e=>{if(overlay&&navigationToken===token)shell('Program','<p>'+escape(e.message)+'</p>',true)});return;
 }
 if(!document.querySelector('#hidroboxProgramStyles')){const link=document.createElement('link');link.id='hidroboxProgramStyles';link.rel='stylesheet';link.href='/hidrobox-program.css';document.head.appendChild(link)}
 const model=root.HydroProgram2026,data=root.HydroProgramData,pics=root.HydroTariffPictures;
 if(!programDraft)programDraft=model.defaults();
 const s=programDraft,q=model.quote(s);
 const card=(key,value,label,picture,note='')=>'<button type="button" class="hp-choice" data-hp="'+key+'" data-value="'+escape(value)+'" aria-pressed="'+(String(s[key])===String(value))+'">'+(picture?'<img src="'+escape(pics[picture])+'" alt="" loading="lazy">':'')+'<b>'+escape(label)+'</b><small>'+escape(note)+'</small></button>';
 const select=(key,label,refs)=>'<label>'+label+'<select data-hp-select="'+key+'"><option value="">Sans</option>'+refs.map(ref=>{const o=data.options[ref];return '<option value="'+ref+'" '+(s[key]===ref?'selected':'')+'>'+escape(o.label)+(o.rawPrice===0?' · inclus':' · '+eu(o.rawPrice)+' source')+'</option>'}).join('')+'</select></label>';
 const input=(key,label,min,max,step=1)=>'<label>'+label+'<input data-hp-number="'+key+'" type="number" min="'+min+'" max="'+max+'" step="'+step+'" value="'+escape(s[key])+'"></label>';
 const check=(key,label)=>'<label><input data-hp-check="'+key+'" type="checkbox" '+(s[key]?'checked':'')+'>'+label+'</label>';
 const families=[...new Set(data.basins.map(b=>b.picture))];
 if(!programFamily)programFamily=q.basin?.picture||families[0];
 const hero=officialImage(officialCollectionMedia('program')?.image);
 const html='<button type="button" class="hidrobox-back">← Collections</button><div class="hidrobox-neo-hero">'+(hero?'<img src="'+escape(hero)+'" alt="Collection Program">':'')+'<div><h3>Program · plan vasque sur mesure</h3><p>Scene blanc lisse · tarif FR 2026, pages 76–83.</p><a href="'+HIDROBOX_DOCUMENTS.program.technical+'" target="_blank" rel="noopener noreferrer">Fiche technique PDF</a><small>Photo de collection · dimensions et options non contractuelles.</small></div></div>'+
 '<div class="hidrobox-program"><h4>1 · Forme du plan et hauteur</h4><div class="hp-grid hp-form">'+[
 ['1.2','Plan fin · 1,2 cm','flat'],['10','Jupe · 3–10 cm','apron'],['20','Jupe · 11–20 cm','high'],['40','Jupe · 21–40 cm','full']].map(([v,l,p])=>card('height',v,l,p)).join('')+'</div>'+
 '<h4>2 · Forme et dimensions de la vasque principale</h4><div class="hp-families">'+families.map(f=>'<button type="button" data-hp-family="'+f+'" aria-pressed="'+(programFamily===f)+'"><img alt="" src="'+pics[f]+'" loading="lazy"><span>'+escape(f.replace('plus',' + ').replace('10',' 10').replace('14',' 14'))+'</span></button>').join('')+'</div><div class="hp-grid">'+data.basins.filter(b=>b.picture===programFamily).map(b=>card('basin',b.id,b.id+' · '+b.dimensionsLabel,b.picture,b.rawPrice?'+ '+eu(b.rawPrice)+' source':'Inclus')).join('')+'</div><p>Vasque choisie : <strong>'+escape(q.basin?.id||'')+' · '+escape(q.basin?.dimensionsLabel||'')+'</strong>. Visuels extraits du tarif : le dessin d’implantation reste à confirmer.</p>'+
 '<h4>3 · Curve et vasque additionnelle</h4><div class="hp-grid">'+card('curve','none','Sans Curve','flat')+card('curve','L','Curve L','curveL','+123 € source')+card('curve','R','Curve R','curveR','+123 € source')+card('curve','LR','Curve L+R','curveLR','+123 € source')+'</div><label>Vasque additionnelle<select data-hp-select="additional"><option value="">Sans vasque additionnelle</option>'+data.basins.map(b=>'<option value="'+b.id+'" '+(s.additional===b.id?'selected':'')+'>'+escape(b.id+' · '+b.label.replace(/^Vasque Program S\d+ /,'')+' · '+b.dimensionsLabel)+'</option>').join('')+'</select></label>'+(q.extra?'<img class="hp-extra" src="'+pics[q.extra.picture]+'" alt="Type de vasque additionnelle">':'')+
 '<h4>4 · Équipement et options</h4><div class="hp-options">'+select('tap','Préparation robinetterie',['OPWB0007','OPWB0008','OPWB0009','OPWB0010'])+select('overflow','Trop-plein',['OPWB0011','OPWB0012'])+select('drain','Bonde',['OPWB0050','OPWB0051','OPWB0052','OPWB0053','OPWB0054','OPWB0055'])+select('shelf','Étagère intégrée latérale',['OPWB0127','OPWB0128','OPWB0129'])+select('drawer','Tiroir extractible',['OPWB0130','OPWB0131','OPWB0132'])+select('towel','Porte-serviettes (prix divergents signalés)',Array.from({length:23},(_,i)=>'OPWB'+String(104+i).padStart(4,'0')))+input('backsplash','Crédence : hauteur en cm (0 = sans)',0,30)+check('backTap','Préparation robinetterie de crédence')+check('underShelf','Étagère sous plan')+check('visibleBrackets','Fixations visibles')+check('wallBacksplash','Crédence murale robinetterie · tarif à confirmer')+check('specialCut','Découpe spéciale · dessin et supplément à confirmer')+'</div>'+
 '<h4>5 · Dimensions exactes du plan</h4><div class="hp-options">'+input('length','Longueur exacte (cm)',60,201)+input('depth','Profondeur exacte (cm)',40,60)+input('height','Hauteur exacte (cm)',1.2,40,.1)+'</div><p>Le tarif est calculé selon ces dimensions, puis les suppléments choisis. Formats hors grille ou implantation particulière : devis fabricant.</p>'+
 '<h4>6 · Détail du chiffrage</h4><table class="hp-breakdown"><thead><tr><th>Élément</th><th>Référence</th><th>Prix source HT</th></tr></thead><tbody>'+q.components.map(c=>'<tr><td>'+escape(c.label)+'</td><td>'+escape(c.reference||'Voir tarif')+'</td><td>'+eu(c.rawPrice)+'</td></tr>').join('')+'</tbody></table>'+
 (q.errors.length?'<ul class="hp-errors" role="alert">'+q.errors.map(e=>'<li>'+escape(e)+'</li>').join('')+'</ul>':'<p>Tranche du plan : '+q.tier.length.join('–')+' × '+q.tier.depth.join('–')+' cm · H '+q.tier.height.join('–')+' cm.</p>')+
 '<div class="hidrobox-result"><div><b>'+(q.ok?eu(q.price)+' HT':'Configuration à confirmer')+'</b><small>'+(q.ok?'Total source '+eu(q.rawPrice)+' +4 % une seule fois. Achat −50 % : '+eu(q.purchasePrice)+' HT.':'Aucun prix final ni ajout tant que la configuration n’est pas vérifiée.')+'</small></div><button id="huAdd" class="btn primary" type="button" '+(q.ok?'':'disabled')+'>Ajouter au projet</button></div></div>';
 shell('Program · configuration sur mesure',html,true);
 overlay.querySelector('.hidrobox-back').onclick=collections;
 function refresh(){const sc=overlay.querySelector('.recor-configurator'),pos=sc?.scrollTop;programPage(g);if(sc&&overlay)overlay.querySelector('.recor-configurator').scrollTop=pos}
 overlay.querySelectorAll('[data-hp]').forEach(b=>b.onclick=()=>{s[b.dataset.hp]=b.dataset.hp==='height'?Number(b.dataset.value):b.dataset.value;refresh()});
 overlay.querySelectorAll('[data-hp-family]').forEach(b=>b.onclick=()=>{programFamily=b.dataset.hpFamily;refresh()});
 overlay.querySelectorAll('[data-hp-select]').forEach(e=>e.onchange=()=>{s[e.dataset.hpSelect]=e.value;refresh()});
 overlay.querySelectorAll('[data-hp-number]').forEach(e=>e.onchange=()=>{s[e.dataset.hpNumber]=e.value===''?NaN:Number(e.value);refresh()});
 overlay.querySelectorAll('[data-hp-check]').forEach(e=>e.onchange=()=>{s[e.dataset.hpCheck]=e.checked;refresh()});
 overlay.querySelector('#huAdd').onclick=()=>{
  const result=model.quote(s);if(!result.ok)return;
  const item={manufacturer:'Hidrobox',collection:'Program',reference:result.reference,base:result.reference,category:'Lavabo',designation:'Program '+s.basin+(s.additional?' + '+s.additional:'')+' · '+s.length+' × '+s.depth+' × '+s.height+' cm · Curve '+s.curve+' · '+result.components.slice(2).map(c=>c.label).join(' · '),price:result.price,totalPrice:result.price,rawTariffPrice:result.rawPrice,purchaseDiscount:50,listPriceUpliftPct:4,currency:'€',vat:'HT',source:data.source,sourceYear:2026,manufacturerUrl:HOUSE+'collections/program/',technicalSheetUrl:HIDROBOX_DOCUMENTS.program.technical,technicalSheetLabel:'Fiche technique Program',installationGuideUrl:HIDROBOX_DOCUMENTS.program.manual,image:hero,imageSource:'Photographie de collection Program · composition non contractuelle',imageFinishMatch:'collection',configuratorType:'hidrobox-configured'};
  try{const record=createSelectedProductRecord(item,room,'');if(!record)throw Error('Création impossible');Object.assign(record,item,{hidroboxConfiguration:{type:'program-2026',group:g.id,...result.configuration,components:result.components,tier:result.tier}});const ids=commitSelectedRecords([record],{showProject:false});if(!ids?.length)throw Error('Enregistrement impossible');close();showView('project')}catch(e){alert(e.message)}
 };
}

function universalPage(g){
 if(norm(g.collection||g.id)==='program')return programPage(g);
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
 if(!root.HydroTariffPictures)loadTariffExtras().then(()=>{if(overlay&&stage==='neo')neoPage()}).catch(()=>{});
 stage='neo';const d=catalogue.FORMATS.find(x=>x.key===neo.form)||catalogue.FORMATS[0];
 if(neo.material==='Scene'){neo.group='BLA';neo.color='Blanc';}
 if(neo.material==='Kromat'&&neo.group==='BLA')neo.group='BAS';
 const colors=catalogue.COLORS[neo.group]||[];
 if(!colors.includes(neo.color))neo.color=colors[0];
 const ranges=sizeRanges();
 const textures=['Lisse','Ardoise'].filter(texture=>catalogue.lookup({...neo,texture,group:neo.material==='Scene'?'BLA':'BAS',color:neo.material==='Scene'?'Blanc':'Bianco'}).ok);
 if(textures.length&&!textures.includes(neo.texture))neo.texture=textures[0];
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
 opts('hnTexture','Texture',textures.length?textures:[neo.texture],neo.texture)+
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
/* Show the manufacturer taxonomy immediately. Price data may load separately;
 * failures cannot block navigation across product types. */
async function open(p,roomId,requestedCategory=''){
 close();
 const token=++navigationToken;
 room=roomId;original=p||{};programDraft=p?.hidroboxConfiguration?.type==='program-2026'?{...p.hidroboxConfiguration}:null;programFamily='';groups=[];groupsLoading=true;groupsError='';
 for(const key of Object.keys(universalDraft))delete universalDraft[key];
 const existing=HIDROBOX_ALL_OFFICIAL.find(x=>norm(x.name)===norm(p?.collection)||norm(x.key)===norm(p?.collection));
 const requested=CATEGORY.find(x=>x.key===requestedCategory);
 cat=requested?.key||existing?.category||'receveurs';
 stage='families';chosenGroup=null;
 if(requested||existing)collections();else families();
 const refresh=()=>{
  if(stage==='families')families();
  else if(stage==='collections')collections();
  else if(stage==='official'&&chosenGroup?.key){
   const entry=HIDROBOX_ALL_OFFICIAL.find(x=>x.key===chosenGroup.key&&x.category===cat);
   if(entry){const match=groupFor(entry);if(match)universalPage(match);else officialInfo(entry);}
  }
 };
 try{
  const loaded=await base.groups();
  if(token!==navigationToken||!overlay)return;
  groups=Array.isArray(loaded)?loaded:[];
  groupsLoading=false;
  if(!groups.length)groupsError='Tarif Hidrobox non chargé';
  refresh();
 }catch(e){
  if(token!==navigationToken||!overlay)return;
  groupsLoading=false;groupsError=e?.message||String(e);
  console.warn('[Hidrobox] Tarifs indisponibles ; arborescence conservée',e);
  refresh();
 }
}
root.HydroHidroboxConfigurator={...base,open,close,neoPlus:catalogue,officialCategories:CATEGORY,officialCollections:HIDROBOX_ALL_OFFICIAL,officialProductTree:HIDROBOX_PRODUCT_TREE,tariffGroupFor:groupFor,officialCollectionMedia};
})(window);
