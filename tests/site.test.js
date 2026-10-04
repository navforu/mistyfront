const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const srcDir = path.join(root, "src");
const htmlPath = path.join(srcDir, "index.html");
const cssPath = path.join(srcDir, "styles.css");
const jsPath = path.join(srcDir, "script.js");
const validationPath = path.join(srcDir, "enquiry-validation.js");
const galleryPath = path.join(srcDir, "gallery.json");
const imagesDir = path.join(srcDir, "images");
const deployWorkflowPath = path.join(root, ".github", "workflows", "deploy-pages.yml");
const ciWorkflowPath = path.join(root, ".github", "workflows", "ci.yml");

const OWNER_PHONE_PATTERNS = [/9894748313/, /9600418844/, /href\s*=\s*["']tel:/i];

before(() => {
  execFileSync("python", [path.join(root, "scripts", "generate_gallery.py")], {
    cwd: root,
    stdio: "pipe",
  });
});

const html = () => fs.readFileSync(htmlPath, "utf8");
const css = () => fs.readFileSync(cssPath, "utf8");
const js = () => fs.readFileSync(jsPath, "utf8");
const validation = () => fs.readFileSync(validationPath, "utf8");
const gallery = () => JSON.parse(fs.readFileSync(galleryPath, "utf8"));

describe("project layout", () => {
  it("keeps site code under src/", () => {
    assert.ok(fs.existsSync(htmlPath));
    assert.ok(fs.existsSync(cssPath));
    assert.ok(fs.existsSync(jsPath));
    assert.ok(fs.existsSync(validationPath));
    assert.ok(fs.existsSync(imagesDir));
  });

  it("includes CI and GitHub Pages workflows that run tests", () => {
    assert.ok(fs.existsSync(deployWorkflowPath));
    assert.ok(fs.existsSync(ciWorkflowPath));
    const deploy = fs.readFileSync(deployWorkflowPath, "utf8");
    const ci = fs.readFileSync(ciWorkflowPath, "utf8");
    assert.match(deploy, /deploy-pages/);
    assert.match(deploy, /npm test|node --test/);
    assert.match(deploy, /site_test\.py|test:py/);
    assert.match(ci, /npm test|node --test/);
    assert.match(ci, /site_test\.py|test:py/);
  });

  it("includes gallery photos on disk and excludes the flyer asset", () => {
    for (const name of ["1.jpg", "2.jpg", "3.jpg", "4.jpg"]) {
      const photoPath = path.join(imagesDir, name);
      assert.ok(fs.existsSync(photoPath), `missing ${name}`);
      assert.ok(fs.statSync(photoPath).size > 0, `${name} should not be empty`);
    }
    assert.ok(!fs.existsSync(path.join(imagesDir, "hero.jpg")));
  });
});

describe("page content", () => {
  it("presents Mistfront branding and tagline", () => {
    assert.match(html(), /Mistfront/i);
    assert.match(html(), /Where the Mountains Meet the Mist/i);
  });

  it("includes the core sections", () => {
    for (const id of ["highlights", "gallery", "stay", "location", "enquire"]) {
      assert.match(html(), new RegExp(`id="${id}"`));
    }
  });

  it("wires stylesheet, scripts, and slideshow shell", () => {
    assert.match(html(), /href="styles\.css(?:\?[^"]*)?"/);
    assert.match(html(), /src="enquiry-validation\.js(?:\?[^"]*)?"/);
    assert.match(html(), /src="script\.js(?:\?[^"]*)?"/);
    assert.match(html(), /data-slideshow/);
    assert.match(html(), /slideshow-stage/);
  });

  it("shows the property address and maps link", () => {
    assert.match(html(), /KCP Etti Farms/i);
    assert.match(html(), /Ettimadai/i);
    assert.match(html(), /Coimbatore/i);
    assert.match(html(), /google\.com\/maps/i);
  });
});

