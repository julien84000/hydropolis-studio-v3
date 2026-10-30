/* Galassia V11.64.21 — source-backed supplementary SKUs and sanitary compatibility.
   Only the supplied manufacturer listino can authorize added SKUs or prices. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HydroGalassiaAccessories=api;})(typeof window==='object'?window:null,function(){
'use strict';
const COLOR={BM:'Blanc mat',BIMT:'Blanc mat',MT:'Blanc mat',NM:'Graphite',NEMT:'Graphite',GM:'Gris mat',SB:'Noir satiné',SA:'Sable',RO:'Rouge',MK:'Moka',FA:'Fango',BI:'Blanc',NE:'Noir',OR:'Or',BR:'Bronze',NO:'Noyer',RM:'Chêne foncé',RMBR:'Chêne et bronze',RMOR:'Chêne et or',NEOR:'Noir/or',NEBR:'Noir/bronze',SV:'Sauge',OC:'Ocre'};
const CODE_NORM={BM:'MT',BIMT:'MT',NM:'NEMT',BI:'',MT:'MT',NEMT:'NEMT',GM:'GM',SB:'SB',SA:'SA',RO:'RO',MK:'MK',FA:'FA',NE:'NE',OR:'OR',BR:'BR',NO:'NO',RM:'RM',RMBR:'RMBR',RMOR:'RMOR',NEOR:'NEOR',NEBR:'NEBR',SV:'SV',OC:'OC'};
const SANITARY={
 wc:{
   SUSI:{models:['7811','7813'],seats:['7815','7816']},
   Lola:{models:['7511','7515'],seats:['7513']},
   Core:{models:['7351','7353'],seats:['7330','7329']},
   'Meg11 Pro':{models:['5411','5486','5481V2','5419'],seats:['5455','5478','5454','5479']},
   Dream:{models:['7335','7349','7328','7327','7331','7310','7311','7313','7317','7337','7309'],seats:['7330','7329','7314','7315']},
   M2:{models:['5210','5211U'],seats:['5223','5226']},
   Eden:{models:['7216','7213','7218','7217','7206','7205'],seats:['7220','7219','7254','7255','7256']},
   Ethos:{models:['8440M','8438M','8437','8441','8428M','8419','8418','8412'],seats:['8482','8495','8413','8414']},
   'Comfort Line':{models:['4022','4019','4016'],seats:['4023','4020']},
 },
 bidet:{
   SUSI:['7812','7814'],Lola:['7512','7516'],Core:['7352','7354'],
   'Meg11 Pro':['5412','5480V2','5410'],Dream:['7334','7338','7327','7332','7317','7311','7309'],
   M2:['5249','5213'],Eden:['7212','7214','7205'],Ethos:['8439','8438M','8441','8419']
 },
 urinal:{
   Core:['7380'],'Meg11 Pro':['5408'],Dream:['7116'],Community:['7003']
 }
};
const seatByModel={
 '5413':['5451','5450'],
 '7311':['7314','7315'],'7313':['7314','7315'],'7317':['7314','7315'],'7337':['7314','7315'],
 '7335':['7330','7329'],'7349':['7330','7329'],'7328':['7330','7329'],'7331':['7330','7329'],
 '7206':['7256','7255'],'7205':['7256','7255'],
 '4022':['4023'],'4019':['4020'],'4016':['4020']
};
const title={
'7815':'Abattant enveloppant à fermeture ralentie','7816':'Abattant enveloppant standard',
'7513':'Abattant slim à fermeture ralentie','7330':'Abattant extra-slim à fermeture ralentie','7329':'Abattant extra-slim standard',
'7314':'Abattant extra-slim à fermeture ralentie','7315':'Abattant extra-slim standard',
'5455':'Abattant enveloppant à fermeture ralentie','5478':'Abattant extra-slim à fermeture ralentie',
'5454':'Abattant enveloppant standard','5479':'Abattant extra-slim standard',
'5451':'Abattant soft-close pour WC monobloc','5450':'Abattant standard pour WC monobloc',
'5223':'Abattant à fermeture ralentie','5226':'Abattant standard',
'7220':'Abattant à fermeture ralentie','7219':'Abattant standard','7254':'Abattant extra-slim à fermeture ralentie',
'7255':'Abattant standard','7256':'Abattant à fermeture ralentie',
'8482':'Abattant à fermeture ralentie','8495':'Abattant standard / bois selon version',
'8413':'Abattant finition assortie','8414':'Abattant finition assortie',
'4023':'Abattant soft-close','4020':'Abattant standard',
'9916':'Bonde click-clack avec cover céramique',
'9051':'Patte de fixation pour bidet suspendu','9053':'Raccord évacuation murale Ø100',
'9052':'Coude évacuation au sol Ø100','9084':'Tube déporté pour arrivée d’eau WC',
'6069':'Bonde à grille pour urinoir','6059':'Siphon chromé ABS Ø32 pour urinoir',
'9086':'Kit de fixation pour urinoir Core','9087':'Raccord alimentation ½ pour urinoir Core','9088':'Siphon horizontal Ø50 pour urinoir Core',
'18090':'Abattant pour WC enfant',
};
const seatPriority=['7815','7513','7330','7314','5455','5478','5451','5223','7220','7256','8482','8495','8413','8414','4023'];
const meta=(p)=>({reference:String(p?.reference||'').toUpperCase(),collection:String(p?.manufacturerCollection||p?.collection||'')});
const normColor=s=>CODE_NORM[s]===undefined?s:CODE_NORM[s];
function finishCode(p){
 const code=String(p?.finishCode||'').toUpperCase();
 if(code in CODE_NORM)return normColor(code);
 const reference=String(p?.reference||'').toUpperCase();
 const base=String(p?.base||p?.manufacturerModelCode||'').toUpperCase();
 const suffix=reference.startsWith(base)?reference.slice(base.length):'';
 return normColor(suffix);
}
function makeRows(priceData,original=[],tree=null,colorsData=null){
 const existing=new Set((original||[]).filter(p=>p.manufacturer==='Galassia').map(p=>p.reference));
 const rows=[];
 const treeApi=typeof window==='object'?window.HydroGalassiaTree:(typeof require==='function'?require('./galassia-tree.js'):null);
 const add=(p)=>{if(!p||existing.has(p.reference))return;existing.add(p.reference);rows.push(p);};
 const make=(base,suffix,price,page,name,collection)=>{
  const ref=base+suffix;
  if(!(Number(price)>0)||!Number.isInteger(page)||page<1)return null;
  const row={manufacturer:'Galassia',collection,reference:ref,base,designation:name+' · '+ref,
   category:'Accessoires et variantes',productType:name,price:Number(price),totalPrice:Number(price),currency:'€',vat:'HT',
   finishCode:suffix,finish:COLOR[suffix]||(!suffix?'Blanc / standard':'Finition selon référence'),
   purchaseDiscount:50,source:'LISTINO-32-Export.pdf · référence vérifiée',sourcePdf:'LISTINO-32-Export.pdf',sourcePage:page,sourcePdfPage:page,
   image:'',galassiaSupplement:true};
  if(tree&&treeApi?.enrich)treeApi.enrich(row,tree);
  return row;
 };
 for(const [base,variants] of Object.entries(priceData?.families||{})){
  const page=Number(variants.page);
  for(const [suffix,price] of Object.entries(variants)){
   if(suffix==='page')continue;
   add(make(base,suffix,price,page,title[base]||'Accessoire sanitaire Galassia','Accessoires sanitaires'));
  }
 }
 for(const [base,variants] of Object.entries(colorsData?.families||{})){
  const page=Number(variants.page);
  for(const [suffix,price] of Object.entries(variants)){
   if(suffix==='page')continue;
   const row=make(base,suffix,price,page,'Modèle '+base,'Références du tarif');
   if(row&&tree&&typeof window==='object'&&window.HydroGalassiaTree?.enrich)window.HydroGalassiaTree.enrich(row,tree);
   add(row);
  }
 }
 return rows;
}
function kind(p){
 if(p?.manufacturer!=='Galassia')return '';
 const base=String(p.base||p.manufacturerModelCode||'').toUpperCase();
 const coll=String(p.manufacturerCollection||p.collection||'');
 if(base==='5413'||base==='4022'||base==='4019'||base==='4016')return 'wc';
 if(['7380','5408','7116','7003'].includes(base))return 'urinal';
 const m=SANITARY.wc[coll];
 if(m?.models.includes(base))return 'wc';
 if(SANITARY.bidet[coll]?.includes(base))return 'bidet';
 const grouped=Object.entries(SANITARY.wc).some(([,x])=>x.models.includes(base))?'wc':
  Object.entries(SANITARY.bidet).some(([,x])=>x.includes(base))?'bidet':'';
 if(grouped)return grouped;
 const name=String(p.manufacturerModel||p.productType||'').toLowerCase();
 if(/\b(bidet)\b/.test(name))return 'bidet';
 if(/\b(orinatoio|urinal|urinoir)\b/.test(name))return 'urinal';
 if(/\b(wc|vaso|toilet)\b/.test(name)&&!/seat|abattant|coprivaso|fixing/i.test(name))return 'wc';
 return '';
}
const lower=s=>String(s||'').toLowerCase();
function wallHung(p){return /sospes|suspend|wall.hung|wall mounted/.test(lower([p.manufacturerModel,p.productType,p.designation,p.manufacturerFamily].join(' ')));}
function choice(ref,rows){
 const row=rows.find(p=>p.manufacturer==='Galassia'&&p.reference===ref);
 return row&&Number(row.price)>0?row:null;
}
function group(id,title,options,multiple=false,notice=''){
 return {id,title,options:options.filter(Boolean),multiple,notice};
}
function compatible(p,rows){
 const type=kind(p);if(!type)return {kind:'',groups:[],included:[]};
 const base=String(p.base||p.manufacturerModelCode||'');
 const col=String(p.manufacturerCollection||p.collection||'');
 const wanted=finishCode(p);
 const included=[],groups=[];
 if(type==='wc'){
  const modelSeat=seatByModel[base]||SANITARY.wc[col]?.seats||[];
  const seats=modelSeat.flatMap(b=>{
   const codes=Object.keys(rows.reduce((o,x)=>{if(x.manufacturer==='Galassia'&&x.base===b)o[x.reference]=1;return o},{}));
   return codes.map(ref=>choice(ref,rows)).filter(Boolean).filter(x=>finishCode(x)===wanted);
  });
  if(seats.length)groups.push(group('seat','Abattant assorti',seats.sort((a,b)=>seatPriority.indexOf(a.base)-seatPriority.indexOf(b.base)),false,'Sélectionnez le mécanisme et la finition ; une seule référence sera ajoutée.'));
  else included.push('Aucun abattant de finition identique confirmé dans le tarif pour ce modèle : ne pas substituer une couleur différente.');
  included.push('Fixation de la cuvette : vérifier la mention « fixation incluse » sur la fiche du WC ; aucune fixation supplémentaire facturée automatiquement.');
  if(wallHung(p))groups.push(group('connection','Raccord de sortie murale', [choice('9053',rows)],false,'Raccord Ø100, uniquement si le chantier le nécessite.'));
  else groups.push(group('connection','Raccordement selon évacuation', [choice('9053',rows),choice('9052',rows)],false,'Choisissez une seule sortie : mur ou sol ; cotes à confirmer avant commande.'));
  groups.push(group('water-inlet','Réglage arrivée d’eau / déport',[choice('9084',rows)],false,'Seulement pour les installations compatibles figurant dans le tarif.'));
 }
 if(type==='bidet'){
  const code=({ '':'BI','MT':'BIMT','NEMT':'NEMT','GM':'GM','SB':'SB','SA':'SA','NE':'NE'})[wanted];
  const drain=code===undefined?null:choice('9916'+code,rows);
  if(drain)groups.push(group('drain','Bonde dans la même finition',[drain],false,'Cache céramique assorti au bidet.'));
  else included.push('Bonde de même finition non confirmée : vérifier le catalogue avant commande.');
  if(wallHung(p)){
   included.push('Fixation de base du bidet suspendu : généralement incluse selon le modèle ; vérifier sa fiche.');
   groups.push(group('bracket','Patte de fixation complémentaire',[choice('9051',rows)],false,'Option séparée : n’ajouter que si elle est effectivement nécessaire ; ne pas doubler le kit fourni.'));
  }else included.push('Fixation cachée du bidet au sol : vérifier si elle est incluse ; pas de kit ajouté automatiquement.');
 }
 if(type==='urinal'){
  if(base==='7380'){
   groups.push(group('trap','Siphon horizontal',[choice('9088',rows)]));
   groups.push(group('inlet','Raccord alimentation ½',[choice('9087',rows)]));
   groups.push(group('mount','Kit de fixation',[choice('9086',rows)]));
  }else if(base==='5408'){
   included.push('Erogateur / robinet de chasse et fixation : inclus par Galassia sur le modèle 5408.');
   groups.push(group('drain','Bonde à grille',[choice('6069',rows)]));
   groups.push(group('trap','Siphon ABS chromé Ø32',[choice('6059',rows)]));
  }else if(base==='7116'){
   included.push('Érogateur de chasse : inclus ; la bonde n’est pas incluse.');
   groups.push(group('drain','Bonde à grille',[choice('6069',rows)]));
  }else included.push('Accessoires à contrôler sur le plan technique de ce modèle ; aucune référence de raccord non vérifiée ne sera ajoutée.');
 }
 return {kind:type,groups:groups.filter(g=>g.options.length),included};
}
return {COLOR,SANITARY,finishCode,kind,compatible,makeRows};
});
