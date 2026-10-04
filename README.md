# Mistfront

Static website for the **Mistfront** weekend retreat at the foothills of the Western Ghats.

The site showcases the A-frame cabin, main villa, and pool. Personal contact details, street address, phone numbers, and pricing are intentionally omitted from the published site.

Live site (GitHub Pages): https://navforu.github.io/mistyfront/

## Project layout

```text
mistyfront/
├── src/                 # Site source deployed to GitHub Pages
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   ├── gallery.json     # generated from images/
│   └── images/
├── scripts/
│   └── generate_gallery.py
├── tests/
├── .github/workflows/   # Pages deploy
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

Pushing to `main` runs `.github/workflows/deploy-pages.yml`, which:

1. Regenerates `gallery.json`
2. Runs the Python site checks
3. Publishes the contents of `src/` to GitHub Pages

One-time repo setting (if Pages is not already using Actions):

1. Open the repo on GitHub → **Settings** → **Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**

Site URL: https://navforu.github.io/mistyfront/

## Tests

```bash
npm test
npm run test:py
```

Tests verify layout, branding, dynamic gallery generation, the Pages workflow, and privacy constraints (no phone numbers or nightly rate).

## Content notes

- Brand: Mistfront
- Tagline: Where the Mountains Meet the Mist
- Published site may include photos and property amenities only
- Do not publish phone numbers, street address, maps links to a private address, or nightly rates unless owners explicitly ask
