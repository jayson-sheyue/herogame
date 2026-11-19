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

## Performance boundaries

The game retains a maximum 1024×576 preview texture, per-texture frame-scan caching, loading only the current battle stage, and 30 Hz HUD updates while combat runs every frame. Selection no longer polls room or roster data; refresh after importing assets. No measured FPS or total-memory claim is made.
