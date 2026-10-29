/* Verified official manufacturer collection media index — V11.64.7.
 * Each Hidrobox path below came from the manufacturer's WordPress media API
 * https://hidrobox.com/wp-json/wp/v2/media (filename and GUID verified 29/10/2026).
 * Entries represent ONE collection, NOT every SKU, colour, size or finish.
 * Future manufacturers should be added under a separate vendor key only
 * after their exact official-media URLs have been verified.
 */
(function(root){
 'use strict';
 const HOSTS=Object.freeze({Hidrobox:'https://hidrobox.com/wp-content/uploads'});
 const FILES=Object.freeze({Hidrobox:Object.freeze({
  "neo-plus": "/Hidrobox_Showertray_Neo-Plus_Thumbnail-copia-6.png",
  "line": "/Hidrobox_Showertray_Line_Thumbnail.png",
  "twins": "/2025/03/Hidrobox_Showertray_Twins_Thumbnail.png",
  "one": "/Hidrobox_Showertray_One_Thumbnail.png",
  "pure": "/2025/03/Hidrobox_Showertray_Pure_Thumbnail.png",
  "quadro": "/2025/03/Hidrobox_Showertray_Quadro_Thumbnail.png",
  "arq": "/2025/05/Hidrobox_Showertray_Arq_Thumbnail.png",
  "unique": "/2025/05/Hidrobox_Showertray_Unique_Thumbnail.png",
  "iconik": "/2025/05/Hidrobox_Showertray_Iconik_Thumbnail.png",
  "loovers": "/2025/05/Hidrobox_Showertray_Loovers_Thumbnail.png",
  "paneles": "/Hidrobox_Showertray_Paneles_Thumbnail-1.png",
  "estantes": "/Hidrobox_Showertray_Estantes_Thumbnail.png",
  "hornacinas": "/Hidrobox_Niches_Thumbnail.png",
  "totems": "/Hidrobox_Totem_Kuiper_02_Thumbnail.png",
  "program": "/2025/05/Hidrobox_Washbasin_Program_Thumbnail.png",
  "program-colour": "/2025/05/Hidrobox_Washbasin_Program-colour_Thumbnail.png",
  "lom": "/2025/06/Hidrobox_Washbasin_Lom_Thumbnail.png",
  "guest": "/2025/06/Hidrobox_Washbasin_Guest_Thumbnail.png",
  "swap": "/2025/06/Hidrobox_Washbasin_Swap_Thumbnail.png",
  "titan": "/2025/06/Hidrobox_Washbasin_Titan_Thumbnail.png",
  "soul": "/2025/06/Hidrobox_Washbasin_Soul_Thumbnail.png",
  "civit": "/2025/06/Hidrobox_Washbasin_Civit_Thumbnail.png",
  "intim": "/2025/06/Hidrobox_Washbasin_Intim_Thumbnail.png",
  "spot": "/Hidrobox_Washbasin_Spot_Thumbnail.png",
  "fs": "/2025/06/Hidrobox_Washbasin_FS_Thumbnail.png",
  "artop": "/2025/06/Hidrobox_Washbasin_Artop_Thumbnail.png",
  "space": "/Hidrobox_Bathtub_Space-42-10.png",
  "beta-essential": "/Hidrobox_Bathtub_Beta-Essential_Thumbnail.png",
  "beta-evoque": "/Hidrobox_Bathtub_Beta-Evoque_Thumbnail-1.png",
  "beta-fusion": "/Hidrobox_Bathtub_Beta-Fusion_Thumbnail-1.png"
})});
 function get(manufacturer,collection){
  const brand=String(manufacturer||'').trim();
  const slug=String(collection||'').toLowerCase().trim().replace(/[_\s]+/g,'-');
  const filename=FILES[brand]?.[slug],host=HOSTS[brand];
  if(!filename||!host||!/^\/(?:[\w.-]+\/)*[\w.-]+\.(?:jpg|jpeg|png|webp)$/i.test(filename))return null;
  return Object.freeze({
   manufacturer:brand,collection:slug,image:host+filename,scope:'collection',
   source:host+filename,
   label:'Photographie officielle de collection · dimensions et finition non garanties'
  });
 }
 root.HydroManufacturerMediaIndex=Object.freeze({get,files:FILES});
})(window);
