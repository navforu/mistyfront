"""Structural checks for the Mistfront static site and enquiry form."""

from __future__ import annotations

import json
import re
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
DEPLOY_WORKFLOW = ROOT / ".github" / "workflows" / "deploy-pages.yml"
CI_WORKFLOW = ROOT / ".github" / "workflows" / "ci.yml"

OWNER_PHONE_PATTERNS = [
    r"9894748313",
    r"9600418844",
    r"""href\s*=\s*["']tel:""",
]

REQUIRED_LABELS = [
    "Full name",
    "Email",
    "Phone number",
    "Number of people",
    "Arrival date",
    "Departure date",
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
VALIDATION = (SRC / "enquiry-validation.js").read_text(encoding="utf-8")
GALLERY_TEXT = (SRC / "gallery.json").read_text(encoding="utf-8")
GALLERY = json.loads(GALLERY_TEXT)


class ProjectLayoutTests(unittest.TestCase):
    def test_site_lives_under_src(self) -> None:
        self.assertTrue((SRC / "index.html").is_file())
        self.assertTrue((SRC / "styles.css").is_file())
        self.assertTrue((SRC / "script.js").is_file())
        self.assertTrue((SRC / "enquiry-validation.js").is_file())
        self.assertTrue((SRC / "images").is_dir())

    def test_ci_and_pages_workflows_run_tests(self) -> None:
        self.assertTrue(DEPLOY_WORKFLOW.is_file())
        self.assertTrue(CI_WORKFLOW.is_file())
        deploy = DEPLOY_WORKFLOW.read_text(encoding="utf-8")
        ci = CI_WORKFLOW.read_text(encoding="utf-8")
        self.assertIn("deploy-pages", deploy)
        self.assertRegex(deploy, r"(?m)^\s*test:\s*$")
        self.assertRegex(deploy, r"needs:\s*test")
        self.assertTrue("npm test" in deploy or "node --test" in deploy)
        self.assertTrue("site_test.py" in deploy or "test:py" in deploy)
        self.assertRegex(ci, r"(?m)^\s*test:\s*$")
        self.assertTrue("npm test" in ci or "node --test" in ci)
        self.assertTrue("site_test.py" in ci or "test:py" in ci)

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
        for section_id in ("highlights", "gallery", "stay", "location", "enquire"):
            self.assertIn(f'id="{section_id}"', HTML)

    def test_assets_and_slideshow(self) -> None:
        self.assertRegex(HTML, r'href="styles\.css(?:\?[^"]*)?"')
        self.assertRegex(HTML, r'src="enquiry-validation\.js(?:\?[^"]*)?"')
        self.assertRegex(HTML, r'src="script\.js(?:\?[^"]*)?"')
        self.assertIn("data-slideshow", HTML)
        self.assertIn("slideshow-stage", HTML)

    def test_location_details(self) -> None:
        self.assertRegex(HTML, r"KCP Etti Farms")
        self.assertRegex(HTML, r"Ettimadai")
        self.assertRegex(HTML, r"Coimbatore")
        self.assertIn("google.com/maps", HTML)


class EnquiryFormRequirementTests(unittest.TestCase):
    def test_formsubmit_enquiry_form(self) -> None:
        self.assertRegex(HTML, r"Contact for details")
        self.assertIn("data-enquire-form", HTML)
        self.assertRegex(HTML, r"mistfrontvilla@gmail\.com")
        self.assertIn("formsubmit.co", HTML)
        self.assertNotIn("mailto:mistfrontvilla@gmail.com", HTML)

    def test_required_asterisks_and_labels(self) -> None:
        self.assertIn("Fields marked with", HTML)
        self.assertRegex(CSS, r"\.required[\s\S]*color:\s*#c62828")
        for label in REQUIRED_LABELS:
            self.assertIn(f'data-required-label="{label}"', HTML)
            self.assertRegex(HTML, rf"{re.escape(label)}[\s\S]*?class=\"required\"")
        self.assertIn("(optional)", HTML)

    def test_core_fields(self) -> None:
        for name in (
            "name",
            "email",
            "number_of_people",
            "arrival_date",
            "departure_date",
            "message",
        ):
            self.assertIn(f'name="{name}"', HTML)
        self.assertIn('type="date"', HTML)

    def test_phone_prefix_and_local_number(self) -> None:
        self.assertIn('name="phone_prefix"', HTML)
        self.assertIn('name="phone"', HTML)
        self.assertIn('value="91"', HTML)
        self.assertIn('maxlength="3"', HTML)
        self.assertIn("phone-plus", HTML)
        self.assertIn("phone-prefix-box", HTML)
        self.assertIn(".phone-prefix-box", CSS)
        self.assertIn(".phone-plus", CSS)

    def test_whatsapp_checkbox_on_right(self) -> None:
        self.assertIn('name="whatsapp_available"', HTML)
        self.assertIn("This number is available on WhatsApp", HTML)
        self.assertIn("form-spacer", HTML)
        self.assertIn(".form-spacer", CSS)

    def test_location_sharing_removed(self) -> None:
        self.assertNotRegex(HTML, r"Share my location")
        self.assertNotIn("data-geo-button", HTML)
        self.assertNotIn("getCurrentPosition", JS)


class EnquiryClientBehaviorTests(unittest.TestCase):
    def test_uses_shared_validation_module(self) -> None:
        self.assertIn("MistfrontEnquiry", JS)
        self.assertIn("validateForm", JS)
        self.assertIn("whatsapp_available", JS)
        self.assertIn("normalizePrefix", VALIDATION)
        self.assertIn("phoneError", VALIDATION)
        self.assertIn("buildPhoneFull", VALIDATION)

    def test_formsubmit_ajax_endpoint(self) -> None:
        self.assertIn("formsubmit.co/ajax/mistfrontvilla@gmail.com", JS)


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
    def test_owner_phone_numbers_are_hidden(self) -> None:
        sources = {
            "index.html": HTML,
            "styles.css": CSS,
            "script.js": JS,
            "enquiry-validation.js": VALIDATION,
            "gallery.json": GALLERY_TEXT,
        }
        for label, content in sources.items():
            for pattern in OWNER_PHONE_PATTERNS:
                self.assertIsNone(
                    re.search(pattern, content, flags=re.IGNORECASE),
                    f"{label} unexpectedly matches {pattern}",
                )


class VisualSystemTests(unittest.TestCase):
    def test_slideshow_script(self) -> None:
        self.assertIn("data-slideshow", JS)
        self.assertTrue("data-prev" in JS or "data-next" in JS)
        self.assertTrue("slideshow-dot" in JS or "goTo" in JS)

    def test_brand_and_form_css(self) -> None:
        self.assertIn("--forest", CSS)
        self.assertIn(".hero", CSS)
        self.assertIn(".slideshow", CSS)
        self.assertIn(".enquire-form .form-grid", CSS)
        self.assertIn(".phone-group", CSS)


if __name__ == "__main__":
    suite = unittest.defaultTestLoader.loadTestsFromModule(sys.modules[__name__])
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    raise SystemExit(0 if result.wasSuccessful() else 1)
