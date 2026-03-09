# CLAUDE.md — Development Guide

## Project Overview

Daily Time Blocking is a browser-based daily planner. Users lay out coloured time blocks on a 9am–8pm timeline, write a focus intention, pick a wallpaper theme, and download the result as a 1080×1920 PNG phone wallpaper. All state is persisted to `localStorage`; there is no back-end.

## Repository Layout

```
public/
  index.html   — app shell, grid layout, inline event handlers
  style.css    — all styling; mobile breakpoint at ≤768px
  app.js       — all logic: state, drag/drop, touch, canvas render
user-stories/  — one .md file per user story
CLAUDE.md      — this file
README.md      — project introduction
```

## Tech Constraints

- **No framework, no build step.** Plain HTML/CSS/JS, served as static files.
- **No external dependencies** beyond Google Fonts (decorative only — app degrades gracefully without them).
- **Canvas API** for wallpaper generation (`renderWallpaper()` in `app.js`).
- **localStorage** for all persistence (blocks, intentions, theme, duration preference).

## Key Constants (`app.js`)

| Constant | Value | Meaning |
|---|---|---|
| `SLOT_H` | 60 | Pixel height of one 30-min slot on screen |
| `SLOT_MIN` | 30 | Minutes per timeline slot |
| `DAY_START` | 9 × 60 | Timeline starts at 09:00 |
| `DAY_END` | 20 × 60 | Timeline ends at 20:00 |
| `SLOTS` | (DAY_END − DAY_START) / SLOT_MIN | Total slot count |

## Layout

Desktop uses a CSS grid: `260px | 1fr | 320px` over two rows (header + content). At ≤768px the grid switches to a flex-column with a Palette / Timeline / Preview tab bar — only one panel is visible at a time.

## Interaction Patterns

| Context | Interaction |
|---|---|
| Desktop | Drag palette blocks onto timeline; drag placed blocks to move; mouse-drag resize handle |
| Mobile | Tap palette block to select → auto-switch to Timeline tab → tap a slot to place; touch-drag resize handle |

The `isMobile()` helper (`window.matchMedia('(max-width: 768px)').matches`) gates all touch-specific code paths. `paletteDragStart` and `showGhost` are no-ops on mobile.

## Adding a New Block Type

1. Add a CSS variable and `.palette-block.<type>` / `.placed-block.<type>` rule in `style.css`.
2. Add the hex colour to `TYPE_COLORS` in `app.js`.
3. Add the palette block HTML in `index.html` (with `onclick="paletteTap(this)"` and `ondragstart="paletteDragStart(event)"`).

## Adding a New Theme

Add an entry to `THEMES` in `app.js` with `bg1`, `bg2`, `text`, `muted`, `accent`, and `isDark`. Add a `<div class="theme-dot">` in `index.html`.

## Wallpaper Render

`renderWallpaper()` redraws the full 1080×1920 canvas on every meaningful state change (block add/move/resize/delete, intention edit, theme change, day shift). It also updates `#dlBtn.href` to the canvas PNG data URL so the download link is always current.

## Git Workflow

- Branch naming: `claude/<feature>-<session-id>`
- Commits should be atomic and describe intent, not mechanics
- Always push with `git push -u origin <branch-name>`

## Development Checklist

Before committing:
- [ ] Desktop drag-and-drop still works
- [ ] Mobile tap-to-place still works
- [ ] Touch resize works on a real device or DevTools touch simulation
- [ ] `localStorage` round-trips correctly (refresh page, data should reappear)
- [ ] Wallpaper renders correctly for all four themes
- [ ] No console errors on init
