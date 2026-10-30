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
let overlay=null,room='',groups=[],stage='families',cat='receveurs',chosenGroup=null,original=null,groupsLoading=false,groupsError='',navigationToken=0;
const NEO_DEFAULT=Object.freeze({form:'rectangle',material:'Kromat',group:'BAS',width:90,length:120,texture:'Lisse',
 color:'Bianco',grille:'Point Inox',bonde:'Horizontale standard',specialCut:false});
let neo={...NEO_DEFAULT};
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
/* Brochure cover showing the Program Colour collection; illustrative, not the selected SKU.
   Source: Hidrobox PROGRAM COLOUR booklet, mirrored by Edilportale/Archiproducts. */
const PROGRAM_COLOUR_GENERIC_IMAGE='/api/image-proxy?url='+encodeURIComponent('https://catalogs.edilportale.com/Program-Colour-washbasin-it-es-pt-Hidrobox-0-catfe87311d.jpg');
function collectionImageFor(slug,src){
 if(norm(slug)==='program colour'||norm(slug)==='program-colour')return PROGRAM_COLOUR_GENERIC_IMAGE;
 return officialImage(src);
}
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
function hidroboxFixedAxes(material,texture,color){
 const fact=(label,value)=>'<div class="hidrobox-fixed-attribute"><strong>'+escape(label)+'</strong><span>'+escape(value||'À confirmer au tarif fabricant')+'</span></div>';
 return '<div class="hidrobox-fields hidrobox-workflow-axes">'+fact('Matière',material)+fact('Texture',texture)+
   (color?fact('Couleur',color):'')+'</div>';
}
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
 const others=groups.filter(g=>groupCategory(g)===category&&!HIDROBOX_ALL_OFFICIAL.some(entry=>groupFor(entry)?.id===g.id));
 const spares=root.HydroHidroboxSpares2026;
 if(category==='accessoires'&&spares?.rows?.length)others.push({id:'hidrobox-spares-2026',collection:'Pièces détachées 2026',category:'Accessoires',variants:spares.rows});
 return others;
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
  return {key:entry.key,name:entry.name,
   img:collectionImageFor(entry.key,media?.image||g?.image)||'',
   collectionPhoto:!!media||entry.key==='program-colour',
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
 const tech=officialPdf(assets.technical),manual=officialPdf(assets.manual);
 const docs=(tech?'<a class="hidrobox-official-link" href="'+escape(tech)+'" target="_blank" rel="noopener noreferrer">Fiche technique fabricant</a>':'')+
   (manual?'<a class="hidrobox-official-link" href="'+escape(manual)+'" target="_blank" rel="noopener noreferrer">Notice d’installation et d’entretien</a>':'');
 const url=entry.private?category?.url:entry.url;
 const media=officialCollectionMedia(entry.key),
  photo=collectionImageFor(entry.key,media?.image);
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
 ['material','Matière'],['finish','Finition / texture'],
 ['colorGroup','Groupe de couleur'],['color','Couleur'],
 ['width','Largeur / tranche tarifaire'],['length','Longueur / tranche tarifaire'],
 ['height','Hauteur'],['diameter','Diamètre'],['option','Option'],['installation','Pose']
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
const TRAY_REF_PREFIX={line:'SLIC',twins:'STWC',quadro:'SQUC',one:'SONC',pure:'SPUC',
 arq:'SARC',loovers:'SLOC',unique:'SUNC',iconik:'SICC','neo plus':'SNEC'};
function pricedShowerVariants(g){
 const prefix=TRAY_REF_PREFIX[norm(g?.collection||g?.id||'')];
 const rows=g?.variants||[];
 // OPSH drain/grille options live separately: never pretend these are tray SKU variants.
 const products=prefix?rows.filter(v=>String(v?.reference||'').startsWith(prefix)):rows;
 const source=prefix==='SLIC'?root.HydroHidroboxLineBands2026:root.HydroHidroboxShowerBands2026;
 return source?.fill?products.map(v=>source.fill(v)||v):products;
}
function universalSelection(g){
  const cascade=root.HydroHidroboxTrayCascade2026;
  if(groupCategory(g)==='receveurs'&&cascade){
    const c=norm(g.collection||g.id);
    // Neo Plus keeps its dedicated supplier-tested algorithm.
    const exactDimensions=c!=='neo plus'?root.HydroHidroboxTrayDimensions2026:null;
    const result=cascade.arrange(g,pricedShowerVariants(g),universalDraft,
      root.HydroHidroboxTrayModels2026,root.HydroHidroboxOfficialVisual,exactDimensions);
    if(result.dimensionResolution){
      if(universalDraft.exactwidth==null)universalDraft.exactwidth=result.dimensionResolution.width;
      if(universalDraft.exactlength==null)universalDraft.exactlength=result.dimensionResolution.length;
    }
    universalDraft.traySubmodel=result.model;
    for(const f of result.fields)if(f.key!=='color'&&f.chosen)universalDraft[f.key]=f.chosen;
    if(result.color)universalDraft.showerColor=result.color;
    universalDraft.reference=result.reference;
    return {...result,sourceBacked:true};
  }
  let rows=pricedShowerVariants(g),fields=[];
  const selector=root.HydroHidroboxTrayModels2026,verified=root.HydroHidroboxOfficialVisual;
  const models=selector?.variants(g,rows,verified)||[];
  if(models.length){
    if(!models.some(x=>x.id===universalDraft.traySubmodel))universalDraft.traySubmodel=models[0].id;
    rows=selector.filter(g,rows,universalDraft.traySubmodel,verified);
  }
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
  const m=String(str||'').trim().replace(/[–—]/g,'-').match(/^(\d{1,3})(?:\s*-\s*(\d{1,3}))?$/);
  if(!m)return null;
  const first=Number(m[1]),last=Number(m[2]||m[1]);
  return first>=1&&last<=260&&first<=last?{first,last}:null;
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
let tariffExtrasPromise=null,programDraft=null,programFamily='',spaceDraft=null,spaceModelPromise=null,betaEvoqueDraft=null,betaEvoqueModelPromise=null,betaEssentialDraft=null,betaEssentialModelPromise=null;
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
 '<div class="hidrobox-program"><h4>1 · Modèle · forme du plan et hauteur</h4><div class="hp-grid hp-form">'+[
 ['1.2','Plan fin · 1,2 cm','flat'],['10','Jupe · 3–10 cm','apron'],['20','Jupe · 11–20 cm','high'],['40','Jupe · 21–40 cm','full']].map(([v,l,p])=>card('height',v,l,p)).join('')+'</div>'+
 '<h4>2 · Forme et dimensions de la vasque principale</h4><div class="hp-families">'+families.map(f=>'<button type="button" data-hp-family="'+f+'" aria-pressed="'+(programFamily===f)+'"><img alt="" src="'+pics[f]+'" loading="lazy"><span>'+escape(f.replace('plus',' + ').replace('10',' 10').replace('14',' 14'))+'</span></button>').join('')+'</div><div class="hp-grid">'+data.basins.filter(b=>b.picture===programFamily).map(b=>card('basin',b.id,b.id+' · '+b.dimensionsLabel,b.picture,b.rawPrice?'+ '+eu(b.rawPrice)+' source':'Inclus')).join('')+'</div><p>Vasque choisie : <strong>'+escape(q.basin?.id||'')+' · '+escape(q.basin?.dimensionsLabel||'')+'</strong>. Visuels extraits du tarif : le dessin d’implantation reste à confirmer.</p>'+
 '<h4>3 · Matière et texture</h4>'+hidroboxFixedAxes('Scene','Lisse')+
 '<h4>4 · Couleur</h4>'+'<div class="hidrobox-fixed-attribute"><strong>Couleur fabricant</strong><span>Blanc · Scene lisse</span></div>'+
 '<h4>5 · Dimensions exactes du plan</h4><div class="hp-options">'+input('length','Longueur exacte (cm)',60,201)+input('depth','Profondeur exacte (cm)',40,60)+input('height','Hauteur exacte (cm)',1.2,40,.1)+'</div><p>Le tarif suit les dimensions et options choisies. Hors grille : devis fabricant.</p>'+
 '<h4>6 · Curve et vasque additionnelle</h4><div class="hp-grid">'+card('curve','none','Sans Curve','flat')+card('curve','L','Curve L','curveL','+123 € source')+card('curve','R','Curve R','curveR','+123 € source')+card('curve','LR','Curve L+R','curveLR','+123 € source')+'</div><label>Vasque additionnelle<select data-hp-select="additional"><option value="">Sans vasque additionnelle</option>'+data.basins.map(b=>'<option value="'+b.id+'" '+(s.additional===b.id?'selected':'')+'>'+escape(b.id+' · '+b.label.replace(/^Vasque Program S\d+ /,'')+' · '+b.dimensionsLabel)+'</option>').join('')+'</select></label>'+(q.extra?'<img class="hp-extra" src="'+pics[q.extra.picture]+'" alt="Type de vasque additionnelle">':'')+
 '<h4>7 · Équipement et options</h4><div class="hp-options">'+select('tap','Préparation robinetterie',['OPWB0007','OPWB0008','OPWB0009','OPWB0010'])+select('overflow','Trop-plein',['OPWB0011','OPWB0012'])+select('drain','Bonde',['OPWB0050','OPWB0051','OPWB0052','OPWB0053','OPWB0054','OPWB0055'])+select('shelf','Étagère intégrée latérale',['OPWB0127','OPWB0128','OPWB0129'])+select('drawer','Tiroir extractible',['OPWB0130','OPWB0131','OPWB0132'])+select('towel','Porte-serviettes (prix divergents signalés)',Array.from({length:23},(_,i)=>'OPWB'+String(104+i).padStart(4,'0')))+input('backsplash','Crédence : hauteur en cm (0 = sans)',0,30)+check('backTap','Préparation robinetterie de crédence')+check('underShelf','Étagère sous plan')+check('visibleBrackets','Fixations visibles')+check('wallBacksplash','Crédence murale robinetterie · tarif à confirmer')+check('specialCut','Découpe spéciale · dessin et supplément à confirmer')+'</div>'+
 
 '<h4>8 · Détail du chiffrage</h4><table class="hp-breakdown"><thead><tr><th>Élément</th><th>Référence</th><th>Prix source HT</th></tr></thead><tbody>'+q.components.map(c=>'<tr><td>'+escape(c.label)+'</td><td>'+escape(c.reference||'Voir tarif')+'</td><td>'+eu(c.rawPrice)+'</td></tr>').join('')+'</tbody></table>'+
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


function loadSpaceModel(){
 if(root.HydroSpace2026)return Promise.resolve();
 if(!spaceModelPromise)spaceModelPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='/hidrobox-space-2026.js';
  script.onload=resolve;script.onerror=()=>reject(Error('Chargement du tarif Space impossible'));
  document.head.appendChild(script);
 }).catch(e=>{spaceModelPromise=null;throw e});
 return spaceModelPromise;
}
function spacePage(g){
 stage='group';chosenGroup=g;
 if(!root.HydroSpace2026){
  const token=navigationToken;
  shell('Space','<p role="status">Chargement des 24 références Space et de leurs options tarifées…</p>',true);
  loadSpaceModel().then(()=>{if(overlay&&token===navigationToken&&chosenGroup===g)spacePage(g)})
   .catch(e=>{if(overlay&&token===navigationToken)shell('Space','<p role="alert">'+escape(e.message)+'</p>',true)});
  return;
 }
 if(!document.querySelector('#hidroboxProgramStyles')){
  const link=document.createElement('link');link.id='hidroboxProgramStyles';link.rel='stylesheet';link.href='/hidrobox-program.css';document.head.appendChild(link);
 }
 const model=root.HydroSpace2026;
 if(!spaceDraft)spaceDraft=model.DEFAULT();
 const s=spaceDraft;
 if(!model.allowedDrain(s.colour,s.overflow===true).includes(s.drain))s.drain='OPBT0001';
 if(s.colour!=='BLA')s.exterior='';
 const q=model.quote(s),hero=officialImage(officialCollectionMedia('space')?.image);
 const card=(key,value,title,note='')=>'<button type="button" class="hp-choice" data-hs="'+escape(key)+'" data-value="'+escape(value)+'" aria-pressed="'+(String(s[key])===String(value))+'"><b>'+escape(title)+'</b><small>'+escape(note)+'</small></button>';
 const select=(key,label,options)=>'<label>'+escape(label)+'<select data-hs-select="'+escape(key)+'">'+options.map(([value,title])=>'<option value="'+escape(value)+'"'+(s[key]===value?' selected':'')+'>'+escape(title)+'</option>').join('')+'</select></label>';
 const option=(ref)=>[ref,model.OPTIONS[ref].label+(model.OPTIONS[ref].price?' · +'+eu(model.OPTIONS[ref].price)+' HT':' · inclus')];
 const html='<button class="hidrobox-back" type="button">← Collections</button>'+
  '<div class="hidrobox-neo-hero">'+(hero?'<img src="'+escape(hero)+'" alt="Collection Space" loading="lazy">':'')+
  '<div><div class="eyebrow">Baignoire îlot · Hidrobox</div><h3>Space · modèle exact</h3><p>Scene Solid Surface · finition Lisse · tarif France février 2026, pages 132–137.</p>'+
  '<div class="hidrobox-downloads"><a href="'+escape(HIDROBOX_DOCUMENTS.space.technical)+'" target="_blank" rel="noopener noreferrer">Fiche technique</a>'+
  '<a href="'+escape(HIDROBOX_DOCUMENTS.space.manual)+'" target="_blank" rel="noopener noreferrer">Notice d’installation</a></div>'+
  '<small>Photographie de collection Space · configuration et couleur non contractuelles.</small></div></div>'+
  '<div class="hidrobox-program hidrobox-space"><h4>1 · Modèle</h4><div class="hidrobox-fixed-attribute"><strong>Space</strong><span>Baignoire îlot</span></div>'+
  '<h4>2 · Matière et texture</h4>'+hidroboxFixedAxes('Scene','Lisse')+
  '<h4>3 · Couleur</h4><div class="hp-grid">'+
  card('colour','BLA','Blanc Scene','Blanc lisse')+
  card('colour','BAS','Plus Colour · Basics','Couleur incluse dans le tarif')+
  card('colour','TRE','Plus Colour · Trends','Couleur incluse dans le tarif')+
  card('colour','SPE','Plus Colour · Specials','Tarif RAL/NCS publié, couleur exacte à préciser à la commande')+'</div>'+
  '<h4>4 · Dimensions de la baignoire</h4><div class="hp-grid">'+
  model.SIZES.map(z=>card('sizeId',z.id,z.length+' × '+z.width+' × '+String(z.height).replace('.',',')+' cm','L × P × H fixes, tarif constructeur')).join('')+'</div>'+
  '<h4>5 · Trop-plein</h4><div class="hp-grid">'+card('overflow','false','Sans trop-plein')+card('overflow','true','Trop-plein intégré')+'</div>'+
  '<h4>6 · Options compatibles</h4><div class="hp-options">'+
  select('drain','Bonde',[...model.allowedDrain(s.colour,s.overflow===true)].map(option))+
  (s.colour==='BLA'?select('exterior','Coloration extérieure sur baignoire blanche',[['','Sans coloration extérieure'],option('OPBT0008'),option('OPBT0009')]):'<p>Plus Colour : couleur déjà incluse dans la référence BSPC, sans supplément de peinture ajouté.</p>')+
  select('headrest','Appuie-tête C12',[['','Sans appuie-tête'],option('OPBT0015'),option('OPBT0016')])+'</div>'+
  '<h4>7 · Référence et détail du prix</h4><table class="hp-breakdown"><thead><tr><th>Désignation</th><th>Référence</th><th>Prix source HT</th></tr></thead><tbody>'+
  q.components.map(c=>'<tr><td>'+escape(c.label)+'</td><td>'+escape(c.reference)+'</td><td>'+eu(c.rawPrice)+'</td></tr>').join('')+'</tbody></table>'+
  (q.errors.length?'<ul class="hp-errors" role="alert">'+q.errors.map(e=>'<li>'+escape(e)+'</li>').join('')+'</ul>':'')+
  '<div class="hidrobox-result"><div><b>'+(q.ok?eu(q.price)+' HT':'Configuration à confirmer')+'</b>'+
  '<span>Référence '+escape(q.reference||'—')+'</span><small>'+(q.ok?'Prix source '+eu(q.rawPrice)+' HT · majoration +4 % une fois · achat fournisseur après remise 50 % : '+eu(q.purchasePrice)+' HT.':'Aucun prix extrapolé.')+'</small></div>'+
  '<button id="huAdd" class="btn primary" type="button"'+(q.ok?'':' disabled')+'>Ajouter au projet</button></div></div>';
 shell('Space · configuration',html,true);
 overlay.querySelector('.hidrobox-back').onclick=collections;
 const refresh=()=>{const previous=overlay.querySelector('.recor-configurator')?.scrollTop||0;spacePage(g);const current=overlay?.querySelector('.recor-configurator');if(current)current.scrollTop=previous};
 overlay.querySelectorAll('[data-hs]').forEach(b=>b.onclick=()=>{
  s[b.dataset.hs]=b.dataset.hs==='overflow'?b.dataset.value==='true':b.dataset.value;
  refresh();
 });
 overlay.querySelectorAll('[data-hs-select]').forEach(e=>e.onchange=()=>{s[e.dataset.hsSelect]=e.value;refresh()});
 overlay.querySelector('#huAdd')?.addEventListener('click',()=>{
  const result=model.quote(s);if(!result.ok)return;
  const dimensions=result.variant,finish=dimensions.colour==='BLA'?'Blanc Scene':'Plus Colour '+dimensions.colour;
  const designation='Space '+dimensions.length+' × '+dimensions.width+' × '+String(dimensions.height).replace('.',',')+' cm · '+finish+
    ' · '+(dimensions.overflow?'Trop-plein intégré':'Sans trop-plein')+' · '+result.components.slice(1).map(c=>c.label).join(' · ');
  const item={manufacturer:'Hidrobox',collection:'Space',reference:result.reference,base:result.reference,designation,category:'Baignoire îlot',material:'Scene Solid Surface',finish,price:result.price,totalPrice:result.price,rawTariffPrice:result.rawPrice,purchaseDiscount:50,listPriceUpliftPct:4,currency:'€',vat:'HT',source:result.source,sourceYear:2026,manufacturerUrl:HOUSE+'collections/space/',technicalSheetUrl:HIDROBOX_DOCUMENTS.space.technical,technicalSheetLabel:'Fiche technique Space',installationGuideUrl:HIDROBOX_DOCUMENTS.space.manual,installationGuideLabel:'Notice de pose Space',image:hero,imageSource:'Photographie de collection Space · finition non contractuelle',imageFinishMatch:'collection',configuratorType:'hidrobox-configured'};
  try{
   const record=createSelectedProductRecord(item,room,'');
   if(!record)throw Error('Impossible de créer la composition Space');
   Object.assign(record,item,{hidroboxConfiguration:{type:'space-2026',group:g.id,...result.configuration,dimensions:{length:dimensions.length,width:dimensions.width,height:dimensions.height},components:result.components,reference:result.reference}});
   const ids=commitSelectedRecords([record],{showProject:false});
   if(!ids?.length)throw Error('Enregistrement impossible');
   close();showView('project');
  }catch(e){alert('Ajout Space impossible : '+e.message)}
 });
}


