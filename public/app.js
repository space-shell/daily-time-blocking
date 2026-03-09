// ── CONSTANTS ────────────────────────────────────────────────────
const SLOT_H    = 60;
const SLOT_MIN  = 30;
const DAY_START = 9 * 60;
const DAY_END   = 17 * 60;
const SLOTS     = (DAY_END - DAY_START) / SLOT_MIN; // 16

const THEMES = {
  dark:   { bg1: '#0e0e0e', bg2: '#181818', text: '#e8e4dc', muted: '#444',    accent: '#c8f072', isDark: true  },
  navy:   { bg1: '#0a1628', bg2: '#0d2442', text: '#d8e8f8', muted: '#2a4a7a', accent: '#7eb8f7', isDark: true  },
  purple: { bg1: '#1a0a2e', bg2: '#2a1248', text: '#e8d8f8', muted: '#4a2a7a', accent: '#c8a0f8', isDark: true  },
  paper:  { bg1: '#f0ebe0', bg2: '#e4ddd0', text: '#1a1614', muted: '#c0b8a8', accent: '#2a5c2a', isDark: false },
};

const TYPE_COLORS = {
  peak:     '#c8f072',
  focus:    '#7eb8f7',
  meetings: '#f78eb8',
  admin:    '#f7c97e',
  buffer:   '#2e2e2e',
};

// ── STATE ─────────────────────────────────────────────────────────
let currentDate = new Date();
currentDate.setHours(0, 0, 0, 0);

const days       = {}; // { 'YYYY-MM-DD': [ ...blocks ] }
const intentions = {}; // { 'YYYY-MM-DD': string }

let selectedDur  = 60;
let currentTheme = 'dark';

// drag state
let dragging       = null;
let dragOffsetSlot = 0;
let resizing       = null;

// tap-to-place state (mobile)
let tapSelected = null; // { el, type, label }

// ── LOCAL STORAGE ─────────────────────────────────────────────────
function saveToStorage() {
  try {
    localStorage.setItem('tb_days',       JSON.stringify(days));
    localStorage.setItem('tb_intentions', JSON.stringify(intentions));
    localStorage.setItem('tb_theme',      currentTheme);
    localStorage.setItem('tb_dur',        String(selectedDur));
  } catch (e) {}
}

function loadFromStorage() {
  try {
    const d = localStorage.getItem('tb_days');
    if (d) Object.assign(days, JSON.parse(d));

    const i = localStorage.getItem('tb_intentions');
    if (i) Object.assign(intentions, JSON.parse(i));

    const t = localStorage.getItem('tb_theme');
    if (t && THEMES[t]) currentTheme = t;

    const dur = localStorage.getItem('tb_dur');
    if (dur) selectedDur = parseInt(dur) || 60;
  } catch (e) {}
}

// ── DATE HELPERS ─────────────────────────────────────────────────
function dateKey(d) {
  return d.toISOString().slice(0, 10);
}

function getBlocks() {
  const k = dateKey(currentDate);
  if (!days[k]) days[k] = [];
  return days[k];
}

function getIntention() {
  return intentions[dateKey(currentDate)] || '';
}

function isToday(d) {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return d.getTime() === t.getTime();
}

function shiftDay(n) {
  currentDate = new Date(currentDate);
  currentDate.setDate(currentDate.getDate() + n);
  updateDayDisplay();
  syncIntentionInput();
  buildTimeline();
  renderWallpaper();
}

function goToday() {
  currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  updateDayDisplay();
  syncIntentionInput();
  buildTimeline();
  renderWallpaper();
}

function updateDayDisplay() {
  const dn = document.getElementById('dayDisplay');
  const ds = document.getElementById('daySubDisplay');
  dn.textContent = currentDate.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase();
  ds.textContent = currentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
    + (isToday(currentDate) ? ' \u00B7 Today' : '');
}

function syncIntentionInput() {
  document.getElementById('intentionInput').value = getIntention();
}

function onIntentionInput() {
  intentions[dateKey(currentDate)] = document.getElementById('intentionInput').value;
  saveToStorage();
  renderWallpaper();
}

