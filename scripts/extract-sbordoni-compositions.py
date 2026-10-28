"""Rebuild 99 Sbordoni composition images from the exact manufacturer catalogue.

This is an intentionally reproducible extraction. It does NOT use upscaling to
simulate missing pixels. It renders the *displayed image placement* in the PDF,
which preserves the PDF's mirroring/rotation and excludes neighboring captions.

Usage:
  python scripts/extract-sbordoni-compositions.py Cat_SBORDONI.pdf
  python scripts/extract-sbordoni-compositions.py Cat_SBORDONI.pdf --dry-run

An unrecognized catalogue SHA-256, missing placement, broken crop or failed
image validation aborts before any file in public/ is replaced.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import math
from pathlib import Path
from tempfile import TemporaryDirectory

import fitz
from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageStat

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "sbordoni" / "compositions"
PROVENANCE = OUT / "provenance.json"
EXPECTED_COUNT = 99
SCALE = 3.0
MAX_SCALE = 4.0
PADDING_PX = 4


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def intersection_area(a: fitz.Rect, b: fitz.Rect) -> float:
    intersection = a & b
    return max(0.0, intersection.width) * max(0.0, intersection.height) if not intersection.is_empty else 0.0


def locate_placement(page: fitz.Page, spec: dict) -> tuple[fitz.Rect, str]:
    """Resolve the xref's actual display matrix, not the untransformed image.

    PDF images may be mirrored relative to their raw JPEG or PNG bytes. Page
    rendering preserves the displayed orientation; extract_image() does not.
    """
    expected = fitz.Rect(spec["box"])
    if expected.is_empty or expected.width <= 0 or expected.height <= 0:
        raise ValueError("Invalid source crop coordinates")
    if "xref" not in spec:
        return expected & page.rect, "page-clip-no-xref"
    try:
        rects = page.get_image_rects(int(spec["xref"]), transform=True)
    except Exception as exc:
        raise ValueError(f"Could not locate image xref={spec['xref']}") from exc
    scored = []
    for rect, matrix in rects:
        area = intersection_area(expected, rect)
        scored.append((area, rect, matrix))
    if not scored:
        raise ValueError(f"Image xref={spec['xref']} not displayed on page")
    area, drawn, transform = max(scored, key=lambda item: item[0])
    if area < min(expected.get_area(), drawn.get_area()) * 0.10:
        raise ValueError(f"Wrong image placement for xref={spec['xref']}: insufficient overlap")
    clip = drawn & expected & page.rect
    if clip.is_empty or clip.width <= 1 or clip.height <= 1:
        raise ValueError("Image crop is empty")
    orientation = (
        f"display-matrix=[{transform.a:.5f},{transform.b:.5f},"
        f"{transform.c:.5f},{transform.d:.5f}]; "
        f"image-rect={list(round(float(x), 3) for x in drawn)}"
    )
    return clip, orientation


def trim_blank_border(im: Image.Image) -> Image.Image:
    """Only trim *outer* white borders; keep a safety margin for fine legs."""
    bg = Image.new("RGB", im.size, "white")
    diff = ImageChops.difference(im, bg).convert("L").point(lambda x: 255 if x >= 14 else 0)
    bounds = diff.getbbox()
    if not bounds:
        raise ValueError("Rendered image appears entirely white")
    x0, y0, x1, y1 = bounds
    x0 = max(0, x0 - PADDING_PX)
    y0 = max(0, y0 - PADDING_PX)
    x1 = min(im.width, x1 + PADDING_PX)
    y1 = min(im.height, y1 + PADDING_PX)
    if x1 - x0 < 110 or y1 - y0 < 70:
        raise ValueError(f"Insufficient image area after crop: {x1-x0} x {y1-y0}")
    return im.crop((x0, y0, x1, y1))


def render_image(page: fitz.Page, spec: dict) -> tuple[Image.Image, dict]:
    clip, orientation = locate_placement(page, spec)
    # Three PDF pixels per point gives a real 423px-wide display crop for the
    # 5700/G571 example. The page renderer preserves mirrors and clipped feet.
    zoom = min(MAX_SCALE, SCALE)
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), clip=clip, alpha=False, annots=False)
    original = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
    trimmed = trim_blank_border(original)
    stats = ImageStat.Stat(trimmed)
    if max(stats.stddev) < 3:
        raise ValueError("Image has almost no visual information")
    return trimmed, {
        "sourcePage": int(spec["page"]),
        "printedPage": int(spec.get("printedPage", 0)),
        "sourceImageXref": spec.get("xref"),
        "sourceBox": spec["box"],
        "renderClip": [round(float(value), 3) for value in clip],
        "transform": orientation,
        "pixelSize": list(trimmed.size),
        "rasterScale": zoom,
        "method": "pdf-page-rendered-xref" if spec.get("xref") else "reviewed-page-clip",
    }


def create_contact_sheet(images: dict[str, Image.Image], path: Path) -> None:
    w, h, columns = 240, 245, 5
    rows = math.ceil(len(images) / columns)
    sheet = Image.new("RGB", (columns * w, rows * h), "#f7f7f7")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()
    for i, (key, img) in enumerate(sorted(images.items())):
        x, y = (i % columns) * w, (i // columns) * h
        thumb = img.copy()
        thumb.thumbnail((222, 213), Image.Resampling.LANCZOS)
        sheet.paste(thumb, (x + (w-thumb.width)//2, y + 5 + (215-thumb.height)//2))
        draw.text((x + 8, y + 226), key, fill="#222222", font=font)
    sheet.save(path, "JPEG", quality=86, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path, help="Exact manufacturer Cat_SBORDONI.pdf")
    parser.add_argument("--dry-run", action="store_true", help="Inspect without changing the current catalogue assets")
    parser.add_argument("--contact-sheet", type=Path, help="Save a labeled review sheet")
    args = parser.parse_args()
    manifest = json.loads(PROVENANCE.read_text(encoding="utf-8"))
    source_hash = sha256(args.pdf.read_bytes())
    if source_hash != manifest["sha256"]:
        raise ValueError(f"PDF SHA-256 mismatch. Expected {manifest['sha256']}; received {source_hash}. NO images modified.")
    specs = manifest["images"]
    if len(specs) != EXPECTED_COUNT:
        raise ValueError(f"Expected {EXPECTED_COUNT} manufacturer compositions; got {len(specs)}")
    doc = fitz.open(args.pdf)
    output: dict[str, Image.Image] = {}
    audit = {}
    for key, spec in sorted(specs.items()):
        if "/" in key or ".." in key:
            raise ValueError(f"Unsafe image key: {key!r}")
        page_num = int(spec["page"])
        if not 1 <= page_num <= len(doc):
            raise ValueError(f"Invalid page for {key}: {page_num}")
        image, details = render_image(doc[page_num - 1], spec)
        output[key] = image
        audit[key] = details
    # Transactional: do not touch existing JPGs until all 99 can be rendered.
    with TemporaryDirectory(prefix=".sbordoni-hd-staging-", dir=OUT) as temp:
        staging = Path(temp)
        for key, im in output.items():
            dest = staging / (key + ".jpg")
            im.save(dest, "JPEG", quality=94, optimize=True, subsampling=0)
            jpeg = dest.read_bytes()
            audit[key]["sha256"] = sha256(jpeg)
            audit[key]["bytes"] = len(jpeg)
        review_path = args.contact_sheet or staging / "contact-sheet.jpg"
        review_path.parent.mkdir(parents=True, exist_ok=True)
        create_contact_sheet(output, review_path)
        if not args.dry_run:
            for key in output:
                (staging / (key + ".jpg")).replace(OUT / (key + ".jpg"))
            report = {
                "version": 2,
                "catalogueSha256": source_hash,
                "extraction": "Rendered PDF image placements at 3 px/point; mirrors preserved, captions outside placements excluded",
                "count": len(audit),
                "images": audit,
            }
            (OUT / "hd-manifest.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Sbordoni: {len(output)} compositions validated, {'not written (dry run)' if args.dry_run else 'HD images written'}")
    if args.contact_sheet:
        print(f"Review contact sheet: {args.contact_sheet}")


if __name__ == "__main__":
    main()
