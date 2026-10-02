from pathlib import Path
import gzip,json,re,collections

with gzip.open('public/catalog_gessi.json.gz','rt',encoding='utf-8') as f:
    items=json.load(f)

def text(p):
    return ' '.join(str(p.get(k) or '') for k in ('designation','originalDescription','collection')).lower()

def bases(rows):
    out={}
    for p in rows:
        b=str(p.get('base') or str(p.get('reference') or '').split('#')[0]).strip()
        if not b: continue
        if b not in out:
            out[b]={
              'base':b,'reference':p.get('reference'),'category':p.get('category'),
              'collection':p.get('collection'),'designation':p.get('designation'),
              'originalDescription':p.get('originalDescription'),
              'finishCount':0
            }
        out[b]['finishCount']+=1
    return list(out.values())

rules={
 'Lavabo': re.compile(r'\b(lavabo|basin|washbasin|wash basin)\b',re.I),
 'Bain': re.compile(r'\b(baignoire|bath(?:tub)?|vasca)\b',re.I),
 'Bidet': re.compile(r'\bbidet\b',re.I),
 'Cuisine': re.compile(r'\b(cuisine|kitchen|sink|evier|évier)\b',re.I),
 'Douche': re.compile(r'\b(douche|shower|doccia)\b',re.I),
}

mismatch={}
for target,rx in rules.items():
    rows=[p for p in items if rx.search(text(p)) and p.get('category')!=target]
    mismatch[target]={
      'variantCount':len(rows),
      'baseCount':len(bases(rows)),
      'currentCategories':collections.Counter(str(p.get('category') or '') for p in rows).most_common(),
      'samples':bases(rows)[:80]
    }

anello=[p for p in items if str(p.get('collection') or '').strip()=='Anello']
anello_bases=bases(anello)
report={
  'count':len(items),
  'anelloVariantCount':len(anello),
  'anelloBaseCount':len(anello_bases),
  'anelloCategoryCounts':collections.Counter(str(p.get('category') or '') for p in anello).most_common(),
  'anelloBases':anello_bases,
  'reference63302':[p for p in anello_bases if p['base']=='63302'],
  'mismatch':mismatch
}
Path('docs/gessi-mismatch-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
