from pathlib import Path
import gzip,json,re,unicodedata

CATALOG=Path('public/catalog_gessi.json.gz')
with gzip.open(CATALOG,'rt',encoding='utf-8') as f:
    rows=json.load(f)
if not isinstance(rows,list) or len(rows)!=16211:
    raise SystemExit(f'Unexpected Gessi catalogue size: {len(rows) if isinstance(rows,list) else type(rows)}')

identity_before=[(p.get('reference'),p.get('finish'),p.get('finishCode'),p.get('price'),p.get('totalPrice'),p.get('manufacturerUrl'),p.get('image')) for p in rows]

def n(v):
    s=unicodedata.normalize('NFD',str(v or '')).encode('ascii','ignore').decode('ascii').lower()
    return re.sub(r'\s+',' ',s)

def text(p):
    return n(f"{p.get('originalDescription','')} {p.get('designation','')}")

def any_rx(t,patterns):
    return any(re.search(rx,t,re.I) for rx in patterns)

FUNCTION_PATTERNS={
 'Lavabo':[
   r'\b(?:miscelatore|mezclador|mitigeur|melangeur)\b[^.;]{0,90}\blavabo\b',
   r'\b(?:basin|washbasin|wash basin)\b[^.;]{0,70}\b(?:mixer|spout|tap)\b',
   r'\b(?:bocca|bec|cano|spout)\b[^.;]{0,70}\b(?:lavabo|basin|washbasin)\b',
   r'\b(?:lavabo|basin|washbasin)\b[^.;]{0,70}\b(?:mixer|spout|tap|mitigeur|miscelatore|mezclador)\b'
 ],
 'Bidet':[
   r'\b(?:miscelatore|mezclador|mitigeur|melangeur)\b[^.;]{0,90}\bbidet\b',
   r'\bbidet\b[^.;]{0,70}\b(?:mixer|tap|mitigeur|miscelatore|mezclador)\b'
 ],
 'Cuisine':[
   r'\b(?:miscelatore|mezclador|mitigeur|melangeur|rubinetto|tap)\b[^.;]{0,90}\b(?:cucina|cuisine|kitchen|sink|evier)\b',
   r'\b(?:kitchen|sink|cuisine|evier)\b[^.;]{0,70}\b(?:mixer|tap|mitigeur|miscelatore|mezclador)\b'
 ],
 'Bain':[
   r'\b(?:miscelatore|mezclador|mitigeur|melangeur)\b[^.;]{0,90}\b(?:vasca|baignoire|banera|bath)\b',
   r'\b(?:bocca|bec|cano|spout)\b[^.;]{0,70}\b(?:vasca|baignoire|banera|bath)\b',
   r'\b(?:bath|baignoire|vasca|banera)\b[^.;]{0,70}\b(?:mixer|spout|tap|mitigeur|miscelatore|mezclador)\b'
 ],
 'Douche':[
   r'\b(?:miscelatore|mezclador|mitigeur|melangeur)\b[^.;]{0,90}\b(?:doccia|douche|shower)\b',
   r'\b(?:doccia|douche|shower)\b[^.;]{0,70}\b(?:mixer|tap|mitigeur|miscelatore|mezclador)\b',
   r'\b(?:soffione|headshower|showerhead|pomme de douche|doccetta|handshower|douchette)\b'
 ]
}

def functional_category(p):
    current=str(p.get('category') or '').strip()
    if current!='Accessoires':
        return current
    t=text(p)
    # Accessory words alone never move a line. Reclassification requires one of the
    # explicit functional-product patterns above (mixer, spout, shower head, etc.).
    for cat in ('Cuisine','Bidet','Lavabo','Bain','Douche'):
        if any_rx(t,FUNCTION_PATTERNS[cat]):
            return cat
    return current

