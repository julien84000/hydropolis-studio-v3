/* Radaway manufacturer photo gallery, November 2026.
 * URLs are copied from official manufacturer product pages (Radaway FR/PL).
 * Exact product images are never confused with collection illustrations.
 */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroRadawayGallery=api;
})(typeof window==='object'?window:null,function(root){
 'use strict';
 const IMG='https://www.radaway.pl/wp-content/uploads/';
 const FR='https://www.radaway.fr/wp-content/uploads/';
 // Product-specific photos verified against the matching Radaway product page.
 const exact=Object.freeze({
  'RAD-MODELE-MODO-XL-GOLD':IMG+'2026/02/Radaway-Modo-Gold-XL-wariant4-kadr-760x1140.jpg',
  'RAD-MODELE-FURO-GOLD-WALK-IN':IMG+'2020/10/Furo-Gold-Walk-in_kadr-512x768.jpg',
  'RAD-MODELE-ESSENZA-PRO-8-GOLD-WALK-IN-III':IMG+'2020/12/Essenza-Pro-Gold-Walkin3-kadr-2-760x1140.jpg',
  'RAD-MODELE-NES-6-BLACK-PTJ':IMG+'2019/12/Nes-Black-PTJ_kadr-760x1140.jpg',
  'RAD-MODELE-VOLTA-II':IMG+'2024/09/Radaway-Volta-Chrome-II-kadr-760x1140.jpg',
  'RAD-MODELE-EOS-DWB':IMG+'2021/07/Radaway-Eos-DWB-kadr-512x768.jpg',
  'RAD-MODELE-MODO-F-SL-II':IMG+'2024/03/Radaway-Modo-F-SL-II-kadr-760x1140.jpg',
  'RAD-MODELE-MODO-F-SL-GOLD-II':IMG+'2024/03/Radaway-Modo-F-SL-Gold-II-kadr-760x1140.jpg',
  'RAD-MODELE-MODO-F-SL-III':IMG+'2024/04/Radaway-Modo-F-SL-III-1140x1140.jpg',
  'RAD-MODELE-MODO-SL-BLACK-II':FR+'2023/05/Radaway-Modo-SL-Black-II-kadr-760x1140.jpg',
  'RAD-MODELE-NES-6-CHROME-WALK-IN-II':IMG+'2021/07/Radaway-Nes-Walk-in-II-pion-755x1140.jpg'
 });
 // A representative official collection photo is better than an empty tile,
 // but is explicitly labelled as illustrative when not the selected model.
 const hero=Object.freeze({
  'Modo XL':IMG+'2021/04/Radaway-Modo-X-do-sufitu-760x1140.jpg',
  'Modo X':IMG+'2016/05/Modo_New_1_v08_02_fix_01.jpg',
  'Modo New':IMG+'2016/05/Modo_New_1_v08_02_fix_01.jpg',
  'Modo SL':FR+'2023/05/Radaway-Modo-SL-Black-II-kadr-760x1140.jpg',
  'Modo F':FR+'2024/04/Radaway-Modo-F-III-1140x1140.jpg',
  'Modo F SL':IMG+'2024/03/Radaway-Modo-F-SL-II-kadr-760x1140.jpg',
  'Essenza Pro 8':IMG+'2020/12/Essenza-Pro-Gold-Walkin3-kadr-2-760x1140.jpg',
  'Nes 6':IMG+'2021/07/Radaway-Nes-Walk-in-II-pion-755x1140.jpg',
  'Nes 8':FR+'2025/03/Radaway-Nes-Brushed-GunMetal-DWJS-kadr-760x1140.jpg',
  'Furo':FR+'2020/10/Furo-Black-Walk-in_kadr-760x1140.jpg',
  'Furo SL':FR+'2020/10/Furo-Black-Walk-in_kadr-760x1140.jpg',
  'Arta 8':FR+'2020/05/Arta-QL_DWD_kadr-760x1140.jpg',
  'Volta':IMG+'2024/09/Radaway-Volta-Chrome-II-kadr-760x1140.jpg',
  'Idea 6':FR+'2026/01/Radaway-Idea-Brushed-Light-Gold-PNJ-II-kadr-760x1140.jpg',
  'Alienta':FR+'2023/03/Radaway-Alienta-C-D-kadr-760x1140.jpg',
  'Eos':FR+'2021/07/Radaway-Eos-Walk-In-kadr-760x1140.jpg'
 });
 const valid=url=>typeof url==='string'&&
  /^https:\/\/www\.radaway\.(?:pl|fr|eu)\/wp-content\/uploads\/.+\.(?:jpe?g|png|webp)$/i.test(url);
 function exactFor(p){
  if(!p)return '';
  const url=exact[String(p.reference||'')];
  return valid(url)?url:'';
 }
 function illustrationFor(p){
  if(!p)return null;
  const rows=root?.HydroRadawayCatalog?.rows||[];
  const same=rows.filter(x=>x!==p&&x.collection===p.collection&&valid(x.image));
  // Prefer the same installation type and a similar visible finish, when possible.
  same.sort((a,b)=>{
   const score=x=>(x.productType===p.productType?4:0)+
    (x.finish&&p.finish&&x.finish===p.finish?2:0);
   return score(b)-score(a);
  });
  const photo=same[0]?.image||hero[p.collection]||'';
  if(!valid(photo))return null;
  return {url:photo,exact:false,source:'Photographie illustrative Radaway, autre modèle ou finition de la collection'};
 }
 function previewFor(p){
  if(!p)return null;
  if(valid(p.image))return {url:p.image,exact:true,source:'Photographie du modèle Radaway'};
  const matched=exactFor(p);
  if(matched)return {url:matched,exact:true,source:'Photographie du modèle Radaway (fiche fabricant)'};
  return illustrationFor(p);
 }
 return {exactFor,illustrationFor,previewFor,valid,hero};
});
