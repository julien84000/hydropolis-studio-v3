const CACHE="hydropolis-v11-34-shell";
const CATALOG_CACHE="hydropolis-v11-34-catalogs";
const SHELL=["/","/index.html","/styles.css","/app.js","/catalog_manifest.json","/manufacturers_manifest.json","/amphora_catalog.json","/manifest.webmanifest",
  "/assets/recor-feet/aster.jpg","/assets/recor-feet/ball-claw.jpg","/assets/recor-feet/wood.jpg","/assets/recor-feet/imperial.jpg",
  "/assets/recor-feet/lion.jpg","/assets/recor-feet/pedestal.jpg","/assets/recor-feet/princess.jpg","/assets/recor-feet/carlton.jpg",
];

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

  // Never cache authenticated/private API responses. Offline project data lives in
  // localStorage under the authenticated browser profile, not in a shared HTTP cache.
  if(url.pathname.startsWith("/api/"))return;

  const isCatalog=/\/(?:catalog_.*\.json(?:\.gz)?|amphora_catalog\.json|catalog_manifest\.json|manufacturers_manifest\.json)$/.test(url.pathname);
  if(isCatalog){
    event.respondWith(caches.open(CATALOG_CACHE).then(async cache=>{
      const hit=await cache.match(req);
      const network=fetch(req).then(r=>{if(r.ok)cache.put(req,r.clone());return r}).catch(()=>null);
      return hit||await network||new Response("[]",{headers:{"Content-Type":"application/json"}});
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
