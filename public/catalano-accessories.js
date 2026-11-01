/* Catalano PRICE LIST 57 — sanitary compatibility from actual price-list
 * reference, collection, model type and exact finish suffix. Never substitute
 * an arbitrary kit or seat merely because its generic designation is similar.
 * Source for construction logic: official Catalano sanitary price list pages;
 * source for SELLABLE references and prices: imported catalog_catalano.json.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HydroCatalanoAccessories=api;})(typeof window==='object'?window:null,function(){
'use strict';
const text=p=>[p?.originalDescription,p?.originalDescriptionIT,p?.designation].filter(Boolean).join(' ');
const kind=p=>{
 if(p?.manufacturer!=='Catalano')return '';
 const s=String(p?.originalDescription||p?.originalDescriptionIT||'').toUpperCase();
 if(p.category==='WC'&&/\bBIDET\b/.test(s))return 'bidet';
 if(p.category==='WC'&&/\bWC\b/.test(s)&&!/\bCISTERN\b|\bPIPE\b|\bFIXING\b/.test(s))return 'wc';
 return '';
};
const seatNames={
 '015120':'Zero 46 · slim soft-close',
 '045125':'Elice · slim soft-close Up-fix',
 '055100':'Zero / Sfera · enveloppant',
 '055105':'Zero / Sfera · enveloppant Up-fix',
 '055110':'Zero / Sfera · soft-close',
 '055115':'Zero / Sfera · soft-close Up-fix',
 '055120':'Zero / Sfera · slim soft-close',
 '055121':'Sfera 63 · slim soft-close',
 '055125':'Zero / Sfera · slim soft-close Up-fix',
 '055130':'Zero / Sfera · basic soft-close',
 '055131':'Zero / Sfera · project',
 '055135':'Zero / Sfera · basic soft-close Up-fix',
 '055150':'Sfera 63 · soft-close',
 '065110':'Alvea · soft-close',
 '075110':'Italy · soft-close',
 '095150':'Comfort · soft-close',
 '095170':'Comfort · sans couvercle'
};
const mounting={
 '905606':'Fixation invisible WC / bidet suspendu',
 '905616':'Fixation invisible UP-FIX WC suspendu',
 '905607':'Fixation latérale WC posé au sol',
 '905608':'Fixation invisible WC posé au sol'
};
const norm=v=>String(v||'').trim().toUpperCase();
const validRow=p=>p?.manufacturer==='Catalano'&&p.reference&&Number.isFinite(Number(p.price))&&Number(p.price)>0;
const accessoryRow=(p)=>validRow(p)&&p.category==='Accessoires'&&
  (/\bSEAT\s*(?:&|AND)?\s*COVER\b|\bSEDILE\b/i.test(p.originalDescription||'')||
   /^(?:HIDDEN|UP-FIX\s+HIDDEN|LATERAL) FIXING SET\b/i.test(p.originalDescription||''));
const finish=p=>norm(p?.finishCode||String(p?.reference||'').slice(-4));
function seatBases(p){
 if(kind(p)!=='wc')return [];
 const coll=norm(p.collection),t=norm(text(p)),base=String(p.base||'');
 if(coll==='ZERO'){
  return base==='011146'?['015120','055120']: /UP.FIX/.test(t)?['055125','055115','055120']:['055120','055110','055100','055125'];
 }
 if(coll==='SFERA'){
  if(base==='051563')return ['055121','055150'];
  if(/UP.FIX/.test(t))return ['055125','055115','055105','055120','055130','055135'];
  return ['055120','055110','055100','055130','055131','055125'];
 }
 if(coll==='ELICE')return ['045125'];
 if(coll==='ALVEA')return ['065110'];
 if(coll==='ITALY')return ['075110'];
 if(coll==='COMFORT')return ['095150','095170'];
 return [];
}
function mountingBases(p){
 if(kind(p)!=='wc')return [];
 const t=norm(p.originalDescription||'');
 if(/\bWALL.HUNG\b/.test(t))return /UP.FIX/.test(t)?['905616']:['905606'];
 if(/\bFLOORSTANDING\b|\bCLOSE COUPLED\b/.test(t))return ['905608','905607'];
 return [];
}
function findOptions(rows,bases,p){
 // An accessory finish must equal the WC finish. No substitutions between
 // satin Nero, satin Cemento or white, and no made-up retail prices.
 const f=finish(p),index=new Map();
 for(const row of rows||[]){
  if(!accessoryRow(row)||!bases.includes(String(row.base)))continue;
  const refFinish=finish(row);
  if(seatNames[String(row.base)]&&refFinish!==f)continue;
  if(mounting[String(row.base)]&&refFinish!=='0000')continue;
  if(!index.has(row.reference))index.set(row.reference,row);
 }
 const selected=[...index.values()];
 return selected.sort((a,b)=>bases.indexOf(String(a.base))-bases.indexOf(String(b.base))||
   String(a.reference).localeCompare(String(b.reference),'fr',{numeric:true}));
}
function compatible(p,rows){
 const k=kind(p);
 if(!k)return {kind:k,groups:[],included:[],warnings:[]};
 if(k==='bidet')return {kind:k,groups:[],included:[],warnings:['Bidet : vérifier les fixations spécifiques et la bonde sur la notice du modèle. Aucune référence non prouvée ne sera ajoutée.']};
 const seats=findOptions(rows,seatBases(p),p);
 const kits=findOptions(rows,mountingBases(p),p);
 const floor=/FLOORSTANDING|CLOSE COUPLED/i.test(p.originalDescription||'');
 const upfix=/UP.FIX/i.test(p.originalDescription||'');
 const alreadyIncluded=/\b(?:INCLUDING|INCLUDES|INCLUDED)\b.{0,35}\b(?:SEAT|COVER|FIXING)\b/i.test(text(p));
 const groups=[
  {id:'seat',title:'Abattant assorti à la finition',options:seats,required:seats.length>0,
   suggested:alreadyIncluded?'':seats[0]?.reference||'',notice:seats.length?'Même suffixe de finition que le WC. Vérifier le profil du modèle sur la fiche fabricant.':'Aucun abattant de la finition exacte n’est identifié dans le tarif : aucun prix inventé.'},
  {id:'mount',title:'Kit de fixation',options:kits,required:true,
   // A floorstanding product may accept a hidden OR lateral kit: no automatic choice.
   suggested:alreadyIncluded?'':!floor&&kits.length===1?kits[0].reference:'',
   notice:floor?'Fixation latérale ou invisible : choisir seulement celle demandée par la notice de pose du modèle.':
      upfix?'Système Up-fix. Confirmer si le kit est déjà fourni avant de le facturer.':
      'Référence de kit proposée selon installation murale. Confirmer le montage et le contenu de la boîte avant commande.'}
 ];
 const included=[];
 if(alreadyIncluded){
  included.push('Ce modèle mentionne un accessoire inclus : contrôler le colisage avant tout supplément.');
 }
 const warnings=[];
 if(!seats.length)warnings.push('Abattant assorti non confirmé dans le tarif importé pour cette finition.');
 if(!kits.length)warnings.push('Kit de fixation non identifié : vérifier les accessoires de pose au fabricant.');
 return {kind:k,groups,included,warnings,seatBases:seatBases(p),mountingBases:mountingBases(p)};
}
const label=p=>seatNames[String(p?.base)]||mounting[String(p?.base)]||p?.originalDescription||p?.designation||'';
return {kind,seatBases,mountingBases,compatible,finish,accessoryRow,label,seatNames,mounting};
});