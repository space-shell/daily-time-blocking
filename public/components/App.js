import { html }      from 'htm/preact';
import { useEffect }  from 'preact/hooks';
import {
  dayLabel, daySubLabel, shiftDay, goToday,
  intention, setIntention,
  currentTheme, activeTab, tapSelected,
  dlHref, isMobile, THEMES,
  phoneModel, PHONE_MODELS,
  settingsOpen, blockSettings, BLOCK_TYPES, BLOCK_ICONS, BLOCK_COLOR_VARS, imgPrefix,
} from '../state/signals.js';
import { renderWallpaper } from '../lib/canvas.js';
import { onDragEnd }       from '../lib/drag.js';
import { downloadICS }     from '../lib/calendar.js';
import DragGhost           from './DragGhost.js';
import PaletteBlockList    from './PaletteBlock.js';
import Timeline            from './Timeline.js';
import Settings            from './Settings.js';

// ── Header ────────────────────────────────────────────────────────
function AppHeader() {
  return html`
    <header>
      <h1>Time Blocks</h1>
      <div class="day-nav">
        <button onClick=${() => shiftDay(-1)}>\u2039</button>
        <div>
          <div class="day-display">${dayLabel.value}</div>
          <div class="day-display day-sub">${daySubLabel.value}</div>
        </div>
        <button onClick=${() => shiftDay(1)}>\u203a</button>
        <button class="today-btn" onClick=${goToday}>Today</button>
      </div>
      <button class="gen-btn" onClick=${renderWallpaper}>\u21BB Refresh</button>
    </header>
  `;
}

// ── Tab bar ───────────────────────────────────────────────────────
function MobileTabBar() {
  const tabs = ['palette', 'timeline', 'preview'];
  return html`
    <nav class="tab-bar">
      ${tabs.map(t => html`
        <button
          key=${t}
          class=${`tab-btn${activeTab.value === t ? ' active' : ''}`}
          data-tab=${t}
          onClick=${() => activeTab.value = t}
        >
          ${t.charAt(0).toUpperCase() + t.slice(1)}
        </button>
      `)}
    </nav>
  `;
}

// ── Palette panel ─────────────────────────────────────────────────
function PalettePanel() {
  const isActive  = !isMobile() || activeTab.value === 'palette';
  const dragLabel = isMobile() ? 'Tap to select' : 'Drag onto timeline';

  function handleIntentionInput(e) {
    setIntention(e.target.value);
  }

  return html`
    <aside class=${`palette${activeTab.value === 'palette' ? ' tab-active' : ''}`}>

      <div class="palette-section">
        <h3>Focus intention</h3>
        <div class="intention-input">
          <label>Today\u2019s priority</label>
          <input
            type="text"
            id="intentionInput"
            placeholder="Ship the draft before lunch\u2026"
            value=${intention.value}
            onInput=${handleIntentionInput}
          />
        </div>
      </div>

      <div class="palette-section">
        <h3>${dragLabel}</h3>
        <${PaletteBlockList} />
      </div>

      <div class="palette-section">
        <h3>Legend</h3>
        <div style="display:flex;flex-direction:column;gap:0.4rem;font-size:0.65rem;color:var(--muted2)">
          ${BLOCK_TYPES.map(type => {
            const { label, hint } = blockSettings.value[type];
            return html`
              <div key=${type}>
                <span style=${{ color: BLOCK_COLOR_VARS[type] }}>${BLOCK_ICONS[type]}</span>
                ${' '}${label} \u2014 ${hint}
              </div>
            `;
          })}
        </div>
        <button class="settings-open-btn" onClick=${() => settingsOpen.value = true}>
          \u2699 Settings
        </button>
      </div>

    </aside>
  `;
}

// ── Timeline panel ────────────────────────────────────────────────
function TimelinePanel() {
  return html`
    <main class=${`timeline-wrap${activeTab.value === 'timeline' ? ' tab-active' : ''}`} id="timelineWrap">
      <div class=${`tap-hint${tapSelected.value ? '' : ' hidden'}`} id="tapHint">
        ${tapSelected.value ? `Tap a time slot to place ${tapSelected.value.label}` : ''}
      </div>
      <${Timeline} />
    </main>
  `;
}

// ── Preview panel ─────────────────────────────────────────────────
const THEME_DOTS = [
  { theme: 'dark',   bg: '#0e0e0e', border: 'var(--peak)' },
  { theme: 'navy',   bg: '#0a1628', border: null },
  { theme: 'purple', bg: '#1a0a2e', border: null },
  { theme: 'paper',  bg: '#f0ebe0', border: null },
];

function PreviewPanel() {
  return html`
    <aside class=${`preview-panel${activeTab.value === 'preview' ? ' tab-active' : ''}`}>
      <div class="preview-panel-header">
        <h3>Wallpaper preview</h3>
        <div class="theme-dots">
          ${THEME_DOTS.map(({ theme, bg, border }) => html`
            <div
              key=${theme}
              class=${`theme-dot${currentTheme.value === theme ? ' active' : ''}`}
              style=${{ background: bg, ...(border ? { borderColor: border } : {}) }}
              data-theme=${theme}
              onClick=${() => { currentTheme.value = theme; renderWallpaper(); }}
            ></div>
          `)}
        </div>
      </div>
      <div class="preview-scroll">
        <button class="dl-btn cal-btn" onClick=${downloadICS}>
          \u2193 Export to calendar (.ics)
        </button>
        <div class="phone-selector">
          <label>Phone</label>
          <select value=${phoneModel.value}
                  onChange=${e => { phoneModel.value = e.target.value; renderWallpaper(); }}>
            <option value="generic-1080">Generic 1080p</option>
            <optgroup label="iPhone">
              ${PHONE_MODELS.filter(m => m.group === 'iPhone').map(m =>
                html`<option key=${m.key} value=${m.key}>${m.label}</option>`)}
            </optgroup>
            <optgroup label="Samsung">
              ${PHONE_MODELS.filter(m => m.group === 'Samsung').map(m =>
                html`<option key=${m.key} value=${m.key}>${m.label}</option>`)}
            </optgroup>
            <optgroup label="Google">
              ${PHONE_MODELS.filter(m => m.group === 'Google').map(m =>
                html`<option key=${m.key} value=${m.key}>${m.label}</option>`)}
            </optgroup>
          </select>
        </div>
        <a class="dl-btn" id="dlBtn" href=${dlHref.value} download=${`${imgPrefix.value}.png`}>
          \u2193 Save to phone
        </a>
        <canvas id="wallCanvas" width="1080" height="1920"></canvas>
        <div class="hint-box">
          <strong>MacroDroid tip:</strong> always save as the same filename.
          MacroDroid applies it at 8:50am automatically \u2014 so it\u2019s waiting
          on your screen when you arrive at work.
        </div>
      </div>
    </aside>
  `;
}

// ── Root ──────────────────────────────────────────────────────────
export default function App() {
  useEffect(() => {
    document.addEventListener('dragend', onDragEnd);
    return () => document.removeEventListener('dragend', onDragEnd);
  }, []);

  // On mobile, boot into palette tab
  useEffect(() => {
    if (isMobile()) activeTab.value = 'palette';
  }, []);

  return html`
    <div class="app">
      <${DragGhost} />
      <${AppHeader} />
      <${MobileTabBar} />
      <${PalettePanel} />
      <${TimelinePanel} />
      <${PreviewPanel} />
      <${Settings} />
    </div>
  `;
}
