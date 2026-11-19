[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/0xrifai/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/0xrifai/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice Cover Studio

A GTA 6-style cover art maker that runs fully offline in a desktop browser. Drop in your own photo, spread it across 2–4 poster panels, add a bold caption, pick a Vice City sunset or neon colour grade, and export a share-ready PNG in 1080×1080, 1080×1350 or 1920×1080.

## What it does

- **Any photo** — upload a photo from your machine and crop + position it per panel (drag on the preview, scroll to zoom, or use the sliders). Fill several panels with one photo or a different photo per panel.
- **Multi-panel poster look** — 2, 3 or 4 vertical panels over a sunset backdrop, with thin gaps, inner panel frames and a white poster border.
- **Bold lettering** — an editable caption with a heavy outline, a slight poster tilt and a "VICE CITY" kicker line.
- **Colour grades** — Vice Sunset (orange/magenta), Neon Nights (cyan/magenta) and Palm Dusk (deep purple), drawn as canvas gradients and vignettes.
- **Fast export** — one click downloads a real PNG at the post size you picked.
- **Load sample** — draws a fully procedural sunset portrait scene (canvas-drawn person, skyline and palms) so you can try the editor and export a cover without any real photo.
- **Private by design** — static files only, zero network requests, no libraries. Your photos never leave your machine.

## Run it

Serve `app/` with any static server and open `index.html` in desktop Chrome:

```sh
python3 -m http.server 8080 --directory app
```

No build step, no dependencies. Everything the page loads lives under `app/`.

## Files

- `app/index.html` — the editor page
- `app/app.js` — editor state, panel controls, drag/zoom, PNG export
- `app/cover.js` — the cover renderer (panels, grades, caption)
- `app/sample.js` — the procedural sample scene (drawn portrait + sunset city)
- `app/style.css` — editor styling
- `main.ts` — the make.fun entrypoint: copies `app/` + `screenshots/` to the output dir and writes `dossier.json`

## Originality

All art is drawn in code. No Rockstar Games logos, artwork, characters or fonts are used anywhere — the lettering uses system fonts (Arial Black / Impact) and the sample scene is an original canvas drawing.

## License

MIT — see [LICENSE](LICENSE).
