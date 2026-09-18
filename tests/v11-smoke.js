const fs=require('fs');
const path=require('path');
const assert=require('assert');
const zlib=require('zlib');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const json=f=>{const p=path.join(root,f);const b=fs.readFileSync(p);return JSON.parse((/\.gz$/i.test(f)?zlib.gunzipSync(b):b).toString('utf8'))};

assert.equal(json('package.json').version,'11.40.0');
for(const f of ['public/sw.js','public/manifest.webmanifest','public/manufacturers_manifest.json'])assert(fs.existsSync(path.join(root,f)),`${f} missing`);

const manifest=json('public/catalog_manifest.json');
const files=['amphora_catalog.json',...manifest.chunks.map(c=>c.file)];
let total=0;const makers=new Set();const unique=new Set();
for(const file of files){
  const rows=json('public/'+file);total+=rows.length;
  for(const p of rows){makers.add(p.manufacturer);unique.add(`${p.manufacturer}|${p.reference}`)}
}
assert.equal(total,89880,'catalog row count changed unexpectedly');
for(const maker of ['Amphora','Catalano','Coalbrook','Gessi','Hotbath','Lefroy Brooks','Nicolazzi','Recor','Ritmonio','Zucchetti'])assert(makers.has(maker),`missing maker ${maker}`);
assert(unique.size>=89876,'unexpected catalog deduplication regression');

const app=read('public/app.js');
for(const symbol of ['renderCompareDock','renderCompareView','renderDashboardEcosystem','renderFavoritesView','toggleFavorite','smartAlternativesFor','requestServerSearch','exportExcel','exportMoodboard','registerOfflineSupport','offlineProjectListKey','hotbathDrawingProxyUrl'])assert(app.includes(symbol),`missing V11 app feature ${symbol}`);
const server=read('server.js');
for(const symbol of ['/api/catalog/search','session_version','storeCopyAssets','safeRemoteGet','REMOTE_HOST_SUFFIXES','/api/hotbath-drawing-image','lefroy-squarespace-variant','images.squarespace-cdn.com','catalano-official-exact-preview','catalano-official-product-gallery'])assert(server.includes(symbol),`missing V11 server feature ${symbol}`);
assert(!app.includes('Number(saved.settings?.vatRate)||20'),'VAT 0% regression guard failed');
assert(app.includes('raw=p?.purchasePrice') && app.includes('raw===null||raw===undefined||raw===""'),'null purchasePrice regression guard missing');
assert(app.includes('return (room?.manual||[]).filter(m=>m && String(m.label||"").trim())'),'manual-line preservation guard missing');
assert(app.includes('technical-pdf-page-3') || read('public/manufacturers_manifest.json').includes('technical-pdf-page-3'),'Zucchetti page 3 capability missing');
assert(app.includes('isRecorBathRequiringFeet'),'Recor feet configurator missing');
assert(app.includes('sanitairkamer'),'Hotbath Sanitairkamer fallback missing');
console.log(`V11 smoke OK · ${total.toLocaleString('fr-FR')} lignes · ${unique.size.toLocaleString('fr-FR')} références uniques · ${makers.size} fabricants`);

const html=read('public/index.html');
for(const anchor of ['view-dashboard','view-favorites','view-compare','view-exports','dashboardSearchInput','favoritesGrid','compareViewGrid'])assert(html.includes(anchor),`missing V11.22 UI anchor ${anchor}`);
const css=read('public/styles.css');
for(const cls of ['dashboard-hero','dashboard-category-grid','ecosystem-card','favorite-toggle','compare-view-table','exports-grid-v11'])assert(css.includes(cls),`missing V11.22 style ${cls}`);

assert(app.includes('catalanoClientGalleryPages'),'Catalano full client gallery pages missing');
assert(app.includes('catalanoGalleryComplete'),'Catalano gallery completeness tracking missing');
assert(app.includes('resolvedImages=(data.images||[])'),'mixed embedded/proxy Catalano image preservation missing');


const recorRows=json('public/catalog_recor.json');
const recorFeet=recorRows.filter(x=>x.collection==='Pieds Recor');
assert.equal(recorFeet.length,50,'Recor feet row count changed unexpectedly');
assert.equal(recorFeet.filter(x=>x.image).length,45,'Recor feet visual mapping count changed unexpectedly');
for(const f of ['aster.jpg','ball-claw.jpg','wood.jpg','imperial.jpg','lion.jpg','pedestal.jpg','princess.jpg','carlton.jpg']){
  assert(fs.existsSync(path.join(root,'public/assets/recor-feet',f)),`missing Recor visual ${f}`);
}
assert(app.includes('recorChoiceVisual'),'Recor visual chooser helper missing');
assert(css.includes('recor-choice-thumb'),'Recor visual chooser styles missing');

