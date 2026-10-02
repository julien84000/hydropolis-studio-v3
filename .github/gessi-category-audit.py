from pathlib import Path
import gzip,json,collections
p=Path('public/catalog_gessi.json.gz')
with gzip.open(p,'rt',encoding='utf-8') as f: root=json.load(f)
if isinstance(root,list): items=root; root_type='list'; root_keys=[]
elif isinstance(root,dict):
    root_type='dict'; root_keys=list(root.keys())
    items=[]
    for k in ('products','items','catalog','data'):
        if isinstance(root.get(k),list): items=root[k]; break
    if not items:
        lists=[v for v in root.values() if isinstance(v,list)]
        items=max(lists,key=len) if lists else []
else: items=[]; root_type=type(root).__name__; root_keys=[]

def val(x,k):
    v=x.get(k) if isinstance(x,dict) else None
    return str(v).strip() if v is not None else ''
keys=sorted({k for x in items[:500] if isinstance(x,dict) for k in x.keys()})
fields=['category','collection','subcategory','family','type','productType','universe','series','designation','reference']
counts={f:collections.Counter(val(x,f) for x in items if val(x,f)) for f in fields}
collection_categories=collections.defaultdict(collections.Counter)
for x in items:
    c=val(x,'collection') or '(sans collection)'
    cat=val(x,'category') or '(sans catégorie)'
    collection_categories[c][cat]+=1
report={
  'rootType':root_type,'rootKeys':root_keys,'count':len(items),'itemKeys':keys,
  'fieldDistinct':{f:len(counts[f]) for f in fields},
  'fieldTop':{f:counts[f].most_common(100) for f in fields},
  'collectionCategories':{c:cnt.most_common() for c,cnt in sorted(collection_categories.items())},
  'samples':items[:12]
}
Path('docs/gessi-category-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
