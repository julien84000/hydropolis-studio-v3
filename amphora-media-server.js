'use strict';
/* Amphora official WooCommerce variation image resolver. Never infer images from filename. */
module.exports=function installAmphoraMedia(app){
 const axios=require('axios'),cheerio=require('cheerio'),cache=new Map(),pending=new Map();
 const valid=ref=>/^RE[A-Z0-9]{2,12}(?:\.EXT)?\.(?:BS|BB|BC)$/i.test(ref);
 async function lookup(reference){
  if(!valid(reference))throw Error('Invalid Amphora SKU');
  const ref=reference.toUpperCase(),saved=cache.get(ref);
  if(saved&&Date.now()-saved.time<12*3600000)return saved.data;
  if(pending.has(ref))return pending.get(ref);
  const task=(async()=>{
   const base=ref.split('.')[0].toLowerCase();
   const url='https://www.amphoradesign.it/fr/prodotto/'+encodeURIComponent(base)+'/';
   const page=await axios.get(url,{timeout:12000,maxRedirects:3,maxContentLength:3*1024*1024,headers:{'User-Agent':'Mozilla/5.0','Accept-Language':'fr-FR,fr;q=0.9'}});
   const $=cheerio.load(String(page.data||''));
   let matched=null;
   $('form.variations_form').each((_,node)=>{
    const encoded=$(node).attr('data-product_variations');
    if(!encoded)return;
    let options;try{options=JSON.parse(encoded)}catch{return}
    const found=options.find(v=>String(v.sku||'').toUpperCase()===ref);
    if(found)matched=found;
   });
   const candidate=matched?.image?.full_src||matched?.image?.src||'';
   let image='';
   try{const u=new URL(candidate);if(u.protocol==='https:'&&u.hostname==='www.amphoradesign.it'&&u.pathname.startsWith('/wp-content/uploads/'))image=u.href;}catch{}
   const data={ok:!!image,reference:ref,image,exactFinish:!!image,manufacturerUrl:url,source:'Amphora officiel · variante fabricant'};
   cache.set(ref,{time:Date.now(),data});if(cache.size>350)cache.delete(cache.keys().next().value);
   return data;
  })().finally(()=>pending.delete(ref));
  pending.set(ref,task);return task;
 }
 app.get('/api/amphora-finish-media',(req,res)=>{
  const ref=String(req.query.reference||'').trim().toUpperCase();
  if(!valid(ref))return res.status(400).json({ok:false,error:'Référence invalide'});
  lookup(ref).then(d=>{res.set('Cache-Control','private,max-age=3600');res.json(d)})
   .catch(()=>res.status(200).json({ok:false,reference:ref,image:'',exactFinish:false,error:'Photo exacte non vérifiée'}));
 });
 return {lookup,valid};
};