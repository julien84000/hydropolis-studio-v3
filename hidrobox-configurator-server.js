'use strict';
/* Hidrobox official configurator: strictly verified selection-to-product-picture lookup.
   The manufacturer catalogue can return unrelated results for a filtered URL.
   NEVER use the first result blindly. No price/reference calculation here. */
const axios=require('axios'),cheerio=require('cheerio');
const ORIGIN='https://hidrobox.com/configurator/en/';
const MODEL_IDS=Object.freeze({
 'neo-plus':827,'line-x':808,'line-y':809,'twins-yl':850,'twins-yr':851,
 'arq':727,'iconik':801,'one':847,'pure':848,'quadro':849
});
const TEXTURE_IDS=Object.freeze({smooth:803,slate:813,microtex:725,cement:730});
const MATERIAL_IDS=Object.freeze({kromat:729,scene:802});
const IMAGE_ROOT='https://hidrobox.com/configurator/wp-content/uploads/cfg-recursos/images/';
const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const TEXTURES={lisse:'smooth',smooth:'smooth',liso:'smooth',ardoise:'slate',pizarra:'slate',slate:'slate',microtex:'microtex',cement:'cement',ciment:'cement'};
const TEXTURE_CODES={smooth:['smo'],slate:['sla','slt'],microtex:['mic'],cement:['cem']};
const SHAPE_CODES={rectangle:['rec'],rectangulaire:['rec'],rectangular:['rec'],square:['squ'],carre:['squ'],angular:['ang'],angulaire:['ang'],pentagonal:['pen']};
const cache=new Map();
function canonical(input){
 const model=String(input.model||'').trim().toLowerCase().replace(/[\s_]+/g,'-');
 if(!/^[a-z0-9-]{2,32}$/.test(model))throw Error('Modèle Hidrobox invalide');
 const texture=TEXTURES[normalize(input.texture)]||'';
 const material=normalize(input.material);
 const color=String(input.color||'').trim();
 const shape=normalize(input.shape||'');
 const width=Number(input.width),length=Number(input.length);
 if(!color||color.length>50||!/^[\p{L}\p{N} .'-]+$/u.test(color))throw Error('Couleur Hidrobox requise');
 if(!(texture in TEXTURE_IDS))throw Error('Texture Hidrobox non vérifiée');
 if(!['scene','kromat'].includes(material))throw Error('Matière Hidrobox non vérifiée');
 if(!Number.isInteger(width)||width<40||width>240||!Number.isInteger(length)||length<40||length>260)throw Error('Dimensions Hidrobox requises');
 if(!MODEL_IDS[model])return {...input,model,unsupported:true};
 return {model,texture,material,color,shape,width,length};
}
function exactFilename(src,selection){
 let url;try{url=new URL(src);}catch{return null;}
 if(url.protocol!=='https:'||url.hostname!=='hidrobox.com'||!url.href.startsWith(IMAGE_ROOT))return null;
 const f=decodeURIComponent(url.pathname.split('/').pop()||'');
 const m=f.match(/^Hidrobox_Shower[-_]tray_([A-Za-z0-9-]+)_Per_([A-Za-z]+)_([A-Za-z]+)_([A-Za-z0-9-]+)\.(png|jpe?g|webp)$/i);
 if(!m)return null;
 if(normalize(m[1])!==normalize(selection.model))return null;
 if(!TEXTURE_CODES[selection.texture]?.includes(m[2].toLowerCase()))return null;
 if(normalize(m[4])!==normalize(selection.color))return null;
 if(SHAPE_CODES[selection.shape]&&!SHAPE_CODES[selection.shape].includes(m[3].toLowerCase()))return null;
 return {url:url.href,shapeCode:m[3].toLowerCase(),file:f};
}
function matchCard(src,heading,selection){
 const asset=exactFilename(src,selection);if(!asset)return null;
 const title=String(heading||'').trim();
 if(!title||!normalize(title).includes(normalize(selection.model)))return null;
 const dimensions=[...title.matchAll(/(\d{2,3})\s*[x×]\s*(\d{2,3})/gi)];
 if(!dimensions.length)return null; // Never infer the pictured dimensions.
 const matched=dimensions.some(x=>
   (Number(x[1])===selection.width&&Number(x[2])===selection.length)||
   (Number(x[1])===selection.length&&Number(x[2])===selection.width));
 if(!matched)return null;
 return {...asset,title,selectionMatch:'model-texture-color-shape-dimensions',materialVerified:false};
}
function parse(html,selection){
 const $=cheerio.load(html);const matches=[];
 $('.configuratorpage__item').each((_,node)=>{
   const element=$(node),anchor=element.find('a.modal-image-btn').first();
   const heading=element.find('h3.configuratorpage__item__title').first().text();
   const match=matchCard(anchor.attr('href'),heading,selection);
   if(match)matches.push(match);
 });
 return matches.length===1?matches[0]:null; // Ambiguity is not an exact match.
}
function urlFor(s){
 const url=new URL(ORIGIN);url.searchParams.set('fltr-typology','1057');
 url.searchParams.set('fltr-collection',String(MODEL_IDS[s.model]));
 url.searchParams.set('fltr-material',String(MATERIAL_IDS[s.material]));
 url.searchParams.set('fltr-texture',String(TEXTURE_IDS[s.texture]));
 return url.href;
}
async function lookup(raw,{get=axios.get}={}){
 const s=canonical(raw);if(s.unsupported)return {ok:false,reason:'Collection non identifiée dans le configurateur officiel',source:ORIGIN};
 const key=JSON.stringify(s),now=Date.now();const saved=cache.get(key);
 if(saved&&saved.expires>now)return saved.data;
 const source=urlFor(s);
 try{
   const response=await get(source,{timeout:12000,maxRedirects:2,maxContentLength:8*1024*1024,headers:{'User-Agent':'Mozilla/5.0 HydropolisStudio/11.64.23','Accept':'text/html'},responseType:'text'});
   const item=parse(String(response.data||''),s);
   const data=item?{ok:true,image:item.url,title:item.title,source,quality:'manufacturer-configurator',match:item.selectionMatch,
      verifiedMaterial:false,disclaimer:'Photo officielle du modèle, de la texture, de la couleur et des dimensions. Matière et accessoires non identifiables sur le fichier.'}:
     {ok:false,source,reason:'Aucun visuel officiel ne correspond à toutes les caractéristiques vérifiables dans les résultats.'};
   cache.set(key,{expires:now+15*60*1000,data});if(cache.size>200)cache.delete(cache.keys().next().value);
   return data;
 }catch(e){return {ok:false,source,reason:'Configurateur fabricant momentanément inaccessible'};}
}
function install(app){
 app.get('/api/hidrobox-configurator-image',async(req,res)=>{
   let input;try{input=canonical(req.query||{});}catch(e){return res.status(400).json({ok:false,error:e.message});}
   res.set('Cache-Control','private, max-age=60');
   res.json(await lookup(input));
 });
}
module.exports=install;
Object.assign(module.exports,{canonical,matchCard,exactFilename,parse,urlFor,lookup,MODEL_IDS,TEXTURE_IDS});