def product_type(p,category):
    t=text(p)
    built=any(x in t for x in ('partie encastree','built-in part','parte incasso','corps encastre'))
    external=any(x in t for x in ('partie apparente','external part','external parts','parte esterna','partie externe'))
    wall=any(x in t for x in (' mural','wall-mounted','a parete','de pared'))
    high=any(x in t for x in (' rehausse',' haut ',' high version',' alto '))
    thermostatic=any(x in t for x in ('thermostat','termostat'))
    mixer=any(x in t for x in ('mitigeur','melangeur','mixer','miscelatore','mezclador'))
    spout=any(x in t for x in ('bec ','bocca ',' spout','cano ','caño '))

    if category=='Lavabo':
        if built:return "Corps d’encastrement lavabo"
        if external:return "Partie apparente lavabo"
        if spout and wall:return "Bec lavabo mural"
        if spout and ('plafond' in t or 'ceiling' in t or 'soffitto' in t):return "Bec lavabo plafond"
        if spout:return "Bec lavabo"
        if mixer and high:return "Mitigeur lavabo haut"
        if mixer and wall:return "Mitigeur lavabo mural"
        if mixer:return "Mitigeur lavabo"
        return "Élément lavabo"
    if category=='Bain':
        if built:return "Corps d’encastrement bain"
        if external:return "Partie apparente bain"
        if spout:return "Bec baignoire"
        if thermostatic and mixer:return "Mitigeur thermostatique bain"
        if mixer:return "Mitigeur baignoire"
        return "Élément bain"
    if category=='Douche':
        if any(x in t for x in ('soffione','headshower','showerhead','pomme de douche')):return "Pomme de douche"
        if any(x in t for x in ('doccetta','handshower','douchette')):return "Douchette"
        if any(x in t for x in ('bras de douche','shower arm','braccio doccia')):return "Bras de douche"
        if built:return "Corps d’encastrement douche"
        if external and thermostatic:return "Partie apparente thermostatique douche"
        if external:return "Partie apparente douche"
        if thermostatic and mixer:return "Mitigeur thermostatique douche"
        if mixer:return "Mitigeur douche"
        if any(x in t for x in ('inverseur','diverter','deviatore')):return "Inverseur"
        return "Élément douche"
    if category=='Bidet':
        if built:return "Corps d’encastrement bidet"
        if external:return "Partie apparente bidet"
        if mixer:return "Mitigeur bidet"
        return "Élément bidet"
    if category=='Cuisine':
        if built:return "Corps d’encastrement cuisine"
        if external:return "Partie apparente cuisine"
        if mixer:return "Mitigeur cuisine"
        if spout:return "Bec cuisine"
        return "Élément cuisine"

    if any(x in t for x in ('sifone','siphon','syphon','bottle trap')):return "Siphon"
    if any(x in t for x in ('bonde','waste','scarico','piletta')):return "Bonde / vidage"
    if any(x in t for x in ('porte-serviette','porte serviette','towel rail','towel holder')):return "Porte-serviettes"
    if any(x in t for x in ('distributeur de savon','soap dispenser','portasapone')):return "Accessoire savon"
    if any(x in t for x in ('etagere','shelf','mensola')):return "Étagère"
    if any(x in t for x in ('patere','robe hook','hook')):return "Patère"
    if any(x in t for x in ('porte-papier','toilet roll','paper holder')):return "Porte-papier"
    if any(x in t for x in ('brosse wc','toilet brush','scopino')):return "Brosse WC"
    return "Accessoire"

changed=0
transitions={}
for p in rows:
    old=str(p.get('category') or '').strip()
    new=functional_category(p)
    if new!=old:
        p['category']=new
        transitions[f'{old}->{new}']=transitions.get(f'{old}->{new}',0)+1
        changed+=1
    p['productType']=product_type(p,new)

identity_after=[(p.get('reference'),p.get('finish'),p.get('finishCode'),p.get('price'),p.get('totalPrice'),p.get('manufacturerUrl'),p.get('image')) for p in rows]
if identity_before!=identity_after:
    raise SystemExit('Gessi commercial/media identity changed unexpectedly')
if len(rows)!=16211:
    raise SystemExit('Gessi count changed')
if any(k.split('->')[0] != 'Accessoires' for k in transitions):
    raise SystemExit(f'Unexpected category transition: {transitions}')
if not all(str(p.get('productType') or '').strip() for p in rows):
    raise SystemExit('Some Gessi rows have no productType')
anello_lavabo=[p for p in rows if p.get('collection')=='Anello' and p.get('category')=='Lavabo']
if not anello_lavabo:
    raise SystemExit('Anello still has no Lavabo category')
