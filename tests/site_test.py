"""Lightweight checks for the Mistfront static site."""

from __future__ import annotations

import json
import re
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
WORKFLOW = ROOT / ".github" / "workflows" / "deploy-pages.yml"

PHONE_PATTERNS = [
    r"9894748313",
    r"9600418844",
    r"""href\s*=\s*["']tel:""",
]


def generate_gallery() -> None:
    subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "generate_gallery.py")],
        check=True,
        cwd=ROOT,
    )


generate_gallery()

HTML = (SRC / "index.html").read_text(encoding="utf-8")
CSS = (SRC / "styles.css").read_text(encoding="utf-8")
JS = (SRC / "script.js").read_text(encoding="utf-8")
GALLERY_TEXT = (SRC / "gallery.json").read_text(encoding="utf-8")
GALLERY = json.loads(GALLERY_TEXT)


class ProjectLayoutTests(unittest.TestCase):
    def test_site_lives_under_src(self) -> None:
        self.assertTrue((SRC / "index.html").is_file())
        self.assertTrue((SRC / "styles.css").is_file())
        self.assertTrue((SRC / "script.js").is_file())
        self.assertTrue((SRC / "images").is_dir())

    def test_pages_workflow_exists(self) -> None:
        self.assertTrue(WORKFLOW.is_file())
        self.assertIn("deploy-pages", WORKFLOW.read_text(encoding="utf-8"))

    def test_gallery_photos_exist_without_flyer(self) -> None:
        for name in ("1.jpg", "2.jpg", "3.jpg", "4.jpg"):
            photo = SRC / "images" / name
            self.assertTrue(photo.is_file(), f"missing {name}")
            self.assertGreater(photo.stat().st_size, 0)
        self.assertFalse((SRC / "images" / "hero.jpg").exists())


class PageContentTests(unittest.TestCase):
    def test_branding(self) -> None:
        self.assertRegex(HTML, r"Mistfront")
        self.assertRegex(HTML, r"Where the Mountains Meet the Mist")

    def test_core_sections(self) -> None:
        for section_id in ("highlights", "gallery", "stay", "location"):
            self.assertIn(f'id="{section_id}"', HTML)

    def test_assets_and_slideshow(self) -> None:
        self.assertRegex(HTML, r'href="styles\.css(?:\?[^"]*)?"')
        self.assertRegex(HTML, r'src="script\.js(?:\?[^"]*)?"')
        self.assertIn("data-slideshow", HTML)
        self.assertIn("slideshow-stage", HTML)

    def test_location_and_enquiry_form(self) -> None:
        self.assertRegex(HTML, r"KCP Etti Farms")
        self.assertRegex(HTML, r"Ettimadai")
        self.assertRegex(HTML, r"Coimbatore")
        self.assertRegex(HTML, r"Contact for details")
        self.assertIn('id="enquire"', HTML)
        self.assertIn("data-enquire-form", HTML)
        self.assertRegex(HTML, r"mistfrontvilla@gmail\.com")
        self.assertIn("formsubmit.co", HTML)
        self.assertIn('name="email"', HTML)
        self.assertIn('name="phone"', HTML)
        self.assertIn('name="trip_dates"', HTML)
        self.assertIn('name="number_of_people"', HTML)
        self.assertNotRegex(HTML, r"Share my location")
        self.assertNotIn("data-geo-button", HTML)
        self.assertIn('class="required"', HTML)
        self.assertIn('data-required-label="Full name"', HTML)


class DynamicGalleryTests(unittest.TestCase):
    def test_gallery_manifest_includes_photos(self) -> None:
        self.assertIsInstance(GALLERY.get("images"), list)
        self.assertGreaterEqual(len(GALLERY["images"]), 4)
        sources = {item["src"] for item in GALLERY["images"]}
        for name in ("1.jpg", "2.jpg", "3.jpg", "4.jpg"):
            self.assertIn(f"images/{name}", sources)
        self.assertNotIn("images/hero.jpg", sources)

    def test_client_loads_gallery_manifest(self) -> None:
        self.assertIn("gallery.json", JS)
        self.assertTrue("buildSlides" in JS or "loadGallery" in JS)


class PrivacyTests(unittest.TestCase):
    def test_phone_numbers_are_hidden(self) -> None:
        sources = {
            "index.html": HTML,
            "styles.css": CSS,
            "script.js": JS,
            "gallery.json": GALLERY_TEXT,
        }
        for label, content in sources.items():
            for pattern in PHONE_PATTERNS:
                self.assertIsNone(
                    re.search(pattern, content, flags=re.IGNORECASE),
                    f"{label} unexpectedly matches {pattern}",
                )


class ClientAssetTests(unittest.TestCase):
    def test_slideshow_script(self) -> None:
        self.assertIn("data-slideshow", JS)
        self.assertTrue("data-prev" in JS or "data-next" in JS)
        self.assertTrue("slideshow-dot" in JS or "goTo" in JS)

    def test_enquiry_form_script(self) -> None:
        self.assertIn("formsubmit.co/ajax/mistfrontvilla@gmail.com", JS)
        self.assertNotIn("getCurrentPosition", JS)
        self.assertTrue("validateRequiredFields" in JS or "Please fill in" in JS)

    def test_brand_css(self) -> None:
        self.assertIn("--forest", CSS)
        self.assertIn(".hero", CSS)
        self.assertIn(".slideshow", CSS)


if __name__ == "__main__":
    suite = unittest.defaultTestLoader.loadTestsFromModule(sys.modules[__name__])
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    raise SystemExit(0 if result.wasSuccessful() else 1)
