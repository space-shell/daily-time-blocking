# Migration Plan: Vanilla JS → Preact + Signals (Build-less ESM)

## Overview

The app has ~630 lines of JavaScript in three logical groupings:

- **State**: `currentDate`, `days{}`, `intentions{}`, `selectedDur`, `currentTheme`, drag/resize transient state
- **DOM imperative loops**: `buildTimeline()` creates 17 time rows and attaches 4 event listeners each; `renderBlocks()` tears down and rebuilds all placed-block DOM nodes
- **Side effects that cascade**: every user action ends with `saveToStorage()` then `renderWallpaper()`, called imperatively

The migration goal is to replace all of this with Preact components driven by signals, while keeping `style.css`, Canvas API, and localStorage logic intact.

---

## 1. Import Map Setup in `index.html`

Replace `<script src="app.js">` with an import map and a module entry point. The import map lets every file write `import { signal } from '@preact/signals'` without a bundler.

Place this in `<head>`, before any `<script type="module">`:

```html
<script type="importmap">
{
  "imports": {
    "preact":            "https://esm.sh/preact@10.26.1",
    "preact/hooks":      "https://esm.sh/preact@10.26.1/hooks",
    "preact/compat":     "https://esm.sh/preact@10.26.1/compat",
    "@preact/signals":   "https://esm.sh/@preact/signals@1.3.2",
    "htm/preact":        "https://esm.sh/htm@3.1.1/preact"
  }
}
</script>
<script type="module" src="app.js"></script>
```

Pin exact patch versions to avoid surprise breakage from CDN updates. `htm/preact` is the pre-bound variant that exports `html` already wired to `preact.h` — no manual binding needed.

Every file then starts with:

```js
import { html }                        from 'htm/preact';
import { render }                      from 'preact';
import { useRef, useEffect }           from 'preact/hooks';
import { signal, computed, effect }    from '@preact/signals';
```

The `<body>` becomes just a mount point:

```html
<body>
  <div id="root"></div>
</body>
```

The drag ghost `<div id="dragGhost">` is rendered by the `DragGhost` component.

---

## 2. State Model: Signals vs Derived Computations

### Primitive Signals (source of truth)

| Signal | Type | Replaces |
|---|---|---|
| `currentDate` | `signal(today)` | `let currentDate` |
| `days` | `signal({})` | `const days = {}` |
| `intentions` | `signal({})` | `const intentions = {}` |
| `selectedDur` | `signal(60)` | `let selectedDur` |
| `currentTheme` | `signal('dark')` | `let currentTheme` |
| `tapSelected` | `signal(null)` | `let tapSelected` |
| `activeTab` | `signal('palette')` | implicit in `switchTab()` |
| `dropGhostSlot` | `signal(null)` | drives `#dropGhost` positioning |
| `dlHref` | `signal('#')` | `#dlBtn.href` updated imperatively |

`dragging`, `dragOffsetSlot`, and `resizeState` remain plain `let` variables — they are transient interaction state that does not drive a re-render, and updating them as signals would cause unnecessary reconciliation during fast pointer moves.

### Computed (derived) Signals

```js
const dateKey     = computed(() => currentDate.value.toISOString().slice(0, 10));
const blocks      = computed(() => days.value[dateKey.value] || []);
const intention   = computed(() => intentions.value[dateKey.value] || '');
const dayLabel    = computed(() => currentDate.value
  .toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase());
const daySubLabel = computed(() => {
  const d = currentDate.value;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
    + (isToday(d) ? ' \u00B7 Today' : '');
});
const durBadge    = computed(() =>
  selectedDur.value >= 60 ? `${selectedDur.value / 60}h` : `${selectedDur.value}m`);
```

`blocks` is the key one: whenever `days` or `dateKey` changes, any component reading `blocks.value` re-renders automatically. This replaces `getBlocks()` entirely.

### Critical: Mutating Object-Valued Signals

`days` and `intentions` are objects inside signals. Signals use reference equality, so you **must replace the object, not mutate it**:

```js
// Wrong — Preact will not detect this
days.value[key] = [...existing, newBlock];

// Correct
days.value = { ...days.value, [key]: [...existing, newBlock] };
```

This is the single most important invariant to maintain throughout the migration.

---

## 3. Component Tree

