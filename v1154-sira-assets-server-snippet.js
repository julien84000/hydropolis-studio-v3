/* V11.54_SIRA_EXACT_ASSETS */
function v54SlugFromUrl(raw){try{return decodeURIComponent(new URL(raw).pathname).split('/').filter(Boolean).pop().toLowerCase()}catch{return ''}}
function v54SiraExactImages($,base,title=''){
  const slug=v54SlugFromUrl(base), titleNorm=String(title||'').toLowerCase().replace(/[^a-z0-9]+/g,'');
  const rows=[],seen=new Set();
  function add(raw,label='',score=0){
    if(!raw)return;const first=String(raw).split(',')[0].trim().split(/\s+/)[0];const u=v53Abs(base,first);
    if(!u||!v53Allowed(u,'Sira Concrete')||!/\.(?:jpe?g|png|webp|avif)(?:\?|$)/i.test(u)||seen.has(u))return;
    const txt=(u+' '+label).toLowerCase();if(/logo|icon|flag|social|cookie|spinner|arrow|placeholder|swatch|color-|colour-/.test(txt))return;
    let s=score;
    if(slug&&txt.includes(slug))s+=120;
    if(titleNorm&&txt.replace(/[^a-z0-9]+/g,'').includes(titleNorm))s+=80;
    if(/woocommerce-product-gallery|wp-post-image|product-gallery/.test(txt))s+=60;
    if(/og:image/.test(label))s+=40;
    seen.add(u);rows.push({url:u,score:s});
  }
  add($("meta[property='og:image']").attr('content'),'og:image',80);
  $('.woocommerce-product-gallery__image img,.woocommerce-product-gallery img,img.wp-post-image,.product-gallery img,figure img').each((_,el)=>{const e=$(el),lab=[e.attr('alt'),e.attr('title'),e.attr('class'),e.closest('[class]').attr('class')].filter(Boolean).join(' ');for(const a of ['data-large_image','data-src','data-lazy-src','src','srcset'])add(e.attr(a),lab,50)});
  $('img').each((_,el)=>{const e=$(el),lab=[e.attr('alt'),e.attr('title')].filter(Boolean).join(' ');for(const a of ['data-large_image','data-src','src'])add(e.attr(a),lab,0)});
  rows.sort((a,b)=>b.score-a.score);
  return rows.map(x=>x.url).slice(0,12);
}
app.get('/api/sira-product-v1154',async(req,res)=>{
  const url=String(req.query.url||'').trim();if(!v53Allowed(url,'Sira Concrete')||!/\/producto\//i.test(url))return res.status(400).json({error:'Produit Sira invalide'});
  const key=`sira-product-v1154|${url}`,hit=V1153_CONFIG_CACHE.get(key);if(hit&&Date.now()-hit.at<6*60*60*1000)return res.json(hit.data);
  try{
    const page=await v53Get(url),html=String(page.data||''),$=cheerio.load(html),txt=v53Norm($.root().text()),title=v53Norm($('h1').first().text())||v53Norm($('title').text());
    const images=v54SiraExactImages($,url,title),docs=v53Docs($,url,'Sira Concrete');
    const colors=[];$('select[name*=color i] option,[data-attribute_name*=color i] option,.variations option').each((_,el)=>{const t=v53Norm($(el).text()),v=v53Norm($(el).attr('value'));if(t&&v&&!/choose|elige|seleccion|choisir/i.test(t))colors.push({code:v,label:t})});
    const specs=[];$('table tr,.woocommerce-product-attributes-item,.product-attributes li').each((_,el)=>{const t=v53Norm($(el).text());if(t&&t.length<180&&!specs.includes(t))specs.push(t)});
    const optionTexts=[];$('h2,h3,h4,strong,p,li').each((_,el)=>{const t=v53Norm($(el).text());if(t&&/(apto|adecuado|suitable|incluye|included|montaje|mounting|designed|diseñado)/i.test(t)&&t.length<220&&!optionTexts.includes(t))optionTexts.push(t)});
    const dimMatch=txt.match(/(?:MEDIDAS|SIZES|DIMENSIONS)\s*[:|]?\s*([0-9ØxX.,\s]+MM)/i),weightMatch=txt.match(/(?:PESO|WEIGHT)\s*[:|]?\s*([0-9.,]+\s*KG)/i),capacityMatch=txt.match(/(?:CAPACIDAD|CAPACITY)\s*[:|]?\s*([0-9.,]+\s*L)/i);
    const technical=docs.pdf.find(x=>/ficha|technical|tech|fiche|scheda/i.test(x.label))||docs.pdf[0]||null;
    const data={url,title,primaryImage:images[0]||'',images,colors:colors.length?colors:[{code:'CH',label:'Charcoal'},{code:'CG',label:'Concrete Grey'},{code:'DC',label:'Dark Clay'},{code:'FG',label:'Fog Grey'},{code:'LS',label:'Light Sun'},{code:'MI',label:'Mint'},{code:'MG',label:'Moss Green'},{code:'OB',label:'Ocean Blue'},{code:'PW',label:'Pearl White'},{code:'SP',label:'Salt Pink'},{code:'SA',label:'Sand'},{code:'TE',label:'Terracota'}],specs:specs.slice(0,16),options:optionTexts.slice(0,12),dimensions:dimMatch?.[1]||'',weight:weightMatch?.[1]||'',capacity:capacityMatch?.[1]||'',technicalSheetUrl:technical?.url||'',technicalSheetLabel:technical?.label||'Fiche technique Sira',otherFiles:docs.other,imageResolver:'exact-product-v1154'};
    V1153_CONFIG_CACHE.set(key,{at:Date.now(),data});res.set('Cache-Control','no-store').json(data)
  }catch(e){res.status(502).json({error:'Impossible de lire le produit Sira',detail:e.message})}
});
