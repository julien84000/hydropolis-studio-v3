/* Coalbrook August 2026 catalogue taxonomy — ALL amounts in EUR HT.
   Data source: uploaded Coalbrook EuroBrochure 05.10, printed pages 4–5 and 145–283.
   Product prices are read from the existing 1,483-row catalog, not calculated. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HydroCoalbrook2026=api;})(typeof window!=='undefined'?window:null,function(){
'use strict';
const finishes={CP:'Chrome',BN:'Nickel brossé',BB:'Laiton brossé',GM:'Gunmetal'};
const furnitureFinishes={BB:'Brazed Brown',GG:'Gauge Green',LL:'Linen Line',MM:'Metric Marine',SS:'Subtle Silk',TT:'Tenth Tuscan',WW:'Whitworth White',LO:'Light Oak',DO:'Deep Oak',SO:'Smoked Oak'};
const ranges=['Domo','Decca','Bank','Zurich'];
const menus={
 'Robinetterie':{'Domo':['Lavabo','Baignoire','Douche'],'Decca':['Lavabo','Baignoire','Douche'],'Bank':['Lavabo','Baignoire','Douche'],'Zurich':['Coalescence','Lavabo','Baignoire','Douche']},
 'Douche & bain':{'Maestro':['Domo','Decca','Bank','Zurich','Composants'],'Baignoire':['Becs & vidages','Autres'],'Douche':['Têtes','Bras','Douchettes','Barres','Autres'],'Mainstream':['Ensembles de douche'],'Bay':['Receveurs']},
 'WC':{'WC':['Plaques et commandes','Robinetterie bidet']},
 'Accessoires':{'Accessoires':['Miroirs','Sèche-serviettes','Porte-serviettes','Autres accessoires']},
 'Mobilier':{'Decimal':['Meubles','Plans & vasques'],'Shepherd':['Meubles','Plans & vasques'],'Farnolls':['Meubles','Modules extra-profonds']},
 'Compléments mobilier':{'Compléments':['Options & upgrades','Vasques Port','Vasques Float','Plans quartz','Autres']}
};
const indexRanges=[
 [146,153,'Domo'],[154,161,'Decca'],[162,166,'Bank'],[167,172,'Zurich'],
 [173,173,'Composants'],[174,186,'Maestro'],[187,187,'Baignoire'],
 [188,190,'Douche'],[191,192,'WC'],[193,197,'Accessoires'],[199,213,'Mobilier']
];
const specEntries='BA1002:231;BA1005:232;BA1006:232;BA1008:233;BA1011:233;BA1015:232;BA1016:232;BA1018:233;BA1021:233;BA2000:235;BA2003:234;BA2004:234;BA2005:235;BA2006:235;BA2112:234;BA2113:234;BA3001:236;BA3002:236;BA3003:237;BA3050:244;BA3051:245;BA3052:246;BA3053:247;BA3054:248;BA3061:250;BA3062:251;BA3101:237;CO1201:217/238;CO1301:219/226/233/240;CO3001:223/229/236/258;CO3002:223/229/236/259;CO3003:223/230/237/259;CO3050:244/249;CO3051:245/249;CO3052:246/249;CO3053:247/249;CO3054:248/249;CO3061:250;CO3062:251;CO3064:253;CO3065:253;CO3101:223/230/237;CO4003:254;CO4004:254;CO4013:254;CO4014:254;CO4017:255;CO4018:252;CO4030:252;CO4031:252;CO4032:245/252;CO7020:260;CO7021:260;CO7040:261;CO7050:260;CO7100:260;CO8001:263;CO8002:263;CO8100:262;CO8101:262;DC1000:215;DC1001:215;DC1003:217;DC1004:217;DC1005:225;DC1006:225;DC1007:217;DC1008:226;DC1009:217;DC1011:226;DC1015:225;DC1016:225;DC1018:226;DC1021:226;DC2000:227;DC2004:229;DC2005:228;DC2006:228;DC2112:228;DC2113:228;DC3001:229;DC3002:229;DC3003:230;DC3005:230;DC3006:230;DC3050:244;DC3051:245;DC3052:246;DC3053:247;DC3054:248;DC3061:250;DC3062:251;DC3101:230;DO1000:215;DO1001:215;DO1003:217;DO1004:217;DO1005:218;DO1006:218;DO1007:217;DO1008:219;DO1009:217;DO1010:261;DO1011:219;DO1015:218;DO1016:218;DO1018:219;DO1021:219;DO1022:215;DO1023:215;DO1024:216;DO2000:221;DO2001:222;DO2003:220;DO2004:220;DO2005:224;DO2006:224;DO2008:261;DO2009:222;DO2112:220;DO2113:220;DO3001:223;DO3002:223;DO3003:223;DO3005:224;DO3006:224;DO3050:244;DO3051:245;DO3052:246;DO3053:247;DO3054:248;DO3061:250;DO3062:251;DO3101:223;DO6000:216;ZU1000:237;ZU1001:237;ZU1003:238;ZU1004:238;ZU1005:239;ZU1006:239;ZU1007:238;ZU1008:240;ZU1009:238;ZU1011:240;ZU1015:239;ZU1016:239;ZU1018:240;ZU1021:240;ZU2000:242;ZU2004:241;ZU2005:241;ZU2006:241;ZU2112:241;ZU3005:243;ZU3006:243;ZU3050:244;ZU3052:246;ZU3053:247;ZU3054:248;ZU3062:251';
const specIndex=new Map(specEntries.split(';').map(entry=>{const [code,page]=entry.split(':');return [code,page.split('/').map(Number)]}));
function base(p){const code=String(p?.reference||'').toUpperCase();if(/^(?:DV|DT|SV|FV)\d/.test(code))return code.replace(/(?:BB|GG|LL|MM|SS|TT|WW|LO|DO|SO)$/,'');return String(p?.base||p?.reference||'').replace(/(?:CP|BN|BB|GM)$/,'');}
function classification(p){
 const ref=String(p?.reference||'').toUpperCase(),refBase=base(p).toUpperCase(),description=String(p?.designation||'')+' '+String(p?.originalDescription||'');
 const category=String(p?.category||''),col=String(p?.collection||'');
 const code=refBase.match(/^(DO|DC|BA|ZU)(\d{4})/);
 if(/^(BY\d{4})/.test(ref))return ['Douche & bain','Bay','Receveurs'];
 if(/^CO(?:12|13|21|30|31)\d/.test(ref)&&/rough|c-box|corps|encastrement/i.test(description+' '+col))return ['Douche & bain','Maestro','Composants'];
 if(/^(LK|DT|DV|SV|FV)\d/.test(ref)||/vanity unit|vanity|meuble|drawer|tall unit/i.test(description)){
  const range=/^DV|^DT|decimal/i.test(refBase+' '+description)?'Decimal':/^SV|shepherd/i.test(refBase+' '+description)?'Shepherd':'Farnolls';
  return ['Mobilier',range,/^FV/.test(ref)?'Modules extra-profonds':'Meubles'];
 }
 if(/^CO9\d/.test(ref)||/basin options|port basin|float basin|quartz countertop/i.test(description)){
  return ['Compléments mobilier','Compléments',/float/i.test(description)?'Vasques Float':/port|ceramic/i.test(description)?'Vasques Port':/countertop|quartz/i.test(description)?'Plans quartz':'Autres'];
 }
 if(/upgrad|lighting kit|cabinet lighting/i.test(description))return ['Compléments mobilier','Compléments','Options & upgrades'];
 if(/flush plate|flush button|cistern|bidet/i.test(description)||/^(CO70(?:20|21|40|50)|CO7100|DO1010)/.test(refBase))return ['WC','WC',/bidet/i.test(description)||/^DO1010/.test(refBase)?'Robinetterie bidet':'Plaques et commandes'];
 if(/mirror/i.test(description))return ['Accessoires','Accessoires','Miroirs'];
 if(/heated towel|towel warmer|towel rail/i.test(description)||/^CO8/.test(ref))return ['Accessoires','Accessoires',/warmer|heated/i.test(description)?'Sèche-serviettes':'Porte-serviettes'];
 if(/(?:accessor|robe hook|soap|towel bar|paper holder|shower shelf)/i.test(description)||/^(DO|DC|BA|ZU)70\d/.test(ref)||/^CO7/.test(ref))return ['Accessoires','Accessoires','Autres accessoires'];
 if(/maestro/i.test(description)||code&&/^30(?:5|6|7|8|9)/.test(code[2])||/^CO30(?:5|6|7|8)/.test(ref)){
  const range=code?{DO:'Domo',DC:'Decca',BA:'Bank',ZU:'Zurich'}[code[1]]:'Composants';
  return ['Douche & bain','Maestro',range];
 }
 if(/^MS|mainstream/i.test(ref+' '+description))return ['Douche & bain','Mainstream','Ensembles de douche'];
 if(/^CO4/.test(ref)||/shower head|shower arm|handshower|shower rail/i.test(description)){
  return ['Douche & bain','Douche',/head/i.test(description)?'Têtes':/arm/i.test(description)?'Bras':/handshower/i.test(description)?'Douchettes':/rail/i.test(description)?'Barres':'Autres'];
 }
 if(/^CO5/.test(ref)||/bath overflow|bath waste/i.test(description))return ['Douche & bain','Baignoire','Becs & vidages'];
 if(code){
  const range={DO:'Domo',DC:'Decca',BA:'Bank',ZU:'Zurich'}[code[1]];
  const sub=code[2][0]==='1'?'Lavabo':code[2][0]==='2'?'Baignoire':code[2][0]==='3'?'Douche':'Lavabo';
  if(range==='Zurich'&&/coalescen/i.test(description+' '+col))return ['Robinetterie','Zurich','Coalescence'];
  return ['Robinetterie',range,sub];
 }
 if(/shower|dou[cs]he/i.test(category+' '+description))return ['Douche & bain','Douche','Autres'];
 if(/bath|bain/i.test(category+' '+description))return ['Douche & bain','Baignoire','Autres'];
 if(/lavabo|basin/i.test(category+' '+description))return ['Compléments mobilier','Compléments','Autres'];
 return ['Accessoires','Accessoires','Autres accessoires'];
}
function finish(p){const code=String(p?.reference||'').toUpperCase();if(/^(?:DV|DT|SV|FV)\d/.test(code)){const m=code.match(/(BB|GG|LL|MM|SS|TT|WW|LO|DO|SO)$/);return furnitureFinishes[m?.[1]]||'Standard';}const fc=String(p?.finishCode||'').toUpperCase();return finishes[fc]||furnitureFinishes[fc]||String(p?.finish||'')||'Standard';}
function detail(p){
 const refBase=base(p).toUpperCase();
 const specs=specIndex.get(refBase)||specIndex.get(String(p?.reference||''))||[];
 return {reference:String(p?.reference||''),base:refBase,vat:'HT',currency:'EUR',hierarchy:classification(p),finish:finish(p),price:Number(p?.price),specificationPages:specs,roughIn:String(p?.internalReference||'')};
}
function audit(rows){
 const relevant=(rows||[]).filter(p=>p?.manufacturer==='Coalbrook');
 return {total:relevant.length,allHT:relevant.every(p=>p.vat==='HT'),missingPrice:relevant.filter(p=>!Number.isFinite(Number(p.price))).map(p=>p.reference),missingMedia:relevant.filter(p=>!p.image).length,missingTech:relevant.filter(p=>!p.technicalSheetUrl).length};
}
return {finishes,furnitureFinishes,menus,indexRanges,classification,base,finish,detail,audit,specIndex};
});