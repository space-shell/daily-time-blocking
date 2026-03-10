# US-010 — Persist Data Between Sessions

**As a** user,
**I want to** return to the app and find my schedule still there,
**So that** I don't have to re-enter my plan if I close the browser or switch tabs.

## Acceptance Criteria

- [ ] All placed blocks are saved to `localStorage` on every change
- [ ] Focus intentions are saved per day
- [ ] The selected wallpaper theme is saved and restored
- [ ] The selected phone model is saved and restored
- [ ] The selected block duration is saved and restored
- [ ] Custom block names and hints are saved and restored
- [ ] Calendar export filename prefix is saved and restored
- [ ] Wallpaper filename prefix is saved and restored
- [ ] Data is keyed by calendar date (`YYYY-MM-DD`) so each day is independent
- [ ] On page load, the app restores all saved state before rendering

## Storage Keys

| Key | Value |
|---|---|
| `tb_days` | JSON object: `{ "YYYY-MM-DD": [ ...blocks ] }` |
| `tb_intentions` | JSON object: `{ "YYYY-MM-DD": "intention string" }` |
| `tb_theme` | Theme name string (e.g. `"dark"`) |
| `tb_phone` | Phone model key string (e.g. `"iphone-16-pm"`) |
| `tb_dur` | Duration in minutes as string (e.g. `"60"`) |
| `tb_block_settings` | JSON object: `{ peak: { label, hint }, … }` |
| `tb_ics_prefix` | Calendar filename prefix string (e.g. `"timeblocks"`) |
| `tb_img_prefix` | Wallpaper filename prefix string (e.g. `"timeblock"`) |

## Notes

All storage operations are wrapped in `try/catch` to handle environments where `localStorage` is unavailable (private browsing, storage quota exceeded). `lib/storage.js` loads all keys once on init; `app.js` runs a single `effect()` that saves all tracked signals on any change, skipping the first run to avoid a redundant write immediately after loading.