// ── MOBILE HELPERS ────────────────────────────────────────────────
function isMobile() {
  return window.matchMedia('(max-width: 768px)').matches;
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tabName)
  );
  document.querySelector('.palette').classList.toggle('tab-active', tabName === 'palette');
  document.querySelector('.timeline-wrap').classList.toggle('tab-active', tabName === 'timeline');
  document.querySelector('.preview-panel').classList.toggle('tab-active', tabName === 'preview');
}

function paletteTap(el) {
  if (!isMobile()) return;
  if (tapSelected && tapSelected.el === el) {
    // deselect
    el.classList.remove('tap-selected');
    tapSelected = null;
    updateTapHint();
    return;
  }
  document.querySelectorAll('.palette-block').forEach(b => b.classList.remove('tap-selected'));
  el.classList.add('tap-selected');
  tapSelected = { el, type: el.dataset.type, label: el.dataset.label };
  switchTab('timeline');
  updateTapHint();
}

function updateTapHint() {
  const hint = document.getElementById('tapHint');
  if (!hint) return;
  if (tapSelected) {
    hint.textContent = 'Tap a time slot to place ' + tapSelected.label;
    hint.classList.remove('hidden');
  } else {
    hint.classList.add('hidden');
  }
}

function zoneTap(e) {
  if (!isMobile() || !tapSelected) return;
  const slot = parseInt(e.currentTarget.dataset.slot);
  const durSlots = selectedDur / SLOT_MIN;
  const targetSlot = Math.max(0, Math.min(slot, SLOTS - durSlots));
  const startMin = DAY_START + targetSlot * SLOT_MIN;
  getBlocks().push({
    id: Math.random().toString(36).slice(2),
    type: tapSelected.type,
    label: tapSelected.label,
    startMin,
    durMin: selectedDur,
  });
  tapSelected.el.classList.remove('tap-selected');
  tapSelected = null;
  updateTapHint();
  renderBlocks();
  checkEmpty();
  saveToStorage();
  renderWallpaper();
}

// ── TIMELINE BUILD ────────────────────────────────────────────────
function buildTimeline() {
  const tl = document.getElementById('timeline');
  const emptyMsg  = isMobile() ? 'Tap a block,<br>then tap a time slot' : 'Drag a block from the left<br>onto the timeline';
  const emptyHint = isMobile() ? '' : 'blocks snap to 30-minute slots';
  tl.innerHTML = '<div class="drop-ghost" id="dropGhost"></div>'
    + `<div class="empty-state" id="emptyState"><p>${emptyMsg}</p><span>${emptyHint}</span></div>`;

  for (let s = 0; s < SLOTS + 1; s++) {
    const min = DAY_START + s * SLOT_MIN;
    const h   = Math.floor(min / 60);
    const m   = min % 60;
    const label = m === 0 ? `${h > 12 ? h - 12 : h}${h >= 12 ? 'pm' : 'am'}` : '';
    const row = document.createElement('div');
    row.className = 'time-row' + (m !== 0 ? ' half' : '');
    row.innerHTML = `<div class="time-label-cell">${label}</div><div class="drop-zone" data-slot="${s}"></div>`;
    tl.appendChild(row);
  }

  tl.querySelectorAll('.drop-zone').forEach(zone => {
    zone.addEventListener('dragover',  zoneDragOver);
    zone.addEventListener('dragleave', zoneDragLeave);
    zone.addEventListener('drop',      zoneDrop);
    zone.addEventListener('click',     zoneTap);
  });

  renderBlocks();
  checkEmpty();
  updateTapHint();
}

function renderBlocks() {
  document.querySelectorAll('.placed-block').forEach(b => b.remove());

  const tl = document.getElementById('timeline');

  getBlocks().forEach(block => {
    const startSlot = (block.startMin - DAY_START) / SLOT_MIN;
    const top    = startSlot * SLOT_H;
    const height = (block.durMin / SLOT_MIN) * SLOT_H - 4;

    const el = document.createElement('div');
    el.className = `placed-block ${block.type}`;
    el.dataset.id = block.id;
    el.style.top    = top + 'px';
    el.style.height = height + 'px';

    const startLabel = minToTime(block.startMin);
    const endLabel   = minToTime(block.startMin + block.durMin);

    el.innerHTML = `
      <div>
        <div class="block-title">${block.label}</div>
        <div class="block-time">${startLabel} \u2013 ${endLabel}</div>
      </div>
      <button class="block-delete" onclick="deleteBlock('${block.id}')">\u2715</button>
      <div class="resize-handle" data-id="${block.id}"></div>
    `;

    el.draggable = !isMobile();
    el.addEventListener('dragstart', placedDragStart);
    el.querySelector('.resize-handle').addEventListener('mousedown', resizeStart);
    el.querySelector('.resize-handle').addEventListener('touchstart', resizeTouchStart, { passive: false });

    tl.appendChild(el);
  });
}

