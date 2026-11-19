/* Lossless, local-only deduplication of embedded project photos.
 * Cloud payloads keep their ordinary URLs for compatibility across devices.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.HydroLocalProjectStorage=api;
})(typeof window==='object'?window:null,function(){
  'use strict';
  const fields=['image','images','pdfImage','pdfImages'];
  const prefix='hydropolis-local-image:';
  function encode(project){
    const images=[],indices=new Map();
    const pack=value=>{
      if(Array.isArray(value))return value.map(pack);
      if(typeof value!=='string'||!/^data:image\//i.test(value))return value;
      if(!indices.has(value)){indices.set(value,images.length);images.push(value);}
      return prefix+indices.get(value);
    };
    const result={...project,selected:(project.selected||[]).map(product=>{
      const copy={...product};
      for(const field of fields)if(Object.hasOwn(copy,field))copy[field]=pack(copy[field]);
      return copy;
    })};
    if(images.length)result.localImageTableV1=images;
    return JSON.stringify(result);
  }
  function decode(project){
    if(!project||!Array.isArray(project.localImageTableV1))return project;
    const images=project.localImageTableV1;
    const unpack=value=>{
      if(Array.isArray(value))return value.map(unpack);
      if(typeof value!=='string'||!value.startsWith(prefix))return value;
      const index=value.slice(prefix.length);
      if(!/^\d+$/.test(index)||typeof images[Number(index)]!=='string')throw Error('Photo du brouillon local introuvable.');
      return images[Number(index)];
    };
    const result={...project,selected:(project.selected||[]).map(product=>{
      const copy={...product};
      for(const field of fields)if(Object.hasOwn(copy,field))copy[field]=unpack(copy[field]);
      return copy;
    })};
    delete result.localImageTableV1;
    return result;
  }
  return {encode,decode};
});
