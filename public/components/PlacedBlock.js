import { html }              from 'htm/preact';
import { useEffect, useRef } from 'preact/hooks';
import { SLOT_H, SLOT_MIN, DAY_START, removeBlock, isMobile } from '../state/signals.js';
import { placedDragStart }   from '../lib/drag.js';
import { resizeTouchStart, resizeMouseDown } from '../lib/resize.js';
import { minToTime }         from '../lib/canvas.js';

export default function PlacedBlock({ block }) {
  const resizeRef = useRef(null);

  // Register resize listeners with { passive: false } — required so that
  // resizeTouchStart can call e.preventDefault() to suppress page scroll.
  // Preact's onTouchStart prop always registers passive listeners.
  useEffect(() => {
    const el = resizeRef.current;
    if (!el) return;
    const onTouch = (e) => resizeTouchStart(e, block.id);
    const onMouse = (e) => resizeMouseDown(e, block.id);
    el.addEventListener('touchstart', onTouch, { passive: false });
    el.addEventListener('mousedown',  onMouse);
    return () => {
      el.removeEventListener('touchstart', onTouch);
      el.removeEventListener('mousedown',  onMouse);
    };
  }, [block.id]);

  const startSlot = (block.startMin - DAY_START) / SLOT_MIN;
  const top    = startSlot * SLOT_H;
  const height = (block.durMin / SLOT_MIN) * SLOT_H - 4;

  const startLabel = minToTime(block.startMin);
  const endLabel   = minToTime(block.startMin + block.durMin);

  function handleDragStart(e) {
    placedDragStart(e, block);
  }

  return html`
    <div
      class=${`placed-block ${block.type}`}
      data-id=${block.id}
      style=${{ top: `${top}px`, height: `${height}px` }}
      draggable=${!isMobile()}
      onDragStart=${handleDragStart}
    >
      <div>
        <div class="block-title">${block.label}</div>
        <div class="block-time">${startLabel} \u2013 ${endLabel}</div>
      </div>
      <button class="block-delete" onClick=${(e) => { e.stopPropagation(); removeBlock(block.id); }}>
        \u2715
      </button>
      <div class="resize-handle" ref=${resizeRef}></div>
    </div>
  `;
}
