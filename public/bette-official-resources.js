/* Bette source links verified against manufacturer pages, 28 October 2026.
 * Strict family equality: no SKU or colour can inherit a neighbour's picture.
 * These resources open the manufacturer's current configurator and downloads;
 * their existence does not certify the compatibility of optional accessories.
 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 root.HydroBetteResources=api;
})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const configurator='https://www.my-bette.com/fr/service/configurateur';
const downloads='https://www.my-bette.com/fr/service/downloads';
const models={
  betteair:{page:'https://www.my-bette.com/fr/produits/autres-sujets-sur-les-produits/betteair'},
  labette:{page:'https://www.my-bette.com/fr/produit/baignoires/labette',
    technical:'https://content.my-bette.com/produkt_downloads/LaBette-133118/LaBette-1300-700-mm-133474/DS-LaBette-BW_0069-FR.pdf'},
  bettefloor:{page:'https://www.my-bette.com/fr/produit/receveurs-de-douche-receveurs-ultra-plats/bettefloor'},
  betteflat:{page:'https://www.my-bette.com/fr/produit/receveurs-de-douche-receveurs-ultra-plats/betteflat'},
  bettestarlet:{page:'https://www.my-bette.com/fr/produit/baignoires/bettestarlet'},
  bettestarletvsilhouette:{page:'https://www.my-bette.com/fr/produit/baignoires/bettestarlet-v-silhouette'}
};
function normalize(x){return String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');}
function resolve(family){
 const item=models[normalize(family)]||{};
 return {productPage:item.page||'',technicalSheetUrl:item.technical||'',technicalScope:item.technical?'family':'missing',configuratorPage:configurator,downloadsPage:downloads,source:'official-bette-website'};
}
return {resolve,knownFamilies:Object.freeze(Object.keys(models))};
});
