import { signal, computed } from '@preact/signals';

// ── Constants ──────────────────────────────────────────────────────
export const SLOT_H    = 60;
export const SLOT_MIN  = 30;
export const DAY_START = 9 * 60;
export const DAY_END   = 20 * 60;
export const SLOTS     = (DAY_END - DAY_START) / SLOT_MIN;

export const THEMES = {
  dark:   { bg1: '#0e0e0e', bg2: '#181818', text: '#e8e4dc', muted: '#444',    accent: '#c8f072', isDark: true  },
  navy:   { bg1: '#0a1628', bg2: '#0d2442', text: '#d8e8f8', muted: '#2a4a7a', accent: '#7eb8f7', isDark: true  },
  purple: { bg1: '#1a0a2e', bg2: '#2a1248', text: '#e8d8f8', muted: '#4a2a7a', accent: '#c8a0f8', isDark: true  },
  paper:  { bg1: '#f0ebe0', bg2: '#e4ddd0', text: '#1a1614', muted: '#c0b8a8', accent: '#2a5c2a', isDark: false },
};

export const TYPE_COLORS = {
  peak:     '#c8f072',
  focus:    '#7eb8f7',
  meetings: '#f78eb8',
  admin:    '#f7c97e',
  buffer:   '#2e2e2e',
};

// ── Helpers ───────────────────────────────────────────────────────
export function isMobile() {
  return window.matchMedia('(max-width: 640px)').matches;
}

export function isToday(d) {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return d.getTime() === t.getTime();
}

// ── Primitive signals ─────────────────────────────────────────────
const _today = new Date(); _today.setHours(0, 0, 0, 0);

export const currentDate   = signal(_today);
export const days          = signal({});
export const intentions    = signal({});
export const selectedDur   = signal(60);
export const currentTheme  = signal('dark');
export const tapSelected   = signal(null);   // { type, label } | null
export const activeTab     = signal('palette');
export const dropGhostSlot = signal(null);   // { top, height } | null
export const dlHref        = signal('#');

// ── Computed signals ──────────────────────────────────────────────
export const dateKey = computed(() =>
  currentDate.value.toISOString().slice(0, 10));

export const blocks = computed(() =>
  days.value[dateKey.value] || []);

export const intention = computed(() =>
  intentions.value[dateKey.value] || '');

export const dayLabel = computed(() =>
  currentDate.value.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase());

export const daySubLabel = computed(() => {
  const d = currentDate.value;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
    + (isToday(d) ? ' \u00B7 Today' : '');
});

export const durBadge = computed(() =>
  selectedDur.value >= 60 ? `${selectedDur.value / 60}h` : `${selectedDur.value}m`);

// ── Day navigation ────────────────────────────────────────────────
export function shiftDay(n) {
  const d = new Date(currentDate.value);
  d.setDate(d.getDate() + n);
  currentDate.value = d;
}

export function goToday() {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  currentDate.value = d;
}

// ── Block mutations ───────────────────────────────────────────────
// All mutations MUST replace the object, never mutate in place.

export function addBlock(block) {
  const k = dateKey.value;
  days.value = { ...days.value, [k]: [...(days.value[k] || []), block] };
}

export function updateBlock(id, patch) {
  const k = dateKey.value;
  days.value = {
    ...days.value,
    [k]: (days.value[k] || []).map(b => b.id === id ? { ...b, ...patch } : b),
  };
}

export function removeBlock(id) {
  const k = dateKey.value;
  days.value = {
    ...days.value,
    [k]: (days.value[k] || []).filter(b => b.id !== id),
  };
}

export function setIntention(text) {
  const k = dateKey.value;
  intentions.value = { ...intentions.value, [k]: text };
}
