import {
  days, intentions, currentTheme, THEMES, phoneModel, PHONE_MODELS,
  blockSettings, BLOCK_TYPES, BLOCK_DEFAULTS, icsPrefix, imgPrefix, selectedDur,
} from '../state/signals.js';

export function loadFromStorage() {
  try {
    const d = localStorage.getItem('tb_days');
    if (d) days.value = JSON.parse(d);

    const i = localStorage.getItem('tb_intentions');
    if (i) intentions.value = JSON.parse(i);

    const t = localStorage.getItem('tb_theme');
    if (t && THEMES[t]) currentTheme.value = t;

    const p = localStorage.getItem('tb_phone');
    if (p && PHONE_MODELS.find(m => m.key === p)) phoneModel.value = p;

    const bs = localStorage.getItem('tb_block_settings');
    if (bs) {
      const parsed = JSON.parse(bs);
      // Merge with defaults so new keys are always present
      const merged = {};
      for (const type of BLOCK_TYPES) {
        merged[type] = { ...BLOCK_DEFAULTS[type], ...(parsed[type] || {}) };
      }
      blockSettings.value = merged;
    }

    const ip = localStorage.getItem('tb_ics_prefix');
    if (ip) icsPrefix.value = ip;

    const mp = localStorage.getItem('tb_img_prefix');
    if (mp) imgPrefix.value = mp;

    const dur = localStorage.getItem('tb_dur');
    if (dur) selectedDur.value = parseInt(dur) || 60;
  } catch (e) {}
}
