/* Hidrobox FS · manufacturer-verified 2026 SKU model mapping, not estimates.
 * Reference/price are ALWAYS loaded from the imported February 2026 tariff.
 * Physical dimensions from official FS technical sheet and price-list pp 117-119.
 * Source: https://hidrobox.com/fr/collections/fs/
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HydroHidroboxFS2026=api;})(typeof window==='object'?window:null,function(){
'use strict';
const MODELS=[
 // [model, thumbnail family, reference, material, width, length, height, tier]
 ['FS 1','FS 1','WFSC0023','Scene',38,48,90,'BLA'],
 ['FS 2','FS 2','WFSC0024','Scene',38,48,90,'BLA'],
 ['FS 3','FS 3','WFSC0025','Scene',44,48,90,'BLA'],
 ['FS 4','FS 4','WFSC0026','Scene',44,48,90,'BLA'],
 ['FS 5','FS 5','WFSC0027','Scene',38,78,90,'BLA'],
 ['FS 6','FS 6','WFSC0028','Scene',38,78,90,'BLA'],
 ['FS 7','FS 7','WFSC0029','Scene',44,78,90,'BLA'],
 ['FS 8','FS 8','WFSC0030','Scene',44,78,90,'BLA'],
 ['FS 9 R','FS 9 R/L','WFSC0049','Scene',38,58,90,'BLA'],
 ['FS 9 L','FS 9 R/L','WFSC0050','Scene',38,58,90,'BLA'],
 ['FS 10 R','FS 10 R/L','WFSC0051','Scene',38,64,90,'BLA'],
 ['FS 10 L','FS 10 R/L','WFSC0052','Scene',38,64,90,'BLA'],
 ['FS 11 R','FS 11 R/L','WFSC0053','Scene',38,83,90,'BLA'],
 ['FS 11 L','FS 11 R/L','WFSC0054','Scene',38,83,90,'BLA'],
 ['FS 12 R','FS 12 R/L','WFSC0055','Scene',38,89,90,'BLA'],
 ['FS 12 L','FS 12 R/L','WFSC0056','Scene',38,89,90,'BLA'],
 ['FS 19','FS 19','WFSC0041','Scene',40,40,90,'BLA'],
 ['FS 20','FS 20','WFSC0020','Scene',40,40,85,'BLA'],
 ['FS 21','FS 21','WFSC0021','Scene',45.5,50.5,85,'BLA'],
 ['FS 22','FS 22','WFSC0042','Scene',70,45,90,'BLA'],
 ['FS 24 L','FS 24 L/R','WFSC0057','Scene',30,60,95,'BLA'],
 ['FS 24 R','FS 24 L/R','WFSC0058','Scene',30,60,95,'BLA'],
 ['FS 25','FS 25','WFSC0059','Scene',40,40,90,'BLA'],
 ['FS 26 L','FS 26 L/R','WFSC0060','Scene',30,60,90,'BLA'],
 ['FS 26 R','FS 26 L/R','WFSC0061','Scene',30,60,90,'BLA'],
 ['FS 19','FS 19','WFSC0043','Kromat',40,40,90,'BAS'],
 ['FS 19','FS 19','WFSC0044','Kromat',40,40,90,'TRE'],
 ['FS 19','FS 19','WFSC0045','Kromat',40,40,90,'SPE'],
 ['FS 23','FS 23','WFSC0046','Kromat',50,50,90,'BAS'],
 ['FS 23','FS 23','WFSC0047','Kromat',50,50,90,'TRE'],
 ['FS 23','FS 23','WFSC0048','Kromat',50,50,90,'SPE']
];
const COLORS=Object.freeze({
 BLA:['Blanc'],
 BAS:['Bianco','Beige','Pietra','Cement','Iron','Graphite'],
 TRE:['Crema','Cappuccino','Terra','Brownie','Cotta','Golden','Sandstone','Blush','Ocean','Lake','Ombra','Dark Liquen','Metropoli','Herbal'],
 SPE:['RAL / NCS']
});
const rows=MODELS.map(([model,thumbnail,reference,material,width,length,height,colorGroup])=>
 Object.freeze({model,thumbnail,reference,material,width,length,height,colorGroup,finish:'Lisse'}));
const BY_REF=new Map(rows.map(r=>[r.reference,r]));
function available(imported=[]){
 const prices=new Map(imported.filter(r=>/^WFSC\d{4}$/.test(String(r.reference||''))).map(r=>[r.reference,r]));
 return rows.filter(r=>prices.has(r.reference)&&Number(prices.get(r.reference).rawPrice)>0&&
    prices.get(r.reference).colorGroup===r.colorGroup).map(r=>({...r,
     rawPrice:Number(prices.get(r.reference).rawPrice),
     sourcePage:prices.get(r.reference).sourcePage||117}));
}
const names=available=>[...new Set(available.map(r=>r.model))];
function quote(imported=[],{reference,color,code=''}={}){
 const r=available(imported).find(x=>x.reference===reference);
 if(!r)return {ok:false,reason:'Référence FS non confirmée dans le tarif 2026.'};
 const possible=COLORS[r.colorGroup]||[];
 if(!possible.includes(color))return {ok:false,reason:'Couleur incompatible avec la référence FS.'};
 if(r.colorGroup==='SPE'&&!/^(?:RAL|NCS)\s*[-\w .]{2,25}$/i.test(String(code||'').trim()))
   return {ok:false,reason:'Saisir une référence RAL ou NCS vérifiable pour la finition Special.'};
 return {ok:true,...r,color,colorCode:r.colorGroup==='SPE'?code.trim():'',
  price:Math.round(r.rawPrice*104)/100,purchasePrice:Math.round(r.rawPrice*104)/200,
  source:'HIDROBOX_TARIF_FR_V0226_19-02-2026.pdf'};
}
function spec(r,color){
 if(!r||r.colorGroup==='SPE'||!color||color==='RAL / NCS')return null;
 return {model:'fs-'+r.model.match(/\d+/)?.[0],typology:'floor-standing-basins',
    material:r.material,texture:'Lisse',color,width:r.width,length:r.length,shape:''};
}
return {rows,BY_REF,COLORS,names,available,quote,spec};
});