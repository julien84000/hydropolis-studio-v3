/* Vismaravetro official collection photographs: representative only, never claimed exact finish/model. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroVismaraPhotos=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 const map=Object.freeze({
  'serie 7200':'https://www.vismaravetro.it/App_Assets/Moduli/0942/2402/md-vismaravetro-box-doccia-serie7200-09.jpg',
  'frame':'https://www.vismaravetro.it/App_Assets/Moduli/0971/2357/md-vismaravetro-box-doccia-frame-02.jpg',
  'smack':'https://www.vismaravetro.it/App_Assets/Moduli/0994/2405/md-vismaravetro-box-doccia-smack-2.jpg',
  'supersintesi':'https://www.vismaravetro.it/App_Assets/Moduli/0634/1491/md-vismaravetro-box-doccia-supersintesi-1-4.jpg',
  'serie 8000':'https://www.vismaravetro.it/App_Assets/Moduli/0229/394/md-vismaravetro-box-doccia-serie80003.jpg',
  'sk-in':'https://www.vismaravetro.it/App_Assets/Moduli/0219/798/md-vismaravetro-box-doccia-sk-in5.jpg',
  'link':'https://www.vismaravetro.it/App_Assets/Moduli/0679/2056/md-vismaravetro-link-4.jpg',
  'gliss':'https://www.vismaravetro.it/App_Assets/Moduli/0232/400/md-vismaravetro-box-doccia-gliss3.jpg',
  'flare 2.0':'https://www.vismaravetro.it/App_Assets/Moduli/0211/1824/md-vismaravetro-box-doccia-flare204.jpg',
  'linea':'https://www.vismaravetro.it/App_Assets/Moduli/0223/379/md-vismaravetro-box-doccia-linea5.jpg',
  'replay':'https://www.vismaravetro.it/App_Assets/Moduli/0217/357/md-vismaravetro-box-doccia-replay3.jpg',
  'sintesi':'https://www.vismaravetro.it/App_Assets/Moduli/0215/794/md-vismaravetro-box-doccia-sintesi-tiquadro.jpg',
  'junior':'https://www.vismaravetro.it/App_Assets/Moduli/0225/1838/md-vismaravetro-box-doccia-junior-header-03.jpg',
  'serie f':'https://www.vismaravetro.it/App_Assets/Moduli/0578/1061/md-vismaravetro-box-doccia-serie-f3.jpg',
  'solutions pour baignoires':'https://www.vismaravetro.it/App_Assets/Moduli/0217/357/md-vismaravetro-box-doccia-replay3.jpg'
 });
 function get(collection){return map[String(collection||'').trim().toLowerCase()]||'';}
 return {get,map};
});