function loadBetaEvoqueModel(){
 if(root.HydroBetaEvoque2026)return Promise.resolve();
 if(!betaEvoqueModelPromise)betaEvoqueModelPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='/hidrobox-beta-evoque-2026.js';
  script.onload=resolve;script.onerror=()=>reject(Error('Chargement de la matrice Beta Evoque impossible'));
  document.head.appendChild(script);
 }).catch(e=>{betaEvoqueModelPromise=null;throw e});
 return betaEvoqueModelPromise;
}
function betaEvoquePage(g){
 stage='group';chosenGroup=g;
 if(!root.HydroBetaEvoque2026){
  const token=navigationToken;
  shell('Beta Evoque','<p role="status">Chargement des six références tarifées Beta Evoque…</p>',true);
  loadBetaEvoqueModel().then(()=>{if(overlay&&token===navigationToken&&chosenGroup===g)betaEvoquePage(g)})
   .catch(e=>{if(overlay&&token===navigationToken)shell('Beta Evoque','<p role="alert">'+escape(e.message)+'</p>',true)});
  return;
 }
 if(!document.querySelector('#hidroboxProgramStyles')){
  const link=document.createElement('link');link.id='hidroboxProgramStyles';link.rel='stylesheet';link.href='/hidrobox-program.css';document.head.appendChild(link);
 }
 const model=root.HydroBetaEvoque2026;
 if(!betaEvoqueDraft){
  const previous=model.VARIANTS.find(v=>v.reference===original?.reference);
  betaEvoqueDraft=previous?{...model.defaults(),position:previous.position,overflow:previous.overflow}:model.defaults();
 }
 const draft=betaEvoqueDraft;
 if(!model.drains(draft.overflow===true).includes(draft.drain))draft.drain='OPBT0001';
 const quote=model.quote(draft),hero=officialImage(officialCollectionMedia('beta-evoque')?.image);
 const card=(key,value,title,note='',diagram='')=>'<button type="button" class="hp-choice'+(diagram?' hbev-position-card':'')+'" data-hbev="'+escape(key)+'" data-value="'+escape(value)+'" aria-pressed="'+(String(draft[key])===String(value))+'">'+
  (diagram?'<span class="hbev-diagram hbev-diagram-'+escape(diagram)+'" aria-hidden="true"><i></i><em></em></span>':'')+
  '<b>'+escape(title)+'</b><small>'+escape(note)+'</small></button>';
 const opts=(key,title,list)=>'<label>'+escape(title)+'<select data-hbev-select="'+escape(key)+'">'+list.map(([value,label])=>'<option value="'+escape(value)+'"'+(draft[key]===value?' selected':'')+'>'+escape(label)+'</option>').join('')+'</select></label>';
 const option=ref=>[ref,model.OPTIONS[ref].label+(model.OPTIONS[ref].rawPrice===null?' · tarif à confirmer':model.OPTIONS[ref].rawPrice?' · +'+eu(model.OPTIONS[ref].rawPrice)+' HT':' · inclus')];
 const html='<button type="button" class="hidrobox-back">← Collections</button>'+
 '<div class="hidrobox-neo-hero">'+(hero?'<img src="'+escape(hero)+'" alt="Collection Beta Evoque" loading="lazy">':'')+
 '<div><div class="eyebrow">Baignoire · Hidrobox</div><h3>Beta Evoque · adossement L / C / R</h3>'+
 '<p>170 × 90 × 56 cm · Scene Solid Surface blanc lisse. Trois orientations tarifées : gauche, centrée, droite.</p>'+
 '<div class="hidrobox-downloads"><a href="'+escape(HIDROBOX_DOCUMENTS['beta evoque'].technical)+'" target="_blank" rel="noopener noreferrer">Fiche technique</a>'+
 '<a href="'+escape(HIDROBOX_DOCUMENTS['beta evoque'].manual)+'" target="_blank" rel="noopener noreferrer">Notice d’installation</a></div>'+
 '<small>Photo fabricant de collection non contractuelle pour l’orientation, la finition et les dimensions. Schémas d’implantation indicatifs.</small></div></div>'+
 '<div class="hidrobox-program hidrobox-beta-evoque"><h4>1 · Modèle et position de la baignoire</h4>'+
 '<div class="hp-grid">'+model.POSITIONS.map(v=>card('position',v.id,'Version '+v.id+' · '+v.label,'Position d’adossement · schéma indicatif',v.id)).join('')+'</div>'+
 '<h4>2 · Matière et texture</h4>'+hidroboxFixedAxes('Scene','Lisse')+
 '<h4>3 · Couleur</h4>'+'<div class="hidrobox-fixed-attribute"><strong>Couleur fabricant</strong><span>Blanc · Scene lisse</span></div>'+
 '<h4>4 · Dimensions</h4><div class="hidrobox-fixed-attribute"><strong>Dimensions fabricant</strong><span>170 × 90 × 56 cm (fixes)</span></div>'+
 '<h4>5 · Trop-plein</h4><div class="hp-grid">'+card('overflow','false','Sans trop-plein','Référence propre au modèle')+
 card('overflow','true','Trop-plein intégré','Référence propre au modèle')+'</div>'+
 '<h4>6 · Bonde et options</h4><div class="hp-options">'+opts('drain','Bonde',[...model.drains(draft.overflow===true)].map(option))+
 opts('exterior','Couleur extérieure',[['','Blanc Scene · sans supplément'],option('OPBT0008'),option('OPBT0009')])+
 opts('headrest','Appuie-tête C12',[['','Sans appuie-tête'],option('OPBT0015'),option('OPBT0016')])+'</div>'+
 '<p class="hidrobox-guide-note">Le supplément de couleur standard est affiché mais désactivé pour le devis : p. 139 = 650 €, tableau détaillé OPBT0008 p. 140 = 666 €. La finition intégrale Plus Colour n’a pas de référence Beta Evoque tarifée dans le document 2026 : aucune variante inventée.</p>'+
 '<h4>7 · Référence exacte et décomposition</h4>'+
 '<table class="hp-breakdown"><thead><tr><th>Élément</th><th>Référence</th><th>Prix source HT</th></tr></thead><tbody>'+
 quote.components.map(c=>'<tr><td>'+escape(c.label)+'</td><td>'+escape(c.reference)+'</td><td>'+eu(c.rawPrice)+'</td></tr>').join('')+'</tbody></table>'+
 (quote.errors.length?'<ul class="hp-errors" role="alert">'+quote.errors.map(e=>'<li>'+escape(e)+'</li>').join('')+'</ul>':'')+
 '<div class="hidrobox-result"><div><b>'+(quote.ok?eu(quote.price)+' HT':'Tarif à confirmer')+'</b>'+
 '<span>Réf. '+escape(quote.reference||'—')+' · 170 × 90 × 56 cm</span>'+
 '<small>'+(quote.ok?'Prix du tarif '+eu(quote.rawPrice)+' HT, majoration +4 % une seule fois. Prix achat après remise −50 % : '+eu(quote.purchasePrice)+' HT.':'Impossible de chiffrer ou d’ajouter une configuration incompatible ou un supplément non vérifié.')+'</small></div>'+
 '<button class="btn primary" type="button" id="huAdd"'+(quote.ok?'':' disabled')+'>Ajouter au projet</button></div></div>';
 shell('Beta Evoque · configuration',html,true);
 overlay.querySelector('.hidrobox-back').onclick=collections;
 const refresh=()=>{const pos=overlay?.querySelector('.recor-configurator')?.scrollTop||0;betaEvoquePage(g);if(overlay?.querySelector('.recor-configurator'))overlay.querySelector('.recor-configurator').scrollTop=pos;};
 overlay.querySelectorAll('[data-hbev]').forEach(b=>b.onclick=()=>{
  draft[b.dataset.hbev]=b.dataset.hbev==='overflow'?b.dataset.value==='true':b.dataset.value;
  refresh();
 });
 overlay.querySelectorAll('[data-hbev-select]').forEach(el=>el.onchange=()=>{draft[el.dataset.hbevSelect]=el.value;refresh()});
 overlay.querySelector('#huAdd')?.addEventListener('click',()=>{
  const result=model.quote(draft);if(!result.ok)return;
  const v=result.variant,position=model.POSITIONS.find(p=>p.id===v.position);
  const options=result.components.slice(1).map(c=>c.label).join(' · ');
  const item={manufacturer:'Hidrobox',collection:'Beta Evoque',reference:result.reference,base:result.reference,
   designation:'Beta Evoque '+v.position+' ('+position.label+') · 170 × 90 × 56 cm · Scene blanc lisse · '+(v.overflow?'Trop-plein intégré':'Sans trop-plein')+' · '+options,
   category:'Baignoire',material:'Scene Solid Surface',finish:'Blanc lisse'+(draft.exterior?' · Couleur extérieure Special RAL/NCS':''),
   price:result.price,totalPrice:result.price,rawTariffPrice:result.rawPrice,
   purchaseDiscount:50,listPriceUpliftPct:4,currency:'€',vat:'HT',source:result.source,sourceYear:2026,
   manufacturerUrl:HOUSE+'collections/beta-evoque/',technicalSheetUrl:HIDROBOX_DOCUMENTS['beta evoque'].technical,technicalSheetLabel:'Fiche technique Beta Evoque',
   installationGuideUrl:HIDROBOX_DOCUMENTS['beta evoque'].manual,installationGuideLabel:'Notice de pose Beta Evoque',
   image:hero,imageSource:'Photographie constructeur de collection Beta Evoque · variante illustrative',imageFinishMatch:'collection',
   configuratorType:'hidrobox-configured'};
  try{
   const record=createSelectedProductRecord(item,room,'');if(!record)throw Error('Création du produit impossible');
   Object.assign(record,item,{hidroboxConfiguration:{type:'beta-evoque-2026',group:g.id,...result.configuration,
    dimensions:{length:170,width:90,height:56},components:result.components,reference:result.reference}});
   const ids=commitSelectedRecords([record],{showProject:false});
   if(!ids?.length)throw Error('La composition Beta Evoque n’a pas été enregistrée');
   close();showView('project');
  }catch(e){alert('Ajout Beta Evoque impossible : '+e.message)}
 });
}


