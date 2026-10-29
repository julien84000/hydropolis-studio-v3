"""Rebuild verified Program prices and tariff pictograms from the supplied FR PDF."""
import sys, re, json, base64, hashlib
from pathlib import Path
import fitz
pdf=Path(sys.argv[1]);doc=fitz.open(pdf)
text=doc[42].get_text();lines=[s.strip() for s in text.splitlines()]
options={}
for i,s in enumerate(lines):
 if re.fullmatch(r'OPWB\d{4}',s):
  val=lines[i+1];options[s]={'reference':s,'label':lines[i-1],'rawPrice':0 if val=='Incl' else None if '%' in val else int(val.replace('.',''))}
# Fixed matrix order is checked against the reference and amount on every row.
lengths=[[60,81],[82,101],[102,121],[122,141],[142,161],[162,181],[182,201]]
rows=[]
for h,start in [([1.2,1.2],1),([3,10],41),([11,20],81),([21,40],121)]:
 for depth,offset in [([40,50],0),([51,60],10)]:
  for j,length in enumerate(lengths):
   ref='WPRC'+str(start+offset+j).zfill(4);i=lines.index(ref)
   assert lines[i-2]==str(length[0])+'-'+str(length[1])
   rows.append({'reference':ref,'height':h,'depth':depth,'length':length,'rawPrice':int(lines[i+1].replace('.',''))})
# Basin geometries on the illustrated page are authoritative for external dimensions.
geo={}
for m in re.finditer(r'S(\d+)\s*\|\s*([^\n]+)',doc[40].get_text()):
 desc=m[2].strip();nums=[float(x.replace(',','.')) for x in re.findall(r'\d+(?:[.,]\d+)?',desc)]
 if len(nums)>=2:
  parts=re.split(r'\s*x\s*',desc.replace('Ø',''))
  dims=[max(float(n.replace(',','.')) for n in re.findall(r'\d+(?:[.,]\d+)?',a)) for a in parts]
  if len(dims)==2:dims=[dims[0],dims[0],dims[1]]
  geo['S'+str(int(m[1]))]={'dimensionsLabel':desc.replace('*',''),'depth':dims[0],'length':dims[1],'height':dims[2]}
basins=[]
for o in options.values():
 m=re.match(r'Vasque Program S0*(\d+) (.+)',o['label'])
 if m:
  key='S'+str(int(m[1]));assert key in geo,key
  basins.append(dict(o,id=key,**geo[key]))
for key in ['S43','S44']:
 basins.append({'id':key,'reference':'','label':key+' City '+('14' if key=='S43' else '10'),'rawPrice':0,**geo[key]})
# Render exact supplied PDF regions; no regenerated or guessed geometry.
pics={}
def crop(key,page,box):
 pix=doc[page].get_pixmap(matrix=fitz.Matrix(2,2),clip=fitz.Rect(*box),alpha=False)
 pics[key]='data:image/png;base64,'+base64.b64encode(pix.tobytes('png')).decode()
for key,box in {'city10':(55,84,221,126),'city14':(399,84,565,126),'cityplus':(55,200,222,242),'cityplusL':(226,200,393,242),'cityplusR':(399,200,565,242),'rectangular':(56,314,134,357),'titan':(227,314,306,357),'lineL':(226,417,392,460),'lineR':(398,417,564,460),'oval':(56,513,134,556),'coliso10':(226,513,307,556),'coliso14':(312,513,394,556),'beta':(484,513,564,556),'arco':(56,629,135,671),'esfera':(226,629,305,671),'circular':(398,629,479,671)}.items():crop(key,40,box)
for b in basins:
 n=int(b['id'][1:]);b['picture']='cityplusL' if n in [51,53,55,57,59] else 'cityplusR' if n in [52,54,56,58,60] else 'cityplus' if 45<=n<=50 else 'city10' if n in [31,32,33,34,35,44] else 'city14' if n in [7,8,9,24,30,43] else 'rectangular' if n in [1,2,3,23] else 'titan' if n>=61 else 'lineL' if n in [10,12] else 'lineR' if n in [11,13] else 'oval' if n==14 else 'coliso10' if n in [36,37,38] else 'coliso14' if n in [15,16,25] else 'beta' if n in [18,19] else 'arco' if n in [21,22] else 'esfera' if n==20 else 'circular'
for key,box in {'flat':(695,126,737,153),'apron':(695,169,737,197),'high':(695,210,737,239),'full':(695,252,737,285),'curveL':(765,324,810,340),'curveR':(765,345,810,360),'curveLR':(765,365,810,381)}.items():crop(key,40,box)
for key,box in {'rectangle':(695,125,823,215),'square':(1015,125,1135,215),'angular':(695,306,795,390),'angularR':(838,306,955,390),'angularL':(1015,306,1140,390),'pentagonal':(695,486,795,570),'pentagonalR':(838,486,955,570),'pentagonalL':(1015,486,1140,570)}.items():crop('neo-'+key,9,box)
data={'source':pdf.name,'sha256':hashlib.sha256(pdf.read_bytes()).hexdigest(),'printedPages':[76,77,78,79,80,81,82,83],'rows':rows,'basins':basins,'options':options}
Path('public/hidrobox-program-data.js').write_text('window.HydroProgramData='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
Path('public/hidrobox-tariff-pictures.js').write_text('window.HydroTariffPictures='+json.dumps(pics,separators=(',',':'))+';\n')
Path('tests/fixtures/hidrobox/program-source.txt').write_text('\n\n'.join(doc[i].get_text() for i in [39,40,41,42]))
print(len(rows),'plan tiers,',len(basins),'basins,',len(options),'coded options,',len(pics),'PDF crops')
