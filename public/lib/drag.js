import {
  SLOT_H, SLOT_MIN, DAY_START, SLOTS,
  TYPE_COLORS, selectedDur, isMobile,
  addBlock, updateBlock, dropGhostSlot,
  blocks,
} from '../state/signals.js';

// Transient drag state — not signals; no re-render needed during move
let dragging       = null;
let dragOffsetSlot = 0;

// ── Palette drag ──────────────────────────────────────────────────
export function paletteDragStart(e, type, label) {
  if (isMobile()) { e.preventDefault(); return; }
  dragging = { source: 'palette', type, label, dur: selectedDur.value };
  dragOffsetSlot = 0;
  _showGhost(type, label, e);
  e.dataTransfer.effectAllowed = 'copy';
}

// ── Placed block drag ─────────────────────────────────────────────
export function placedDragStart(e, block) {
  dragging = { source: 'placed', type: block.type, label: block.label, dur: block.durMin, blockId: block.id };
  const clickSlot = Math.floor(e.offsetY / SLOT_H);
  dragOffsetSlot  = Math.max(0, Math.min(clickSlot, Math.floor(block.durMin / SLOT_MIN) - 1));
  _showGhost(block.type, block.label, e);
  e.dataTransfer.effectAllowed = 'move';
}

// ── Ghost helpers (imperative — high-frequency updates) ───────────
function _showGhost(type, label, e) {
  const ghost = document.getElementById('dragGhost');
  ghost.textContent = label;
  ghost.style.background = TYPE_COLORS[type] || '#555';
  ghost.style.display    = 'block';
  moveGhost(e);
  document.addEventListener('dragover', moveGhost);
}

export function moveGhost(e) {
  const g = document.getElementById('dragGhost');
  if (g) { g.style.left = (e.clientX + 12) + 'px'; g.style.top = (e.clientY - 10) + 'px'; }
}

export function hideGhost() {
  const g = document.getElementById('dragGhost');
  if (g) g.style.display = 'none';
}

// ── dragend (attached to document in App) ────────────────────────
export function onDragEnd() {
  hideGhost();
  document.removeEventListener('dragover', moveGhost);
  document.querySelectorAll('.drop-zone').forEach(z => z.classList.remove('drag-over'));
  dropGhostSlot.value = null;
  dragging = null;
}

// ── Drop zone handlers ────────────────────────────────────────────
export function zoneDragOver(e) {
  e.preventDefault();
  if (!dragging) return;
  const slot       = parseInt(e.currentTarget.dataset.slot);
  const targetSlot = Math.max(0, slot - dragOffsetSlot);
  const durSlots   = dragging.dur / SLOT_MIN;
  if (targetSlot + durSlots > SLOTS) return;
  dropGhostSlot.value = {
    top:    targetSlot * SLOT_H,
    height: durSlots * SLOT_H - 4,
  };
  e.currentTarget.classList.add('drag-over');
}

export function zoneDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

export function zoneDrop(e) {
  e.preventDefault();
  if (!dragging) return;
  const slot       = parseInt(e.currentTarget.dataset.slot);
  const targetSlot = Math.max(0, slot - dragOffsetSlot);
  const durSlots   = dragging.dur / SLOT_MIN;
  if (targetSlot + durSlots > SLOTS) return;
  const startMin = DAY_START + targetSlot * SLOT_MIN;
  if (dragging.source === 'placed') {
    updateBlock(dragging.blockId, { startMin });
  } else {
    addBlock({
      id: Math.random().toString(36).slice(2),
      type: dragging.type, label: dragging.label,
      startMin, durMin: dragging.dur,
    });
  }
  dropGhostSlot.value = null;
  dragging = null;
}

// ── Mobile tap-to-place ───────────────────────────────────────────
export function zoneTap(slot, type, label, dur) {
  const durSlots   = dur / SLOT_MIN;
  const targetSlot = Math.max(0, Math.min(slot, SLOTS - durSlots));
  addBlock({
    id: Math.random().toString(36).slice(2),
    type, label,
    startMin: DAY_START + targetSlot * SLOT_MIN,
    durMin:   dur,
  });
}
