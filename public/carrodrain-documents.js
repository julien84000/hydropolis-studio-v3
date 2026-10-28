/* Carrodrain supplier documentation audit, 28 October 2026.
 * Each file below was linked from the corresponding official product page.
 * Page linkage is evidence of publication, not independent PDF-byte validation.
 * Never substitute a PRO specification for LOW (or the reverse).
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.HydroCarrodrainDocuments=api;
})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const DIR='https://cdn.shopify.com/s/files/1/0400/4459/3315/files/';
const page=id=>'https://carrodrain.com/en/products/'+id;
const files={
  cayman:{url:page('cayman'),general:'CD_Cayman_Technical_Specifications_EN_2023.pdf?v=1682431159',install:'Carrodrain_installatie_Cayman_LOW-PRO_210x250_Drieluik_Stappenplan_2025.pdf?v=1773670543'},
  caymanmono:{url:page('cayman-mono'),general:'CD_Cayman_Technical_Specifications_EN_2023.pdf?v=1682431159',install:'Carrodrain_installatie_Cayman_LOW-PRO_210x250_Drieluik_Stappenplan_2025.pdf?v=1773670543'},
  twiggi:{url:page('twiggi'),general:'CD_Twiggi_Technical_Specifications_EN_2022.pdf?v=1680251529',install:'Carrodrain_installatie_Twiggi_LOW-PRO_210x250_2luik_2026.pdf?v=1773670543'},
  quattro:{url:page('quattro'),low:'Quattro_100_LOW_Technical_Specifications_2025.pdf?v=1759237864',pro:'Quattro_100_PRO_Technical_Specifications_2025.pdf?v=1759237865'},
  disco:{url:page('disco'),low:'CD_Disco_125_LOW_Technical_Specifications_2025.pdf?v=1759395859',pro:'CD_Disco_125_PRO_Technical_Specifications_2025.pdf?v=1759395859'},
  invisible:{url:page('invisible'),general:'CD_Invisible_Technical_Specifications_EN_2023.pdf?v=1682432378',install:'Carrodrain_installatie_Invisible_LOW-PRO_210x250_Drieluik_Stappenplan_2025.pdf?v=1773670421'},
  invisiblequattro:{url:page('invisible-quattro'),low:'Invisible_Quattro_100_LOW_Technical_Specifications_2025.pdf?v=1759237865',pro:'Invisible_Quattro_100_PRO_Technical_Specifications_2025.pdf?v=1759237864',install:'Carrodrain_installatie_Invisible_LOW-PRO_210x250_Drieluik_Stappenplan_2025.pdf?v=1773670421'},
  invisibledisco:{url:page('invisible-disco'),general:'Invisible_Disco_125_Technical_Specifications_2025.pdf?v=1759237864',pro:'Invisible_Disco_125_PRO_Specifications_2025.pdf?v=1759237864',install:'Carrodrain_installatie_Invisible_LOW-PRO_210x250_Drieluik_Stappenplan_2025.pdf?v=1773670421'},
  liquid:{url:page('liquid'),low:'CD_Liquid_LOW_Technical_Specifications_ENG_2024.pdf?v=1759414694',pro:'CD_Liquid_PRO_Technical_Specifications_ENG_2024.pdf?v=1759414694',install:'Carrodrain_installatie_Liquid_LOW-PRO_210x250_Drieluik_Stappenplan_2025.pdf?v=1773670543'},
  liquidmono:{url:page('liquid-mono'),install:'Carrodrain_installatie_Liquid_LOW-PRO_210x250_Drieluik_Stappenplan_2025.pdf?v=1773670543'},
  liquidquattro:{url:page('liquid-quattro'),low:'Liquid_Quattro_100_LOW_Technical_Specifications_2025.pdf?v=1759237864',pro:'Liquid_Quattro_100_PRO_Technical_Specifications_2025.pdf?v=1759237864',install:'Carrodrain_installatie_Liquid_LOW-PRO_210x250_Drieluik_Stappenplan_2025.pdf?v=1773670543'},
  liquiddisco:{url:page('liquid-disco'),low:'Liquid_Disco_125_LOW_Technical_Specifications_2025.pdf?v=1759237864',pro:'Liquid_Disco_125_PRO_Technical_Specifications_2025.pdf?v=1759237864',install:'Carrodrain_installatie_Liquid_LOW-PRO_210x250_Drieluik_Stappenplan_2025.pdf?v=1773670543'},
  liquidsnake:{url:page('liquid-snake'),low:'CD_Liquid700_Snake_LOW_Technical_Specifications_ENG_2025.pdf?v=1759414694',pro:'CD_Liquid700_Snake_PRO_Technical_Specifications_ENG_2025.pdf?v=1759414694',install:'Carrodrain_installatie_Liquid_Snake_LOW-PRO_210x250_2luik_2026.pdf?v=1773670543'},
  kerlox:{url:page('waterproof-membrane-kerlox'),general:'kerlox_technical_specifications_en.pdf?v=1601470839'}
};
const safeFile=s=>/^[A-Za-z0-9_%-]+\.pdf\?v=\d{8,}$/.test(s||'');
function exactUrl(path){return safeFile(path)?DIR+path:'';}
function resolve(id,version){
  const item=files[String(id||'').toLowerCase()];
  if(!item)return {technicalSheetUrl:'',installationGuideUrl:'',sourcePage:'',technicalScope:'missing',installationScope:'missing'};
  const variant=String(version||'').toUpperCase().trim();
  const matched=(variant==='LOW'||variant==='PRO')?item[variant.toLowerCase()]:null;
  // General files can be consulted regardless of variant, but are not
  // described as dimension- or LOW/PRO-specific.
  const spec=matched||item.general||'';
  return {
    technicalSheetUrl:exactUrl(spec),
    installationGuideUrl:exactUrl(item.install),
    sourcePage:item.url,
    technicalScope:matched?'exact-version':item.general?'family':'missing',
    installationScope:item.install?'family':'missing'
  };
}
return {resolve,models:Object.freeze(Object.keys(files)),sourceDirectory:DIR};
});
