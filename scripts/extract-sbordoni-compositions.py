"""Re-extract reviewed Sbordoni images. Usage: python script.py /path/Cat_SBORDONI.pdf
Requires PyMuPDF and Pillow. No network access; validates the source PDF hash.
The explicit image manifest is reviewed against the manufacturer's labelled plates.
"""
import hashlib, io, json, sys
from pathlib import Path
import fitz
from PIL import Image, ImageChops
out = Path(__file__).resolve().parents[1] / 'public/sbordoni/compositions'
manifest = json.loads((out / 'provenance.json').read_text())
source = Path(sys.argv[1])
assert hashlib.sha256(source.read_bytes()).hexdigest() == manifest['sha256'], 'Wrong catalogue PDF'
doc = fitz.open(source)
for key, spec in manifest['images'].items():
    if 'xref' in spec:
        raw = doc.extract_image(spec['xref'])['image']
        im = Image.open(io.BytesIO(raw)).convert('RGB')
        mask = ImageChops.difference(im, Image.new('RGB', im.size, 'white')).convert('L').point(lambda x: 255 if x > 20 else 0)
        box = mask.getbbox()
        if box:
            im = im.crop((max(0, box[0]-4), max(0, box[1]-4), min(im.width, box[2]+4), min(im.height, box[3]+4)))
        im.save(out / (key + '.jpg'), quality=95)
    else:
        pix = doc[spec['page']-1].get_pixmap(matrix=fitz.Matrix(2, 2), clip=fitz.Rect(spec['box']), alpha=False)
        pix.pil_save(out / (key + '.jpg'), format='JPEG', quality=92)
print(f"Extracted {len(manifest['images'])} verified compositions")
