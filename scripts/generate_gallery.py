"""Scan src/images and write src/gallery.json for the slideshow."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMAGES_DIR = ROOT / "src" / "images"
OUTPUT = ROOT / "src" / "gallery.json"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}
EXCLUDED_NAMES = {
    "hero.jpg",  # flyer/reference art may contain private contact details
}


def natural_key(name: str) -> list:
    return [
        int(part) if part.isdigit() else part.lower()
        for part in re.split(r"(\d+)", name)
    ]


def caption_from_filename(name: str) -> str:
    stem = Path(name).stem.replace("_", " ").replace("-", " ").strip()
    if re.fullmatch(r"\d+", stem):
        return f"Photo {stem}"
    return stem.title() if stem else "Photo"


def collect_images() -> list[dict]:
    if not IMAGES_DIR.is_dir():
        return []

    files = [
        path
        for path in IMAGES_DIR.iterdir()
        if path.is_file()
        and path.suffix.lower() in IMAGE_EXTENSIONS
        and path.name.lower() not in EXCLUDED_NAMES
        and not path.name.startswith(".")
        and not path.name.startswith("_")
    ]
    files.sort(key=lambda path: natural_key(path.name))

    return [
        {
            "src": f"images/{path.name}",
            "alt": caption_from_filename(path.name),
            "caption": caption_from_filename(path.name),
        }
        for path in files
    ]


def main() -> None:
    images = collect_images()
    payload = {"images": images}
    OUTPUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(ROOT)} with {len(images)} image(s).")


if __name__ == "__main__":
    main()
