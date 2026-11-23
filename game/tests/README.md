# PVE verification

**English** | [简体中文](README.zh-CN.md)

Run `python3 game/check.py` from the repository root. Requires Python 3.11+ and Node.js 22+, with no additional dependencies.

## Automated checks

- Python and JavaScript syntax checks.
- `game.test.cjs`: PVE opponents, selected stage and difficulty, duplicate-start protection, stage wrapping, selection persistence and obsolete mode-parameter cleanup, shared mirror-match assets, fighter/stage readiness, refreshed metadata, paused cooldowns, difficulty behavior, wins/losses/double knockouts, texture caching and preview dimensions.
- `shell.test.cjs`: keyboard isolation for help and native controls, pause/resume and input-buffer clearing, repeated focus loss, mute preferences including no-audio environments, loading recovery, rematch data retention and closing help during a fight.

These use lightweight scene and DOM substitutes. They do not replace Phaser rendering tests or exhaustive checks of every move. Removed game modes and their dedicated room tests are outside the current version.

## Recorded PVE acceptance

2026-11-19, macOS, local browser, Python 3.14 / Node.js 25:

- 19 automated regressions and syntax checks passed at the PVE-only stage.
- Keyboard selection changed both fighters, the stage and all three difficulties. Mouse clicks on opponent portraits, fighter tiles, stage arrows and difficulty buttons produced the expected changes.
- A Chiang Kai-shek mirror match loaded, counted down, fought and reached its result. Enter started a rematch. The return button and Esc returned to Select while preserving fighters and stage.
- Zhen Huan / Newton and Zhen Huan / Lu Bu entered fights; the latter used another stage. Movement, skills, help, pause and resume were exercised.
- Opening the Move List paused a fight; closing it resumed play. Closing help on Select restored selection controls.
- Mute and fullscreen entry/exit worked. Refresh preserved mute, difficulty, fighter and stage choices.
- Desktop 1280×850 and portrait 390×844 were inspected. Selection and combat scaled within the viewport; help and the bottom Start action remained accessible. Portrait mode recommended landscape and a physical keyboard. No touch combat controls are provided.
- The real local HTTP server returned 200 for the page, scripts, font and asset index. Removed `/src/net.js` and `/api/lan` returned 404.
- Captured browser error/warning logs were empty.

Not every fighter move or stage collision was checked, and Windows, Linux and all browser engines were not verified. Loading-failure recovery was covered with substitutes without damaging real assets. No speaker/audio-quality acceptance is claimed.

## Interface-language acceptance

This increment was originally completed on `codex/pve-arcade`, adding English / Chinese settings while keeping Chinese as the initial default.

- 27 automated regressions passed, including eight added language checks: explicit default and preference restoration, unavailable storage, page/accessible-label coverage, text-binding cleanup, asset-name fallback, error recovery, and localization without changing health or the combat clock.
- The local browser exercised Chinese → English → Chinese → English, preserving selections and stage. Refresh restored English. English selection, help, loading, HUD, super titles (`SUPER` / `The Upper Hand`), results and rematch worked.
- Changing language during an ongoing, damaged fight updated names and hints without reinitializing health bars or fighter positions. English help paused and resumed normally.
- Desktop 1280×850 and portrait 390×844 were checked for toolbar fit, help wrapping and the Start action. A CSS scope issue that drew a portrait hint below the desktop canvas was corrected.
- Captured browser error/warning logs were empty during these checks. Failed loading and blocked storage were tested with substitutes rather than damaging assets or changing browser privacy settings.

Language switching does not translate voice recordings or text embedded in artwork. The nine built-in playable fighters and twelve stages have English display names. Imported packs use their own English metadata when supplied, otherwise the authored name. Full user guides are linked from the repository's `README.md` and `README.zh-CN.md`.

## Localized effects and README gallery acceptance

2026-11-19, macOS, local browser at 1280×720:

