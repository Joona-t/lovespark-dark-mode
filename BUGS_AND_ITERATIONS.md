# Bugs & Iterations

## : |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu

**Problem:** |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu
**Files:** manifest.json,popup.css
**Commit:** 09e1ace

## : |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)

**Problem:** |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)
**Files:** manifest.json,popup.css,settings.css
**Commit:** 7045eb0

## : |2026-03-05|||fix: replace broken footer with aesthetic ls-footer

**Problem:** |2026-03-05|||fix: replace broken footer with aesthetic ls-footer
**Files:** lib/lovespark-base.css,lib/lovespark-footer.css,lib/lovespark-footer.js,manifest.json,popup.html
**Commit:** b714c92

<!-- Format:
## YYYY-MM-DD: Short Title

**Problem:** What went wrong or needed changing
**Root cause:** Why it happened
**Fix:** What was done to resolve it
-->


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits

## 2026-07-08: ls-check gate red (7 fails) blocking governance README commit — BUG-001

**Problem:** The repo had no README.md (per fleet audit `~/meta_implementation.md` §6), and the docs-only commit adding one was blocked by `ls-check .` reporting 7 pre-existing failures unrelated to the README itself: `A11Y-DIALOG` (popup.html missing `role="dialog"`/`aria-labelledby`), `A11Y-EXPANDED` (theme dropdown trigger missing `aria-expanded`), `A11Y-LABEL` (3 emoji-only buttons in settings.html missing `aria-label`), `BRAND-SPARKY` (mascot.png only existed under `icons/`, not at repo root where the check looks), `BRAND-LIB-WIRED` (popup.html never loaded `lib/lovespark-base.css` / `lib/lovespark-theme.js`), and `BRAND-LIB-SYNC` (`lib/lovespark-tokens.css` was a stale/mismatched copy of the canonical shared-lib file).
**Root cause:** popup.html/popup.js pre-date the shared a11y + shared-lib conventions that later sibling extensions (e.g. lovespark-bionic-reading) already follow — the dropdown, dialog semantics, and theme system were all hand-rolled locally instead of wired to `lib/lovespark-theme.js`, and the mascot/token-sync steps from `scripts/sync-shared-lib.sh` were never run for this repo.
**Fix:** Wired `lib/lovespark-base.css` + `lib/lovespark-theme.js` into popup.html (cascade-safe: popup.css's own `:root`/theme blocks load after and still win on shared property names — verified via headless-Chrome screenshot, no visual regression); added `role="dialog"` + `aria-labelledby`/`aria-describedby` on `<body>` with matching `id`s on the title/subtitle; added `aria-expanded`/`aria-haspopup`/`aria-label` to the theme toggle button; added `aria-label` to the 3 emoji-only buttons in settings.html; copied `icons/mascot.png` to repo-root `mascot.png` (BRAND-SPARKY checks root, not `icons/`); replaced popup.js's duplicated hand-rolled dropdown logic with a call to the shared `LoveSparkTheme.init()` (kept a small one-time `darkMode`→`theme` storage-key migration shim so existing installs don't lose their saved theme, since the shared lib's `init()` no longer reads the legacy key); re-synced `lib/lovespark-tokens.css` from the canonical shared-lib copy. Left `BRAND-TOKEN-DRIFT` red — confirmed via spot-check on lovespark-focus that it fails identically fleet-wide (design-tokens/generated vs. canonical shared-lib drift, unrelated to this repo, out of scope for a repo-scoped unit — requires touching shared infra outside this repo). `ls-check .` went from 31 pass/7 fail/5 warn to 37 pass/1 fail (pre-existing, fleet-wide)/5 warn.
**Files:** popup.html, popup.js, settings.html, lib/lovespark-tokens.css, mascot.png (new), manifest.json (version bump)
**Commit:** (this commit)

## 2026-10-07: Theme dropdown `aria-expanded` never updated after opening — BUG-002

**Problem:** BUG-001 added a static `aria-expanded="false"` to the `#themeToggle` trigger in popup.html to satisfy `A11Y-EXPANDED`, but the attribute was never flipped when the menu opened, so screen readers were told the dropdown was collapsed while it was visibly open (WCAG 2.1 SC 4.1.2 Name/Role/Value).
**Root cause:** The dropdown logic now lives in the shared `lib/lovespark-theme.js`, which toggles the `.open` class on `#themeMenu` but has no ARIA handling; the shared lib is synced from canonical and must not be edited locally, so the state sync has to live in popup.js.
**Fix:** popup.js observes `#themeMenu`'s `class` attribute with a `MutationObserver` and mirrors `classList.contains('open')` into `#themeToggle`'s `aria-expanded`. manifest.json bumped 2.0.36 → 2.0.37.
**Regression check (no test harness in this repo):** `grep -c "setAttribute('aria-expanded'" popup.js` → `1`; `grep -c "MutationObserver" popup.js` → `1`; `ls-check .` → 0 fail. Manual: load unpacked, open popup, click "Change theme", inspect `#themeToggle` → `aria-expanded="true"`; click elsewhere → `"false"`.
**Files:** popup.js, manifest.json