function loadBetaEssentialModel(){
 if(root.HydroBetaEssential2026)return Promise.resolve();
 if(!betaEssentialModelPromise)betaEssentialModelPromise=new Promise((resolve,reject)=>{
  const js=document.createElement('script');js.src='/hidrobox-beta-essential-2026.js';
  js.onload=resolve;js.onerror=()=>reject(Error('Le tarif Beta Essential n’a pas pu être chargé'));
  document.head.appendChild(js);
 }).catch(err=>{betaEssentialModelPromise=null;throw err});
 return betaEssentialModelPromise;
}
function betaEssentialPage(g){
 stage='group';chosenGroup=g;
 if(!root.HydroBetaEssential2026){
  const token=navigationToken;shell('Beta Essential','<p role="status">Chargement des 96 références Beta Essential du tarif 2026…</p>',true);
  loadBetaEssentialModel().then(()=>{if(overlay&&token===navigationToken&&chosenGroup===g)betaEssentialPage(g)})
   .catch(e=>{if(overlay&&token===navigationToken)shell('Beta Essential','<p role="alert">'+escape(e.message)+'</p>',true)});
  return;
 }
 if(!document.querySelector('#hidroboxProgramStyles')){
  const link=document.createElement('link');link.id='hidroboxProgramStyles';link.rel='stylesheet';link.href='/hidrobox-program.css';document.head.appendChild(link);
 }
 const model=root.HydroBetaEssential2026;
 if(!betaEssentialDraft){
  const old=model.VARIANTS.find(v=>v.reference===original?.reference);
  betaEssentialDraft=old?{...model.defaults(),form:old.form,sizeId:old.sizeId,colour:old.colour,overflow:old.overflow}:model.defaults();
 }
 const state=betaEssentialDraft;
 const selectedForm=model.FORMS.find(f=>f.key===state.form)||model.FORMS[0];
 if(!selectedForm.sizes.some(x=>x.id===state.sizeId))state.sizeId=selectedForm.sizes[0].id;
 if(!model.availableDrains(state.colour,state.overflow===true).includes(state.drain))state.drain='OPBT0001';
 if(state.colour!=='BLA')state.exterior='';
 const q=model.quote(state);
 const hero=officialImage(officialCollectionMedia('beta-essential')?.image);
 const card=(key,value,title,note='',diagram='')=>
  '<button type="button" class="hp-choice hbess-choice" data-hbess="'+escape(key)+'" data-value="'+escape(value)+'" aria-pressed="'+(String(state[key])===String(value))+'">'+
  (diagram?'<span class="hbess-pictogram hbess-pictogram-'+escape(diagram)+'" aria-hidden="true"><span></span></span>':'')+
  '<b>'+escape(title)+'</b><small>'+escape(note)+'</small></button>';
 const options=(key,label,rows)=>'<label>'+escape(label)+'<select data-hbess-select="'+escape(key)+'">'+rows.map(([val,name])=>
  '<option value="'+escape(val)+'"'+(state[key]===val?' selected':'')+'>'+escape(name)+'</option>').join('')+'</select></label>';
 const opt=ref=>[ref,model.OPTIONS[ref].label+(model.OPTIONS[ref].price?' · +'+eu(model.OPTIONS[ref].price)+' HT':' · inclus')];
 const html='<button class="hidrobox-back" type="button">← Collections</button>'+
  '<div class="hidrobox-neo-hero">'+(hero?'<img src="'+escape(hero)+'" alt="Collection Beta Essential" loading="lazy">':'')+
  '<div><div class="eyebrow">Baignoires îlot · Hidrobox</div><h3>Beta Essential · formes et dimensions du tarif</h3>'+
  '<p>4 formes ovales et 4 formes circulaires, avec dimensions propres à chaque variante. Scene Solid Surface lisse.</p>'+
  '<div class="hidrobox-downloads"><a href="'+escape(HIDROBOX_DOCUMENTS['beta essential'].technical)+'" target="_blank" rel="noopener noreferrer">Fiche technique fabricant</a>'+
  '<a href="'+escape(HIDROBOX_DOCUMENTS['beta essential'].manual)+'" target="_blank" rel="noopener noreferrer">Notice d’installation</a></div>'+
  '<small>Photo fabricant de collection, non contractuelle selon dimension et couleur. Les pictogrammes sont indicatifs, non des plans cotés.</small></div></div>'+
  '<div class="hidrobox-program hidrobox-beta-essential"><h4>1 · Type et forme de la baignoire</h4><div class="hp-grid hbess-shapes">'+
  model.FORMS.map(x=>card('form',x.key,x.name,x.sizes.map(z=>z.label).join(' / '),x.kind)).join('')+'</div>'+
  '<h4>2 · Matière et texture</h4>'+hidroboxFixedAxes('Scene','Lisse')+
  '<h4>3 · Couleur</h4><div class="hp-grid">'+model.FINISH.map(x=>card('colour',x.id,x.name,x.id==='SPE'?'Tarif couleur Special RAL/NCS inclus, teinte exacte à confirmer':'Référence du tarif publiée')).join('')+'</div>'+
  '<h4>4 · Dimensions disponibles · '+escape(selectedForm.name)+'</h4><div class="hp-grid">'+
  selectedForm.sizes.map(x=>card('sizeId',x.id,x.label,'L / P / H ou Ø / H en centimètres')).join('')+'</div>'+
  '<h4>5 · Trop-plein</h4><div class="hp-grid">'+
  card('overflow','false','Sans trop-plein','Référence fabricant spécifique')+
  card('overflow','true','Avec trop-plein intégré','Référence fabricant spécifique')+'</div>'+
  '<h4>6 · Bonde, coloris extérieur et accessoires</h4>'+
  '<div class="hp-options">'+
  options('drain','Bonde',[...model.availableDrains(state.colour,state.overflow===true)].map(opt))+
  (state.colour==='BLA'?options('exterior','Coloration extérieure sur la version blanche',[['','Sans coloration extérieure'],opt('OPBT0008'),opt('OPBT0009')]):'<p>La couleur Plus Colour est déjà comprise dans le tarif de la référence BBEC. Aucun supplément de coloration ajouté.</p>')+
  options('headrest','Appuie-tête C12',[['','Sans appuie-tête'],opt('OPBT0015'),opt('OPBT0016')])+
  '<label><span>Préparation robinetterie · OPBT0029 (+68 € HT)</span><input type="checkbox" data-hbess-check="tapPrep"'+(state.tapPrep?' checked':'')+'></label>'+
  (state.tapPrep?'<label><span>Je dispose d’un plan coté de perçage à transmettre à Hidrobox</span><input type="checkbox" data-hbess-check="technicalPlanProvided"'+(state.technicalPlanProvided?' checked':'')+'></label>':'')+
  '</div>'+
  '<p class="hidrobox-guide-note">Pas de dimension libre pour ces modèles. Les couleurs Specials doivent être précisées sur la commande. Les totems/étagères sont des articles séparés, non inclus.</p>'+
  '<h4>7 · Référence et détail du chiffrage</h4>'+
  '<table class="hp-breakdown"><thead><tr><th>Poste</th><th>Réf.</th><th>Prix source HT</th></tr></thead><tbody>'+
  q.components.map(c=>'<tr><td>'+escape(c.label)+'</td><td>'+escape(c.reference)+'</td><td>'+eu(c.rawPrice)+'</td></tr>').join('')+'</tbody></table>'+
  (q.errors.length?'<ul class="hp-errors" role="alert">'+q.errors.map(e=>'<li>'+escape(e)+'</li>').join('')+'</ul>':'')+
  '<div class="hidrobox-result"><div><b>'+(q.ok?eu(q.price)+' HT':'Configuration à vérifier')+'</b>'+
  '<span>Réf. '+escape(q.reference||'—')+' · '+escape(q.variant?.dimensions.label||'')+'</span>'+
  '<small>'+(q.ok?'Source '+eu(q.rawPrice)+' HT · majoration +4 % une fois · achat fournisseur −50 % : '+eu(q.purchasePrice)+' HT.':'Aucun article chiffré si la combinaison est invalide.')+'</small></div>'+
  '<button id="huAdd" class="btn primary" type="button"'+(q.ok?'':' disabled')+'>Ajouter au projet</button></div></div>';
 shell('Beta Essential · configuration',html,true);
 overlay.querySelector('.hidrobox-back').onclick=collections;
 const refresh=()=>{const scroll=overlay.querySelector('.recor-configurator')?.scrollTop||0;betaEssentialPage(g);const pane=overlay?.querySelector('.recor-configurator');if(pane)pane.scrollTop=scroll};
 overlay.querySelectorAll('[data-hbess]').forEach(b=>b.onclick=()=>{
  const key=b.dataset.hbess;
  state[key]=key==='overflow'?b.dataset.value==='true':b.dataset.value;
  if(key==='form'){
   state.sizeId=model.FORMS.find(x=>x.key===state.form)?.sizes[0]?.id||'';
  }
  refresh();
 });
 overlay.querySelectorAll('[data-hbess-select]').forEach(el=>el.onchange=()=>{state[el.dataset.hbessSelect]=el.value;refresh()});
 overlay.querySelectorAll('[data-hbess-check]').forEach(el=>el.onchange=()=>{state[el.dataset.hbessCheck]=el.checked;refresh()});
 overlay.querySelector('#huAdd')?.addEventListener('click',()=>{
  const result=model.quote(state);if(!result.ok)return;
  const v=result.variant,dim=v.dimensions;
  const designation='Beta Essential '+v.shape+' · '+dim.label+' · '+v.finishLabel+' · '+(v.overflow?'Trop-plein intégré':'Sans trop-plein')+
   ' · '+result.components.slice(1).map(c=>c.label).join(' · ');
  const item={manufacturer:'Hidrobox',collection:'Beta Essential',reference:result.reference,base:result.reference,
   designation,category:'Baignoire îlot',material:'Scene Solid Surface',finish:v.finishLabel,
   price:result.price,totalPrice:result.price,rawTariffPrice:result.rawPrice,
   purchaseDiscount:50,listPriceUpliftPct:4,currency:'€',vat:'HT',
   source:result.source,sourceYear:2026,manufacturerUrl:HOUSE+'collections/beta-essential/',
   technicalSheetUrl:HIDROBOX_DOCUMENTS['beta essential'].technical,technicalSheetLabel:'Fiche technique Beta Essential',
   installationGuideUrl:HIDROBOX_DOCUMENTS['beta essential'].manual,installationGuideLabel:'Notice de pose Beta Essential',
   image:hero,imageSource:'Photo constructeur de collection Beta Essential · variante illustrative',imageFinishMatch:'collection',
   configuratorType:'hidrobox-configured'};
  try{
   const record=createSelectedProductRecord(item,room,'');if(!record)throw Error('Impossible de préparer le produit');
   Object.assign(record,item,{hidroboxConfiguration:{type:'beta-essential-2026',group:g.id,...result.configuration,
     dimensions:{...dim},components:result.components,reference:result.reference}});
   const ids=commitSelectedRecords([record],{showProject:false});
   if(!ids?.length)throw Error('Enregistrement Beta Essential non effectué');
   close();showView('project');
  }catch(e){alert('Ajout Beta Essential impossible : '+e.message)}
 });
}