base63361=[p for p in rows if str(p.get('base') or '')=='63361']
if not base63361 or any(p.get('category')!='Lavabo' for p in base63361):
    raise SystemExit('Anello 63361 was not normalized to Lavabo')

with gzip.GzipFile(filename=str(CATALOG),mode='wb',mtime=0) as gz:
    gz.write(json.dumps(rows,ensure_ascii=False,separators=(',',':')).encode('utf-8'))
print(json.dumps({'count':len(rows),'changedCategories':changed,'transitions':transitions,'anelloLavaboVariants':len(anello_lavabo)},ensure_ascii=False))

# UI: add Type between functional category and finish.
index_path=Path('public/index.html')
index=index_path.read_text(encoding='utf-8')
needle='''      <select id="categoryFilter"><option value="">Toutes catégories</option></select>\n      <select id="finishFilter"><option value="">Toutes finitions</option></select>'''
replacement='''      <select id="categoryFilter"><option value="">Toutes catégories</option></select>\n      <select id="typeFilter"><option value="">Tous types</option></select>\n      <select id="finishFilter"><option value="">Toutes finitions</option></select>'''
if needle in index:index=index.replace(needle,replacement,1)
elif 'id="typeFilter"' not in index:raise SystemExit('Catalog filter markup not found')
index_path.write_text(index,encoding='utf-8')

app_path=Path('public/app.js')
app=app_path.read_text(encoding='utf-8')

# Add productType as a real filter scope.
app=app.replace('function catalogueRowsForFilters({manufacturer="",collection="",category=""}={}){','function catalogueRowsForFilters({manufacturer="",collection="",category="",productType=""}={}){',1)
app=app.replace('''    if(category && p.category!==category)return false;\n    return true;''','''    if(category && p.category!==category)return false;\n    if(productType && p.productType!==productType)return false;\n    return true;''',1)

m=re.search(r'function updateDependentFilters\(resetCollection=false,resetCategory=false,resetFinish=false\)\{.*?\n\}\nfunction initFilters',app,re.S)
if not m:raise SystemExit('updateDependentFilters block not found')
new_filters='''function updateDependentFilters(resetCollection=false,resetCategory=false,resetFinish=false){\n  const manufacturer=$("#manufacturerFilter")?.value||"";\n  fillSelect("collectionFilter",filterValues("collection",{manufacturer}),!resetCollection);\n  const collection=$("#collectionFilter")?.value||"";\n  fillSelect("categoryFilter",filterValues("category",{manufacturer,collection}),!resetCategory);\n  const category=$("#categoryFilter")?.value||"";\n  const typeValues=filterValues("productType",{manufacturer,collection,category});\n  fillSelect("typeFilter",typeValues,!resetFinish);\n  const typeEl=$("#typeFilter");\n  if(typeEl)typeEl.disabled=!typeValues.length;\n  const productType=typeEl?.value||"";\n  fillSelect("finishFilter",filterValues("finish",{manufacturer,collection,category,productType}),!resetFinish);\n}\nfunction initFilters'''
app=app[:m.start()]+new_filters+app[m.end():]

app=app.replace('text=[p.reference,p.base,p.designation,p.collection,p.manufacturer,p.finish,p.category,p.originalDescription,p.marketingDescription]','text=[p.reference,p.base,p.designation,p.collection,p.manufacturer,p.finish,p.category,p.productType,p.originalDescription,p.marketingDescription]',1)
app=app.replace('const fs={manufacturer:$("#manufacturerFilter")?.value||"",collection:$("#collectionFilter")?.value||"",category:$("#categoryFilter")?.value||"",finish:$("#finishFilter")?.value||""};','const fs={manufacturer:$("#manufacturerFilter")?.value||"",collection:$("#collectionFilter")?.value||"",category:$("#categoryFilter")?.value||"",productType:$("#typeFilter")?.value||"",finish:$("#finishFilter")?.value||""};',1)
app=app.replace('return JSON.stringify({q:$("#searchInput")?.value||"",manufacturer:$("#manufacturerFilter")?.value||"",collection:$("#collectionFilter")?.value||"",category:$("#categoryFilter")?.value||"",finish:$("#finishFilter")?.value||""});','return JSON.stringify({q:$("#searchInput")?.value||"",manufacturer:$("#manufacturerFilter")?.value||"",collection:$("#collectionFilter")?.value||"",category:$("#categoryFilter")?.value||"",productType:$("#typeFilter")?.value||"",finish:$("#finishFilter")?.value||""});',1)
app=app.replace('!filters.q.trim() && !filters.manufacturer && !filters.collection && !filters.category && !filters.finish','!filters.q.trim() && !filters.manufacturer && !filters.collection && !filters.category && !filters.productType && !filters.finish',1)
app=app.replace('["manufacturerFilter","collectionFilter","categoryFilter","finishFilter"]','["manufacturerFilter","collectionFilter","categoryFilter","typeFilter","finishFilter"]',1)