```
App
├── DragGhost                    (fixed position, reads dragging module var)
├── AppHeader
│   ├── DayNav
│   │   ├── <button> prev
│   │   ├── DayDisplay           (reads dayLabel, daySubLabel signals)
│   │   ├── <button> next
│   │   └── <button> today
│   └── <button> Refresh
├── MobileTabBar                 (reads activeTab signal)
├── PalettePanel                 (hidden/shown via activeTab on mobile)
│   ├── IntentionInput           (reads/writes intention signal)
│   ├── DurationSelector         (reads/writes selectedDur signal)
│   ├── PaletteBlockList
│   │   └── PaletteBlock × 5    (reads durBadge, tapSelected signals)
│   └── Legend
├── TimelinePanel                (hidden/shown via activeTab on mobile)
│   ├── TapHint                  (reads tapSelected signal)
│   └── Timeline
│       ├── DropGhost            (reads dropGhostSlot signal)
│       ├── EmptyState           (reads blocks signal)
│       ├── TimeRow × 22        (static; attaches dragover/drop/click via props)
│       └── PlacedBlock × N     (reads blocks signal; resize handle via useRef)
└── PreviewPanel                 (hidden/shown via activeTab on mobile)
    ├── ThemeDots                (reads currentTheme signal)
    ├── <a> Download             (reads dlHref signal)
    └── <canvas id="wallCanvas"> (imperative; renderWallpaper writes to it)
```

---

## 4. Component Specifications

### `App`

- Mounts with `render(html\`<${App} />\`, document.getElementById('root'))`
- On mount: calls `loadFromStorage()`, hydrates all signals
- Owns no props; all state is module-level signals
- Attaches `document`-level drag and key listeners in `useEffect(fn, [])`

### `AppHeader`

Reads `dayLabel`, `daySubLabel`. Buttons call `shiftDay()` and `goToday()` which update `currentDate.value`.

### `MobileTabBar`

Reads `activeTab.value`. Sets `class=${activeTab.value === 'palette' ? 'tab-btn active' : 'tab-btn'}` inline.

Note: `paletteTap()` now sets both `tapSelected.value = type` and `activeTab.value = 'timeline'` in one call.

### `IntentionInput`

Controlled input: `value=${intention.value}`. On `input` event: writes to `intentions` signal. The wallpaper effect handles the re-render automatically.

### `DurationSelector`

Each button: `onClick=${() => { selectedDur.value = dur; }}`. The localStorage effect handles persistence.

### `PaletteBlock`

Reads `durBadge.value` for the badge label and `tapSelected.value` to apply `tap-selected` CSS class. Handles `onDragStart` (desktop) and `onClick` (mobile tap) via Preact props.

### `TapHint`

Reads `tapSelected.value`. `class=${tapSelected.value ? 'tap-hint' : 'tap-hint hidden'}`.

### `Timeline`

Renders 22 static `TimeRow` elements plus N dynamic `PlacedBlock` elements. Drop zones attach via Preact event props (`onDragOver`, `onDragLeave`, `onDrop`, `onClick`).

```js
blocks.value.map(b => html`<${PlacedBlock} key=${b.id} block=${b} />`)
```

### `DropGhost`

```js
function DropGhost() {
  const slot = dropGhostSlot.value;
  if (!slot) return null;
  return html`<div class="drop-ghost"
    style=${{ display: 'block', top: `${slot.top}px`, height: `${slot.height}px` }}
  ></div>`;
}
```

### `PlacedBlock`

Props: `block`. Computes top/height from `block.startMin` and `block.durMin`. Attaches resize handlers via `useRef` because `touchstart` requires `{ passive: false }` — this cannot be set via Preact's synthetic event props:

```js
function PlacedBlock({ block }) {
  const resizeRef = useRef(null);
  useEffect(() => {
    const el = resizeRef.current;
    el.addEventListener('touchstart', resizeTouchStart, { passive: false });
    el.addEventListener('mousedown',  resizeMouseDown);
    return () => {
      el.removeEventListener('touchstart', resizeTouchStart);
      el.removeEventListener('mousedown',  resizeMouseDown);
    };
  }, [block.id]);
  // ...
}
```

`[block.id]` dependency ensures the effect only re-runs if identity changes (not on every resize step).

The `key=${block.id}` on every `PlacedBlock` in the parent is critical: because block IDs are stable across moves and resizes, Preact patches the existing element rather than remounting it, keeping the `useEffect` listeners intact throughout a gesture.

### `ThemeDots`

Reads `currentTheme.value`. On click: `currentTheme.value = theme`.

### `PreviewPanel`

The `<canvas>` element is rendered by Preact but written to imperatively by `renderWallpaper()`. The download `<a>` reads `dlHref.value`.

---

## 5. Side-Effect Strategy

### Wallpaper Re-render

Replace every manual `renderWallpaper()` call with a single module-level effect:

```js
effect(() => {
  void blocks.value;
  void intention.value;
  void currentTheme.value;
  void currentDate.value;
  queueMicrotask(() => renderWallpaper());
});
```

`queueMicrotask` defers until after signal propagation completes but before the next frame. Place this **after** `render()` to ensure the canvas element exists in the DOM.

`renderWallpaper()` in `lib/canvas.js` must import and read directly from signals (`blocks.value`, `intention.value`, etc.) rather than from the old mutable globals.