function checkEmpty() {
  const es = document.getElementById('emptyState');
  if (es) es.style.display = getBlocks().length > 0 ? 'none' : 'block';
}

// ── DURATION SELECTOR ─────────────────────────────────────────────
function selectDur(btn) {
  document.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedDur = parseInt(btn.dataset.dur);
  updateBadges();
  saveToStorage();
}

function updateBadges() {
  const label = selectedDur >= 60 ? `${selectedDur / 60}h` : `${selectedDur}m`;
  document.querySelectorAll('[id^="badge-"]').forEach(b => b.textContent = label);
}

// ── PALETTE DRAG ─────────────────────────────────────────────────
function paletteDragStart(e) {
  if (isMobile()) { e.preventDefault(); return; }
  const el = e.currentTarget;
  dragging = { source: 'palette', type: el.dataset.type, label: el.dataset.label, dur: selectedDur };
  dragOffsetSlot = 0;
  showGhost(el.dataset.type, el.dataset.label, e);
  e.dataTransfer.effectAllowed = 'copy';
}

function placedDragStart(e) {
  const id    = e.currentTarget.dataset.id;
  const block = getBlocks().find(b => b.id === id);
  if (!block) return;
  dragging = { source: 'placed', type: block.type, label: block.label, dur: block.durMin, blockId: id };
  const clickSlot = Math.floor(e.offsetY / SLOT_H);
  dragOffsetSlot = Math.max(0, Math.min(clickSlot, Math.floor(block.durMin / SLOT_MIN) - 1));
  showGhost(block.type, block.label, e);
  e.dataTransfer.effectAllowed = 'move';
}

function showGhost(type, label, e) {
  if (isMobile()) return;
  const ghost = document.getElementById('dragGhost');
  ghost.textContent = label;
  ghost.style.background = TYPE_COLORS[type] || '#555';
  ghost.style.display = 'block';
  moveGhost(e);
  document.addEventListener('dragover', moveGhost);
}

function moveGhost(e) {
  const g = document.getElementById('dragGhost');
  g.style.left = (e.clientX + 12) + 'px';
  g.style.top  = (e.clientY - 10) + 'px';
}

document.addEventListener('dragend', () => {
  document.getElementById('dragGhost').style.display = 'none';
  document.removeEventListener('dragover', moveGhost);
  document.querySelectorAll('.drop-zone').forEach(z => z.classList.remove('drag-over'));
  hideDropGhost();
  dragging = null;
});

// ── DROP ZONES ────────────────────────────────────────────────────
function zoneDragOver(e) {
  e.preventDefault();
  if (!dragging) return;
  const slot       = parseInt(e.currentTarget.dataset.slot);
  const targetSlot = Math.max(0, slot - dragOffsetSlot);
  const durSlots   = dragging.dur / SLOT_MIN;
  if (targetSlot + durSlots > SLOTS) return;
  showDropGhost(targetSlot, durSlots);
  e.currentTarget.classList.add('drag-over');
}

function zoneDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function zoneDrop(e) {
  e.preventDefault();
  if (!dragging) return;
  const slot       = parseInt(e.currentTarget.dataset.slot);
  const targetSlot = Math.max(0, slot - dragOffsetSlot);
  const durSlots   = dragging.dur / SLOT_MIN;
  if (targetSlot + durSlots > SLOTS) return;

  const startMin = DAY_START + targetSlot * SLOT_MIN;

  if (dragging.source === 'placed') {
    const b = getBlocks().find(x => x.id === dragging.blockId);
    if (b) b.startMin = startMin;
  } else {
    getBlocks().push({
      id: Math.random().toString(36).slice(2),
      type: dragging.type, label: dragging.label,
      startMin, durMin: dragging.dur,
    });
  }

  hideDropGhost();
  renderBlocks();
  checkEmpty();
  saveToStorage();
  renderWallpaper();
}

