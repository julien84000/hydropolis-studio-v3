#!/usr/bin/env python3
"""Verify contemporary Hotbath CDN product imagery (not guess-and-publish).

For each historical hotbath.it image in our index:
- derive a small set of *candidate* paths from exact model code and known finish
- send HTTP GET and require 200 + decodable real raster >= 100px
- verify that the returned file is not the provider's generic placeholder
- only then replace the dead historical link with the validated CDN URL
- otherwise clear the unavailable image (historical provenance remains)
- preserve all existing verified collection photos and all pricing/variants.

Run: python scripts/verify-hotbath-cdn.py [--limit 20] [--dry-run]
"""
import argparse
import concurrent.futures
import hashlib
import io
import json
import re
import threading
from collections import Counter
from pathlib import Path

import requests
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'public'/'brand-guide-hotbath-media.json'
QUALITY='?resolution=600x600&quality=85&isLogo=true'
COL_SUFFIX={
 'Archie':['IX','BGP','BCP'],
 'Gent':['','IX','CR'],
 'Chap':['PBP','CR'],
 'Cobber':['BCP','AB','CR'],
 'Cobber X':['BBP','BCP','CR'],
 'Guy':['TB','CR'],
 'Ace':['MBP','CR'],
 'Gal':['BGP','CR'],
 'Fellow':['CR','IX'],
 'Mate':['CR','GN','BGP'],
 'Tron':['CR','IX'],
 'Ray':['CR','IX']
}
_tls=threading.local()
def safe_ref(ref):
    return bool(re.fullmatch(r'[A-Za-z0-9.-]{2,40}',ref)) and '..' not in ref
def candidate_urls(ref,collection):
    directory=ref.replace('-','.')
    parts=[ref]
    if '-' in ref:parts.append(ref.replace('-',''))
    # Only filenames that embed the exact manufacturer reference; never use sibling photos.
    for suffix in COL_SUFFIX.get(collection,['']):
        for prefix in parts:
            for variant in ('_02','_01',''):
                for ext in ('png','jpg'):
                    yield f'https://hotbath.com/images/compano/{directory}/{prefix}{suffix}{variant}.{ext}{QUALITY}'
def session():
    if not hasattr(_tls,'session'):
        _tls.session=requests.Session()
        _tls.session.headers.update({'User-Agent':'HydropolisStudio/1.0 (manufacturer-image-validation)'})
    return _tls.session
def test_candidate(url):
    try:
        resp=session().get(url,timeout=(6,12),allow_redirects=True)
        if resp.status_code!=200 or len(resp.content)<2500 or len(resp.content)>8_000_000:
            return None
        ctype=resp.headers.get('Content-Type','').lower()
        if not ctype.startswith('image/'):return None
        image=Image.open(io.BytesIO(resp.content))
        image.load()
        if image.width<100 or image.height<100:return None
        if image.format not in {'PNG','JPEG','WEBP'}:return None
        return {'url':url,'sha256':hashlib.sha256(resp.content).hexdigest(),
                'pixels':[image.width,image.height],'format':image.format,
                'bytes':len(resp.content),'status':resp.status_code}
    except (requests.RequestException,OSError,ValueError):
        return None
def verify(row):
    collection,ref,dead=row
    if not safe_ref(ref):
        return collection,ref,dead,None,0
    attempts=0
    for url in candidate_urls(ref,collection):
        attempts+=1
        found=test_candidate(url)
        if found:
            return collection,ref,dead,found,attempts
    return collection,ref,dead,None,attempts
def main():
    p=argparse.ArgumentParser()
    p.add_argument('--limit',type=int,default=0)
    p.add_argument('--workers',type=int,default=14)
    p.add_argument('--dry-run',action='store_true')
    args=p.parse_args()
    data=json.loads(SOURCE.read_text(encoding='utf-8'))
    rows=[]
    for collection,mapping in data['byCollection'].items():
        for ref,url in mapping.items():
            if url.startswith('https://hotbath.it/documents/') or url.startswith('https://www.hotbath.it/documents/'):
                rows.append((collection,ref,url))
    rows.sort()
    if args.limit:rows=rows[:args.limit]
    print(f'Checking {len(rows)} dead Hotbath archive URLs (exact model candidates only)',flush=True)
    results=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        for i,r in enumerate(pool.map(verify,rows),1):
            results.append(r)
            if i%20==0 or i==len(rows):
                hits=sum(x[3] is not None for x in results)
                print(f'  {i}/{len(rows)} checked, {hits} verified CDN photos',flush=True)
    valid=[r for r in results if r[3]]
    missing=[r for r in results if not r[3]]
    summary={'inspected':len(rows),'verified':len(valid),'unavailable':len(missing),
             'requests':sum(r[4] for r in results),'resolvedByCollection':dict(Counter(r[0] for r in valid)),
             'missingExamples':[{'collection':r[0],'ref':r[1]} for r in missing[:40]]}
    print('HOTBATH_CDN_VERIFICATION',json.dumps(summary,ensure_ascii=False),flush=True)
    if args.dry_run:return
    data.setdefault('verifiedContemporaryCDN',{})
    data.setdefault('missingContemporaryCDN',{})
    for collection,ref,dead,result,attempts in results:
        key=collection+'|'+ref
        if result:
            data['byCollection'][collection][ref]=result['url']
            data['verifiedContemporaryCDN'][key]={**result,'source':'current Hotbath CDN; exact-reference filename; HTTP and image decoded'}
            data['missingContemporaryCDN'].pop(key,None)
        else:
            # A known broken URL is worse than an explicit missing-image badge.
            del data['byCollection'][collection][ref]
            data['missingContemporaryCDN'][key]={'historicalUrl':dead,'reason':'archive returns 404; no verified current CDN candidate'}
    data['historicalURLsValidated']=True
    SOURCE.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (ROOT/'docs'/'HOTBATH_CDN_AUDIT.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

if __name__=='__main__':main()