### localStorage Sync

```js
let storageReady = false;
effect(() => {
  const d   = days.value;
  const i   = intentions.value;
  const t   = currentTheme.value;
  const dur = selectedDur.value;
  if (!storageReady) { storageReady = true; return; }
  try {
    localStorage.setItem('tb_days',       JSON.stringify(d));
    localStorage.setItem('tb_intentions', JSON.stringify(i));
    localStorage.setItem('tb_theme',      t);
    localStorage.setItem('tb_dur',        String(dur));
  } catch (_) {}
});
```

The `storageReady` flag skips the first (init-time) run to avoid writing back what was just loaded.

---

## 6. Drag-and-Drop and Touch Interaction

### Desktop Drag (Palette → Timeline)

`dragging` and `dragOffsetSlot` stay as plain `let` variables — no signal needed, purely transient.

The `DragGhost` component renders `<div id="dragGhost">` to the DOM; `showGhost()`, `moveGhost()`, `hideGhost()` manipulate its style imperatively at pointer-move frequency to avoid Preact reconciliation overhead.

`document.addEventListener('dragend', ...)` and `document.addEventListener('mousemove', moveGhost)` go in a `useEffect(fn, [])` inside `App`.

### Timeline Drop Zones

`TimeRow` components attach via Preact props:

```js
html`<div class="drop-zone" data-slot=${s}
  onDragOver=${zoneDragOver}
  onDragLeave=${zoneDragLeave}
  onDrop=${zoneDrop}
  onClick=${zoneTap}
></div>`
```

`zoneDrop` and `zoneTap` update `days.value = { ... }` to trigger re-render.

### Resize Handle: `passive: false` is Mandatory

Preact's `onTouchStart` prop registers a **passive** listener. `resizeTouchStart` calls `e.preventDefault()` to suppress scroll, which silently fails in passive mode. The `useRef` + `addEventListener(..., { passive: false })` pattern in `PlacedBlock` (above) is the required fix.

---

## 7. File Structure After Migration

```
public/
  index.html            — import map, <div id="root">, <script type="module" src="app.js">
  style.css             — unchanged
  app.js                — entry: imports, signal definitions, effects, render()
  components/
    App.js
    AppHeader.js
    DayNav.js
    MobileTabBar.js
    PalettePanel.js
    IntentionInput.js
    DurationSelector.js
    PaletteBlock.js
    TimelinePanel.js
    TapHint.js
    Timeline.js
    TimeRow.js
    PlacedBlock.js
    DropGhost.js
    EmptyState.js
    PreviewPanel.js
    ThemeDots.js
    DragGhost.js
  state/
    signals.js           — signal(), computed() declarations; THEMES, TYPE_COLORS, constants
  lib/
    storage.js           — loadFromStorage() for initial hydration
    canvas.js            — renderWallpaper(), roundRect(), wrapText(), minToTime()
    drag.js              — palette drag, placed block drag, ghost helpers, zone handlers
    resize.js            — resizeMouseDown/Move/Up, resizeTouchStart/Move/End
    mobile.js            — isMobile(), paletteTap(), zoneTap()
```

`app.js` entry point:

```js
import { render }          from 'preact';
import { html }            from 'htm/preact';
import { effect }          from '@preact/signals';
import { loadFromStorage } from './lib/storage.js';
import { renderWallpaper } from './lib/canvas.js';
import {
  blocks, intention, currentTheme, currentDate,
  days, intentions, selectedDur
} from './state/signals.js';
import App from './components/App.js';

loadFromStorage();

render(html`<${App} />`, document.getElementById('root'));

// After render() so canvas element exists in DOM
effect(() => {
  void blocks.value; void intention.value;
  void currentTheme.value; void currentDate.value;
  queueMicrotask(() => renderWallpaper());
});

let storageReady = false;
effect(() => {
  const snap = {
    d: days.value, i: intentions.value,
    t: currentTheme.value, dur: selectedDur.value
  };
  if (!storageReady) { storageReady = true; return; }
  try {
    localStorage.setItem('tb_days',       JSON.stringify(snap.d));
    localStorage.setItem('tb_intentions', JSON.stringify(snap.i));
    localStorage.setItem('tb_theme',      snap.t);
    localStorage.setItem('tb_dur',        String(snap.dur));
  } catch (_) {}
});
```

---

## 8. Migration Sequencing

The strategy is **add Preact alongside the existing code, then progressively hollow out the vanilla JS**. The app remains fully functional at every step.

### Step 1 — Add the import map, keep `app.js` unchanged

Verify the app still works with the import map present. No Preact code yet. Confirms CDN URLs are reachable and the import map does not break anything.

### Step 2 — Extract `state/signals.js` and `lib/canvas.js`

