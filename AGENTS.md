# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project purpose

Mistfront is a **static marketing site** for a private weekend rental. Keep the experience calm, brand-led, and image-forward. Prefer small, deliberate changes over framework rewrites.

## Source of truth

| Path | Role |
|------|------|
| `src/` | All published site code and images |
| `scripts/generate_gallery.py` | Builds `src/gallery.json` from `src/images/` |
| `tests/` | Automated checks for structure and privacy constraints |
| `.github/workflows/deploy-pages.yml` | GitHub Pages deploy |
| `README.md` | Human setup and run instructions |

Do not leave production HTML/CSS/JS at the repo root. New pages, styles, scripts, and media belong under `src/`.

## Gallery rule

- Adding photos to `src/images/` must update the gallery via `gallery.json`.
- Do not hardcode gallery slides in `index.html`.
- Regenerate with `python scripts/generate_gallery.py` (also runs on `npm start` and in CI).
- Exclude flyer/reference assets and files starting with `_` or `.`.

## Non-negotiable content rules

- **Never publish** personal phone numbers unless the owner explicitly requests it.
- The KCP Etti Farms address, Maps link, and `mistfrontvilla@gmail.com` enquiry email are allowed.
- **Contact for details** must use the on-page enquiry form (not mailto). The form collects name, email, phone, trip dates, number of people, and optional message, then emails via FormSubmit.
- Keep the Mistfront brand and tagline (“Where the Mountains Meet the Mist”) prominent in the first viewport.
- Do not deploy flyer images that embed phone numbers.

## Design constraints

- Static HTML/CSS/JS only unless the owner asks for a framework.
- Preserve the forest-green / mist palette and serif+sans pairing already in use.
- Hero stays full-bleed: brand, one headline, one short supporting sentence, CTA group, dominant photo.
- Avoid card clutter in the hero and avoid generic purple/cream AI-template aesthetics.

## Working conventions

1. Edit files in `src/`; update `tests/` when structure or privacy rules change.
2. Run `npm run gallery` after changing images, then `npm test` / `npm run test:py`.
3. Serve from `src/` (`npm start`).
4. Do not commit secrets, credentials, or private contact details.
5. Do not create commits or PRs unless the user asks.

## Useful commands

```bash
npm start
npm run gallery
npm test
npm run test:py
python scripts/generate_gallery.py
python -m http.server 5500 --directory src
python tests/site_test.py
```
