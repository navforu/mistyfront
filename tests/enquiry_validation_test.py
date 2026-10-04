"""Unit tests for Mistfront enquiry validation rules."""

from __future__ import annotations

import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JS = (ROOT / "src" / "enquiry-validation.js").read_text(encoding="utf-8")


def digits_only(value: str) -> str:
    return re.sub(r"\D", "", value or "")


def normalize_prefix(value: str) -> str:
    digits = digits_only(value)[:3]
    return digits or "91"


def phone_error(prefix_value: str, number_value: str) -> str:
    prefix = digits_only(prefix_value)
    if prefix and not re.fullmatch(r"\d{1,3}", prefix):
        return "Country code can have up to 3 digits."

    number = digits_only(number_value)
    if not number:
        return "Please fill in Phone number."

    code = normalize_prefix(prefix_value)
    if code == "91":
        if not re.fullmatch(r"[6-9]\d{9}", number):
            return "For +91, enter a valid 10-digit mobile number."
        return ""

    if not re.fullmatch(r"\d{6,12}", number):
        return "Please enter a valid phone number (6–12 digits)."
    return ""


def build_phone_full(prefix_value: str, number_value: str) -> str:
    return f"+{normalize_prefix(prefix_value)}{digits_only(number_value)}"


class EnquiryValidationTests(unittest.TestCase):
    def test_shared_validation_module_exists(self) -> None:
        self.assertTrue((ROOT / "src" / "enquiry-validation.js").is_file())
        self.assertIn("normalizePrefix", JS)
        self.assertIn("phoneError", JS)
        self.assertIn("buildPhoneFull", JS)
        self.assertIn("emailError", JS)
        self.assertIn("mistfrontvilla@gmail.com", JS)

    def test_blocks_mistfront_inbox_as_guest_email(self) -> None:
        self.assertIn("your own email", JS)
        self.assertIn("Mistfront inbox", JS)

    def test_prefix_defaults_and_max_length(self) -> None:
        self.assertEqual(normalize_prefix(""), "91")
        self.assertEqual(normalize_prefix("1"), "1")
        self.assertEqual(normalize_prefix("97155"), "971")

    def test_valid_and_invalid_phones(self) -> None:
        self.assertEqual(phone_error("91", "9876543210"), "")
        self.assertEqual(phone_error("1", "4401234123"), "")
        self.assertIn("Phone number", phone_error("91", "asdf"))
        self.assertIn("valid 10-digit", phone_error("91", "1234567890"))
        self.assertIn("6–12 digits", phone_error("1", "12"))
        self.assertIn("up to 3 digits", phone_error("9999", "9876543210"))

    def test_phone_full_format(self) -> None:
        self.assertEqual(build_phone_full("1", "4401234123"), "+14401234123")
        self.assertEqual(build_phone_full("", "9876543210"), "+919876543210")


if __name__ == "__main__":
    unittest.main()