Extract constants, signal declarations into `state/signals.js`. Extract `renderWallpaper()` and helpers into `lib/canvas.js`. These modules are not imported anywhere yet — the vanilla `app.js` still runs.

### Step 3 — Mount a no-op Preact `App`

Add `<div id="root"></div>` to `index.html`. Keep the vanilla `<script src="app-vanilla.js">` running alongside `<script type="module" src="app.js">`. The new `app.js` mounts an empty `<App />` fragment. Confirms Preact loads and mounts without conflict.

### Step 4 — Migrate `AppHeader` and `MobileTabBar`

Replace `<header>` and `<nav class="tab-bar">` with Preact-rendered equivalents. Wire `currentDate` signal to day navigation buttons. Remove `updateDayDisplay()` from vanilla code — the signal-driven computed handles it.

### Step 5 — Migrate `PalettePanel`

Replace `<aside class="palette">`. Wire `IntentionInput` → `intention` signal, `DurationSelector` → `selectedDur` signal, `PaletteBlock` taps → `tapSelected` signal. Remove `syncIntentionInput`, `selectDur`, `updateBadges`, `paletteTap`, `updateTapHint` from vanilla code.

### Step 6 — Migrate `PreviewPanel`

Replace `<aside class="preview-panel">`. Wire `ThemeDots` → `currentTheme` signal. Canvas element rendered by Preact, written to imperatively. Wire `dlHref` signal to the download link.

### Step 7 — Migrate `Timeline` and `PlacedBlock`

The heaviest step. Replace `<main class="timeline-wrap">`. Render time rows and drop zones via Preact. Render `PlacedBlock` list from `blocks.value`. Wire drop handlers to update `days.value`. Wire delete to `days.value`. Wire resize handle via `useRef` + `useEffect` with `{ passive: false }`.

Remove from vanilla code: `buildTimeline`, `renderBlocks`, `checkEmpty`, all zone handlers, `deleteBlock`, all resize handlers.

### Step 8 — Add module-level `effect()` calls

Add the wallpaper and localStorage effects in `app.js`. Remove the explicit `renderWallpaper()` and `saveToStorage()` calls from all event handlers.

### Step 9 — Remove `app-vanilla.js`

Delete the vanilla script tag. Move remaining utilities to their modules. App is fully Preact.

### Step 10 — Smoke-test against dev checklist

- [ ] Desktop drag-and-drop
- [ ] Mobile tap-to-place
- [ ] Touch resize (DevTools simulation)
- [ ] localStorage round-trip (refresh page)
- [ ] All four theme wallpaper renders
- [ ] No console errors on init

---

## 9. Gotchas and Risks

### Import Maps: Safari < 16.4

Import maps require Safari 16.4+ (March 2023). Devices on iOS 16.3 or earlier will fail. Add `es-module-shims` as a fallback if older devices need to be supported:

```html
<script async src="https://esm.sh/es-module-shims@1"></script>
```

### `htm` and HTML Entities

`htm` uses template literals — `&hellip;` and `&mdash;` are **not** parsed as HTML entities. Convert every `&entity;` to a Unicode escape (`\u2026`, `\u2014`) or a literal Unicode character before removing the static HTML.

### `passive: false` on Touch Events

Preact's `onTouchStart` prop always registers a passive listener. Any handler that calls `e.preventDefault()` (resize, potentially drag over drop zones) **must** use `useRef` + `addEventListener(..., { passive: false })` in `useEffect`. This is not optional — passive violation is silently ignored and the browser scroll wins.

### Signal Mutation with Object State

Never mutate `days.value` or `intentions.value` in place. Always create a new object reference. Failing to do this is the most common source of silent "UI stopped updating" bugs with signals.

### `renderWallpaper()` Must Read from Signals

After migration, `renderWallpaper()` in `lib/canvas.js` must import and read from signals (`blocks.value`, `intention.value`, etc.) rather than the old globals. Update `canvas.js` as part of Step 2.

### `effect()` Runs Before Canvas Exists

A module-level `effect(() => renderWallpaper())` placed before `render()` will fire before the `<canvas>` element is in the DOM. Place the effect **after** `render()`, or guard with `if (!document.getElementById('wallCanvas')) return;` inside `renderWallpaper()`.

### `key` Prop Stability During Resize

The `key=${block.id}` on `PlacedBlock` must be stable across mutations. Because `block.id` never changes (only `startMin`/`durMin` change), Preact patches rather than remounts — keeping `useEffect` listeners alive through a resize gesture. If IDs were regenerated on mutation, every resize step would remount the block and break the gesture.

### Serve via HTTP, not `file://`

`type="module"` scripts are blocked by CORS when opened as `file://`. Always use a static server:

```
python3 -m http.server 8080
# or
npx serve public
```

This is not a build step — it is an HTTP server constraint that also applied to the vanilla app if it loaded external resources.
