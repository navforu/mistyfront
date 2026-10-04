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
const galleryPath = path.join(srcDir, "gallery.json");
const imagesDir = path.join(srcDir, "images");
const workflowPath = path.join(root, ".github", "workflows", "deploy-pages.yml");

const PHONE_PATTERNS = [/9894748313/, /9600418844/, /href\s*=\s*["']tel:/i];

before(() => {
  execFileSync("python", [path.join(root, "scripts", "generate_gallery.py")], {
    cwd: root,
    stdio: "pipe",
  });
});

const html = () => fs.readFileSync(htmlPath, "utf8");
const css = () => fs.readFileSync(cssPath, "utf8");
const js = () => fs.readFileSync(jsPath, "utf8");
const gallery = () => JSON.parse(fs.readFileSync(galleryPath, "utf8"));

describe("project layout", () => {
  it("keeps site code under src/", () => {
    assert.ok(fs.existsSync(htmlPath));
    assert.ok(fs.existsSync(cssPath));
    assert.ok(fs.existsSync(jsPath));
    assert.ok(fs.existsSync(imagesDir));
  });

  it("includes a GitHub Pages deploy workflow", () => {
    assert.ok(fs.existsSync(workflowPath));
    assert.match(fs.readFileSync(workflowPath, "utf8"), /deploy-pages/);
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
    for (const id of ["highlights", "gallery", "stay", "location"]) {
      assert.match(html(), new RegExp(`id="${id}"`));
    }
  });

  it("wires stylesheet, script, and slideshow shell", () => {
    assert.match(html(), /href="styles\.css(?:\?[^"]*)?"/);
    assert.match(html(), /src="script\.js(?:\?[^"]*)?"/);
    assert.match(html(), /data-slideshow/);
    assert.match(html(), /slideshow-stage/);
  });

  it("shows the property address and enquiry form", () => {
    assert.match(html(), /KCP Etti Farms/i);
    assert.match(html(), /Ettimadai/i);
    assert.match(html(), /Coimbatore/i);
    assert.match(html(), /Contact for details/i);
    assert.match(html(), /id="enquire"/);
    assert.match(html(), /data-enquire-form/);
    assert.match(html(), /mistfrontvilla@gmail\.com/);
    assert.match(html(), /formsubmit\.co/);
    assert.match(html(), /name="email"/);
    assert.match(html(), /name="phone"/);
    assert.match(html(), /name="trip_dates"/);
    assert.match(html(), /name="number_of_people"/);
    assert.doesNotMatch(html(), /Share my location/i);
    assert.doesNotMatch(html(), /data-geo-button/);
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
  const labels = ["index.html", "styles.css", "script.js", "gallery.json"];

  for (const label of labels) {
    it(`omits phone numbers from ${label}`, () => {
      const content =
        label === "index.html"
          ? html()
          : label === "styles.css"
            ? css()
            : label === "script.js"
              ? js()
              : fs.readFileSync(galleryPath, "utf8");

      for (const pattern of PHONE_PATTERNS) {
        assert.doesNotMatch(content, pattern);
      }
    });
  }
});

describe("client scripts and styles", () => {
  it("implements slideshow controls", () => {
    assert.match(js(), /data-slideshow/);
    assert.match(js(), /data-prev|data-next/);
    assert.match(js(), /slideshow-dot|goTo/);
  });

  it("submits the enquiry form by email gateway", () => {
    assert.match(js(), /formsubmit\.co\/ajax\/mistfrontvilla@gmail\.com/);
    assert.doesNotMatch(js(), /getCurrentPosition/);
  });

  it("defines brand-facing CSS variables", () => {
    assert.match(css(), /--forest/);
    assert.match(css(), /\.hero/);
    assert.match(css(), /\.slideshow/);
  });
});
