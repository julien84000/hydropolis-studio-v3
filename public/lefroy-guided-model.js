/* Lefroy Brooks guided sanitary configurations — verified against official UK set pages.
   Public prices come exclusively from the existing Hydropolis 2026 EUR catalogue. */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.HydroLefroyGuidedData=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const BASINS=[
    ['charterhouse-cloakroom-basin-with-ball-jointed-stand','Charterhouse','Lave-mains sur piètement', ['LB7251L','LB7251R','LB7252'],'LB3222'],
    ['charterhouse-basin-with-ball-jointed-stand-62cm','Charterhouse','Lavabo 62 cm · piètement', ['LB7201','LB7202','LB7203'],'LB3225'],
    ['charterhouse-basin-with-pedestal-62-cm','Charterhouse','Lavabo 62 cm · colonne', ['LB7201','LB7202','LB7203'],'LB7204'],
    ['lissa-doon-basin-with-ball-jointed-stand-62-cm','Lissa Doon','Lavabo 62 cm · piètement', ['LB7501','LB7502','LB7503'],'LB4970'],
    ['lissa-doon-basin-with-pedestal-62-cm','Lissa Doon','Lavabo 62 cm · colonne', ['LB7501','LB7502','LB7503'],'LB7504'],
    ['la-chapelle-narrow-basin-with-ball-jointed-stand-57-cm','La Chapelle','Lavabo 57 cm · piètement', ['LB7721','LB7722','LB7723'],'LB3226'],
    ['la-chapelle-narrow-basin-with-pedestal-57-cm','La Chapelle','Lavabo 57 cm · colonne', ['LB7721','LB7722','LB7723'],'LB7724'],
    ['la-chapelle-standard-basin-with-ball-jointed-stand-72-cm','La Chapelle','Lavabo 72 cm · piètement', ['LB7701','LB7702','LB7703'],'LB3227'],
    ['la-chapelle-standard-basin-with-pedestal-72-cm','La Chapelle','Lavabo 72 cm · colonne', ['LB7701','LB7702','LB7703'],'LB7724'],
    ['la-chapelle-console-basin-100-cm','La Chapelle','Console 100 cm · pieds', ['LB7731','LB7733'],'LB7713'],
    ['metropole-basin-with-ball-jointed-stand','Metropole','Lavabo 62 cm · piètement', ['LB7301','LB7302','LB7303'],'LB3224'],
    ['metropole-basin-with-pedestal-62-cm','Metropole','Lavabo 62 cm · colonne', ['LB7301','LB7302','LB7303'],'LB7304'],
    ['belle-aire-basin-with-metal-stand-60-cm','Belle Aire','Lavabo 60 cm · piètement', ['LB7803'],'LB4971'],
    ['belle-aire-basin-with-pedestal-60-cm','Belle Aire','Lavabo 60 cm · colonne', ['LB7803'],'LB7804'],
    ['belle-aire-console-basin-with-metal-stand','Belle Aire','Console 110 cm · piètement', ['LB7833'],'LB4972'],
    ['belle-aire-console-basin-with-pedestal','Belle Aire','Console 110 cm · colonne', ['LB7833'],'LB7804'],
    ['lb-7250-classic-rectangular-under-counter-basin','Classic','Vasque sous plan rectangulaire', ['LB7250'],null],
    ['lb-7220-classic-oval-under-counter-basin','Classic','Vasque sous plan ovale', ['LB7220'],null],
    ['xo-rectangular-ceramic-basin-for-deck','XO','Vasque sur plan XO 6000', ['XO6000'],null],
    ['charterhouse-wall-mounted-cloakroom-basin','Charterhouse','Lave-mains mural', ['LB7251L','LB7251R','LB7252'],null],
    ['charterhouse-corner-cloakroom-basin','Charterhouse','Lave-mains d’angle', ['LB7262'],null]
  ].map(function(x){return {slug:x[0],collection:x[1],label:x[2],basins:x[3],support:x[4],type:'basin'};});

  const WC=[
    ['classic-close-coupled-lavatory','Classic','WC réservoir attenant','LB7207','LB7208','LB7299DF',null,null,['LB7240','LB7241','LB7242BL'],['LB1307','BK1307','MK1307'],null],
    ['classic-low-level-lavatory','Classic','WC réservoir bas','LB7209','LB7212','LB7298DF','LB7788',null,['LB7240','LB7241','LB7242BL'],['LB1307','BK1307','MK1307'],null],
    ['classic-high-level-lavatory','Classic','WC réservoir haut','LB7209','LB7211','LB7297DF','LB7787',['LB7780','LB1305'],['LB7240','LB7241','LB7242BL'],[],['LB1310','BK1310']],
    ['classic-concealed-cistern-lavatory','Classic','WC réservoir encastré','LB7210','LB7296',null,null,null,['LB7240','LB7241','LB7242BL'],['LB1308','BK1308','MK1308'],null],
    ['lissa-doon-close-coupled-lavatory','Lissa Doon','WC réservoir attenant','LB7507','LB7508','LB7599DF',null,null,['LB7540','LB7541','LB7542BL'],['LB1307','BK1307'],null],
    ['la-chapelle-close-coupled-lavatory','La Chapelle','WC réservoir attenant','LB7707','LB7708','LB7799DF',null,null,['LB7740','LB7741','LB7742BL'],['LB1307','BK1307','MK1307'],null],
    ['la-chapelle-low-level-cistern-lavatory','La Chapelle','WC réservoir bas','LB7709','LB7708','LB7798DF','LB7788',null,['LB7740','LB7741','LB7742BL'],['LB1307','BK1307','MK1307'],null],
    ['la-chapelle-high-level-cistern-lavatory','La Chapelle','WC réservoir haut','LB7709','LB7711','LB7797','LB7787',['LB7780','LB1305'],['LB7740','LB7741','LB7742BL'],[],['LB1310','BK1310']],
    ['belle-aire-close-coupled-lavatory','Belle Aire','WC réservoir attenant','LB7807','LB7808','LB7789',null,null,['LB7840','LB7841','LB7842BL'],[],null]
  ].map(function(x){return {slug:x[0],collection:x[1],label:x[2],bowl:x[3],tank:x[4],mechanism:x[5],pipe:x[6],brackets:x[7],seats:x[8],levers:x[9],chains:x[10],type:'wc'};});

  const BIDETS=[
    {slug:'lb-7205',collection:'Classic',label:'Bidet Classic',basins:['LB7205'],type:'bidet',url:'https://uk.lefroybrooks.com/all-bidets'},
    {slug:'lb-7505',collection:'Lissa Doon',label:'Bidet Lissa Doon',basins:['LB7505'],type:'bidet',url:'https://uk.lefroybrooks.com/all-bidets'},
    {slug:'lb-7705',collection:'La Chapelle',label:'Bidet La Chapelle',basins:['LB7705'],type:'bidet',url:'https://uk.lefroybrooks.com/all-bidets'}
  ];

  const WASTES=['LB1328','LB1329','PPW040','LB1327','LB2140'];
  const OPTIONAL_DRAINS={Classic:['LB1383'], 'La Chapelle':['FR1383']};
  const FINISHES={CP:'Chrome',NK:'Nickel argenté',AG:'Or antique',PB:'Laiton poli'};
  const ALL=Object.freeze(BASINS.concat(WC,BIDETS));
  function group(kind){return kind==='wc'?WC:kind==='bidet'?BIDETS:BASINS;}
  function matchingRows(rows,base){
    return (rows||[]).filter(function(p){return p.manufacturer==='Lefroy Brooks' && (p.base===base || (p.reference===base))});
  }
  function variants(rows,base){
    // Approved Hydropolis price exception (4 Nov 2026): single-flush LB 7797
    // at the same price as the Classic LB 7297 single-flush mechanism.
    // The supplied 2026 EUR catalogue only contains LB7297DF at 133 EUR HT;
    // use that currently evidenced amount as a transparent reference-price proxy,
    // without modifying the 3,397 original tariff lines.
    if(base==='LB7797'){
      const existing=matchingRows(rows,base);
      if(existing.length)return existing;
      const priceRef=(rows||[]).find(p=>p.manufacturer==='Lefroy Brooks'&&
        ['LB7297SF','LB7297','LB7297DF'].includes(p.reference));
      if(!priceRef||!(Number(priceRef.price)>0))return [];
      return [{...priceRef,reference:'LB7797',base:'LB7797',designation:'La Chapelle high-level cistern internal fittings (6 L single flush)',
        price:priceRef.price,totalPrice:priceRef.price,internalPrice:0,
        source:'Exception Hydropolis 2026 : tarif aligné sur LB7297 single flush ; proxy chiffré '+priceRef.reference,
        originalDescription:'La Chapelle high-level cistern internal fittings (6 L single flush)',
        priceOverride:{approvedBy:'Hydropolis',comparison:'LB7297 single flush',pricingReference:priceRef.reference,
          note:'Prix single-flush absent du tarif EUR 2026 ; base vérifiable actuellement LB7297DF.'}}];
    }
    return matchingRows(rows,base).sort(function(a,b){return String(a.reference).localeCompare(String(b.reference));});
  }
  function metalCode(p){
    const ref=String(p&&p.reference||'').toUpperCase();
    const suffix=ref.match(/(?:-|^)(AG|CP|NK|PB)$/);
    if(suffix)return suffix[1];
    const code=String(p&&p.finishCode||'').toUpperCase();
    return FINISHES[code]?code:'';
  }
  function pick(rows,base,finish){
    if(!base)return null;
    // Manufacturer excludes Mackintosh levers in polished brass, even though the price list has PB SKUs.
    if(finish==='PB'&&['MK1307','MK1308'].includes(base))return null;
    const available=variants(rows,base);
    if(!available.length)return null;
    if(!finish)return available.find(function(x){return metalCode(x)==='CP';})||available[0];
    return available.find(function(x){return metalCode(x)===finish;}) || available.find(function(x){return !metalCode(x);}) || null;
  }
  function baseOf(reference){return String(reference||'').toUpperCase().replace(/[^A-Z0-9]/g,'').replace(/(?:WH|BL)?(?:AG|CP|NK|PB)$/,'');}
  function eligible(p){
    if(!p||p.manufacturer!=='Lefroy Brooks')return false;
    const base=String(p.base||p.reference||'').toUpperCase();
    return ALL.some(function(s){return [s.bowl,s.tank,s.mechanism,s.pipe,s.support].concat(s.basins||[],s.seats||[],s.levers||[],s.brackets||[],s.chains||[]).filter(Boolean).some(function(x){return x===base;});});
  }
  function initialSet(p){
    if(!p)return null;
    const base=String(p.base||p.reference||'').toUpperCase();
    return ALL.find(function(s){return (s.basins||[]).includes(base)||s.bowl===base;})||
      ALL.find(function(s){return [s.support,s.tank,s.mechanism,s.pipe].concat(s.seats||[],s.levers||[],s.brackets||[],s.chains||[]).includes(base);})||null;
  }
  function assemble(rows,set,choices){
    if(!set)throw new Error('Choisir une composition Lefroy Brooks.');
    choices=choices||{};
    const specs=[];
    function add(role,base,required){
      if(!base)return;
      const item=pick(rows,base,choices.finish||'CP');
      if(!item){if(required)specs.push({role,base,missing:true});return;}
      specs.push({role,base,item,required:required===true});
    }
    if(set.type==='wc'){
      add('Cuvette',set.bowl,true);
      add('Réservoir',set.tank,true);
      add('Mécanisme de chasse',set.mechanism,true);
      add('Tube de chasse',set.pipe,true);
      if(set.brackets&&set.brackets.length)add('Supports du réservoir',choices.brackets||set.brackets[0],true);
      add('Abattant',choices.seat||set.seats[0],true);
      if(set.levers&&set.levers.length)add('Commande de chasse',choices.lever||set.levers[0],true);
      if(set.chains&&set.chains.length)add('Chaîne et poignée de chasse',choices.chain||set.chains[0],true);
    }else{
      add(set.type==='bidet'?'Bidet':'Lavabo',choices.basin||set.basins[0],true);
      if(set.support)add('Support / colonne',set.support,true);
      if(choices.waste)add('Bonde',choices.waste,true);
      if(choices.trap)add('Siphon',choices.trap,true);
      if(choices.extension&&choices.trap==='LB1302')add('Rallonge de siphon','LB1303',true);
      if(choices.mounting&&set.basins.includes('XO6000'))add('Fixation murale','XO6010',true);
      if(choices.rod && ['FR1383','LB1383'].includes(choices.waste))add('Rallonge tirette',choices.rod,true);
    }
    const seen=new Set(); const unique=specs.filter(function(x){const key=x.item&&x.item.reference||x.base;if(seen.has(key))return false;seen.add(key);return true;});
    return {set,parts:unique,total:unique.filter(function(x){return x.item;}).reduce(function(s,x){return s+Number(x.item.price||0);},0),
      missing:unique.filter(function(x){return x.missing;}).map(function(x){return x.role+' ('+x.base+')';})};
  }
  return Object.freeze({BASINS,WC,BIDETS,ALL,WASTES,OPTIONAL_DRAINS,FINISHES,group,variants,metalCode,pick,eligible,initialSet,assemble});
});