category_handler='''$("#categoryFilter").addEventListener("change",()=>{\n  $("#searchInput").value="";\n  $("#finishFilter").value="";\n  updateDependentFilters(false,false,true);\n  renderCatalog();\n});'''
if category_handler not in app:raise SystemExit('category filter handler not found')
type_handler=category_handler+'''\n$("#typeFilter").addEventListener("change",()=>{\n  $("#searchInput").value="";\n  $("#finishFilter").value="";\n  const manufacturer=$("#manufacturerFilter")?.value||"";\n  const collection=$("#collectionFilter")?.value||"";\n  const category=$("#categoryFilter")?.value||"";\n  const productType=$("#typeFilter")?.value||"";\n  fillSelect("finishFilter",filterValues("finish",{manufacturer,collection,category,productType}),false);\n  renderCatalog();\n});'''
app=app.replace(category_handler,type_handler,1)
app_path.write_text(app,encoding='utf-8')

css_path=Path('public/styles.css')
css=css_path.read_text(encoding='utf-8')
if '/* V11.57_GESSI_TYPE_FILTER */' not in css:
    css+='''\n\n/* V11.57_GESSI_TYPE_FILTER */\n.v11-filters{grid-template-columns:repeat(5,minmax(0,1fr))}\n@media(max-width:1000px){.v11-filters{grid-template-columns:repeat(2,minmax(0,1fr))}}\n@media(max-width:620px){.v11-filters{grid-template-columns:1fr}}\n'''
css_path.write_text(css,encoding='utf-8')

# Permanent regression coverage.
test_path=Path('tests/v11.57-regression.test.js')
tests=test_path.read_text(encoding='utf-8')
if "const zlib=require('zlib');" not in tests:
    tests=tests.replace("const path=require('path');","const path=require('path');\nconst zlib=require('zlib');",1)
if "const gessiCatalog=" not in tests:
    tests=tests.replace("const appSource=fs.readFileSync(path.join(__dirname,'..','public','app.js'),'utf8');","const appSource=fs.readFileSync(path.join(__dirname,'..','public','app.js'),'utf8');\nconst indexSource=fs.readFileSync(path.join(__dirname,'..','public','index.html'),'utf8');\nconst gessiCatalog=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname,'..','public','catalog_gessi.json.gz'))));",1)
if "Gessi functional hierarchy preserves the 16,211 tariff variants" not in tests:
    tests+='''\n\ntest('Gessi functional hierarchy preserves the 16,211 tariff variants',()=>{\n  assert.equal(gessiCatalog.length,16211);\n  assert.ok(gessiCatalog.every(p=>p.reference&&p.finish&&p.productType),'every Gessi tariff variant must retain a reference/finish and expose a type');\n  const anelloLavabo=gessiCatalog.filter(p=>p.collection==='Anello'&&p.category==='Lavabo');\n  assert.ok(anelloLavabo.length>0,'Anello must expose its lavabo family');\n  const anello63361=gessiCatalog.filter(p=>String(p.base||'')==='63361');\n  assert.ok(anello63361.length>0&&anello63361.every(p=>p.category==='Lavabo'),'Anello 63361 must be classified as Lavabo');\n  assert.match(indexSource,/id="typeFilter"/,'catalog UI must expose the Type level');\n  assert.match(appSource,/productType:\$\("#typeFilter"\)/,'renderCatalog must filter on productType');\n  assert.match(appSource,/filterValues\("productType"/,'dependent filters must derive types from the selected collection/category');\n});\n'''
test_path.write_text(tests,encoding='utf-8')
