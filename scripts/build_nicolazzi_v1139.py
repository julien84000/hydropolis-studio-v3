#!/usr/bin/env python3
"""Complete the Nicolazzi 2024 catalogue from audited multi-column PDF tables."""

import argparse
import base64
import gzip
import io
import json
import re
import subprocess
import tempfile
import unicodedata
from pathlib import Path

import pdfplumber
from PIL import Image, ImageDraw, ImageFont, ImageOps


GROUP_CODES = {
    "g1": ["CR", "NL", "OG", "OS", "OL"],
    "g2": [
        "CB", "NS", "BN", "NKN", "TB", "RA", "FV", "DB", "DBM", "BZ",
        "AG", "GB", "GF", "SE", "RED", "BLU", "YE", "HE", "NEM", "BIM",
        "VP", "PNK", "ND", "TY", "RP", "GRF",
    ],
    "g3": ["GO", "COP", "RG", "SG"],
}

TARGET_COLLECTIONS = {
    "Star", "Arena", "Elica", "Monte Croce", "Agorà", "Impero",
    "Dames Anglaises", "Half Dome", "El Capitan", "P. Mont Blanc", "Forest",
    "Teide Four", "Teide", "Liberty", "Nuova Brenta", "Mac Kinley",
    "Cristallo", "Cristallo Khady", "Half Dome Crystal", "Cristallo Liberty",
    "Le Pietre", "Cristallo di rocca", "Onice", "Teide Chic", "Cinquanta", "Cucina",
}

HANDLE_HEADER_PAGE = {
    "44": 80, "56": 80, "97X": 86, "56M": 86,
    "27": 112, "29": 112, "27X": 118, "29M": 118,
    "45IN": 136, "18IN": 136, "05IN": 136,
    "36": 174, "36L": 174,
    "18": 188, "70": 188,
    "69": 196, "78": 196, "79": 196,
    "45": 204, "05": 204,
    "01": 242, "60": 242,
    "22": 252, "22B": 252, "C1": 252,
    "93": 258, "34": 258, "43": 258,
    "09MC": 282, "09C": 282,
    "09O": 298, "09ON": 298,
    "75C": 324, "76C": 324, "77C": 324, "33C": 324,
}


def read_gz_json(path):
    with gzip.open(path, "rt", encoding="utf-8") as handle:
        return json.load(handle)


def write_gz_json(path, value):
    payload = json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    with gzip.GzipFile(filename=str(path), mode="wb", compresslevel=9, mtime=0) as handle:
        handle.write(payload)


def clean_text(value):
    value = "".join(ch if unicodedata.category(ch) != "Co" else " " for ch in str(value or ""))
    value = re.sub(r"\s+", " ", value).strip()
    if "Piastra per batteria" in value:
        value = value[value.index("Piastra per batteria"):]
    header_markers = [
        " Olympus Arena Leva Arena", " Dames Anglaises Half Dome El Capitan",
        " Mini Dames Mini Mini Mini", " Nuova Brenta Mac Kinley",
        " Monte Croce Mac Kinley 05", " El Capitan Half Dome Forest",
    ]
    for marker in header_markers:
        if marker in value:
            value = value.split(marker, 1)[0]
    value = re.sub(r"(?:\s+(?:\.\.)?[A-Z0-9]{1,6}){2,}\s*$", "", value)
    value = re.sub(r"\s+[A-Z]$", "", value)
    return value


def base_suffix(base):
    return base.split("..", 1)[1] if ".." in base else ""


def base_family(base):
    return base.split("..", 1)[0].strip()


def add_catalog_rows(project, candidates_path):
    catalog_path = project / "public" / "catalog_nicolazzi.json.gz"
    rows = read_gz_json(catalog_path)
    existing_bases = {row.get("base", "") for row in rows}
    finish_names = {row.get("finishCode", ""): row.get("finish", "") for row in rows}
    candidates = json.loads(candidates_path.read_text(encoding="utf-8"))
    missing = []
    for item in candidates:
        if item.get("base") in existing_bases:
            continue
        if not 22 <= int(item.get("page", 0)) <= 347:
            continue
        if item.get("collection") not in TARGET_COLLECTIONS:
            continue
        missing.append(item)
        existing_bases.add(item["base"])

    additions = []
    for item in missing:
        designation = clean_text(item.get("designation"))
        category = "Cuisine" if item["collection"] == "Cucina" else item.get("category", "Accessoires")
        for group, finish_codes in GROUP_CODES.items():
            public_price = round(float(item["prices"][group]) * 1.25, 2)
            for finish_code in finish_codes:
                base = item["base"]
                reference = base.replace("..", finish_code, 1) if ".." in base else base + finish_code
                additions.append({
                    "manufacturer": "Nicolazzi",
                    "collection": item["collection"],
                    "reference": reference,
                    "base": base,
                    "designation": designation,
                    "finishCode": finish_code,
                    "finish": finish_names[finish_code],
                    "category": category,
                    "price": public_price,
                    "currency": "€",
                    "vat": "HT",
                    "internalReference": None,
                    "internalPrice": 0,
                    "totalPrice": public_price,
                    "source": "Nicolazzi Listino Prezzi 2024 · majoration Hydropolis +25%",
                    "sourceYear": 2024,
                    "image": "",
                    "imageSource": "Catalogue et site officiel Nicolazzi",
                    "manufacturerUrl": "https://www.nicolazzi.it/en/",
                    "supplierNote": "",
                    "originalDescription": designation,
                    "purchaseDiscount": 50,
                    "catalogPage": int(item["page"]),
                    "catalogSource": "nicolazzi-2024",
                })
    rows.extend(additions)
    write_gz_json(catalog_path, rows)
    return rows, missing, additions


