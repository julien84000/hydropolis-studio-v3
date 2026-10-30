"""Extract original manufacturer photographs for the client dossier only.
No upscaling, cropping or replacement of configurator composition images.
"""
import hashlib,json,sys,io
from PIL import Image
from pathlib import Path
import fitz
ROOT=Path(__file__).resolve().parents[1]
SOURCE='https://www.sbordoniceramica.com/download/Cat_SBORDONI.pdf'
SHA='d0eb7aac8feb11888f3c50d78d580d3508dbd3d9f1dcbefc795d31c71d95645f'
# composition, photo page, xref, caption page, exact caption, visible finish/accessories
ROWS=[
 ('9090-N9090',21,3726,21,'9090+N9090NIO+DN1PNIO','Blanc, structure nickel mat ; accessoires illustrés'),
 ('9020-high',27,3699,27,'9020+9028+TB01NI+MC01NI+ST01NI','Blanc, réservoir haut, accessoires nickel'),
 ('7200-G720',32,3635,33,'7200+G720','Blanc, pieds céramiques ; robinetterie dorée illustrée'),
 ('7200-P7200',35,3625,35,'7200+P7200OL','Blanc, structure or light'),
 ('7100-7001',36,3621,36,'7100+7001','Blanc, colonne céramique ; robinetterie dorée illustrée'),
 ('7070-7070M',45,3585,45,'7070+7070M','Blanc, consoles céramiques ; porte-serviettes et robinetterie illustrés'),
 ('7020-high',48,3573,48,'7020+S030OL','Blanc, réservoir haut et abattant bois, accessoires dorés'),
 ('7020-low',51,3561,51,'7020+7029+MC060OL+S030OL','Blanc, réservoir bas et abattant bois, accessoires dorés'),
 ('7024-default',55,3543,55,'7024+S020OL','Blanc, WC suspendu ; bidet et accessoires illustrés'),
 ('5700-N5700',61,3444,62,'5700+N5700NI','Blanc, structure nickel'),
 ('5700-G571',64,3432,65,'5700+G571','Blanc, pieds céramiques ; robinetterie illustrée'),
 ('5770-5771',67,3420,66,'5770+5771','Blanc, colonne céramique'),
 ('5765-N5765',73,3398,72,'5765+N5765NI','Blanc, structure nickel ; vue de deux lavabos'),
 ('5770-Y5770',77,3384,76,'5770+Y5770BSSM','Blanc, structure laiton brossé mat'),
 ('5107-low',79,3376,78,'5107+5129+MC06NI+S123NI','Blanc, réservoir bas, abattant noir ; bidet illustré'),
 ('5022-default',85,3352,84,'5022+S123NI','Blanc, WC suspendu et abattant noir ; bidet illustré'),
 ('5033-default',87,3346,86,'5033+S060BT','Blanc ; bidet et robinetterie illustrés'),
 ('5309-default',88,3342,89,'5309+S127NI','Blanc, WC rétro ; lavabo et bidet illustrés'),
 ('5369-M5369G',98,3201,98,'5369+M5369GCR-1PCR','Blanc, console céramique avec porte-serviettes chrome illustrés'),
 ('5365-5771',101,3191,100,'5365+5771','Blanc, colonne céramique'),
 ('5359-5359M',102,3187,103,'5359+5359M','Blanc, consoles céramiques'),
 ('5352-alone',105,3175,104,'5352','Blanc ; robinetterie illustrée'),
 ('5520-default',106,3171,106,'5520+S520CR','Blanc, WC et bidet illustrés')]
def extract(path):
 data=Path(path).read_bytes();assert hashlib.sha256(data).hexdigest()==SHA,'Unexpected catalogue'
 doc=fitz.open(stream=data,filetype='pdf');out=ROOT/'public/sbordoni/dossier';out.mkdir(exist_ok=True)
 records=[]
 for key,page,xref,caption_page,caption,note in ROWS:
  normalized=''.join(doc[caption_page-1].get_text().split()).lower();assert caption.lower() in normalized,(key,'caption missing')
  placements=doc[page-1].get_image_rects(xref,transform=True);assert len(placements)==1,(key,'ambiguous image')
  matrix=placements[0][1];assert matrix.b==matrix.c==0,(key,'rotation needs review')
  im=doc.extract_image(xref);assert im['ext']=='jpeg' and im['width']>=750 and im['height']>=1000
  payload=im['image'];method='embedded-jpeg-original-bytes'
  if matrix.a<0 or matrix.d<0:
   photo=Image.open(io.BytesIO(payload)).convert('RGB')
   if matrix.a<0:photo=photo.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
   if matrix.d<0:photo=photo.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
   buffer=io.BytesIO();photo.save(buffer,format='JPEG',quality=96,subsampling=0);payload=buffer.getvalue();method='native-pixels-pdf-orientation'
  filename=key+'.jpg';(out/filename).write_bytes(payload)
  records.append(dict(key=key,url='/sbordoni/dossier/'+filename,source=SOURCE,sourceSha256=SHA,photoPage=page,captionPage=caption_page,caption=caption,finishNote=note,width=im['width'],height=im['height'],xref=xref,sha256=hashlib.sha256(payload).hexdigest(),sourceImageSha256=hashlib.sha256(im['image']).hexdigest(),bytes=len(payload),method=method))
 (out/'manifest.json').write_text(json.dumps(dict(version=1,photos=records),ensure_ascii=False,indent=2)+'\n')
 print('Extracted',len(records),'original photographs;',sum(r['bytes'] for r in records),'bytes')
if __name__=='__main__':extract(sys.argv[1])
