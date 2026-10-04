const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const rules = require(path.join(__dirname, "..", "src", "enquiry-validation.js"));

describe("enquiry validation rules", () => {
  it("defaults optional prefix to 91 and caps at 3 digits", () => {
    assert.equal(rules.normalizePrefix(""), "91");
    assert.equal(rules.normalizePrefix("91"), "91");
    assert.equal(rules.normalizePrefix("1"), "1");
    assert.equal(rules.normalizePrefix("971"), "971");
    assert.equal(rules.normalizePrefix("97155"), "971");
    assert.equal(rules.normalizePrefix("+44"), "44");
  });

  it("accepts valid Indian and international phone numbers", () => {
    assert.equal(rules.phoneError("91", "9876543210"), "");
    assert.equal(rules.phoneError("", "9876543210"), "");
    assert.equal(rules.phoneError("1", "4401234123"), "");
    assert.equal(rules.phoneError("44", "7911123456"), "");
  });

  it("rejects invalid phone numbers and oversized prefixes", () => {
    assert.match(rules.phoneError("91", "asdf"), /Phone number/i);
    assert.match(rules.phoneError("91", "1234567890"), /valid 10-digit/i);
    assert.match(rules.phoneError("91", "98765"), /valid 10-digit/i);
    assert.match(rules.phoneError("1", "12"), /6–12 digits|6-12 digits/i);
    assert.match(rules.phoneError("9999", "9876543210"), /up to 3 digits/i);
    assert.match(rules.phoneError("91", ""), /Phone number/i);
  });

  it("builds a full phone number from prefix and local number", () => {
    assert.equal(rules.buildPhoneFull("91", "9876543210"), "+919876543210");
    assert.equal(rules.buildPhoneFull("1", "4401234123"), "+14401234123");
    assert.equal(rules.buildPhoneFull("", "9876543210"), "+919876543210");
  });

  it("validates email, people count, and date order", () => {
    assert.equal(rules.fieldError("email", "guest@example.com"), "");
    assert.match(rules.fieldError("email", "not-an-email"), /valid email/i);
    assert.equal(rules.fieldError("number_of_people", "8"), "");
    assert.match(rules.fieldError("number_of_people", "0"), /1–20|1-20/i);
    assert.match(rules.fieldError("number_of_people", "21"), /1–20|1-20/i);

    assert.equal(
      rules.fieldError("arrival_date", "2026-10-06", { today: "2026-10-04" }),
      ""
    );
    assert.match(
      rules.fieldError("arrival_date", "2026-10-01", { today: "2026-10-04" }),
      /past/i
    );
    assert.match(
      rules.departureOrderError("2026-10-08", "2026-10-06"),
      /after the arrival date/i
    );
    assert.equal(rules.departureOrderError("2026-10-06", "2026-10-08"), "");
  });

  it("lists the required enquiry fields from the product rules", () => {
    for (const label of [
      "Full name",
      "Email",
      "Phone number",
      "Number of people",
      "Arrival date",
      "Departure date",
    ]) {
      assert.ok(rules.REQUIRED_FIELDS.includes(label));
    }
  });
});
