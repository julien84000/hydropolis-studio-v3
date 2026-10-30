'use strict';
/* Hidrobox official configurator: strictly verified selection-to-product-picture lookup.
   The manufacturer catalogue can return unrelated results for a filtered URL.
   NEVER use the first result blindly. No price/reference calculation here. */
const axios=require('axios'),cheerio=require('cheerio');
const ORIGIN='https://hidrobox.com/configurator/en/';
const MODEL_IDS=Object.freeze({
 'neo-plus':827,'line-x':808,'line-y':809,'twins-yl':850,'twins-yr':851,
 'arq':727,'iconik':801,'one':847,'pure':848,'quadro':849,
 'spot-1':938,'spot-2':1002,'spot-9':940,'spot-17':941,'spot-24':943,
 'spot-32':944,'spot-39':946,'spot-46':950,'spot-53':953,'spot-60':956,
 'spot-62':929,'spot-63':958,'spot-75':961,'spot-76':963,'spot-124':968,
 'spot-125':931,'spot-133':970,'spot-141':973,'spot-148':976,
 'spot-159':933,'spot-160':978,'spot-163':981,'spot-164':984,
 'spot-167':987,'spot-169':935,'spot-170':990,'spot-171':992,
 'spot-172':994,'spot-173':996,'spot-174':1000,'spot-186':936,
 'beta-essential':645,'beta-evoque':642,'beta-fusion':634,'civit':535,'fs-1':891,'fs-10':910,'fs-11':912,'fs-12':914,'fs-19':903,'fs-2':893,'fs-20':887,'fs-21':889,'fs-22':904,'fs-23':906,'fs-24':916,'fs-25':918,'fs-26':919,'fs-3':894,'fs-4':896,'fs-5':897,'fs-6':899,'fs-7':900,'fs-8':902,'fs-9':908,'guest':551,'lom':540,'niches':997,'shelves':965,'soul':558,'space':656,'totems':947,'wall-panels':1022
});
const TEXTURE_IDS=Object.freeze({smooth:803,slate:813,microtex:725,cement:730});
const MATERIAL_IDS=Object.freeze({kromat:729,scene:802});
const TYPOLOGY_IDS=Object.freeze({'shower-tray':1057,'wall-panels':1059,accessories:1080,
 'wall-hung-washbasins':1069,'vessel-washbasin':1180,'floor-standing-basins':1172,
 'freestanding-bathtub':1061,'recessed-bathtub':1063});
const SHOWER_MODELS=new Set(['neo-plus','line-x','line-y','twins-yl','twins-yr','arq','iconik','one','pure','quadro']);
function inferredTypology(model){
 if(SHOWER_MODELS.has(model))return 'shower-tray';
 if(/^spot-\d+$/.test(model))return 'vessel-washbasin';
 if(model==='wall-panels')return 'wall-panels';
 if(model==='niches'||model==='shelves')return 'accessories';
 if(/^fs-\d+$/.test(model)||model==='totems')return 'floor-standing-basins';
 return '';
}
const IMAGE_ROOT='https://hidrobox.com/configurator/wp-content/uploads/cfg-recursos/images/';
const AJAX='https://hidrobox.com/configurator/wp-admin/admin-ajax.php';
const COLOR_IDS=Object.freeze({beige:564,blush:570,brownie:571,cappuccino:572,cement:566,cotta:573,crema:574,
 'darkliquen':610,golden:576,graphite:567,herbal:577,iron:568,lake:578,metropoli:579,ocean:580,ombra:581,
 pietra:569,sandstone:611,terra:583,white:880,blanc:880,bianco:880});
