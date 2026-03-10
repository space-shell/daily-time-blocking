# US-004 — Save Schedule as Phone Wallpaper

**As a** user,
**I want to** download my daily schedule as a phone wallpaper image,
**So that** my plan is visible on my lock screen throughout the day without opening an app.

## Acceptance Criteria

- [ ] A "Save to phone" button is visible in the Preview panel
- [ ] Clicking the button downloads a PNG file named `{imgPrefix}.png` (default: `timeblock.png`)
- [ ] The wallpaper is rendered at the resolution of the selected phone model
- [ ] The wallpaper includes: date, day name, focus intention, time blocks, hour lines, and a footer quote
- [ ] The download link updates automatically whenever any block, intention, or theme changes
- [ ] The canvas preview is a scaled-down version of the full-resolution wallpaper
- [ ] The wallpaper filename prefix is configurable in Settings (US-012)

## Phone Model Presets

The phone selector in the Preview panel lets users choose their device; the canvas renders at that device's exact pixel dimensions. Generic 1080p is the default.

## MacroDroid Integration

Save the file as the same filename every time (default: `timeblock.png`). A MacroDroid macro can watch for that file and apply it as wallpaper automatically at a set time (e.g. 8:50am) so it's on your screen when you arrive at work. The fixed filename is preserved by default — only change `imgPrefix` in Settings if you intentionally want a different name.

## Related

- **US-011** — Export schedule to calendar (.ics) for the companion export feature
