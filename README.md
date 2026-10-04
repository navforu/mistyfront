# Mistfront

Static website for the **Mistfront** weekend retreat at the foothills of the Western Ghats.

The site showcases the A-frame cabin, main villa, and pool, plus the KCP Etti Farms address. Guests enquire through an on-page form that emails `mistfrontvilla@gmail.com`. Property owner phone numbers are intentionally omitted from the published site.

Live site (GitHub Pages): https://navforu.github.io/mistyfront/

## Project layout

```text
mistyfront/
├── src/                 # Site source deployed to GitHub Pages
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   ├── enquiry-validation.js
│   ├── gallery.json     # generated from images/
│   └── images/
├── scripts/
│   └── generate_gallery.py
├── tests/               # Node + Python suites
├── .github/workflows/   # CI + Pages deploy
├── AGENTS.md
├── package.json
└── README.md
```

## Prerequisites

- Python 3 (local server, gallery generation, and Python tests)
- Node.js 18+ on your PATH (optional, for the Node test runner)

## Local development

From the repository root:

```bash
npm start
```

This regenerates `src/gallery.json` from `src/images/`, then serves the site.

Equivalent commands:

```bash
python scripts/generate_gallery.py
python -m http.server 5500 --directory src
```

Open [http://127.0.0.1:5500](http://127.0.0.1:5500).

## Adding photos to the gallery

1. Drop image files into `src/images/` (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif`).
2. Run `npm run gallery` or `npm start` (or push to `main` — CI regenerates the manifest).
3. The slideshow reads `gallery.json` and includes every eligible photo automatically.

Notes:

- Do not add flyer images that contain phone numbers, prices, or street addresses.
- Files starting with `_` or `.` are ignored.
- Captions come from the filename (`pool-view.jpg` → “Pool View”; `5.jpg` → “Photo 5”).

## GitHub Pages

Pushing to `main` runs `.github/workflows/deploy-pages.yml` with three jobs:

1. **test** — regenerates `gallery.json` and runs the full Python + Node suites
2. **build** — packages `src/` for GitHub Pages (only after tests pass)
3. **deploy** — publishes the site

Pull requests and non-`main` branches run `.github/workflows/ci.yml` (**test** only). Pushes to `main` use Deploy GitHub Pages alone so tests are not duplicated.

One-time repo setting (if Pages is not already using Actions):

1. Open the repo on GitHub → **Settings** → **Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**

Site URL: https://navforu.github.io/mistyfront/

## Tests

```bash
npm run test:all
```

Or separately:

```bash
npm test
npm run test:py
```

Coverage includes:

- Site layout under `src/` and gallery auto-generation
- Branding, address, and FormSubmit enquiry form
- Required-field asterisks and shared validation rules
- Phone prefix (`+91` default, max 3 digits) and WhatsApp checkbox
- Arrival/departure date rules
- Owner phone numbers stay unpublished
- CI workflows that execute these suites

## Content notes

- Brand: Mistfront
- Tagline: Where the Mountains Meet the Mist
- Address: KCP Etti Farms, SF No. 141, Iyyampathi Road, Chinniya Goundan Pudur, Ettimadai, Coimbatore, Tamil Nadu 641105
- Do not publish owner phone numbers (or flyer images that contain them) unless owners explicitly ask
- Enquiry form uses [FormSubmit](https://formsubmit.co/) to email `mistfrontvilla@gmail.com`
- After the first live submission, confirm the activation email FormSubmit sends to that inbox