// V11.19 Recor HD regression guards
assert(server.includes('woocommerce-product-gallery official full image'),'Recor HD official gallery extraction missing');
assert(server.includes('Do not fall back to the Recor home page'),'Recor exact-page guard missing');
assert(app.includes('hydropolis-manufacturer-v119'),'Recor/manufacturer image cache was not invalidated for V11.19');
assert(app.includes('recorImageQualityVersion=2'),'Recor HD migration marker missing');
assert(app.includes('refreshLegacyRecorBathImages'),'Legacy Recor project auto-refresh missing');

assert(server.includes('pixelWidth') && server.includes('Math.max(w,h)>=800'),'Recor actual-pixel HD guard missing');

// V11.21 Coalbrook CDN delivery regression guards
assert(server.includes('coalbrook-bathrooms.transforms.svdcdn.com'),'Coalbrook image CDN allowlist missing');
assert(server.includes('coalbrook-bathrooms.files.svdcdn.com'),'Coalbrook files CDN allowlist missing');
assert(server.includes('isAllowedHydropolisRemoteHost(new URL(item.url||manufacturerUrl).hostname)'),'Manufacturer embed path is not using the central secure host allowlist');

// V11.20 Recor supplier-freight separation guards
assert(app.includes('function recorAutomaticSupplierShipping()'),'Recor automatic supplier shipping helper missing');
assert(app.includes('supplierShippingManual+recorSupplierShipping'),'Recor freight not aggregated into supplier shipping');
assert(app.includes('return articleMerchandisePrice(p);'),'Product list total still includes Recor freight');
assert(app.includes('Port fournisseur HT') && app.includes('dont port Recor automatique HT'),'Excel supplier shipping split missing');
assert(app.includes('clientFacingDesignation'),'Client-facing Recor designation cleanup missing');
assert(!app.includes('port obligatoire ${euro(row.freight)}'),'Quote designation still exposes product-level freight');
assert(html.includes('supplierShippingHint'),'Supplier shipping automatic Recor hint missing');

// V11.22 Recor protected technical PDF regression guards
assert(app.includes('pdfPageImageProxyUrl'),'Recor-aware PDF proxy URL helper missing');
assert(app.includes('productUrl') && app.includes('/api/pdf-page-image'),'Recor product-page session hint missing from PDF render requests');
assert(server.includes('fetchRecorProtectedPdf'),'Recor protected PDF fetch helper missing');
assert(server.includes('RECOR_BROWSER_UA'),'Recor browser session headers missing');
assert(server.includes('bufferStartsWithPdf'),'PDF signature validation missing');
assert(server.includes('Technical drawing URL from the live DOM') || server.includes('Technical drawing URL from the live DOM'.replace('URL','URL')),'Recor live drawing refresh guard missing');

// Ritmonio V11.23 regression guards
const ritmonioRows=json('public/catalog_ritmonio.json.gz');
assert.equal(ritmonioRows.length,16082,'Ritmonio unique catalog count changed unexpectedly');
assert(ritmonioRows.every(x=>x.purchaseDiscount===55),'Ritmonio 55% supplier discount missing');
assert(ritmonioRows.every(x=>/majoration Hydropolis \+5%/.test(x.source||'')),'Ritmonio +5% source marker missing');
assert(app.includes('finishSwatchBadgeHtml') && app.includes('features/${encodeURIComponent(code)}_body.jpg'),'Ritmonio finish swatch overlay missing');
assert(server.includes('ritmonio-official-product-image'),'Ritmonio official product-image priority missing');
assert(server.includes('ritmonio.it'),'Ritmonio secure remote host missing');
const lefroyRows=json('public/catalog_lefroy_brooks.json');
assert(lefroyRows.every(x=>x.purchaseDiscount===55),'Lefroy Brooks 55% supplier discount missing');

// V11.24/V11.25 finish swatches are embedded for GitHub-safe deployment
for(const code of ['CRL','IX','CRB','BLX','DOR','GOX','CHX','BRX','C03','C04','F31','F32','F33','F34','F36','F37','F45','F46']) assert(app.includes(`Ritmonio:${code}`),`missing embedded Ritmonio swatch ${code}`);
assert(app.includes('SUPPLIER_FINISH_SWATCH_DATA'),'embedded supplier swatch map missing');
assert(read('public/sw.js').includes('hydropolis-v11-40-shell'),'V11.40 SW cache missing');