class PdfPreviewFactory:
    def __init__(self, pdf_path, temp_dir):
        self.pdf_path = pdf_path
        self.temp_dir = temp_dir
        self.pdf = pdfplumber.open(pdf_path)
        self.rasters = {}
        self.article_positions = {}
        self.handle_tiles = {}
        self.scale = 90 / 72

    def close(self):
        self.pdf.close()

    def page_image(self, page_number):
        if page_number not in self.rasters:
            prefix = self.temp_dir / f"page-{page_number}"
            subprocess.run([
                "pdftoppm", "-f", str(page_number), "-l", str(page_number),
                "-r", "90", "-singlefile", "-png", str(self.pdf_path), str(prefix),
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            self.rasters[page_number] = Image.open(prefix.with_suffix(".png")).convert("RGB")
        return self.rasters[page_number]

    def positions(self, page_number):
        if page_number in self.article_positions:
            return self.article_positions[page_number]
        words = self.pdf.pages[page_number - 1].extract_words()
        positions = []
        for index, word in enumerate(words[:-1]):
            if word["text"].strip().lower() == "art.":
                code = words[index + 1]
                positions.append((code["text"].strip(), float(code["x0"]), float(code["top"])))
        self.article_positions[page_number] = positions
        return positions

    def product_band(self, page_number, family):
        page = self.pdf.pages[page_number - 1]
        positions = self.positions(page_number)
        normalized = family.replace(" ", "").upper()
        matches = [entry for entry in positions if entry[0].replace(" ", "").upper().startswith(normalized)]
        current = matches[0] if matches else ("", 320.0, page.height / 2)
        y = current[2]
        later = sorted(pos[2] for pos in positions if pos[2] > y + 8)
        top = max(0.0, y - 125.0)
        bottom = min(float(page.height), later[0] - 8.0 if later else y + 310.0)
        if bottom - top < 230:
            bottom = min(float(page.height), top + 300.0)
        raster = self.page_image(page_number)
        box = (0, int(top * self.scale), raster.width, int(bottom * self.scale))
        return raster.crop(box)

    def handle_crop(self, suffix):
        if suffix in self.handle_tiles:
            return self.handle_tiles[suffix]
        source_page = HANDLE_HEADER_PAGE.get(suffix)
        if not source_page:
            self.handle_tiles[suffix] = None
            return None
        page = self.pdf.pages[source_page - 1]
        target = f"..{suffix}".upper()
        words = page.extract_words()
        matches = [word for word in words if word["text"].strip().upper() == target and float(word["top"]) < 360]
        if not matches:
            self.handle_tiles[suffix] = None
            return None
        word = matches[0]
        center = (float(word["x0"]) + float(word["x1"])) / 2
        left = max(0.0, center - 72.0)
        right = min(float(page.width), center + 72.0)
        top = max(0.0, float(word["top"]) - 12.0)
        bottom = min(float(page.height), top + 185.0)
        raster = self.page_image(source_page)
        result = raster.crop((int(left * self.scale), int(top * self.scale), int(right * self.scale), int(bottom * self.scale)))
        self.handle_tiles[suffix] = result
        return result

    def make_preview(self, page_number, base):
        family = base_family(base)
        suffix = base_suffix(base)
        band = self.product_band(page_number, family)
        canvas = Image.new("RGB", (640, 460), "white")
        fitted = ImageOps.contain(band, (620, 440), Image.Resampling.LANCZOS)
        canvas.paste(fitted, ((640 - fitted.width) // 2, (460 - fitted.height) // 2))

        handle = self.handle_crop(suffix)
        if handle is not None:
            tile = Image.new("RGB", (168, 196), "white")
            visual = ImageOps.contain(handle, (156, 158), Image.Resampling.LANCZOS)
            tile.paste(visual, ((168 - visual.width) // 2, 4))
            draw = ImageDraw.Draw(tile)
            draw.rounded_rectangle((4, 164, 164, 192), radius=8, fill="#F36D21")
            draw.text((84, 178), f"Poignée {suffix}", anchor="mm", fill="white", font=ImageFont.load_default())
            canvas.paste(tile, (464, 8))
            draw = ImageDraw.Draw(canvas)
            draw.rounded_rectangle((463, 7, 632, 204), radius=10, outline="#F36D21", width=3)
        elif suffix:
            draw = ImageDraw.Draw(canvas)
            draw.rounded_rectangle((466, 14, 626, 48), radius=9, fill="#F36D21")
            draw.text((546, 31), f"Poignée {suffix}", anchor="mm", fill="white", font=ImageFont.load_default())

        output = io.BytesIO()
        canvas.save(output, format="WEBP", quality=55, method=2)
        return base64.b64encode(output.getvalue()).decode("ascii")


def extend_asset_pack(project, pdf_path, missing):
    pack_path = project / "public" / "nicolazzi_pdf_assets.json.gz"
    pack = read_gz_json(pack_path)
    with tempfile.TemporaryDirectory(prefix="hydropolis-nicolazzi-") as temp:
        factory = PdfPreviewFactory(pdf_path, Path(temp))
        try:
            for index, item in enumerate(missing, 1):
                base = item["base"]
                if base in pack["models"]:
                    continue
                pack["models"][base] = {
                    "page": int(item["page"]),
                    "collection": item["collection"],
                    "designation": clean_text(item.get("designation")),
                    "category": "Cuisine" if item["collection"] == "Cucina" else item.get("category", "Accessoires"),
                    "family": base_family(base),
                    "handleCode": base_suffix(base),
                    "externalHandleSelection": False,
                    "mime": "image/webp",
                    "image": factory.make_preview(int(item["page"]), base),
                }
                if index % 50 == 0:
                    print(f"assets {index}/{len(missing)}", flush=True)
        finally:
            factory.close()
    pack["version"] = "11.39.0"
    pack["modelCount"] = len(pack["models"])
    pack["description"] = "Official Nicolazzi 2024 PDF visuals, including audited multi-handle catalogue pages"
    write_gz_json(pack_path, pack)
    return pack


def update_metadata(project, total_rows, model_count):
    manifest_path = project / "public" / "catalog_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    previous_nicolazzi = next(chunk["count"] for chunk in manifest["chunks"] if chunk["label"] == "Nicolazzi")
    next(chunk for chunk in manifest["chunks"] if chunk["label"] == "Nicolazzi")["count"] = total_rows
    manifest["total"] += total_rows - previous_nicolazzi
    manifest["version"] = "11.39.0"
    manifest["engineVersion"] = "11.39.0"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    manufacturers_path = project / "public" / "manufacturers_manifest.json"
    manufacturers = json.loads(manufacturers_path.read_text(encoding="utf-8"))
    manufacturers["version"] = "11.39.0"
    manufacturers_path.write_text(json.dumps(manufacturers, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    build_path = project / "BUILD_INFO.json"
    build = json.loads(build_path.read_text(encoding="utf-8"))
    delta = total_rows - int(build["nicolazzi"]["catalogRows"])
    build["version"] = "11.39.0"
    build["build"] = "V11.39"
    build["catalogRows"] += delta
    build["uniqueManufacturerReferences"] += delta
    build["releaseNotes"] = "RELEASE_NOTES_V11.39.md"
    build["notes"] = "Nicolazzi catalogue completeness audit: multi-handle product tables and shared kitchen/classic tables restored from the official 2024 price list."
    build["nicolazzi"]["catalogRows"] = total_rows
    build["nicolazzi"]["modelAssets"] = model_count
    build["nicolazziPdfV1131"]["models"] = model_count
    build["nicolazziPdfV1131"]["catalogRows"] = total_rows
    build["nicolazziCatalogV1139"] = {
        "source": "NICOLAZZI_LISTINO 2024 official PDF",
        "scope": "audited pages 22-347",
        "restoredBases": 0,
        "catalogRows": total_rows,
        "modelAssets": model_count,
        "validation": "multi-column price groups mapped to explicit handle codes; public price remains list price × 1.25",
    }
    build_path.write_text(json.dumps(build, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--project", type=Path, required=True)
    parser.add_argument("--candidates", type=Path, required=True)
    parser.add_argument("--pdf", type=Path, required=True)
    args = parser.parse_args()
    rows, missing, additions = add_catalog_rows(args.project, args.candidates)
    print(f"restored bases: {len(missing)}; restored rows: {len(additions)}; Nicolazzi total: {len(rows)}")
    pack = extend_asset_pack(args.project, args.pdf, missing)
    update_metadata(args.project, len(rows), int(pack["modelCount"]))
    build_path = args.project / "BUILD_INFO.json"
    build = json.loads(build_path.read_text(encoding="utf-8"))
    build["nicolazziCatalogV1139"]["restoredBases"] = len(missing)
    build_path.write_text(json.dumps(build, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"asset models: {pack['modelCount']}")


if __name__ == "__main__":
    main()
