import { html } from 'htm/preact';
import {
  settingsOpen, blockSettings, BLOCK_TYPES, BLOCK_ICONS, BLOCK_COLOR_VARS, BLOCK_DEFAULTS,
  selectedDur, icsPrefix, imgPrefix,
} from '../state/signals.js';

const DUR_OPTIONS = [
  { value: 30,  label: '30 min'   },
  { value: 60,  label: '1 hour'   },
  { value: 90,  label: '1.5 hours' },
  { value: 120, label: '2 hours'  },
];

export default function Settings() {
  if (!settingsOpen.value) return null;

  function updateBlock(type, key, value) {
    blockSettings.value = {
      ...blockSettings.value,
      [type]: { ...blockSettings.value[type], [key]: value },
    };
  }

  function resetBlocks() {
    blockSettings.value = JSON.parse(JSON.stringify(BLOCK_DEFAULTS));
  }

  return html`
    <div class="settings-overlay">
      <div class="settings-header">
        <button class="settings-back" onClick=${() => settingsOpen.value = false}>
          \u2190 Back
        </button>
        <h2 class="settings-title">Settings</h2>
      </div>

      <div class="settings-body">

        <section class="settings-section">
          <h3>Block names</h3>
          ${BLOCK_TYPES.map(type => {
            const bs = blockSettings.value[type];
            return html`
              <div key=${type} class="settings-block-row">
                <span class="settings-block-icon" style=${{ color: BLOCK_COLOR_VARS[type] }}>
                  ${BLOCK_ICONS[type]}
                </span>
                <input
                  class="settings-input"
                  value=${bs.label}
                  placeholder="Label"
                  onInput=${e => updateBlock(type, 'label', e.target.value)}
                />
                <input
                  class="settings-input settings-hint-input"
                  value=${bs.hint}
                  placeholder="Description"
                  onInput=${e => updateBlock(type, 'hint', e.target.value)}
                />
              </div>
            `;
          })}
          <button class="settings-reset-btn" onClick=${resetBlocks}>Reset to defaults</button>
        </section>

        <section class="settings-section">
          <h3>Default block size</h3>
          <select
            class="settings-select"
            value=${selectedDur.value}
            onChange=${e => selectedDur.value = parseInt(e.target.value)}
          >
            ${DUR_OPTIONS.map(o => html`
              <option key=${o.value} value=${o.value}>${o.label}</option>
            `)}
          </select>
        </section>

        <section class="settings-section">
          <h3>File names</h3>
          <div class="setting-row">
            <label class="setting-label">Calendar export prefix</label>
            <div class="settings-filename-row">
              <input
                class="settings-input"
                value=${icsPrefix.value}
                onInput=${e => icsPrefix.value = e.target.value}
              />
              <span class="settings-filename-suffix">-YYYY-MM-DD.ics</span>
            </div>
          </div>
          <div class="setting-row">
            <label class="setting-label">Wallpaper filename</label>
            <div class="settings-filename-row">
              <input
                class="settings-input"
                value=${imgPrefix.value}
                onInput=${e => imgPrefix.value = e.target.value}
              />
              <span class="settings-filename-suffix">.png</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  `;
}