- 29 automated regressions passed. The new rendering-contract check covers all nine built-in super names plus the super tag in Chinese → English → Chinese, logical display sizing, viewport width limits, texture disposal and language-listener cleanup. Canvas pixel appearance is checked in the browser; the automated check uses rendering substitutes.
- Real keyboard input triggered Lu Bu’s halberd throw and mounted super, Newton’s spectrum beam, and Hawking’s super. The README gallery has seven real screenshots per language: selection, two skills, two super cut-ins and two arenas. Each README references only its own language directory.
- Super cut-ins use the same red/black carved effect in both languages. Latin titles use measured glyph widths; the 3x baked textures render at logical dimensions. Live language switching repaints an active cut-in; selection headings, loading headings, the Select footer label and the ready indicator also follow the chosen language.

2026-11-20: Super lettering now varies glyph size, baseline and angle, splits prefixes from enlarged impact words, uses paper-colored lead glyphs, and enters diagonally. Chinese and English Lu Bu / Hawking cut-ins were exercised and their four README screenshots replaced. The 29 regressions also check font-size and angle variation, both facing angles, rotated bounds and texture disposal for all nine built-in titles.

2026-11-20: Visible ink is now cropped before display scaling, so transparent font margins cannot shrink the lettering. Move names fill an envelope up to 78% of game width / 80% of game height; the super tag aligns to the outer edge. The 30 regressions include a transparent-margin crop case and a minimum envelope-fill assertion. The four bilingual cut-in screenshots were refreshed and supers now use full-width README images.

## Performance boundaries

The game retains a maximum 1024×576 preview texture, per-texture frame-scan caching, loading only the current battle stage, and 30 Hz HUD updates while combat runs every frame. Selection no longer polls room or roster data; refresh after importing assets. No measured FPS or total-memory claim is made.

## Static web export

2026-11-20: 33 automated regressions and syntax checks passed, including the bundled catalog, one-frame selection previews and relative arena-preview URLs. The exporter validates page dependencies and all published fighter/stage file references, checks itch.io file/size/path limits, and verifies every converted fighter sheet against the original decoded RGBA pixels. The current build contains nine playable fighters and twelve stages.

The actual export was served under a subdirectory, then exercised in a browser: English/Chinese selection, fight loading, Lu Bu’s halberd skill and English super, pause/resume, Move List and return to selection. Captured warnings/errors were empty. This does not claim all moves, every arena, mobile touch play or a fixed cold-load time.

## Automatic interface language

2026-11-20: The initial-language rule now follows browser preferences instead of always starting in Chinese. 36 automated regressions pass, covering Chinese/English locale variants, ordered preferences, unsupported/missing language fallback, both existing manual choices, returning to Auto, live languagechange events and blocked browser storage. Existing manual choices retain priority; Auto does not persist an implicit manual selection. Earlier fixed-default records above describe the previous behavior.

## Japanese localization

2026-11-23: 40 regressions and syntax checks pass. Japanese now has complete message coverage, built-in fighter/stage names, imported `i18n.ja.displayName` / `displayNameJa` fallback, `ja` / `ja-JP` auto-detection, saved manual preferences and live language changes. Effect checks cover all nine supers and the super tag in Chinese → English → Japanese → Chinese, including the Japanese brush family and texture cleanup. The real fight localization check preserves health/combat time while changing Japanese HUD names and fonts; results retain their source key for live translation.

The actual static export passed Japanese UI and brush-glyph coverage checks using the exported WOFF2 files. In the browser at 1280×720, Japanese selection, Lu Bu / Newton skills, Lu Bu / Hawking supers, help, pause/resume, three-language switching and the lunar arena were exercised. Seven Japanese screenshots accompany `README.ja.md`. A 390×844 viewport had no horizontal document overflow; the Japanese Move List and Close button remained visible. Browser voice quality, every move and every arena are not claimed as verified.

Long Japanese full names on the two selection panels also shrink to fit their nameplates; Chinese and English retain their normal size when they fit.