function restoreHidroboxSelection(g){
 const key=String(g?.id||g?.collection||'');
 if(universalDraft.__group===key)return;
 for(const k of Object.keys(universalDraft))delete universalDraft[k];
 universalDraft.__group=key;
 const found=(g?.variants||[]).find(v=>String(v.reference||'')===String(original?.reference||''));
 if(!found)return;
 for(const [field] of FACE_KEYS)if(found[field]!==undefined&&found[field]!==null&&String(found[field]))universalDraft[field]=String(found[field]);
 universalDraft.reference=String(found.reference);
 const supplierModel=root.HydroHidroboxTrayModels2026;
 const selectedModel=supplierModel?.submodel(g,found,root.HydroHidroboxOfficialVisual);
 if(selectedModel)universalDraft.traySubmodel=selectedModel;
 const saved=original?.hidroboxConfiguration||{};
 const width=Number(saved.widthCm||saved.selectedWidthCm),length=Number(saved.lengthCm||saved.selectedLengthCm);
 if(Number.isInteger(width)&&width>0)universalDraft.exactwidth=width;
 if(Number.isInteger(length)&&length>0)universalDraft.exactlength=length;
 if(saved.color||saved.selectedColour)universalDraft.showerColor=saved.color||saved.selectedColour;
 for(const opt of saved.accessories||[])if(opt.group&&opt.id)universalDraft['tray_'+opt.group]=opt.id;
}
function officialSpecForGroup(g,row,colour,width,length){
 const engine=root.HydroHidroboxOfficialVisual;
 if(!engine?.selection||!row)return null;
 const category=groupCategory(g);
 const tax={'receveurs':'shower-tray','panneaux':'wall-panels',
   'vasques-suspendues':'wall-hung-washbasins','vasques-a-poser':'vessel-washbasin',
   'vasques-sur-pied':'floor-standing-basins','bains-ilot':'freestanding-bathtub',
   'bains-encastres':'recessed-bathtub','accessoires':'accessories'};
 const typology=tax[category];if(!typology)return null;
 const collection=norm(g?.collection||g?.id).replaceAll(' ','-');
 const model=category==='receveurs'?(engine.modelFor(g,row)||collection):
   collection==='paneles'?'wall-panels':
   /^spot-[0-9]+$/.test(collection)?collection:
   collection==='fs'?String(row?.model||'').toLowerCase().replaceAll(' ','-'):collection;
 const spec=engine.selection(g,row,{model,typology,
  color:colour||row.color||'',width:Number(width)||0,length:Number(length)||0});
 return engine.eligible(spec)?spec:null;
}
function sourcePanelSpotPage(g,type){
 const api=root.HydroHidroboxPanelSpotUI;
 if(!api)return null;
 stage='group';chosenGroup=g;
 const collection=type==='panel'?'Panneaux muraux':'Spot';
 const docs=HIDROBOX_DOCUMENTS[norm(collection)]||HIDROBOX_DOCUMENTS[norm(g.collection)]||{};
 const image=collectionImageFor(collection,officialGroupMedia(g)?.image||g.image)||'';
 const ctx={original,room,image,
  docs:{technical:officialPdf(docs.technical),manual:officialPdf(docs.manual)},
  overlay:()=>overlay,
  back:collections,shell:(name,html)=>shell(name,html,true),
  save:(item,configuration)=>{
   if(ctx.docs.technical){item.technicalSheetUrl=ctx.docs.technical;item.technicalSheetLabel='Fiche technique '+collection;}
   if(ctx.docs.manual){item.installationGuideUrl=ctx.docs.manual;item.installationGuideLabel='Notice d’installation '+collection;}
   const record=createSelectedProductRecord(item,room,'');
   if(!record)throw Error('Impossible de créer le produit Hidrobox');
   Object.assign(record,item,{hidroboxConfiguration:{group:g.id,collection,...configuration}});
   const ids=commitSelectedRecords([record],{showProject:false});
   if(!ids?.length)throw Error('Impossible de sauvegarder le produit');
   close();showView('project');
  }};
 return type==='panel'?api.panel(g,ctx):api.spot(g,ctx);
}
function universalPage(g){
 const familyName=norm(g.collection||g.id);
 const specialParts=familyName==='niches etageres et pieces speciales'?root.HydroHidroboxSpecialParts2026:null;
 if(specialParts){
   // The compressed catalogue omits supplier SKUs from both special-piece matrices.
   // Restore the exact 2026 source variants, retaining every other imported accessory.
   const others=(g.variants||[]).filter(v=>!/^(?:SCOC|VCOC)\d{4}$/.test(String(v.reference||'')));
   g={...g,variants:[...specialParts.rows,...others]};
 }
 if(familyName==='panneaux muraux'||familyName==='paneles')return sourcePanelSpotPage(g,'panel');
 if(familyName==='spot')return sourcePanelSpotPage(g,'spot');
 if(familyName==='program')return programPage(g);
 if(norm(g.collection||g.id)==='space')return spacePage(g);
 if(norm(g.collection||g.id)==='beta evoque')return betaEvoquePage(g);
 if(norm(g.collection||g.id)==='beta essential')return betaEssentialPage(g);
 restoreHidroboxSelection(g);
 stage='group';chosenGroup=g;
 const name=g.collection||g.family||g.model||g.id;
 const selection=universalSelection(g);
 const {selected,fields,refs}=selection;
 const traySubmodelSelector=root.HydroHidroboxTrayModels2026;
 const submodels=traySubmodelSelector?.variants(g,pricedShowerVariants(g),root.HydroHidroboxOfficialVisual)||[];
 const submodelMarkup=submodels.length?'<section class="hidrobox-tray-submodels"><h4 class="hidrobox-universal-subtitle">1 · Choisir la forme du receveur</h4>'+
   '<div class="hidrobox-tray-model-grid">'+submodels.map(item=>'<button type="button" class="hidrobox-tray-model" data-hb-tray-model="'+escape(item.id)+'" aria-pressed="'+(item.id===universalDraft.traySubmodel?'true':'false')+'">'+
     traySubmodelSelector.shapeSvg(item.id)+'<strong>'+escape(item.label)+'</strong></button>').join('')+'</div>'+
   '<p class="hidrobox-guide-note">Les références et les plages de dimensions sont filtrées selon cette forme du tarif 2026.</p></section>':'';
 const family=CATEGORY.find(c=>c.key===groupCategory(g));
 const n=norm(name),assets=HIDROBOX_DOCUMENTS[n]||{};
 const url=officialCollection(g);
 const groupMedia=officialGroupMedia(g);
 const isProgramColour=n==='program colour';
 const exactSelectedImage=isProgramColour?'':officialImage(selected?.image),
   exactGroupImage=isProgramColour?'':officialImage(g.image);
 const collectionImage=collectionImageFor(name,groupMedia?.image||g.image);
 const mainImage=isProgramColour?PROGRAM_COLOUR_GENERIC_IMAGE:
   exactSelectedImage||exactGroupImage||collectionImage||family?.img||'';
 const imageScope=exactSelectedImage?'exact':collectionImage||exactGroupImage?'collection':'category';
 const facetControl=f=>f.static?
   '<div class="hidrobox-fixed-attribute"><strong>'+escape(f.label)+'</strong><span>'+escape(f.chosen||'À vérifier')+'</span></div>':
   visualFacet('huFacet'+f.key,f.label,f.options,f.chosen,'data-facet="'+escape(f.key)+'"');
 const orderedShower=groupCategory(g)==='receveurs'&&selection.sourceBacked;
 const materialTexture=orderedShower?fields.filter(f=>['material','finish'].includes(f.key)).map(facetControl).join(''):'';
 const dimensionFacets=orderedShower&&!selection.dimensionResolution?fields.filter(f=>['width','length'].includes(f.key)).map(facetControl).join(''):'';
 const genericWorkflow=(()=>{
   if(orderedShower)return '';
   const axes=[
     {title:'1 · Modèle',keys:['model','type','shape','form']},
     {title:'2 · Matière',keys:['material']},
     {title:'3 · Texture',keys:['finish']},
     {title:'4 · Couleur',keys:['colorGroup','color']},
     {title:'5 · Dimensions',keys:['width','length','height','diameter']},
     {title:'6 · Autres caractéristiques',keys:['option','installation']}
   ];
   return axes.map(axis=>{
     const attributes=fields.filter(f=>axis.keys.includes(f.key));
     if(!attributes.length&&axis.title==='1 · Modèle')
       return '<h4 class="hidrobox-universal-subtitle">1 · Modèle</h4>'+
         '<div class="hidrobox-fixed-attribute"><strong>Collection</strong><span>'+escape(name)+'</span></div>';
     if(!attributes.length)return '';
     return '<h4 class="hidrobox-universal-subtitle">'+axis.title+'</h4><div class="hidrobox-fields">'+
       attributes.map(facetControl).join('')+'</div>';
   }).join('');
 })();
 const shower=groupCategory(g)==='receveurs',visual=root.HydroHidroboxOfficialVisual;
 const liveSize=selection.dimensionResolution;
 const exactNumberInputs=liveSize?'<div class="hidrobox-fields">'+
   [['width','Largeur réelle (cm)','widthBounds'],['length','Longueur réelle (cm)','lengthBounds']].map(([key,label,boundKey])=>{
     const bounds=liveSize[boundKey];
     return '<label>'+escape(label)+'<input type="number" id="huExact'+key+'" step="1"'+
       (bounds?' min="'+bounds.first+'" max="'+bounds.last+'"':'')+
       ' value="'+escape(String(liveSize[key]??''))+'" placeholder="cm" required></label>';
   }).join('')+'</div><small>Référence et prix calculés à partir des tranches tarifaires du PDF fabricant, sans interpolation.</small>':'';
 const dimensionMarkup=liveSize?exactNumberInputs:dimensionFields(selected);

 const verifiedColors=orderedShower?fields.find(f=>f.key==='color')?.options||[]:
   shower&&visual?visual.colorsFor(selected||{}):[];
 if(verifiedColors.length&&!verifiedColors.includes(universalDraft.showerColor))universalDraft.showerColor=verifiedColors[0];
 const showerColor=verifiedColors.length?'<div class="hidrobox-shower-colors"><h4>Couleur réelle du receveur</h4>'+
   visualFacet('huShowerColor','Couleur',verifiedColors,universalDraft.showerColor)+'</div>':'';

 const specialTier=specialParts&&selected&&specialParts.byRef.has(selected.reference)?selected.colorGroup:'';
 const specialChoices=specialTier==='BAS'?specialParts.COLOR_BAS:
   specialTier==='TRE'?specialParts.COLOR_TRE:specialTier==='BLA'?['Blanc']:[];
 if(specialChoices.length&&!specialChoices.includes(universalDraft.specialColor))universalDraft.specialColor=specialChoices[0];
 if(specialTier==='SPE'&&(!universalDraft.specialColor||universalDraft.specialColor==='Blanc'))universalDraft.specialColor='';
 const specialColorMarkup=specialTier==='SPE'?
   '<label>Code couleur RAL / NCS exigé<input id="huSpecialColorCode" type="text" value="'+escape(universalDraft.specialColor||'')+'" placeholder="RAL 9001 / NCS S ..."></label>':
   specialChoices.length?visualFacet('huSpecialColor','Couleur fabricant',specialChoices,universalDraft.specialColor):'';
 const accessories=root.HydroHidroboxShowerOptions2026;
 const trayModel=shower&&visual?visual.modelFor(g,selected||{}):'';
 const trayOpts=shower&&accessories?accessories.optionsFor({model:trayModel,material:selected?.material||'',
   texture:selected?.finish||'',width:Number(universalDraft.exactwidth)||Number(centimeterRange(selected?.width)?.first)||0,
   colorGroup:selected?.colorGroup||'',outlet:selected?.outlet||selected?.drainDiameter||''}):[];
 const trayOptsMarkup=trayOpts.length?'<h4 class="hidrobox-universal-subtitle">Grille, cache-bonde et évacuation</h4>'+
   '<div class="hidrobox-fields">'+trayOpts.map(group=>{
      const ids=group.options.map(x=>x.id);
      if(!ids.includes(universalDraft['tray_'+group.key]))universalDraft['tray_'+group.key]=ids[0];
      return '<label>'+escape(group.label)+'<select data-hb-tray-option="'+escape(group.key)+'">'+
        group.options.map(x=>'<option value="'+escape(x.id)+'"'+(x.id===universalDraft['tray_'+group.key]?' selected':'')+'>'+
          escape(x.label)+' · '+(x.percent?'+'+x.percent+' % du prix de base HT':x.rawPrice?eu(x.rawPrice)+' HT':'inclus')+'</option>').join('')+'</select></label>';
   }).join('')+'</div>':'';
 const trayQuote=accessories&&trayOpts.length?accessories.quote(selected?.rawPrice,trayOpts,Object.fromEntries(
    trayOpts.map(g=>[g.key,universalDraft['tray_'+g.key]]))):null;
 const eligibleSpec=officialSpecForGroup(g,selected,universalDraft.showerColor||selected?.color,
   universalDraft.exactwidth||selected?.width,universalDraft.exactlength||selected?.length);
 const imageLookup=eligibleSpec?'<div class="hidrobox-configured-photo"><img data-hb-config-image hidden alt="Visuel officiel correspondant à la configuration"><small data-hb-config-status>Recherche du visuel constructeur pour la combinaison exacte…</small></div>':'';
 const fixedMaterialTexture='';
 const flat='';
 const pricingWarning=selection.needsColorQuote?'La finition Scene choisie exige une confirmation du supplément tarifaire fabricant. Référence de base affichée, ajout désactivé.':
   selection.missingAttributes?.length?'Le tarif importé ne documente pas : '+selection.missingAttributes.join(', ')+'. Choisissez une autre référence tarifée ou vérifiez la fiche officielle.':'';
 const spareGroup=g.id==='hidrobox-spares-2026';
 const refsControl=refs.length>1?'<label>'+(spareGroup?'Article et référence':'Référence finale')+'<select id="huReference">'+(spareGroup?refs.map(ref=>{
    const item=(g.variants||[]).find(x=>x.reference===ref);
    return '<option value="'+escape(ref)+'"'+(ref===universalDraft.reference?' selected':'')+'>'+escape(ref+' · '+(item?.designation||''))+'</option>';
   }).join(''):choices(refs,universalDraft.reference))+'</select></label>':'';
 const price=trayQuote?.ok?trayQuote.price:Number(selected?.price),raw=Number(selected?.rawPrice);
 const canAdd=selected&&Number.isFinite(price)&&price>0&&selected.reference&&(!orderedShower||selection.ready)&&(!specialTier||specialTier!=='SPE'||String(universalDraft.specialColor||'').trim().length>=3);
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
   '<p>'+escape(pricedShowerVariants(g).length)+' références produit issues du tarif 2026. Configurez progressivement les caractéristiques, sans masquer les références restantes.</p>'+
   docs+'<small>'+escape(mainImage?(imageScope==='exact'?'Visuel associé à la référence sélectionnée':imageScope==='collection'?'Photo constructeur de la collection · finition/dimensions non contractuelles':'Illustration de catégorie · modèle et finition non garantis'):'Visuel non disponible')+'</small></div></div>'+
   submodelMarkup+
   (orderedShower&&!submodels.length?'<h4 class="hidrobox-universal-subtitle">1 · Modèle</h4><div class="hidrobox-fixed-attribute"><strong>Modèle</strong><span>'+escape(name)+'</span></div>':'')+
   '<h4 class="hidrobox-universal-subtitle">Caractéristiques tarifaires</h4>'+
   fixedMaterialTexture+
   (flat?'<p class="hidrobox-guide-note">'+flat+'</p>':'')+
   (orderedShower?
      '<h4 class="hidrobox-universal-subtitle">2 · Matière puis texture</h4><div class="hidrobox-fields">'+materialTexture+'</div>'+
      '<h4 class="hidrobox-universal-subtitle">3 · Finition couleur</h4>'+showerColor+
      '<h4 class="hidrobox-universal-subtitle">4 · Dimensions</h4><div class="hidrobox-fields">'+dimensionFacets+'</div>'+
      dimensionMarkup+
      '<h4 class="hidrobox-universal-subtitle">5 · Référence finale</h4><div class="hidrobox-fields">'+refsControl+'</div>':
      genericWorkflow+
      (showerColor||specialColorMarkup?'<h4 class="hidrobox-universal-subtitle">Couleur fabricant</h4><div class="hidrobox-fields">'+showerColor+specialColorMarkup+'</div>':'')+
      dimensionMarkup+'<div class="hidrobox-fields">'+refsControl+'</div>')+
   (pricingWarning?'<p class="hidrobox-guide-note" role="status">'+escape(pricingWarning)+'</p>':'')+
   trayOptsMarkup+imageLookup+
   '<div class="hidrobox-result"><div><b>'+(canAdd?eu(price)+' HT':'Tarif indisponible')+'</b>'+
   '<span>Réf. '+escape(selected?.reference||'—')+' · '+escape(selected?.designation||'')+'</span>'+
   '<small>'+(canAdd?(Number.isFinite(raw)&&raw>0?'Prix fabricant '+eu(raw)+' HT. ':'')+(trayQuote?.optionRawPrice?'Options fabricant '+eu(trayQuote.optionRawPrice)+' HT. ':'')+'Majoration 4 % appliquée une fois. Remise achat 50 % en calcul de marge.':'Aucun prix extrapolé sans référence tarifaire.')+'</small></div>'+
   '<button class="btn primary" id="huAdd" type="button"'+(canAdd?'':' disabled')+'>Ajouter au projet</button></div>';
 shell(String(name)+' · configuration',markup,true);
 overlay.querySelector('.hidrobox-back').onclick=collections;
 overlay.querySelectorAll('[data-hb-tray-model]').forEach(button=>button.addEventListener('click',()=>{
   if(button.dataset.hbTrayModel===universalDraft.traySubmodel)return;
   universalDraft.traySubmodel=button.dataset.hbTrayModel;
   for(const [key] of FACE_KEYS)delete universalDraft[key];
   universalDraft.reference='';delete universalDraft.showerColor;
   delete universalDraft.exactwidth;delete universalDraft.exactlength;
   for(const k of Object.keys(universalDraft))if(k.startsWith('tray_'))delete universalDraft[k];
   universalPage(g);
 }));
 overlay.querySelectorAll('[data-facet]').forEach(e=>e.addEventListener('change',()=>{
   universalDraft[e.dataset.facet]=e.value;universalDraft.reference='';
   for(const key of ['exactwidth','exactlength'])delete universalDraft[key];
   universalPage(g);
 }));
 wireVisualFacets();
 overlay.querySelectorAll('[data-hb-tray-option]').forEach(input=>input.addEventListener('change',()=>{
   universalDraft['tray_'+input.dataset.hbTrayOption]=input.value;universalPage(g);
 }));
 overlay.querySelector('#huShowerColor')?.addEventListener('change',e=>{
   universalDraft.showerColor=e.target.value;universalPage(g);
 });
 overlay.querySelector('#huSpecialColor')?.addEventListener('change',e=>{universalDraft.specialColor=e.target.value;universalPage(g)});
 overlay.querySelector('#huSpecialColorCode')?.addEventListener('change',e=>{universalDraft.specialColor=e.target.value.trim();universalPage(g)});
 if(eligibleSpec&&visual?.preview){
   void visual.preview(overlay.querySelector('.hidrobox-configured-photo'),eligibleSpec)
     .catch(e=>console.warn('[Hidrobox official visual]',e));
 }
 overlay.querySelector('#huReference')?.addEventListener('change',e=>{universalDraft.reference=e.target.value;universalPage(g)});
 overlay.querySelector('#huExactwidth')?.addEventListener('change',e=>{universalDraft.exactwidth=Number(e.target.value);universalPage(g)});
 overlay.querySelector('#huExactlength')?.addEventListener('change',e=>{universalDraft.exactlength=Number(e.target.value);universalPage(g)});
 overlay.querySelector('#huAdd')?.addEventListener('click',async()=>{
   const validation=universalSelection(g);
   if(validation.sourceBacked&&!validation.ready){alert('Cette combinaison requiert une validation du tarif constructeur.');return;}
   const {selected:row}=validation;
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
   const pickedColor=specialParts&&specialParts.byRef.has(row.reference)?String(universalDraft.specialColor||'').trim():(shower?(universalDraft.showerColor||row.color||''):(row.color||''));
   if(specialParts&&specialParts.byRef.has(row.reference)){
     const check=specialParts.resolve({kind:row.kind,material:row.material,finish:row.finish,
       colorGroup:row.colorGroup,width:dimInfo.widthCm??row.width,length:dimInfo.lengthCm??row.length,height:row.height});
     if(!check.ok||check.reference!==row.reference){alert('Dimensions / référence des pièces spéciales non vérifiées dans le tarif 2026.');return;}
     if(row.colorGroup==='SPE'&&pickedColor.length<3){alert('Indiquer la référence RAL ou NCS.');return;}
   }
   const selectedTrayQuote=accessories&&trayOpts.length?accessories.quote(row.rawPrice,trayOpts,
     Object.fromEntries(trayOpts.map(g=>[g.key,universalDraft['tray_'+g.key]]))):null;
   if(selectedTrayQuote&&!selectedTrayQuote.ok){alert(selectedTrayQuote.reason);return;}
   const optionLabels=selectedTrayQuote?.components?.map(x=>x.label)||[];
   const designation=[row.designation||name,...dimLabels,pickedColor?'Couleur '+pickedColor:'',...optionLabels].filter(Boolean).join(' · ');
   const officialSelection=officialSpecForGroup(g,row,pickedColor,
      dimInfo.widthCm||row.widthCm||0,dimInfo.lengthCm||row.lengthCm||0);
   let officialResult=null;
   if(officialSelection&&visual.eligible(officialSelection)){
     try{
       officialResult=await visual.lookup(officialSelection);
       if(officialResult?.ok){
         const quality=await visual.printQuality(officialResult);
         officialResult={...officialResult,verifiedPrintQuality:quality.ok,width:quality.width||0,height:quality.height||0};
       }
     }catch(error){console.warn('[Hidrobox official configured image]',error?.message||error);}
   }
   const isColourCollection=norm(name)==='program colour';
   const productImage=isColourCollection?'':officialImage(row.image);
   const groupCollectionImage=collectionImageFor(name,officialGroupMedia(g)?.image||g.image);
   const representative=isColourCollection?PROGRAM_COLOUR_GENERIC_IMAGE:
     groupCollectionImage||family?.img||'';
   const fallbackImage=productImage||representative;
   const fallbackScope=productImage?'product':(groupCollectionImage||isColourCollection?'collection':representative?'category':'unavailable');
   const item={manufacturer:'Hidrobox',collection:name,reference:row.reference,base:row.reference,designation,
      category:row.category||original?.category||family?.name||'Sanitaire',material:row.material||'',
      finish:[pickedColor,row.finish||row.colorGroup||''].filter(Boolean).join(' · '),
      price:selectedTrayQuote?.price??Number(row.price),totalPrice:selectedTrayQuote?.price??Number(row.price),
      rawTariffPrice:selectedTrayQuote?.rawPrice??(Number(row.rawPrice)||0),listPriceUpliftPct:4,purchaseDiscount:50,currency:'€',vat:'HT',
      source:'HIDROBOX_TARIF_FR_V0226_19-02-2026.pdf',sourceYear:2026,manufacturerUrl:url,
      image:fallbackImage,
      imageSource:fallbackScope==='product'?'Photo fabricant du produit · finition illustrée à vérifier':fallbackScope==='collection'?'Photographie officielle de collection · variante illustrative':fallbackScope==='category'?'Illustration de catégorie Hidrobox · modèle et finition non contractuels':'Photographie indisponible',
      imageFinishMatch:fallbackScope,
      technicalSheetUrl:tech,technicalSheetLabel:'Fiche technique Hidrobox',installationGuideUrl:manual,
      installationGuideLabel:'Notice de pose Hidrobox',configuratorType:'hidrobox-configured'};
   try{
     const record=createSelectedProductRecord(item,room,'');
     if(!record)throw Error('Création du produit impossible');
     Object.assign(record,item,{hidroboxConfiguration:{group:g.id,collection:name,reference:row.reference,
       widthTier:row.width||'',lengthTier:row.length||'',...dimInfo,submodel:universalDraft.traySubmodel||'',
       material:row.material||'',
       finish:row.finish||'',colorGroup:row.colorGroup||'',color:pickedColor,
       shape:row.shape||row.form||'',accessories:selectedTrayQuote?.components||[],
       accessoriesSource:'Tarif Hidrobox 2026 · options OPSH',optionRawPrice:selectedTrayQuote?.optionRawPrice||0}});
     if(visual&&officialResult?.ok)visual.apply(record,officialResult,officialSelection);
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
 if(neo.material==='Kromat'&&neo.group==='BLA')neo.group='BAS';
 if(neo.material==='Scene'){neo.group='BLA';neo.color='Blanc';}
 const colors=catalogue.COLORS[neo.group]||[];
 if(!colors.includes(neo.color))neo.color=colors[0];
 const ranges=sizeRanges();
 const textures=['Lisse','Ardoise'].filter(texture=>catalogue.lookup({...neo,texture,group:neo.material==='Scene'?'BLA':'BAS',color:neo.material==='Scene'?'Blanc':'Bianco'}).ok);
 if(textures.length&&!textures.includes(neo.texture))neo.texture=textures[0];
 const line=catalogue.lookup(neo);
 const neoAccessories=root.HydroHidroboxShowerOptions2026;
 const GRID_IDS={'Point Inox':'point-inox','Point Basic':'point-basic','Point Trend':'point-trend',
   'Point Special':'point-special','Star Inox':'star-inox','Star Basic':'star-basic',
   'Star Trend':'star-trend','Star Special':'star-special',
   'Radiance Steel':'radiance-steel','Radiance Gunmetal':'radiance-gunmetal',
   'Radiance Gold':'radiance-gold','Radiance Rame':'radiance-rame'};
 const DRAIN_IDS={'Horizontale standard':'h90','Verticale':'v90',
   'Horizontale extraplate':'low90','Horizontale Plus':'plus90'};
 const neoOpts=neoAccessories?.optionsFor({model:'neo-plus',material:neo.material,
   texture:neo.texture,colorGroup:neo.group,width:Number(neo.width)})||[];
 const neoQuote=line.ok&&neoOpts.length&&GRID_IDS[neo.grille]&&DRAIN_IDS[neo.bonde]?
   neoAccessories.quote(line.rawBasePrice,neoOpts,{cover:GRID_IDS[neo.grille],
     drain:DRAIN_IDS[neo.bonde],cut:neo.specialCut?'special':'none'}):null;
 const fittingsMatch=!!neoQuote?.ok&&Math.abs((neoQuote.rawPrice-(neo.specialCut?neoQuote.components.find(x=>x.reference==='OPSH0018')?.rawPrice||0:0))-line.rawPrice)<0.011;
 const cutValid=!!neoQuote?.ok&&fittingsMatch;
 const neoRawTotal=cutValid?neoQuote.rawPrice:0;
 const neoPublicTotal=cutValid?neoQuote.price:0;
 const neoCutRaw=cutValid?neoQuote.components.find(x=>x.reference==='OPSH0018')?.rawPrice||0:0;
 const colorGroups=neo.material==='Scene'?['BLA']:['BAS','TRE','SPE'];
 const opts=(id,label,list,current,disabled=false)=>visualFacet(id,label,list,current,disabled?'disabled':'');
 const pict=officialImage(officialCollectionMedia('neo-plus')?.image)||CATEGORY[0].img;
 const previewMarkup='<div class="hidrobox-configured-photo"><img data-hb-config-image hidden alt="Visuel fabricant Hidrobox Neo Plus ; dimensions et accessoires à vérifier"><small data-hb-config-status>Recherche du visuel officiel correspondant à la finition.</small><a data-hb-config-link hidden target="_blank" rel="noopener noreferrer">Voir cette sélection dans le configurateur officiel Hidrobox</a></div>';
 const config='<button class="hidrobox-back" type="button">← Collections</button>'+
 '<div class="hidrobox-neo-hero"><img src="'+escape(pict)+'" alt="Illustration receveurs de douche Hidrobox" loading="lazy">'+
 '<div><div class="eyebrow">Receveur de douche · Neo Plus</div><h3>NEO PLUS</h3><p>Scene Solid Surface ou Kromat. Fabriqué au centimètre selon les plages du tarif 2026.</p>'+
 '<a href="'+HOUSE+'collections/neo-plus/" target="_blank" rel="noopener noreferrer">Produit officiel</a><div class="hidrobox-downloads">'+
 '<a href="'+TECH+'" target="_blank" rel="noopener noreferrer">Fiche technique PDF</a>'+
 '<a href="'+MANUAL+'" target="_blank" rel="noopener noreferrer">Notice de pose PDF</a>'+
 '<a href="'+NEO_BIM+'" target="_blank" rel="noopener noreferrer">Objet BIM constructeur · Neo Plus</a>'+
 '<a href="'+NEO_3D+'" target="_blank" rel="noopener noreferrer">Modèle 3D constructeur · 80 × 140 × 3 cm</a></div>'+
 '<small>Photo constructeur de la collection Neo Plus · dimensions, grille, couleur et finition non contractuelles.</small></div></div>'+
 '<div class="hidrobox-fields"><h4 class="hidrobox-universal-subtitle">1 · Modèle / forme</h4>'+
 opts('hnForm','Modèle et forme',catalogue.FORMATS.map(f=>f.key),neo.form)+
 '<h4 class="hidrobox-universal-subtitle">2 · Matière</h4>'+
 opts('hnMaterial','Matière',['Kromat','Scene'],neo.material)+
 '<h4 class="hidrobox-universal-subtitle">3 · Texture</h4>'+
 opts('hnTexture','Texture',textures.length?textures:[neo.texture],neo.texture)+
 '<h4 class="hidrobox-universal-subtitle">4 · Couleur</h4>'+
 opts('hnGroup','Groupe de couleurs',colorGroups,neo.group)+
 opts('hnColor','Couleur',colors,neo.color)+
 '<h4 class="hidrobox-universal-subtitle">5 · Dimensions</h4>'+
 opts('hnWidth','Largeur exacte (cm)',values(ranges.widths),neo.width)+
 opts('hnLength','Longueur exacte (cm)',values(ranges.lengths),neo.length)+
 '<h4 class="hidrobox-universal-subtitle">6 · Accessoires et options</h4>'+
 opts('hnGrille','Grille',['Point Inox','Point Basic','Point Trend','Point Special','Star Inox','Star Basic','Star Trend','Star Special','Radiance Steel','Radiance Gunmetal','Radiance Gold','Radiance Rame'],neo.grille)+
 opts('hnBonde','Bonde',['Horizontale standard','Verticale','Horizontale extraplate','Horizontale Plus'],neo.bonde)+
 '<label class="hidrobox-cut-option"><input type="checkbox" id="hnSpecialCut"'+(neo.specialCut?' checked':'')+'> Découpe spéciale · OPSH0018 · +10 % du prix fabricant (plan technique requis)</label></div>'+previewMarkup+
 '<p class="hidrobox-guide-note">Formes : '+catalogue.FORMATS.map(f=>escape(f.label)).join(' · ')+'. Les finitions spéciales RAL/NCS nécessitent un contrôle du tarif exact.</p>'+
 '<div class="hidrobox-result"><div><b>'+(line.ok&&cutValid?eu(neoPublicTotal)+' HT':'Prix à confirmer')+'</b><span>'+(line.ok?'Réf. '+escape(line.reference)+' · Tranche '+escape(line.tier):escape(line.reason))+'</span>'+
 '<small>'+(line.ok&&cutValid?'Prix receveur '+eu(line.rawBasePrice)+' HT. Grille/bonde/découpe '+eu(neoQuote.optionRawPrice)+' HT'+(neo.specialCut?' (dont découpe '+eu(neoCutRaw)+' HT)':'')+'. Total fabricant '+eu(neoRawTotal)+' HT, majoration 4 % appliquée une fois. Remise achat 50 % dans la marge.':'Aucun prix inventé : choisissez une configuration tarifée ou consultez Hidrobox.')+'</small></div>'+
 '<button class="btn primary" id="hnAdd" type="button"'+(line.ok&&cutValid?'':' disabled')+'>Ajouter la configuration</button></div>';
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
 overlay.querySelector('#hnSpecialCut')?.addEventListener('change',e=>{neo.specialCut=e.target.checked;neoPage()});
 const officialVisual=root.HydroHidroboxOfficialVisual;
 const spec=officialVisual?.selection({collection:'Neo Plus'},{...neo,collection:'Neo Plus'},
   {model:'neo-plus',material:neo.material,texture:neo.texture,color:neo.color,shape:neo.form,width:Number(neo.width),length:Number(neo.length)});
 if(spec)void officialVisual.preview(overlay.querySelector('.hidrobox-configured-photo'),spec).catch(e=>console.warn('[Hidrobox Neo image]',e));
 overlay.querySelector('#hnAdd')?.addEventListener('click',async()=>{
   const chosen=catalogue.lookup(neo);if(!chosen.ok||!cutValid)return;
   const image=officialImage(officialCollectionMedia('neo-plus')?.image)||CATEGORY[0].img;
   const item={manufacturer:'Hidrobox',collection:'Neo Plus',reference:chosen.reference,base:chosen.reference,designation:'Neo Plus · '+catalogue.FORMATS.find(x=>x.key===neo.form).label+' · '+chosen.referenceDimensions+' · '+neo.material+' · '+neo.texture+' · '+neo.color+' · Grille '+neo.grille+' · Bonde '+neo.bonde+(neo.specialCut?' · Découpe spéciale OPSH0018, dessin à valider':''),
     category:'Receveur de douche',finish:neo.color+' · '+neo.texture,price:neoPublicTotal,totalPrice:neoPublicTotal,rawTariffPrice:neoRawTotal,listPriceUpliftPct:4,
     purchaseDiscount:50,currency:'€',vat:'HT',source:chosen.source,sourceYear:2026,manufacturerUrl:HOUSE+'collections/neo-plus/',
     image,imageSource:'Photographie constructeur de collection Neo Plus · dimensions et finition non contractuelles',imageFinishMatch:'collection',
     technicalSheetUrl:TECH,technicalSheetLabel:'Fiche technique Neo Plus',technicalSheetType:'application/pdf',
     installationGuideUrl:MANUAL,installationGuideLabel:"Notice d'installation Neo Plus",
     configuratorType:'hidrobox-configured'};
   try{
     const record=createSelectedProductRecord(item,room,'');
     if(!record)throw Error('Impossible de préparer le produit');
     Object.assign(record,item,{hidroboxConfiguration:{...chosen,selectedShape:neo.form,selectedWidthCm:+neo.width,selectedLengthCm:+neo.length,selectedColour:neo.color,selectedGrille:neo.grille,selectedBonde:neo.bonde,
       specialCut:!!neo.specialCut,requiresSupplierDrawing:!!neo.specialCut,
       options:neoQuote.components.map(x=>({reference:x.reference,label:x.label,rawPrice:x.rawPrice,percent:x.percent||0})),
       supplierRawBase:chosen.rawBasePrice,supplierOptionsRaw:neoQuote.optionRawPrice}});
     if(officialVisual&&spec){
       try{
         const image=await officialVisual.lookup(spec);
         if(image.ok){
           const quality=await officialVisual.printQuality(image);
           if(quality.ok)officialVisual.apply(record,{...image,verifiedPrintQuality:true,width:quality.width,height:quality.height},spec);
         }
       }catch(e){console.warn('[Neo Plus configured visual]',e?.message||e)}
     }
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
 neo={...NEO_DEFAULT};
 if(norm(p?.collection)==='neo plus'&&p?.hidroboxConfiguration){
  const c=p.hidroboxConfiguration;
  neo={...neo,form:c.selectedShape||c.form||neo.form,
   material:c.material||neo.material,group:c.group||neo.group,texture:c.texture||neo.texture,
   width:Number(c.selectedWidthCm??c.width??neo.width),
   length:Number(c.selectedLengthCm??c.length??neo.length),
   color:c.selectedColour||c.color||neo.color,grille:c.selectedGrille||c.grille||neo.grille,
   bonde:c.selectedBonde||c.bonde||neo.bonde,
   specialCut:!!(c.specialCut||c.options?.some(x=>x.reference==='OPSH0018'))};
 }
 room=roomId;original=p||{};programDraft=p?.hidroboxConfiguration?.type==='program-2026'?{...p.hidroboxConfiguration}:null;spaceDraft=p?.hidroboxConfiguration?.type==='space-2026'?{...p.hidroboxConfiguration}:null;betaEvoqueDraft=p?.hidroboxConfiguration?.type==='beta-evoque-2026'?{...p.hidroboxConfiguration}:null;betaEssentialDraft=p?.hidroboxConfiguration?.type==='beta-essential-2026'?{...p.hidroboxConfiguration}:null;programFamily='';groups=[];groupsLoading=true;groupsError='';
 for(const key of Object.keys(universalDraft))delete universalDraft[key];
 root.HydroHidroboxPanelSpotUI?.reset?.();
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