// V11.25 Nicolazzi + Gessi
const nicolazziRows=json('public/catalog_nicolazzi.json.gz');
assert.equal(nicolazziRows.length,36303,'Nicolazzi catalog row count changed unexpectedly');
assert(nicolazziRows.every(x=>x.purchaseDiscount===50),'Nicolazzi 50% supplier discount missing');
assert(nicolazziRows.every(x=>/majoration Hydropolis \+25%/.test(x.source||'')),'Nicolazzi +25% source marker missing');
const gessiRows=json('public/catalog_gessi.json.gz');
assert.equal(gessiRows.length,16211,'Gessi catalog row count changed unexpectedly');
assert(gessiRows.every(x=>x.purchaseDiscount===50),'Gessi 50% supplier discount missing');
assert(gessiRows.every(x=>/majoration Hydropolis \+6%/.test(x.source||'')),'Gessi +6% source marker missing');
for(const code of ['CR','NL','OS','GO','NEM']) assert(app.includes(`Nicolazzi:${code}`),`missing embedded Nicolazzi swatch ${code}`);
for(const code of ['031','149','239','299','706','707','708','726','727']) assert(app.includes(`Gessi:${code}`),`missing embedded Gessi swatch ${code}`);
assert(app.includes('NICOLAZZI_FINISH_NAMES') && app.includes('GESSI_FINISH_NAMES'),'new supplier finish maps missing');
assert(server.includes('resolveNicolazziProductUrl') && server.includes('resolveGessiProductUrl'),'new supplier official-site resolvers missing');
assert(server.includes('gwebassets.gessi.com') && server.includes('nicolazzi.it'),'new supplier secure remote hosts missing');

assert(server.includes('zlib.gunzipSync'),'server gzip catalog loader missing');
assert(app.includes('new DecompressionStream("gzip")'),'browser gzip catalog loader missing');

// V11.26 Gessi regression guards
assert(server.includes('gessi-area-pro-finish-image'),'missing Gessi exact-finish image resolver');
assert(server.includes('gessistorage.blob.core.windows.net'),'missing Gessi image storage allowlist/resolver');
assert(server.includes('areapro.gessi.com'),'missing Gessi Area Pro resolver');
assert(!server.includes('source:/nicolazzi/i.test(manufacturerUrl)?"nicolazzi-official-og":"gessi-official-og"'),'Gessi must not fall back to corporate OG branding');

assert(app.includes('gessiDirectOfficialImage'),'missing client-side immediate Gessi image resolver');
assert(app.includes('hydropolis-gessi-image-fix-v126'),'stale Gessi cache migration missing');

// V11.27 automatic manufacturer imagery / performance guards
assert(app.includes('setupAutomaticCatalogImages'),'automatic catalog image hydrator missing');
assert(app.includes('IntersectionObserver'),'viewport image observer missing');
assert(app.includes('AUTO_PHOTO_CONCURRENCY=4'),'automatic image concurrency guard missing');
assert(app.includes('manufacturerSharedCacheKey'),'shared Nicolazzi/Ritmonio image cache missing');
assert(app.includes('enqueueSelectedImageSearch(item)'),'selected-product universal background enrichment missing');
assert(server.includes('brandPageInflight'),'manufacturer page request deduplication missing');
assert(server.includes('BRAND_PAGE_TTL=6*60*60*1000'),'manufacturer page cache TTL missing');
assert(server.includes('nicolazzi-official-product-gallery'),'Nicolazzi WooCommerce product image extraction missing');
assert(server.includes('nicolazziProductLinks'),'Nicolazzi exact product card resolver missing');


// V11.30 Hotbath/Zucchetti regression guards retained in V11.31
assert(app.includes('hydropolis-zucchetti-resolver-v129'),'Zucchetti stale image cache migration missing');
assert(server.includes('zCanonicalMatchesBase'),'Zucchetti canonical product identity check missing');
assert(server.includes('if(!pageMatchesSku || !baseMatch)return'),'Zucchetti generic image rejection missing');
assert(server.includes('String(x.source||"").startsWith("zucchetti-")'),'Zucchetti dedicated-candidate selection missing');
assert(!server.includes('!!zSkuFromUrl && zSkuFromUrl===zFullRef) ||'),'client-supplied Zucchetti sku must not certify page identity');
assert(server.includes('source:"zucchetti-reference-asset"'),'Zucchetti direct reference asset fast path missing');
assert(server.includes('https://assets.zucchettidesign.it/uploads/${encodeURIComponent(base.toUpperCase())}'),'Zucchetti reference-bearing CDN path missing');
assert(server.includes('Promise.any([verify("jpeg"),verify("jpg")])'),'Zucchetti fast extension race missing');
assert(server.includes('hotbathResultCache') && server.includes('hotbathResultInflight'),'Hotbath V11.30 server cache/deduplication missing');

