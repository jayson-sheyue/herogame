# Web publishing

**English** | [简体中文](WEB-PUBLISHING.zh-CN.md)

Live game: **[jayson-sheyue.github.io/herogame](https://jayson-sheyue.github.io/herogame/)**.
Players need a desktop browser and keyboard, with no installation or account. Select a fighter and click **FIGHT** or press **J / Enter**. Mobile touch controls are not implemented.

## GitHub Pages

The `Publish web game` [workflow](../.github/workflows/pages.yml) runs checks, builds the game and deploys on every push to `main`. Repository Settings → Pages must use **GitHub Actions** as the source. Deployment status and the itch.io package are available under [Actions](https://github.com/jayson-sheyue/herogame/actions/workflows/pages.yml).

The published directory contains `index.html`, browser scripts, fonts, Phaser **3.80.1** and game assets. It requires only static HTTPS hosting; `serve.py`, Python and Node.js are not needed on the player’s machine or production server. Paths are relative, so both repository subdirectories and itch.io embeds work.

Selection uses generated small arena previews, portraits and exact first-frame poses instead of full animation sheets. Fonts are subset to the published UI and metadata. Japanese uses bundled DotGothic16 and Yuji Boku fonts; the exporter verifies Japanese UI and super-title glyph coverage and includes the [font licenses](../game/fonts/README.md). Fighter sheets use lossless WebP, with every decoded RGBA pixel checked against the original during the build. Full fighter animations and the selected arena load when starting a fight; the catalog is bundled so selection does not fetch a separate JSON for each fighter and stage. Original imported files are preserved. Load time still depends on network speed and device performance; no fixed three-second guarantee is made.

## Build and preview

Python 3.11+ and Node.js 22+ are development requirements. Run from the repository root:

```bash
python3 game/check.py
python3 -m venv .venv
.venv/bin/pip install -r game/requirements-web.txt
.venv/bin/python game/build_web.py
python3 -m http.server 8792 --bind 127.0.0.1 --directory dist
```

Open **http://127.0.0.1:8792/herogame/**. This tests the same subdirectory layout as Pages. Windows uses `.venv\Scripts\python` and `.venv\Scripts\pip`.

Output: `dist/herogame/` and `dist/herogame-itch.zip`. Choose another fresh directory with `--output dist/preview-2` for a subsequent build; existing output is not overwritten. The exporter includes only Git-tracked assets, reads their current working-tree content and never modifies the source. Use a clean checkout for publication; CI builds the exact pushed commit. Build optimizers are development-only dependencies. The bundled engine’s MIT notice is at [game/vendor/PHASER-LICENSE.txt](../game/vendor/PHASER-LICENSE.txt).

## itch.io HTML5 upload

Use the **herogame-itch-html5** artifact from a successful workflow for the same commit deployed to Pages. Extract the Actions artifact wrapper first; upload the inner **`herogame-itch.zip`**, which has `index.html` at its root.

1. Sign in to the intended itch.io account and create or edit the game project.
2. Set **Kind of project → HTML**. Upload `herogame-itch.zip` and select **This file will be played in the browser**.
3. Use **Click to launch in fullscreen** or an embedded viewport of **1344 × 870**. Keep click-to-play enabled so keyboard focus and audio start from the player’s gesture. The game scales its canvas and has its own fullscreen button.
4. Do not mark the game mobile-friendly: combat currently requires a keyboard.
5. Preview selection, all three interface languages, stage changes, combat, skills, supers, pause and return-to-select in the actual embed before making the project public.

The build checks itch.io’s documented limits: at most 1,000 files, 500 MB extracted, 200 MB per file and 240-character paths. File names are case-sensitive. Successful packaging alone does not mean an itch.io project has been uploaded or published.

Official references: [itch.io HTML5 requirements](https://itch.io/docs/creators/html5), [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [fontTools subsetting](https://fonttools.readthedocs.io/en/latest/subset/index.html).
