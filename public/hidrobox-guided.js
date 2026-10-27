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
  {key:'autres',name:'Autres références tarifées',img:'',url:HOUSE}
];
const SHOWER_MODELS=['neo plus','line','twins','quadro','one','pure','arq','loovers','unique','iconik','falcon'];
const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function groupCategory(g){
 const name=norm(g.collection||g.family||g.model||g.id),category=norm(g.category);
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
 const priced=groups.filter(x=>groupCategory(x)===cat);
 const cards=priced.map(g=>({key:g.id,name:g.collection||g.family||g.model||g.id,img:family?.img,note:'Matrice tarifaire importée'}));
 if(cat==='receveurs'){
   const have=new Set(cards.map(x=>norm(x.name)));
   for(const model of SHOWER_CATALOG){if(have.has(norm(model)))continue;
     cards.push({key:model==='Neo Plus'?'neo-plus-official':'official-'+norm(model).replace(/\s+/g,'-'),name:model,img:family?.img,note:model==='Neo Plus'?'Configurateur et tarif Neo Plus 2026':'Voir modèle officiel'});
   }
 }
 shell(family?.name||'Collections','<button class="hidrobox-back" type="button">← Familles</button>'+tiles(cards,'collection')+
 '<p class="hidrobox-guide-note">Illustrations de familles provenant du site Hidrobox. Les visuels exacts de chaque collection restent à associer.</p>'+
 '<a class="hidrobox-official-link" href="'+escape(family?.url||HOUSE)+'" target="_blank" rel="noopener noreferrer">Voir toutes les collections sur le site officiel</a>',true);
 overlay.querySelector('.hidrobox-back').onclick=families;
 overlay.querySelectorAll('[data-kind=collection]').forEach(b=>b.onclick=()=>{
   const key=b.dataset.choice;
   const group=groups.find(x=>x.id===key);
   if(norm(group?.collection||group?.id||key)==='neo plus'||key==='neo-plus-official'||norm(group?.collection)==='neo plus'){neoPage();return;}
   if(!group){const model=b.querySelector('.hidrobox-guide-tile-name')?.textContent?.trim()||'';
      const url=HOUSE+'produit/receveurs-de-douche/';
      root.open(url,'_blank','noopener');return;}
   close();base.open({...original,manufacturer:'Hidrobox',collection:group.collection,configGroup:group.id},room).catch(e=>alert(e.message));
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
 cat='receveurs';stage='families';chosenGroup=null;
 families();
}
root.HydroHidroboxConfigurator={...base,open,close,neoPlus:catalogue};
})(window);