function showDropGhost(slot, durSlots) {
  const ghost = document.getElementById('dropGhost');
  ghost.style.display = 'block';
  ghost.style.top    = (slot * SLOT_H) + 'px';
  ghost.style.height = (durSlots * SLOT_H - 4) + 'px';
}

function hideDropGhost() {
  const ghost = document.getElementById('dropGhost');
  if (ghost) ghost.style.display = 'none';
}

// ── DELETE ────────────────────────────────────────────────────────
function deleteBlock(id) {
  const k = dateKey(currentDate);
  days[k] = (days[k] || []).filter(b => b.id !== id);
  renderBlocks();
  checkEmpty();
  saveToStorage();
  renderWallpaper();
}

// ── RESIZE ────────────────────────────────────────────────────────
function resizeStart(e) {
  e.stopPropagation();
  e.preventDefault();
  const block = getBlocks().find(b => b.id === e.currentTarget.dataset.id);
  if (!block) return;
  resizing = { id: block.id, startY: e.clientY, origDur: block.durMin };
  document.addEventListener('mousemove', resizeMove);
  document.addEventListener('mouseup',   resizeEnd);
}

function resizeMove(e) {
  if (!resizing) return;
  const block = getBlocks().find(b => b.id === resizing.id);
  if (!block) return;
  const addSlots = Math.round((e.clientY - resizing.startY) / SLOT_H);
  const newDur   = Math.max(SLOT_MIN, resizing.origDur + addSlots * SLOT_MIN);
  block.durMin   = Math.min(newDur, DAY_END - block.startMin);
  renderBlocks();
}

function resizeEnd() {
  resizing = null;
  document.removeEventListener('mousemove', resizeMove);
  document.removeEventListener('mouseup',   resizeEnd);
  saveToStorage();
  renderWallpaper();
}

function resizeTouchStart(e) {
  e.stopPropagation();
  e.preventDefault();
  const touch = e.touches[0];
  const block = getBlocks().find(b => b.id === e.currentTarget.dataset.id);
  if (!block) return;
  resizing = { id: block.id, startY: touch.clientY, origDur: block.durMin };
  document.addEventListener('touchmove', resizeTouchMove, { passive: false });
  document.addEventListener('touchend',  resizeTouchEnd);
}

function resizeTouchMove(e) {
  if (!resizing) return;
  e.preventDefault();
  const touch = e.touches[0];
  const block = getBlocks().find(b => b.id === resizing.id);
  if (!block) return;
  const addSlots = Math.round((touch.clientY - resizing.startY) / SLOT_H);
  const newDur   = Math.max(SLOT_MIN, resizing.origDur + addSlots * SLOT_MIN);
  block.durMin   = Math.min(newDur, DAY_END - block.startMin);
  renderBlocks();
}

function resizeTouchEnd() {
  resizing = null;
  document.removeEventListener('touchmove', resizeTouchMove);
  document.removeEventListener('touchend',  resizeTouchEnd);
  saveToStorage();
  renderWallpaper();
}

// ── HELPERS ───────────────────────────────────────────────────────
function minToTime(min) {
  const h    = Math.floor(min / 60);
  const m    = min % 60;
  const ampm = h >= 12 ? 'pm' : 'am';
  const hh   = h > 12 ? h - 12 : h;
  return `${hh}:${String(m).padStart(2, '0')}${ampm}`;
}

function selectTheme(el) {
  document.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'));
  el.classList.add('active');
  currentTheme = el.dataset.theme;
  saveToStorage();
  renderWallpaper();
}

function syncThemeDot() {
  document.querySelectorAll('.theme-dot').forEach(d => {
    d.classList.toggle('active', d.dataset.theme === currentTheme);
  });
}

function syncDurBtn() {
  document.querySelectorAll('.dur-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.dur) === selectedDur);
  });
}

