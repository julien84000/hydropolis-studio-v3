/* Naxani 2026: supplier PDF SKU index; physical product photos illustrate COLLECTION, not finishes. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroNaxani2026=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 const TYPES={
 'bois-massif':['Meubles','Bois massif'],'laque':['Meubles','Laqués'],'complement':['Meubles','Compléments'],
 'plan-integre':['Lavabos','Plans intégrés'],'vasque-poser':['Lavabos','Vasques à poser'],
 'suspendu':['Lavabos','Plans suspendus'],'plan-solid':['Lavabos','Plans de travail'],
 'plan-mdf':['Lavabos','Plans de travail'],'plan-marbre':['Lavabos','Plans de travail'],
 'miroir':['Compléments','Miroirs'],'bonde':['Accessoires','Bondes']
 };
 const kind=page=>page>=4&&page<=31?'bois-massif':page>=33&&page<=46?'laque':page>=48&&page<=51?'complement':
 page===53?'plan-marbre':page>=55&&page<=62?'plan-integre':page===63?'suspendu':page===64||page===65?'vasque-poser':
 page===66?'plan-solid':page===67?'plan-mdf':page>=68&&page<=70?'miroir':'other';
 const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const slugByCollection={'Suró':'suro','Mòdul':'modul','Valnöt':'valnot','Slat':'slat-1c','Prenn':'prenn-31','Roten':'roten','Doki-Mini':'doki-mini','2r':'2r','Rodó':'rodo','1Q84':'1q84'};
 const pageUrl=c=>/^https?:/i.test(c)?c:'https://naxani.com/producto/'+(slugByCollection[c]||normalize(c))+'/';
 const money=x=>Number(x||0).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
 const toRecords=data=>(data.rows||[]).map(([reference,price,page,model,width])=>{
  const subtype=model==='Clic Clac'?'bonde':kind(page),labels=TYPES[subtype]||['Autres','Autres'];
  return {manufacturer:'Naxani',reference:String(reference),collection:model,base:model,
   designation:(subtype==='bois-massif'||subtype==='laque'?'Meuble':subtype==='complement'?'Complément':
   subtype==='plan-integre'?'Plan vasque intégré':subtype==='vasque-poser'?'Vasque à poser':
   subtype==='suspendu'?'Plan vasque suspendu':subtype==='bonde'?'Bonde et siphon Clic-Clac':subtype.includes('plan-')?'Plan de travail':'Miroir')+' '+model+
   (Number.isFinite(width)?' · '+width+' cm':''),
   category:labels[0],productType:labels[1],naxaniKind:subtype,naxaniWidth:Number.isFinite(width)?width:null,
   price:Number(price),totalPrice:Number(price),currency:'EUR',vat:'HT',sourceYear:2026,
   source:'Naxani — Tarifa 2026 Catalogo General',sourcePage:page,
   purchaseDiscount:null,manufacturerUrl:pageUrl(model),naxaniSourceVerified:true,
   image:'/api/naxani-collection-image?collection='+encodeURIComponent(model),imageSource:'Photo de collection Naxani illustrative · finition non contractuelle',
   finish:'Finition à préciser avec le fabricant'};
 });
 const compatible=(furniture,top,exclusions={})=>{
  if(!furniture||!top||furniture.manufacturer!=='Naxani'||top.manufacturer!=='Naxani')return false;
  if(!['bois-massif','laque'].includes(furniture.naxaniKind))return false;
  if(!['plan-integre','plan-solid','plan-mdf','plan-marbre'].includes(top.naxaniKind))return false;
  const excluded=(exclusions[furniture.collection]||[]).map(normalize);
  if(top.naxaniKind==='plan-integre'&&excluded.includes(normalize(top.collection)))return false;
  const a=Number(furniture.naxaniWidth),b=Number(top.naxaniWidth);
  return Number.isFinite(a)&&a>0&&Number.isFinite(b)&&b>0&&Math.abs(a-b)<.02;
 };
 let cached=null;
 async function load(){
  if(cached)return cached;
  const r=await fetch('/naxani-tariff-2026.json?v=__APP_VERSION__',{cache:'no-store'});
  if(!r.ok)throw Error('Tarif Naxani 2026 indisponible');
  const data=await r.json();
  if(!Array.isArray(data.rows)||data.rows.length<2100)throw Error('Tarif Naxani 2026 incomplet');
  cached={data,records:toRecords(data)};return cached;
 }
 return {TYPES,kind,normalize,pageUrl,money,toRecords,compatible,load};
});