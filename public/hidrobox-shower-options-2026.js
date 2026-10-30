/* Hidrobox shower trays: official 2026 priced fitting options.
 * Source: HIDROBOX_TARIF_FR_V0226_19-02-2026.pdf pp. 18-57.
 * Existing imported tariff supplies the complete tray SKU; this module never invents one. */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroHidroboxShowerOptions2026=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const OPT=(id,label,rawPrice,reference,percent=0)=>Object.freeze({id,label,rawPrice,reference,percent});
 const customCut={key:'cut',label:'Découpe spéciale (plan technique à confirmer)',options:[
   OPT('none','Sans découpe spéciale',0,'INCLUS'),
   OPT('special','Découpe spéciale +10 % du prix de base fabricant',0,'OPSH0018',10)
 ]};
 const drain90=[
   OPT('h90','Horizontale Ø90 Viega Tempoplex',0,'OPSH0078'),
   OPT('v90','Verticale Ø90 Viega Tempoplex',51,'OPSH0077'),
   OPT('low90','Horizontale Ø90 extraplate',26,'OPSH0016'),
   OPT('plus90','Horizontale Ø90 Plus',38,'OPSH0017')
 ];
 const drain50=[
   OPT('h50','Horizontale Ø50 Viega Domoplex',0,'OPSH0049'),
   OPT('v50','Verticale Ø50 Viega Domoplex',36,'OPSH0050')
 ];
 const coverPointStar=[
   OPT('point-inox','Grille Point · inox',0,'OPSH0001'),
   OPT('point-basic','Grille Point · Basic',0,'OPSH0002'),
   OPT('point-trend','Grille Point · Trend',25,'OPSH0003'),
   OPT('point-special','Grille Point · Special',36,'OPSH0004'),
   OPT('star-inox','Grille Star · inox',0,'OPSH0005'),
   OPT('star-basic','Grille Star · Basic',0,'OPSH0006'),
   OPT('star-trend','Grille Star · Trend',25,'OPSH0007'),
   OPT('star-special','Grille Star · Special',36,'OPSH0008'),
   OPT('radiance-steel','Grille Radiance · Steel',62,'OPSH0010'),
   OPT('radiance-rame','Grille Radiance · Rame',62,'OPSH0011'),
   OPT('radiance-gold','Grille Radiance · Gold',62,'OPSH0012'),
   OPT('radiance-gunmetal','Grille Radiance · Gunmetal',62,'OPSH0013')
 ];
 function lineCover({model,width,material,texture,colorGroup}){
   const series=model==='line-y'?70:width<=80?60:width<=90?70:width<=110?80:null;
   if(!series)return [];
   const idx={60:0,70:1,80:2}[series];
   const smooth=/lisse|smooth|liso/i.test(texture),slate=/ardoise|slate|pizarra/i.test(texture);
   if(!smooth&&!slate)return [];
   const scene=/scene/i.test(material),kromat=/kromat/i.test(material),group=normalize(colorGroup);
   if(!scene&&!kromat)return [];
   const stainless=OPT('inox','Caniveau LINE L'+series+' inox',0,'OPSH'+String(22+idx).padStart(4,'0'));
   let code=null;
   if(scene)code=(smooth?25:28)+idx;
   else{
     const g=group==='bas'||group==='basic'?0:group==='tre'||group==='trend'?1:group==='spe'||group==='special'?2:-1;
     if(g<0)return [stainless];
     code=(smooth?31:40)+idx*3+g;
   }
   const matching=OPT('matching','Caniveau LINE L'+series+' assorti au receveur',38,'OPSH'+String(code).padStart(4,'0'));
   return [stainless,matching];
 }
 function optionsFor({model,material,texture,width,colorGroup,outlet}={}){
   const m=normalize(model),fmt=m==='linex'?'line-x':m==='liney'?'line-y':m;
   const config={model:fmt,material,texture,width:Number(width),colorGroup};
   const drainage90={key:'drain',label:'Bonde',options:drain90};
   const drainage50={key:'drain',label:'Bonde',options:drain50};
   if(fmt==='neoplus')return [{key:'cover',label:'Grille Neo Plus',options:coverPointStar},drainage90,customCut];
   if(fmt==='line-x'||fmt==='line-y'){
     const cover=lineCover(config);
     return cover.length?[{key:'cover',label:'Caniveau',options:cover},drainage50,customCut]:[];
   }
   if(fmt==='twinsyl'||fmt==='twinsyr'){
     const group=normalize(colorGroup);
     const g=group==='bas'?51:group==='tre'?52:group==='spe'?53:null;
     const cover=g?[{key:'cover',label:'Cache-bonde',options:[OPT('matching','Cache-bonde TWINS assorti',0,'OPSH'+String(g).padStart(4,'0'))]}]:[];
     return [...cover,drainage50,customCut];
   }
   if(fmt==='quadro')return [{key:'cover',label:'Grille',options:coverPointStar},drainage90];
   if(fmt==='one')return [{key:'cover',label:'Grille',options:[OPT('inox','Grille ONE inox',0,'OPSH0054'),OPT('basic','Grille ONE Basic assortie',14,'OPSH0055')]},drainage90];
   if(fmt==='pure')return [{key:'cover',label:'Cache-bonde',options:[OPT('matching','Cache-bonde PURE assorti',0,'OPSH0057')]},drainage90];
   if(fmt==='arq')return [{key:'cover',label:'Cache-bonde',options:[OPT('matching','Cache-bonde ARQ assorti',0,'OPSH0056')]},drainage50,customCut];
   if(fmt==='iconik')return [{key:'cover',label:'Cache-bonde',options:[OPT('matching','Cache-bonde ICONIK assorti',0,'OPSH0058')]},drainage90,
   {key:'iconikColor',label:'Option Plus Colour ICONIK',options:[
     OPT('standard','Sans Plus Colour',0,'INCLUS'),
     OPT('plus','Plus Colour ICONIK +15 % du prix de base fabricant',0,'OPSH0073',15)]}];
   if(fmt==='loovers'){
     const r=String(outlet||'').match(/\b(?:50|90)\b/);
     if(!r)return []; // source supports BOTH Ø50 and Ø90, do not choose implicitly.
     return [{key:'cover',label:'Cache-bonde',options:[OPT('matching','Cache-bonde LOOVERS assorti',0,'INCLUS')]},
       r[0]==='50'?drainage50:drainage90];
   }
   return []; // UNIQUE, FALCON and other models: no unsafe accessory interpolation.
 }
 function quote(baseRaw,groups,chosen={}){
   if(!Number.isFinite(Number(baseRaw))||Number(baseRaw)<=0)return {ok:false,reason:'Prix de base du tarif PDF absent'};
   let extra=0;const components=[];
   for(const group of groups){
     const id=chosen[group.key]||group.options[0]?.id;
     const match=group.options.find(x=>x.id===id);
     if(!match)return {ok:false,reason:'Option fabricante indisponible : '+group.label};
     const charge=match.rawPrice+(match.percent?Math.round(Number(baseRaw)*match.percent)/100:0);
     extra+=charge;
     if(match.reference!=='INCLUS'||charge>0)components.push({...match,rawPrice:charge,group:group.key});
   }
   const source=Number(baseRaw)+extra;
   return {ok:true,rawPrice:source,price:Math.round(source*104)/100,optionRawPrice:extra,components};
 }
 return {optionsFor,quote,lineCover};
});
