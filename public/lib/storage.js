import { days, intentions, currentTheme, THEMES, phoneModel, PHONE_MODELS } from '../state/signals.js';

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
  } catch (e) {}
}
