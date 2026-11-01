/* Verified collection illustration URLs from Catalano manufacturer pages.
 * Photos show a COLLECTION, not the exact configured reference/colour.
 * Do not replace an exact product photo with a lower-fidelity collection photo.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HydroCatalanoGallery=api;})(typeof window==='object'?window:null,function(){
'use strict';
const GROUPS=Object.freeze({
 'Zero':{image:'https://www.catalano.it/wp-content/uploads/2025/04/CATALANO_sanitari_Zero_55_sospesi-2.webp',url:'https://www.catalano.it/en/all-collections/zero/'},
 'Sfera':{image:'https://www.catalano.it/wp-content/uploads/2025/04/CATALANO_Sfera_55-sospesi.webp',url:'https://www.catalano.it/en/all-collections/sfera/'},
 'Elice':{image:'https://www.catalano.it/wp-content/uploads/2026/05/CATALANO_Elice_Set_01_generale.webp',url:'https://www.catalano.it/en/all-collections/elice/'},
 'Premium':{image:'https://www.catalano.it/wp-content/uploads/2025/04/Premium_120-doppio-bacino-2.webp',url:'https://www.catalano.it/en/all-collections/premium/'},
 'Alvea':{image:'https://www.catalano.it/wp-content/uploads/2025/04/CATALANO_Alvea_60_appoggio.webp',url:'https://www.catalano.it/en/all-collections/alvea/'},
 'Italy':{image:'https://www.catalano.it/wp-content/uploads/2025/04/CATALANO_Italy_100-1.webp',url:'https://www.catalano.it/en/all-collections/italy/'},
 'Comfort':{image:'https://www.catalano.it/wp-content/uploads/2025/04/CATALANO_Comfort_Set_01_generale.webp',url:'https://www.catalano.it/en/all-collections/comfort/'},
 'Ceramic Top':{image:'https://www.catalano.it/wp-content/uploads/2025/05/CATALANO_Zero_Set_08.webp',url:'https://www.catalano.it/en/all-collections/ceramic-top/'},
 'H3 Ceramic':{image:'https://www.catalano.it/wp-content/uploads/2025/06/H3-CERAMIC_120x80.webp',url:'https://www.catalano.it/en/shower-trays/'},
 'H3 Planar':{image:'https://www.catalano.it/wp-content/uploads/2025/06/H3_PLANAR_120x80.webp',url:'https://www.catalano.it/en/shower-trays/'},
 'H3 Solid':{image:'https://www.catalano.it/wp-content/uploads/2025/06/H3_SOLID_120x80.webp',url:'https://www.catalano.it/en/shower-trays/'},
 'H 4,5 Ceramic':{image:'https://www.catalano.it/wp-content/uploads/2025/06/H4_5_120x80.webp',url:'https://www.catalano.it/en/shower-trays/'},
 'Vasca':{image:'https://www.catalano.it/wp-content/uploads/2025/03/Vasca_165x80_h52-600x600.webp',url:'https://www.catalano.it/en/bathtubs/'},
 'Accessori Vari':{image:'https://www.catalano.it/wp-content/uploads/2025/03/SEDILE_SFERA_ZERO_soft_close_0551200001-600x600.webp',url:'https://www.catalano.it/en/accessories/'}
});
const verifiedPhoto=url=>{
 try{const x=new URL(url);return x.protocol==='https:'&&x.hostname==='www.catalano.it'&&
   /^\/wp-content\/uploads\/\d{4}\/\d{2}\/[^/?#]+\.(?:webp|jpe?g|png)$/i.test(x.pathname);}
 catch{return false;}
};
function family(collection){
 const entry=GROUPS[String(collection||'').trim()];
 return entry&&verifiedPhoto(entry.image)?{...entry,scope:'collection'}:null;
}
return {GROUPS,family,verifiedPhoto};
});