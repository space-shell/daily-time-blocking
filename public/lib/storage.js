import { days, intentions, currentTheme, selectedDur, THEMES } from '../state/signals.js';

export function loadFromStorage() {
  try {
    const d = localStorage.getItem('tb_days');
    if (d) days.value = JSON.parse(d);

    const i = localStorage.getItem('tb_intentions');
    if (i) intentions.value = JSON.parse(i);

    const t = localStorage.getItem('tb_theme');
    if (t && THEMES[t]) currentTheme.value = t;

    const dur = localStorage.getItem('tb_dur');
    if (dur) selectedDur.value = parseInt(dur) || 60;
  } catch (e) {}
}
