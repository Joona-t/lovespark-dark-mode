# LoveSpark Dark Mode

Three beautiful themes for every website — dark mode, bubblegum pink, and hot pink. Free, open-source, and part of the [LoveSpark suite](https://lovespark.love).

## What it does

LoveSpark Dark Mode applies a website-wide theme filter (dark mode plus two retro-pink variants) to any page you visit, with per-site toggling and persistent preferences. It's built for reading comfort — dark environments for eye strain and light sensitivity, and playful high-contrast pink themes for users who want the LoveSpark aesthetic everywhere they browse.

## Features

- 🌙 **Three themes** — Dark, Bubblegum Pink, Hot Pink (Slate/Beige theme options for the popup UI itself)
- 🖱️ **One-click toggle** — apply or remove the active theme per site
- 💾 **Persistent settings** — your theme choice and per-site preferences are saved locally
- 🆓 **Always free & open source** — MIT licensed
- 🔒 **Zero tracking** — all settings stay in local storage

## Permissions

- `storage` — save theme preferences and per-site settings locally
- `tabs` — apply/remove the theme on the active tab and track per-tab state
- `scripting` — inject the CSS/JS that applies the selected theme to the page
- `alarms` — scheduled housekeeping (e.g. daily stat reset)
- `<all_urls>` (host permission) — the theme filter needs to be applicable to any website you choose to browse with it on

## Install

Load unpacked from this repo via `chrome://extensions` (Developer Mode → Load unpacked), or install from the Chrome Web Store / Firefox Add-ons once published.

## Development

- Manifest V3, vanilla JS, no frameworks
- Shared LoveSpark theme/lib in `lib/`
- See `BUGS_AND_ITERATIONS.md` for the build/fix history

## License

MIT — see [LICENSE](LICENSE).
