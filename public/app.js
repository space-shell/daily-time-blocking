import { render }  from 'preact';
import { html }     from 'htm/preact';
import { effect }   from '@preact/signals';
import { loadFromStorage } from './lib/storage.js';
import { renderWallpaper } from './lib/canvas.js';
import {
  blocks, intention, currentTheme, currentDate,
  days, intentions, selectedDur,
} from './state/signals.js';
import App from './components/App.js';

// ── 1. Hydrate signals from localStorage ─────────────────────────
loadFromStorage();

// ── 2. Mount the Preact app ───────────────────────────────────────
render(html`<${App} />`, document.getElementById('root'));

// ── 3. Wallpaper re-render effect ─────────────────────────────────
// Runs after render() so the <canvas> element exists in the DOM.
// queueMicrotask defers until after signal propagation completes.
effect(() => {
  void blocks.value;
  void intention.value;
  void currentTheme.value;
  void currentDate.value;
  queueMicrotask(() => renderWallpaper());
});

// ── 4. localStorage persistence effect ───────────────────────────
// Skip the first run (the data was just loaded from storage).
let _storageReady = false;
effect(() => {
  const d   = days.value;
  const i   = intentions.value;
  const t   = currentTheme.value;
  const dur = selectedDur.value;
  if (!_storageReady) { _storageReady = true; return; }
  try {
    localStorage.setItem('tb_days',       JSON.stringify(d));
    localStorage.setItem('tb_intentions', JSON.stringify(i));
    localStorage.setItem('tb_theme',      t);
    localStorage.setItem('tb_dur',        String(dur));
  } catch (_) {}
});
