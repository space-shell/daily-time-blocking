# CLAUDE.md — Development Guide

## Project Overview

Daily Time Blocking is a browser-based daily planner. Users lay out coloured time blocks on a 9am–8pm timeline, write a focus intention, pick a wallpaper theme, and download the result as a phone wallpaper PNG. Blocks can also be exported as an `.ics` calendar file. A Settings panel lets users rename block types, change the default block size, and configure download filenames. All state is persisted to `localStorage`; there is no back-end.

## Repository Layout

```
public/
  index.html          — app shell; mounts Preact via importmap
  style.css           — all styling; mobile breakpoint at ≤640px
  app.js              — entry point: loads storage, mounts app, runs effects
  state/
    signals.js        — all signals, constants, and mutations
  components/
    App.js            — root layout: header, tab bar, panels, settings overlay
    Timeline.js       — timeline grid, drop zones, placed blocks
    PlacedBlock.js    — individual placed block (drag, resize, delete)
    PaletteBlock.js   — draggable/tappable palette entry
    DragGhost.js      — floating drag preview element
    Settings.js       — full-screen settings overlay
  lib/
    canvas.js         — wallpaper rendering (Canvas API)
    drag.js           — drag-and-drop logic (desktop)
    resize.js         — block resize logic (mouse + touch)
    storage.js        — localStorage load on init
    calendar.js       — .ics file generation and download
user-stories/         — one .md file per user story
CLAUDE.md             — this file
README.md             — project introduction
```

## Tech Constraints

- **No build step.** Served as static files; Preact and signals loaded from `esm.sh` via an importmap in `index.html`.
- **Preact + @preact/signals + htm/preact** — components use tagged-template JSX via `htm`. All reactive state lives in signals.
- **Critical importmap rule:** `@preact/signals` and `htm/preact` must use `?external=preact` in their `esm.sh` URLs, or each CDN package bundles its own Preact copy → signals patch the wrong instance → no reactive re-renders.
- **No other external dependencies** beyond Google Fonts (decorative only — app degrades gracefully without them).
- **Canvas API** for wallpaper generation (`renderWallpaper()` in `lib/canvas.js`).
- **localStorage** for all persistence (blocks, intentions, theme, duration, block settings, filename prefixes).

## Key Constants (`state/signals.js`)

| Constant | Value | Meaning |
|---|---|---|
| `SLOT_H` | 60 | Pixel height of one 30-min slot on screen |
| `SLOT_MIN` | 30 | Minutes per timeline slot |
| `DAY_START` | 9 × 60 | Timeline starts at 09:00 |
| `DAY_END` | 20 × 60 | Timeline ends at 20:00 |
| `SLOTS` | (DAY_END − DAY_START) / SLOT_MIN | Total slot count |
| `BLOCK_TYPES` | `['peak','focus','meetings','admin','buffer']` | Canonical type order |
| `BLOCK_ICONS` | `{ peak: '◆', … }` | Icon per type (used in palette, legend, settings) |
| `BLOCK_COLOR_VARS` | `{ peak: 'var(--peak)', … }` | CSS variable per type |
| `BLOCK_DEFAULTS` | `{ peak: { label, hint }, … }` | Factory defaults for block names |

## Signals Reference (`state/signals.js`)

| Signal | Default | Meaning |
|---|---|---|
| `currentDate` | today | The day currently being viewed |
| `days` | `{}` | All blocks keyed by `YYYY-MM-DD` |
| `intentions` | `{}` | Focus intentions keyed by `YYYY-MM-DD` |
| `currentTheme` | `'dark'` | Active wallpaper theme key |
| `selectedDur` | `60` | Default block duration in minutes |
| `phoneModel` | `'generic-1080'` | Selected phone model for wallpaper export |
| `blockSettings` | (BLOCK_DEFAULTS copy) | Per-type `{ label, hint }` — user-customisable |
| `icsPrefix` | `'timeblocks'` | Prefix for downloaded `.ics` filename |
| `imgPrefix` | `'timeblock'` | Prefix for downloaded `.png` filename |
| `settingsOpen` | `false` | Whether the settings overlay is visible |
| `dlHref` | `'#'` | Data URL for the wallpaper download link |