// ── WALLPAPER RENDER ──────────────────────────────────────────────
function renderWallpaper() {
  const canvas = document.getElementById('wallCanvas');
  const ctx    = canvas.getContext('2d');
  const W = 1080, H = 1920;
  const theme  = THEMES[currentTheme];

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, theme.bg1);
  bg.addColorStop(1, theme.bg2);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Grain
  for (let i = 0; i < 6000; i++) {
    ctx.fillStyle = theme.isDark
      ? `rgba(255,255,255,${Math.random() * 0.012})`
      : `rgba(0,0,0,${Math.random() * 0.015})`;
    ctx.fillRect(Math.random() * W, Math.random() * H, 1.2, 1.2);
  }

  // Accent bar
  ctx.fillStyle = theme.accent;
  ctx.fillRect(80, 90, 4, 120);

  // Weekday
  ctx.fillStyle = theme.isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)';
  ctx.font = '400 34px "DM Mono", monospace';
  ctx.fillText(currentDate.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase(), 100, 122);

  // Date
  ctx.fillStyle = theme.text;
  ctx.font = '300 72px Fraunces, serif';
  ctx.fillText(currentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }), 100, 196);

  // Intention
  const intention = getIntention();
  if (intention) {
    ctx.fillStyle = theme.accent;
    ctx.font = 'italic 300 42px Fraunces, serif';
    wrapText(ctx, intention, 100, 270, W - 180, 54);
  }

  // Divider
  ctx.strokeStyle = theme.muted;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 9]);
  ctx.beginPath(); ctx.moveTo(100, 340); ctx.lineTo(W - 100, 340); ctx.stroke();
  ctx.setLineDash([]);

  // Timeline
  const blocks   = getBlocks().slice().sort((a, b) => a.startMin - b.startMin);
  const tlTop    = 380;
  const tlH      = H - tlTop - 120;
  const totalMin = DAY_END - DAY_START;

  // Hour lines
  for (let h = 9; h <= 17; h++) {
    const y = tlTop + ((h * 60 - DAY_START) / totalMin) * tlH;
    ctx.strokeStyle = theme.muted;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 8]);
    ctx.beginPath(); ctx.moveTo(160, y); ctx.lineTo(W - 100, y); ctx.stroke();
    ctx.setLineDash([]);
    const label = h > 12 ? `${h - 12}pm` : h === 12 ? '12pm' : `${h}am`;
    ctx.fillStyle = theme.muted;
    ctx.font = '400 28px "DM Mono", monospace';
    ctx.fillText(label, 100, y + 10);
  }

  // Blocks
  blocks.forEach(block => {
    const by = tlTop + ((block.startMin - DAY_START) / totalMin) * tlH;
    const bh = Math.max((block.durMin / totalMin) * tlH - 6, 24);
    const bx = 165, bw = W - 265;

    roundRect(ctx, bx, by, bw, bh, 14);
    ctx.fillStyle = TYPE_COLORS[block.type] || '#444';
    ctx.fill();

    const isLight = block.type !== 'buffer';
    ctx.fillStyle = isLight ? 'rgba(0,0,0,0.75)' : (theme.isDark ? '#888' : '#666');
    ctx.font = '500 36px "DM Mono", monospace';
    ctx.fillText(block.label, bx + 20, by + Math.min(bh - 14, 46));

    if (bh > 58) {
      ctx.fillStyle = isLight ? 'rgba(0,0,0,0.45)' : '#555';
      ctx.font = '400 26px "DM Mono", monospace';
      ctx.fillText(
        `${minToTime(block.startMin)} \u2013 ${minToTime(block.startMin + block.durMin)}`,
        bx + 20, by + bh - 14
      );
    }
  });

  // Empty state
  if (blocks.length === 0) {
    ctx.fillStyle = theme.muted;
    ctx.font = 'italic 300 40px Fraunces, serif';
    ctx.textAlign = 'center';
    ctx.fillText('No blocks yet \u2014 drag to build your day', W / 2, tlTop + tlH / 2);
    ctx.textAlign = 'left';
  }

  // Footer
  ctx.fillStyle = theme.muted;
  ctx.font = '400 26px "DM Mono", monospace';
  ctx.fillText('buffer = transition time, not wasted time', 100, H - 60);

  document.getElementById('dlBtn').href = canvas.toDataURL('image/png');
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line.trim(), x, y);
      line = word + ' ';
      y += lh;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, y);
}

// ── INIT ──────────────────────────────────────────────────────────
loadFromStorage();
syncThemeDot();
syncDurBtn();
updateDayDisplay();
syncIntentionInput();
buildTimeline();
updateBadges();
renderWallpaper();
if (isMobile()) {
  switchTab('palette');
  document.querySelectorAll('.palette-section h3').forEach(h => {
    if (h.textContent.toLowerCase().includes('drag')) h.textContent = 'Tap to select';
  });
}
