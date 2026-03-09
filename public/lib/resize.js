import { SLOT_H, SLOT_MIN, DAY_END, blocks, updateBlock } from '../state/signals.js';

// Transient resize state — not a signal; no re-render needed between steps
let resizing = null;

// ── Mouse resize ──────────────────────────────────────────────────
export function resizeMouseDown(e, blockId) {
  e.stopPropagation();
  e.preventDefault();
  const block = blocks.value.find(b => b.id === blockId);
  if (!block) return;
  resizing = { id: blockId, startY: e.clientY, origDur: block.durMin };
  document.addEventListener('mousemove', _resizeMove);
  document.addEventListener('mouseup',   _resizeEnd);
}

function _resizeMove(e) {
  if (!resizing) return;
  const block = blocks.value.find(b => b.id === resizing.id);
  if (!block) return;
  const addSlots = Math.round((e.clientY - resizing.startY) / SLOT_H);
  const newDur   = Math.max(SLOT_MIN, resizing.origDur + addSlots * SLOT_MIN);
  updateBlock(resizing.id, { durMin: Math.min(newDur, DAY_END - block.startMin) });
}

function _resizeEnd() {
  resizing = null;
  document.removeEventListener('mousemove', _resizeMove);
  document.removeEventListener('mouseup',   _resizeEnd);
}

// ── Touch resize ──────────────────────────────────────────────────
// Must be registered with { passive: false } via useRef in PlacedBlock —
// Preact's onTouchStart prop is passive and cannot call preventDefault().
export function resizeTouchStart(e, blockId) {
  e.stopPropagation();
  e.preventDefault();
  const touch = e.touches[0];
  const block = blocks.value.find(b => b.id === blockId);
  if (!block) return;
  resizing = { id: blockId, startY: touch.clientY, origDur: block.durMin };
  document.addEventListener('touchmove', _resizeTouchMove, { passive: false });
  document.addEventListener('touchend',  _resizeTouchEnd);
}

function _resizeTouchMove(e) {
  if (!resizing) return;
  e.preventDefault();
  const touch = e.touches[0];
  const block = blocks.value.find(b => b.id === resizing.id);
  if (!block) return;
  const addSlots = Math.round((touch.clientY - resizing.startY) / SLOT_H);
  const newDur   = Math.max(SLOT_MIN, resizing.origDur + addSlots * SLOT_MIN);
  updateBlock(resizing.id, { durMin: Math.min(newDur, DAY_END - block.startMin) });
}

function _resizeTouchEnd() {
  resizing = null;
  document.removeEventListener('touchmove', _resizeTouchMove);
  document.removeEventListener('touchend',  _resizeTouchEnd);
}