describe("enquiry form requirements", () => {
  it("uses an on-page form emailed through FormSubmit", () => {
    assert.match(html(), /Contact for details/i);
    assert.match(html(), /data-enquire-form/);
    assert.match(html(), /mistfrontvilla@gmail\.com/);
    assert.match(html(), /formsubmit\.co/);
    assert.doesNotMatch(html(), /mailto:mistfrontvilla@gmail\.com/);
  });

  it("marks required fields with a red asterisk and required labels", () => {
    assert.match(html(), /Fields marked with/);
    assert.match(css(), /\.required[\s\S]*color:\s*#c62828/i);
    for (const label of [
      "Full name",
      "Email",
      "Phone number",
      "Number of people",
      "Arrival date",
      "Departure date",
    ]) {
      assert.match(html(), new RegExp(`data-required-label="${label}"`));
      assert.match(
        html(),
        new RegExp(`${label}[\\s\\S]*?class="required"`, "i")
      );
    }
    assert.match(html(), /\(optional\)/);
  });

  it("collects name, email, people count, arrival, departure, and message", () => {
    assert.match(html(), /name="name"/);
    assert.match(html(), /name="email"/);
    assert.match(html(), /name="number_of_people"/);
    assert.match(html(), /name="arrival_date"/);
    assert.match(html(), /name="departure_date"/);
    assert.match(html(), /name="message"/);
    assert.match(html(), /type="date"/);
  });

  it("splits phone into optional +prefix and local number", () => {
    assert.match(html(), /name="phone_prefix"/);
    assert.match(html(), /name="phone"/);
    assert.match(html(), /value="91"/);
    assert.match(html(), /maxlength="3"/);
    assert.match(html(), /phone-plus/);
    assert.match(html(), /phone-prefix-box/);
    assert.match(css(), /\.phone-prefix-box/);
    assert.match(css(), /\.phone-plus/);
  });

  it("includes WhatsApp availability on the right side of the form", () => {
    assert.match(html(), /name="whatsapp_available"/);
    assert.match(html(), /This number is available on WhatsApp/);
    assert.match(html(), /form-spacer/);
    assert.match(css(), /\.form-spacer/);
  });

  it("does not expose location sharing controls", () => {
    assert.doesNotMatch(html(), /Share my location/i);
    assert.doesNotMatch(html(), /data-geo-button/);
    assert.doesNotMatch(js(), /getCurrentPosition/);
  });
});

describe("enquiry client behavior", () => {
  it("loads shared validation and blocks invalid submissions", () => {
    assert.match(js(), /MistfrontEnquiry/);
    assert.match(js(), /validateForm/);
    assert.match(js(), /phoneError|phone_full/);
    assert.match(js(), /whatsapp_available/);
    assert.match(js(), /Departure date must be after|departureOrderError/);
    assert.match(validation(), /normalizePrefix/);
    assert.match(validation(), /phoneError/);
    assert.match(validation(), /buildPhoneFull/);
  });

  it("submits through FormSubmit AJAX to the enquiry inbox", () => {
    assert.match(js(), /formsubmit\.co\/ajax\/mistfrontvilla@gmail\.com/);
    assert.match(js(), /buildPhoneFull|phone_full/);
  });
});

describe("dynamic gallery", () => {
  it("builds gallery.json from images in src/images", () => {
    const data = gallery();
    assert.ok(Array.isArray(data.images));
    assert.ok(data.images.length >= 4);
    const sources = data.images.map((item) => item.src);
    for (const name of ["1.jpg", "2.jpg", "3.jpg", "4.jpg"]) {
      assert.ok(sources.includes(`images/${name}`), `gallery missing ${name}`);
    }
    assert.ok(!sources.includes("images/hero.jpg"));
  });

  it("loads the gallery manifest in the client script", () => {
    assert.match(js(), /gallery\.json/);
    assert.match(js(), /buildSlides|loadGallery/);
  });
});

describe("privacy constraints", () => {
  for (const label of ["index.html", "styles.css", "script.js", "gallery.json", "enquiry-validation.js"]) {
    it(`omits owner phone numbers from ${label}`, () => {
      const content =
        label === "index.html"
          ? html()
          : label === "styles.css"
            ? css()
            : label === "script.js"
              ? js()
              : label === "enquiry-validation.js"
                ? validation()
                : fs.readFileSync(galleryPath, "utf8");

      for (const pattern of OWNER_PHONE_PATTERNS) {
        assert.doesNotMatch(content, pattern);
      }
    });
  }
});

describe("visual system", () => {
  it("implements slideshow controls", () => {
    assert.match(js(), /data-slideshow/);
    assert.match(js(), /data-prev|data-next/);
    assert.match(js(), /slideshow-dot|goTo/);
  });

  it("defines brand-facing CSS variables and form alignment styles", () => {
    assert.match(css(), /--forest/);
    assert.match(css(), /\.hero/);
    assert.match(css(), /\.slideshow/);
    assert.match(css(), /\.enquire-form\s+\.form-grid/);
    assert.match(css(), /\.phone-group/);
  });
});