// V11.31 Nicolazzi catalogue-PDF local architecture
assert(fs.existsSync(path.join(root,'public/nicolazzi_pdf_assets.json.gz')),'Nicolazzi PDF asset pack missing');
assert(app.includes('hydropolis-nicolazzi-pdf-v131'),'Nicolazzi V11.31 cache migration missing');
assert(app.includes('nicolazziLocalCatalogImage'),'Nicolazzi instant local catalogue visual helper missing');
assert(app.includes('/api/nicolazzi-pdf-asset?base='),'Nicolazzi local asset URL missing client-side');
assert(app.includes('Catalogue PDF Nicolazzi 2024'),'Nicolazzi PDF source badge missing');
assert(server.includes('NICOLAZZI_PDF_ASSET_FILE'),'Nicolazzi PDF asset loader missing');
assert(server.includes('app.get("/api/nicolazzi-pdf-asset"'),'Nicolazzi local asset endpoint missing');
assert(server.includes('source:"nicolazzi-pdf-catalog"'),'Nicolazzi PDF-first server result missing');
assert(server.includes("Aucune photo commerciale Designer Tapware Co n'a été trouvée avec une correspondance de modèle sûre") || server.includes('aucune image web ambiguë'),'Nicolazzi safe visual fallback guard missing');


// V11.32 Nicolazzi commercial visual bridge
assert(app.includes('hydropolis-nicolazzi-designer-v132'),'Nicolazzi V11.32 cache migration missing');
assert(app.includes('nicolazziVisualOptionsHtml'),'Nicolazzi handle/finish visual strip missing');
assert(server.includes('NICOLAZZI_DESIGNER_BASE'),'Designer Tapware Nicolazzi bridge missing');
assert(server.includes('designertapwareco.com.au') && server.includes('cdn.shopify.com'),'Designer Tapware/Shopify remote allowlist missing');
assert(server.includes('resolveDesignerTapwareNicolazzi'),'Nicolazzi Designer Tapware resolver missing');
assert(server.includes('parseDesignerTapwareProductPayload'),'Nicolazzi Shopify product parser missing');
assert(server.includes('designer-tapware-nicolazzi'),'Nicolazzi commercial photo source marker missing');
assert(server.includes('Drawing technique · catalogue Nicolazzi 2024'),'Official PDF drawing retention missing');


// V11.33 Recor compact project configuration
assert(app.includes('function isRecorBathLinkedAccessory'),'Recor linked-accessory helper missing');
assert(app.includes('Configuration Recor ✓'),'Recor validated compact summary missing');
assert(app.includes('edit-recor-config'),'Recor configuration edit action missing');
assert(app.includes('!isRecorBathLinkedAccessory(p)'),'Recor linked feet/waste must be hidden as standalone room products');
assert(app.includes('[Recor configurator update]'),'Recor in-place configuration update missing');


// V11.34 Ritmonio official technical-sheet resolver
assert(server.includes('function ritmonioOfficialDownloads'),'Ritmonio document parser missing');
assert(server.includes('ritmonio-scheda-tecnica'),'Ritmonio Scheda tecnica source missing');
assert(server.includes('istruzioni di montaggio'),'Ritmonio installation-instructions parser missing');
assert(app.includes('hydropolis-ritmonio-docs-v134'),'Ritmonio stale document cache migration missing');
assert(app.includes('refreshLegacyRitmonioTechnicalSheets'),'Ritmonio legacy technical-sheet refresh missing');

// V11.35 Ritmonio exact resolver + Scheda tecnica UI
assert(server.includes('function ritmonioArticleCodeFromUrl'),'Ritmonio exact URL-code parser missing');
assert(app.includes('Inclure la Scheda tecnica'),'Ritmonio Scheda tecnica inclusion label missing');
assert(app.includes('ritmonio-tech-refresh'),'Ritmonio explicit document recovery action missing');

// V11.36 dedicated Ritmonio docs resolver
assert(server.includes('async function resolveRitmonioDocuments'),'Ritmonio dedicated docs resolver missing');
assert(server.includes('/api/ritmonio-docs'),'Ritmonio docs API missing');
assert(server.includes('/it/ricerca/?code=${encodeURIComponent(base)}'),'Ritmonio exact official search must be primary');
assert(app.includes('async function fetchRitmonioDocuments'),'Ritmonio client docs fetch missing');
assert(app.includes('Réessayer la Scheda tecnica'),'Ritmonio visible retry state missing');

// V11.37 Ritmonio <br> label parsing
assert(server.includes("replace(/<br\\s*\\/?>/gi,\" \")"),'Ritmonio BR separator normalization missing');
assert(server.includes('/\\bschedatecnica\\b/.test(label)'),'Ritmonio concatenated Scheda label fallback missing');