let sizeIndex=null,sizeIndexTime=0;
async function officialSizeIndex({get=axios.get}={}){
 if(sizeIndex&&Date.now()-sizeIndexTime<12*60*60*1000)return sizeIndex;
 const response=await get(ORIGIN,{timeout:12000,maxRedirects:2,maxContentLength:8*1024*1024});
 const $=cheerio.load(response.data);
 const index=new Map();
 $('[data-fltrtype="size"][data-fltrid]').each((_,el)=>{
   const txt=$(el).text().trim().replace(/\s+/g,'').toLowerCase().replace(/,/g,'.');
   if(/^\d{2,3}(?:\.\d)?x\d{2,3}(?:\.\d)?$/.test(txt))index.set(txt,$(el).attr('data-fltrid'));
 });
 if(!index.size)throw Error('Dimensions du configurateur Hidrobox non disponibles');
 sizeIndex=index;sizeIndexTime=Date.now();return index;
}
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
 const typology=String(input.typology||inferredTypology(model)).trim().toLowerCase().replace(/[\s_]+/g,'-');
 const width=Number(input.width),length=Number(input.length);
 if(!color||color.length>50||!/^[\p{L}\p{N} .'-]+$/u.test(color))throw Error('Couleur Hidrobox requise');
 if(!(texture in TEXTURE_IDS))throw Error('Texture Hidrobox non vérifiée');
 if(!['scene','kromat'].includes(material))throw Error('Matière Hidrobox non vérifiée');
 const minimum=/^spot-[0-9]+$/.test(model)?30:20;
 const valid=n=>Number.isFinite(n)&&n>=minimum&&n<=260&&Math.round(n*2)===n*2;
 if(!valid(width)||!valid(length))throw Error('Dimensions Hidrobox requises');
 if(!MODEL_IDS[model])return {...input,model,unsupported:true};
 if(!Object.hasOwn(TYPOLOGY_IDS,typology))return {...input,model,unsupported:true};
 const fixed=inferredTypology(model);
 if(fixed&&fixed!==typology)throw Error('Catégorie incohérente avec la collection constructeur');
 return {model,typology,texture,material,color,shape,width,length};
}
function exactFilename(src,selection){
 let url;try{url=new URL(src);}catch{return null;}
 if(url.protocol!=='https:'||url.hostname!=='hidrobox.com'||!url.href.startsWith(IMAGE_ROOT))return null;
 const f=decodeURIComponent(url.pathname.split('/').pop()||'');
 if(/^spot-[0-9]+$/.test(selection.model)){
   // Vessel washbasins have a separate official asset naming scheme from shower trays.
   // Example confirmed in the user's live browser: Hidrobox_Washbasin_Spot-62_Blush.png.
   const wb=f.match(/^Hidrobox_Washbasin_Spot-([0-9]+)_([A-Za-z0-9-]+)\.(png|jpe?g|webp)$/i);
   if(!wb||('spot-'+wb[1])!==selection.model)return null;
   if(normalize(wb[2])!==normalize(selection.color)&&
      COLOR_IDS[normalize(wb[2])]!==COLOR_IDS[normalize(selection.color)])return null;
   return {url:url.href,file:f,shapeCode:'',assetType:'washbasin'};
 }
 if(selection.typology!=='shower-tray'){
   // Require collection and colour tokens in the official original filename.
   // Do not assign generic lifestyle photography as an exact configured result.
   if(!/\.(png|jpe?g|webp)$/i.test(f))return null;
   const tok=f.replace(/\.(png|jpe?g|webp)$/i,'').split('_');
   const wanted=normalize(selection.model);
   if(normalize(tok[0])!=='hidrobox'||!tok.some(t=>normalize(t)===wanted))return null;
   if(!tok.some(t=>normalize(t)===normalize(selection.color)))return null;
   const family=tok.slice(1).join('').toLowerCase();
   if(selection.typology==='wall-panels'&&!/panel/.test(family))return null;
   if(['vessel-washbasin','wall-hung-washbasins','floor-standing-basins'].includes(selection.typology)&&
      !/washbasin|basin|lavabo/.test(family))return null;
   if(['freestanding-bathtub','recessed-bathtub'].includes(selection.typology)&&!/bath/.test(family))return null;
   return {url:url.href,file:f,assetType:selection.typology};
 }
 const m=f.match(/^Hidrobox_Shower[-_]tray_([A-Za-z0-9-]+)_Per_([A-Za-z]+)_([A-Za-z]+)_([A-Za-z0-9-]+)\.(png|jpe?g|webp)$/i);
 if(!m)return null;
 if(normalize(m[1])!==normalize(selection.model))return null;
 if(!TEXTURE_CODES[selection.texture]?.includes(m[2].toLowerCase()))return null;
 if(normalize(m[4])!==normalize(selection.color) && !(COLOR_IDS[normalize(m[4])]===COLOR_IDS[normalize(selection.color)]))return null;
 if(SHAPE_CODES[selection.shape]&&!SHAPE_CODES[selection.shape].includes(m[3].toLowerCase()))return null;
 return {url:url.href,shapeCode:m[3].toLowerCase(),file:f};
}
function matchCard(src,heading,selection){
 const asset=exactFilename(src,selection);if(!asset)return null;
 const title=String(heading||'').trim();
 if(!title||!normalize(title).includes(normalize(selection.model)))return null;
 const dimensions=[...title.replace(/,/g,'.').matchAll(/(\d{2,3}(?:\.\d)?)\s*[x×]\s*(\d{2,3}(?:\.\d)?)/gi)];
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
 const url=new URL(ORIGIN);url.searchParams.set('fltr-typology',String(TYPOLOGY_IDS[s.typology]));
 url.searchParams.set('fltr-collection',String(MODEL_IDS[s.model]));
 url.searchParams.set('fltr-material',String(MATERIAL_IDS[s.material]));
 url.searchParams.set('fltr-texture',String(TEXTURE_IDS[s.texture]));
 return url.href;
}
async function lookup(raw,{get=axios.get,post=axios.post,sizeId=null}={}){
 const s=canonical(raw);if(s.unsupported)return {ok:false,reason:'Collection non identifiée dans le configurateur officiel',source:ORIGIN};
 const key=JSON.stringify(s),now=Date.now();const saved=cache.get(key);
 if(saved&&saved.expires>now)return saved.data;
 const source=urlFor(s);
 try{
   const colorId=COLOR_IDS[normalize(s.color)];
   if(!colorId)return {ok:false,source,reason:'Couleur indisponible dans le configurateur fabricant'};
   const dimensionId=sizeId || (await officialSizeIndex({get})).get(s.width+'x'+s.length) ||
     (await officialSizeIndex({get})).get(s.length+'x'+s.width);
   if(!dimensionId)return {ok:false,source,reason:'Ces dimensions ne figurent pas dans le configurateur officiel'};
   const params=new URLSearchParams();
   params.set('action','_listado_results');
   const filters={typology:TYPOLOGY_IDS[s.typology],
     collection:MODEL_IDS[s.model],texture:TEXTURE_IDS[s.texture],
     material:MATERIAL_IDS[s.material],color:colorId,size:dimensionId};
   for(const [key,value] of Object.entries(filters))params.append('fltr-'+key+'[]',String(value));
   params.set('offset','0');params.set('limit','48');
   const res=await post(AJAX,params.toString(),{timeout:15000,maxRedirects:2,maxContentLength:6*1024*1024,
     headers:{'Content-Type':'application/x-www-form-urlencoded','Accept':'application/json'}});
   const html=String(res?.data?.data?.grid||'');
   if(!html)throw Error('Réponse AJAX fabricant sans résultats vérifiables');
   const item=parse(html,s);
   const data=item?{ok:true,image:item.url,title:item.title,source,quality:'manufacturer-configurator',match:item.selectionMatch,
     verifiedMaterial:false,disclaimer:'Photo officielle correspondant aux filtres modèle, matière, texture, couleur et dimensions. La grille et la bonde peuvent ne pas être représentées.'}:
     {ok:false,source,reason:'Aucun rendu unique du fabricant ne correspond à tous les filtres demandés.'};
   cache.set(key,{expires:now+15*60*1000,data});if(cache.size>200)cache.delete(cache.keys().next().value);
   return data;
 }catch(e){return {ok:false,source,reason:'Le service officiel de rendu configuré est momentanément inaccessible'};}
}
function install(app){
 app.get('/api/hidrobox-configurator-image',async(req,res)=>{
   let input;try{input=canonical(req.query||{});}catch(e){return res.status(400).json({ok:false,error:e.message});}
   res.set('Cache-Control','private, max-age=60');
   res.json(await lookup(input));
 });
}
module.exports=install;
Object.assign(module.exports,{canonical,matchCard,exactFilename,parse,urlFor,lookup,officialSizeIndex,MODEL_IDS,TYPOLOGY_IDS,TEXTURE_IDS,COLOR_IDS});