## Layout

Desktop uses a CSS grid: `260px | 1fr | 320px` over two rows (header + content). At ≤640px the grid switches to a flex-column with a Palette / Timeline / Preview tab bar — only one panel is visible at a time.

## Interaction Patterns

| Context | Interaction |
|---|---|
| Desktop | Drag palette blocks onto timeline; drag placed blocks to move; mouse-drag resize handle |
| Mobile | Tap palette block to select → auto-switch to Timeline tab → tap a slot to place; touch-drag resize handle |

The `isMobile()` helper (`window.matchMedia('(max-width: 640px)').matches`) gates all touch-specific code paths.

## Settings System

Settings are accessed via the **⚙ Settings** button in the Palette panel (below the legend). They open as a full-screen overlay rendered by `Settings.js`.

| Setting | Signal | Persisted key |
|---|---|---|
| Block labels and hint text | `blockSettings` | `tb_block_settings` |
| Default block size | `selectedDur` | `tb_dur` |
| Calendar export filename prefix | `icsPrefix` | `tb_ics_prefix` |
| Wallpaper filename prefix | `imgPrefix` | `tb_img_prefix` |

Settings take effect immediately (signals update on each keystroke / selection). Changing a block name updates the palette and legend live; blocks already placed on the timeline keep the label they were given at placement time.

## Calendar Export

`lib/calendar.js` exports `downloadICS()`. It reads `blocks.value` and `currentDate.value`, converts each block's `startMin`/`durMin` to `DTSTART`/`DTEND` timestamps, and generates a standards-compliant iCalendar (`.ics`) file. The filename is `{icsPrefix}-YYYY-MM-DD.ics`. The button sits above "Save to phone" in the Preview panel.

## Adding a New Block Type

1. Add a CSS variable and `.palette-block.<type>` / `.placed-block.<type>` rule in `style.css`.
2. Add the hex colour to `TYPE_COLORS` in `state/signals.js`.
3. Add the type key to `BLOCK_TYPES`, an icon to `BLOCK_ICONS`, a CSS var to `BLOCK_COLOR_VARS`, and default label/hint to `BLOCK_DEFAULTS` in `state/signals.js`.

## Adding a New Theme

Add an entry to `THEMES` in `state/signals.js` with `bg1`, `bg2`, `text`, `muted`, `accent`, and `isDark`. Add a corresponding dot to `THEME_DOTS` in `components/App.js`.

## Wallpaper Render

`renderWallpaper()` redraws the canvas on every meaningful state change (block add/move/resize/delete, intention edit, theme change, day shift, phone model change). It updates `dlHref.value` to the canvas PNG data URL. The effect in `app.js` that triggers re-renders subscribes to `blocks`, `intention`, `currentTheme`, `currentDate`, and `phoneModel`.

## localStorage Persistence

`lib/storage.js` loads all keys once on init. `app.js` runs a single `effect()` that saves every tracked signal on change. The first run of the effect is skipped (data was just loaded from storage).

| Key | Value |
|---|---|
| `tb_days` | `{ "YYYY-MM-DD": [...blocks] }` |
| `tb_intentions` | `{ "YYYY-MM-DD": "string" }` |
| `tb_theme` | Theme name string |
| `tb_phone` | Phone model key string |
| `tb_dur` | Duration in minutes as string |
| `tb_block_settings` | `{ peak: { label, hint }, … }` |
| `tb_ics_prefix` | String |
| `tb_img_prefix` | String |

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
- [ ] Settings changes persist after page refresh
- [ ] Wallpaper renders correctly for all four themes
- [ ] Calendar export produces a valid `.ics` file
- [ ] No console errors on init
