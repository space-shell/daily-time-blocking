import { html }      from 'htm/preact';
import { useEffect }  from 'preact/hooks';
import {
  dayLabel, daySubLabel, shiftDay, goToday,
  selectedDur, intention, setIntention,
  currentTheme, activeTab, tapSelected,
  dlHref, isMobile, THEMES,
} from '../state/signals.js';
import { renderWallpaper } from '../lib/canvas.js';
import { onDragEnd }       from '../lib/drag.js';
import DragGhost           from './DragGhost.js';
import PaletteBlockList    from './PaletteBlock.js';
import Timeline            from './Timeline.js';

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
const DUR_OPTIONS = [
  { dur: 30, label: '30 min' },
  { dur: 60, label: '1 hr'   },
  { dur: 90, label: '1.5 hr' },
  { dur: 120, label: '2 hr'  },
];

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
        <h3>Block duration</h3>
        <div class="duration-selector">
          ${DUR_OPTIONS.map(({ dur, label }) => html`
            <button
              key=${dur}
              class=${`dur-btn${selectedDur.value === dur ? ' active' : ''}`}
              onClick=${() => { selectedDur.value = dur; }}
            >
              ${label}
            </button>
          `)}
        </div>
      </div>

      <div class="palette-section">
        <h3>${dragLabel}</h3>
        <${PaletteBlockList} />
      </div>

      <div class="palette-section">
        <h3>Legend</h3>
        <div style="display:flex;flex-direction:column;gap:0.4rem;font-size:0.65rem;color:var(--muted2)">
          <div><span style="color:var(--peak)">\u25C6</span> Peak \u2014 best cognitive work</div>
          <div><span style="color:var(--focus)">\u25CF</span> Focus \u2014 steady effort</div>
          <div><span style="color:var(--meetings)">\u25CE</span> Meetings \u2014 social energy</div>
          <div><span style="color:var(--admin)">\u25A3</span> Admin \u2014 low-effort tasks</div>
          <div><span style="color:var(--muted2)">\u25CB</span> Buffer \u2014 transition time</div>
        </div>
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
        <a class="dl-btn" id="dlBtn" href=${dlHref.value} download="timeblock.png">
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
    </div>
  `;
}
