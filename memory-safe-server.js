'use strict';

// V11.56 — garde-fous mémoire installés avant les routes historiques.
// Le catalogue complet est déjà chargé côté navigateur. L'ancien index serveur
// décompressait puis conservait toutes les références en RAM ; on neutralise ce
// doublon côté Render et on garde le catalogue local comme source principale.
module.exports=function installMemorySafeServer(app){
  app.get('/api/catalog/search',(req,res)=>{
    res.set('Cache-Control','no-store').json({
      source:'client-catalog-memory-safe',
      total:0,
      items:[],
      note:'Recherche serveur désactivée en mode mémoire sûre ; le catalogue local reste la source principale.'
    });
  });

  app.get('/api/health/memory',(req,res)=>{
    const m=process.memoryUsage();
    const mb=n=>Math.round((Number(n||0)/1024/1024)*10)/10;
    res.set('Cache-Control','no-store').json({
      ok:true,
      version:require('./package.json').version,
      caches:{legacy:app.locals.legacyCacheStats?.()||{},official:app.locals.assetResolver?.stats()||{},packs:app.locals.packCacheStats?.()||{},tda:app.locals.tdaCacheStats?.()||{}},
      rssMB:mb(m.rss),
      heapUsedMB:mb(m.heapUsed),
      heapTotalMB:mb(m.heapTotal),
      externalMB:mb(m.external),
      arrayBuffersMB:mb(m.arrayBuffers),
      uptimeSeconds:Math.round(process.uptime()),
      time:new Date().toISOString()
    });
  });
};
