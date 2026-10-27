/* Sbordoni catalogue compositions. Compatibility is transcribed from the labelled
 * manufacturer plates, never inferred from OCR descriptions. See provenance.json. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.HydroSbordoniModel=factory();
})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  const VERSION=1;
  const FINISHES=['CR','NI','OL','BR','ON','RA','NN'];
  // [width in mm, explicitly allowed support bases, printed composition page, kind]
  const BASINS={
    Romana:{9200:[1350,['P9200','N9200','R9200'],26,'Console double'],9090:[900,['P9090','N9090','R9090'],26,'Console lavabo'],9065:[650,['P9065','N9065','R9065','9001'],26],9050:[500,[],26]},
    Palladio:{7200:[1500,['P7200','G720'],54,'Console double'],7100:[1000,['P7100','7001','G720','7100M'],54,'Console lavabo'],7070:[715,['P7070','7001','7070M'],54],7064:[645,['P7064','7001'],55],7050:[0,[],55,'Lavabo angulaire']},
    Neoclassica:{5700:[1050,['P5700','N5700','Y5700','G571'],90,'Console lavabo'],5775:[730,['P5775','N5775','Y5775','5771'],90],5770:[690,['P5770','N5770','Y5770','5771'],90],5765:[650,['P5765','N5765','Y5765','5771'],90],5758:[580,['P5758','N5758','Y5758','5771'],91]},
    Masaccio:{5369:[680,['5369M','5771','M5369','M5369G'],106],5365:[640,['5365M','5771','M5365','M5365G'],106],5359:[595,['5359M','5771','M5359','M5359G'],106],5352:[525,[],107],5304:[650,[],107,'Lavabo semi-encastré'],5305:[580,[],107,'Lavabo semi-encastré']}
  };
  const keys=Object.keys(BASINS), indexes=new WeakMap();
  function index(rows){
    let value=indexes.get(rows);
    if(value?.length===rows.length)return value;
    value={length:rows.length,byRef:new Map(),byCollection:new Map()};
    for(const p of rows){
      if(p.manufacturer!=='Sbordoni')continue;
      if(!value.byRef.has(p.reference))value.byRef.set(p.reference,p);
      if(!value.byCollection.has(p.collection))value.byCollection.set(p.collection,[]);
      value.byCollection.get(p.collection).push(p);
    }
    indexes.set(rows,value);return value;
  }
  function spec(collection,family){return BASINS[collection]?.[String(family)]||null;}
  function byRef(rows,collection,ref){return index(rows).byCollection.get(collection)?.find(p=>p.reference===ref)||index(rows).byRef.get(ref)||null;}
  function familyFrom(p){
    if(p?.manufacturer!=='Sbordoni')return '';
    const family=String(p.reference||'').split('/')[0];
    return spec(p.collection,family)?family:'';
  }
  function holesFrom(p){return String(p?.reference||'').match(/\/([13])$/)?.[1]||(p?.reference==='9050'?'1':'');}
  function familyRows(rows,collection,family){
    if(!spec(collection,family))return [];
    return ['1','3'].map(h=>byRef(rows,collection,String(family)==='9050'?(h==='1'?'9050':''):family+'/'+h)).filter(Boolean);
  }
  function families(rows,collection){return Object.keys(BASINS[collection]||{}).filter(f=>familyRows(rows,collection,f).length).sort((a,b)=>spec(collection,b)[0]-spec(collection,a)[0]);}
  function supportKey(p){return String(p?.base||p?.reference||p||'').replace(/(?:CR|NI|OL|BR|ON|RA|NN)$/,'');}
  function supportLabel(key){
    key=supportKey(key);
    if(['9001','7001','5771'].includes(key))return 'Piédestal céramique';
    if(['G571','G720'].includes(key))return 'Pieds céramiques';
    if(/^\d+M$/.test(key))return 'Supports céramiques';
    if(/^M\d+G$/.test(key))return 'Structure métal avec grille';
    if(/^M\d+$/.test(key))return 'Structure métal avec étagère en verre';
    return ({P:'Console métal classique',N:'Console métal Art déco',R:'Console métal rectangulaire',Y:'Console métal New York'})[key[0]]||key;
  }
  function supportGroups(rows,collection,family){
    return (spec(collection,family)?.[1]||[]).map(key=>{
      // Bare Pxxxx rows are glass shelves, not metal stands. Ceramic supports
      // have an exact reference; metal stands require an explicit finish suffix.
      const metal=/^[PNRYM]\d/.test(key);
      const candidates=metal?FINISHES.map(f=>byRef(rows,collection,key+f)).filter(Boolean):[byRef(rows,collection,key)].filter(Boolean);
      const items=candidates.map(p=>({...p,collection}));
      return {key,label:supportLabel(key),items,representative:items[0],image:image(collection,family,key)};
    }).filter(g=>g.items.length);
  }
  function image(collection,family,support=''){
    const s=spec(collection,family),key=supportKey(support);
    if(!s || (key&&!s[1].includes(key)))return '';
    return '/sbordoni/compositions/'+family+'-'+(key||'alone')+'.jpg';
  }
  function designation(collection,family,holes,support){
    const s=spec(collection,family);if(!s)return '';
    return `${s[3]||'Lavabo'} ${collection}${s[0]?' '+s[0]+' mm':''} — ${holes} trou${String(holes)==='1'?'':'s'} robinetterie`+(support?' · '+supportLabel(support)+' · '+(support.finish||'Céramique blanche'):'');
  }
  function price(p){return Number(p?.totalPrice??p?.price??0)||0;}
  function buildBasin(rows,selection){
    const {collection,family}=selection, holes=String(selection.holes||'1');
    const basin=familyRows(rows,collection,family).find(p=>holesFrom(p)===holes);
    if(!basin)throw Error('Variante de lavabo introuvable.');
    const ref=String(selection.supportRef||'');
    const support=ref?supportGroups(rows,collection,family).flatMap(g=>g.items).find(p=>p.reference===ref):null;
    if(ref&&!support)throw Error('Ce piètement est incompatible avec le lavabo sélectionné.');
    const components=[{role:'lavabo',reference:basin.reference,designation:designation(collection,family,holes),finish:basin.finish||'',price:price(basin)},...(support?[{role:'pietement',reference:ref,designation:supportLabel(support),finish:support.finish||'',price:price(support)}]:[])];
    const total=components.reduce((sum,p)=>sum+p.price,0),src=image(collection,family,support);
    const note=support&&/^M\d/.test(supportKey(support))?'Porte-serviettes 1P illustrés vendus séparément.':'';
    return {...basin,category:'Lavabo',designation:designation(collection,family,holes,support),price:total,totalPrice:total,catalogPrice:total,catalogTotalPrice:total,
      ...imageFields(src),imageNote:note,finish:support?.finish||basin.finish||'',sbordoniGrouped:true,
      sbordoniConfiguration:{schemaVersion:VERSION,collection,family:String(family),holes:Number(holes),supportRef:ref,componentReferences:components.map(p=>p.reference),components,resultImage:src,totalPrice:total,grouped:true}};
  }
  function imageFields(src){return {image:src,images:src?[src]:[],pdfImage:src,pdfImages:src?[src]:[],remoteImageUrl:'',remoteImages:[],imageSource:'Catalogue Sbordoni — planche de composition',imageStatus:src?'Visuel de la composition Sbordoni':'Composition à vérifier'};}
  function applyEditedRecord(current,updated){
    const result={...current,...updated};
    // Preserve the user's commercial, document, location and quantity choices.
    for(const k of Object.keys(current))if(/^(?:id$|roomId$|space|quantity|leadTime$|clientDiscount|priceOverride$|quote|include|hideFromDossier$|customTechnicalSheet$|technicalSheet|installationGuide|drawing|cadDrawing)/.test(k))result[k]=current[k];
    return result;
  }
  function wcImage(configuration){
    const c=configuration||{},ref=c.bowlRef||c.references?.[0]||'';
    const allowed=['9020','9021','9024','9025','9026','7020','7021','7032','7034','7024','5107','5109','5177','5179','5022','5033','5309','5520','5521','5324'];
    if(!allowed.includes(ref))return '';
    const floor=['9020','9021','7020','7021','5107','5109'].includes(ref);
    return '/sbordoni/compositions/'+ref+'-'+(floor?(c.flush==='high'?'high':'low'):'default')+'.jpg';
  }
  function migrate(selected){
    const result=selected.map(p=>({...p})),remove=new Set();let changed=false;
    for(const p of result){
      const c=p.sbordoniConfiguration;
      if(!c)continue;
      const children=result.filter(x=>x.accessoryFor===p.id&&x.sbordoniConfigurationAccessory);
      const components=c.components?.length?c.components:[{role:'lavabo',reference:p.reference,designation:p.designation,finish:p.finish||'',price:price(p)},...children.map(x=>({role:'pietement',reference:x.reference,designation:x.designation,finish:x.finish||'',price:price(x)}))];
      const supportRef=c.supportRef||components.find(x=>x.role==='pietement')?.reference||'';
      const src=image(c.collection,c.family,supportRef);
      const valid=!!src;
      const total=components.reduce((sum,x)=>sum+(Number(x.price)||0)*(Number(x.quantity)||1),0);
      const support=supportRef?{reference:supportRef,finish:components.find(x=>x.role==='pietement')?.finish||p.finish}:null;
      const next={...p,category:'Lavabo',sbordoniGrouped:true,price:total,totalPrice:total,catalogPrice:total,catalogTotalPrice:total,
        designation:valid?designation(c.collection,c.family,c.holes||holesFrom(p),support):p.designation,
        sbordoniConfiguration:{...c,schemaVersion:VERSION,supportRef,components,componentReferences:components.map(x=>x.reference),totalPrice:total,resultImage:src,grouped:true},
        sbordoniConfigurationIssue:valid?'':'Piètement incompatible avec la planche fabricant : modifier la configuration.'};
      if(!p.customImage)Object.assign(next,imageFields(src));
      if(JSON.stringify(next)!==JSON.stringify(p)){Object.assign(p,next);changed=true;}
      children.forEach(x=>remove.add(x.id));
    }
    // WC parts remain separate billable items; only the parent owns the composition photo.
    for(const p of result){if(p.sbordoniWCConfiguration&&!p.customImage){
      const src=wcImage(p.sbordoniWCConfiguration);
      if(src&&p.image!==src){Object.assign(p,imageFields(src));changed=true;}
    }}
    return {selected:result.filter(p=>!remove.has(p.id)),changed:changed||!!remove.size};
  }
  return {VERSION,BASINS,collections:keys,spec,byRef,familyFrom,holesFrom,familyRows,families,supportKey,supportLabel,supportGroups,image,designation,price,buildBasin,imageFields,applyEditedRecord,wcImage,migrate};
});
