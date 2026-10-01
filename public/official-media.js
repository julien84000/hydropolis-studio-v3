(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.HydroOfficialMedia=factory();
})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';const VERSION=globalThis.HYDROPOLIS_VERSION||(typeof module==='object'?require('../package.json').version:'');
  const brand=p=>/^alpi$/i.test(p?.manufacturer||'')?'alpi':/^sira(?: concrete)?$/i.test(p?.manufacturer||'')?'sira':/^gessi$/i.test(p?.manufacturer||'')?'gessi':'';
  function allowed(value,p,depth=0){
    if(!value||depth>2)return false;
    try{
      const u=new URL(value,'https://hydropolis.local');
      if(u.pathname==='/api/image-proxy')return allowed(u.searchParams.get('url'),p,depth+1);
      const hosts={alpi:['alpirubinetterie.com'],sira:['siraconcrete.com'],gessi:['gessi.com','gessistorage.blob.core.windows.net']};
      return u.protocol==='https:'&&!u.username&&!u.password&&(hosts[brand(p)]||[]).some(h=>u.hostname===h||u.hostname.endsWith('.'+h));
    }catch{return false;}
  }
  function key(p){return [p.manufacturer,p.reference,p.collection||'',p.finishCode||p.siraConfiguration?.color||p.finish||'',VERSION].join('|');}
  function sanitizeProducts(rows){
    let changed=false;
    for(const p of rows||[]){
      if(!brand(p))continue;
      const oldSira=/Catalogue Sira|catalogue Sira|\/assets\/sira\//i.test([p.imageSource,p.imageStatus,p.image].join(' '));
      // User-uploaded project photographs remain intentional overrides.
      if(p.customImage&&!oldSira)continue;
      if(p.mediaVersion===VERSION&&(!p.image||allowed(p.remoteImageUrl||p.image,p)))continue;
      for(const field of ['image','pdfImage','remoteImageUrl','manufacturerGenericImage','resolvedManufacturerUrl','drawingUrl'])p[field]='';
      if(!p.customTechnicalSheet)p.technicalSheetUrl='';
      if(!p.installationGuideAsset)p.installationGuideUrl='';
      p.images=[];p.pdfImages=[];p.remoteImages=[];p.customImage=false;
      p.imageStatus='Visuel fabricant à actualiser';p.mediaVersion=VERSION;changed=true;
    }
    return changed;
  }
  return {VERSION,brand,allowed,key,sanitizeProducts};
});
