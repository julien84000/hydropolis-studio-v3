const VERSION='__APP_VERSION__';
const CACHE=`hydropolis-v${VERSION}-shell`;
const CATALOG_CACHE=`hydropolis-v${VERSION}-catalogs`;
const SHELL=["/","/index.html","/styles.css","/app.js","/runtime-config.js","/catalog-index.js","/rough-in.js","/official-media.js","/sira-configurator.js","/catalog_manifest.json","/manufacturers_manifest.json","/manifest.webmanifest"];

self.addEventListener("install",event=>event.waitUntil(
  caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())
));
self.addEventListener("activate",event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(
    keys.filter(k=>k.startsWith("hydropolis-")&&![CACHE,CATALOG_CACHE].includes(k)).map(k=>caches.delete(k))
  )).then(()=>self.clients.claim())
));
self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET")return;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;

  if(url.pathname.startsWith("/api/"))return;

  const isCatalog=/\/(?:catalog_.*\.json(?:\.gz)?|(?:amphora|alpi)_catalog(?:_2025)?\.json|catalog_manifest\.json|manufacturers_manifest\.json|sira_models\.json|[^/]+_tariff_\d+\.json)$/.test(url.pathname);
  if(isCatalog){
    event.respondWith(caches.open(CATALOG_CACHE).then(async cache=>{
      try{
        const fresh=await fetch(req,{cache:"no-store"});
        if(fresh.ok){try{await cache.put(req,fresh.clone());}catch{}return fresh;}
      }catch{}
      const hit=await cache.match(req);
      return hit||new Response("Catalogue indisponible hors connexion",{status:503});
    }));
    return;
  }

  if(req.mode==="navigate"){
    event.respondWith(fetch(req).then(r=>{
      if(r.ok)caches.open(CACHE).then(c=>c.put("/index.html",r.clone())).catch(()=>{});
      return r;
    }).catch(()=>caches.match("/index.html")));
    return;
  }

  event.respondWith(fetch(req).then(r=>{
    if(r.ok)caches.open(CACHE).then(c=>c.put(req,r.clone())).catch(()=>{});
    return r;
  }).catch(()=>caches.match(req)));
});
