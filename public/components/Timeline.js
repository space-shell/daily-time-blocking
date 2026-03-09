import { html }    from 'htm/preact';
import {
  SLOT_H, SLOT_MIN, DAY_START, SLOTS,
  blocks, dropGhostSlot, tapSelected, selectedDur, isMobile,
} from '../state/signals.js';
import { zoneDragOver, zoneDragLeave, zoneDrop, zoneTap } from '../lib/drag.js';
import PlacedBlock from './PlacedBlock.js';

// Build time-row label for a given slot index
function slotLabel(s) {
  const min  = DAY_START + s * SLOT_MIN;
  const h    = Math.floor(min / 60);
  const m    = min % 60;
  if (m !== 0) return '';
  return h > 12 ? `${h - 12}pm` : h === 12 ? '12pm' : `${h}am`;
}

function TimeRow({ slot }) {
  const min   = DAY_START + slot * SLOT_MIN;
  const isHalf = (min % 60) !== 0;
  const label = slotLabel(slot);

  function handleClick(e) {
    if (!isMobile() || !tapSelected.value) return;
    const { type, label: lbl } = tapSelected.value;
    zoneTap(slot, type, lbl, selectedDur.value);
    tapSelected.value = null;
  }

  return html`
    <div class=${`time-row${isHalf ? ' half' : ''}`}>
      <div class="time-label-cell">${label}</div>
      <div
        class="drop-zone"
        data-slot=${slot}
        onDragOver=${zoneDragOver}
        onDragLeave=${zoneDragLeave}
        onDrop=${zoneDrop}
        onClick=${handleClick}
      ></div>
    </div>
  `;
}

function DropGhost() {
  const g = dropGhostSlot.value;
  if (!g) return null;
  return html`
    <div class="drop-ghost" style=${{ display: 'block', top: `${g.top}px`, height: `${g.height}px` }}></div>
  `;
}

function EmptyState() {
  if (blocks.value.length > 0) return null;
  const msg  = isMobile() ? html`Tap a block,<br/>then tap a time slot` : html`Drag a block from the left<br/>onto the timeline`;
  const hint = isMobile() ? '' : 'blocks snap to 30-minute slots';
  return html`
    <div class="empty-state">
      <p>${msg}</p>
      ${hint && html`<span>${hint}</span>`}
    </div>
  `;
}

// Render SLOTS + 1 rows (9am label appears on the first row = slot 0)
const timeSlots = Array.from({ length: SLOTS + 1 }, (_, i) => i);

export default function Timeline() {
  return html`
    <div class="timeline" id="timeline">
      <${DropGhost} />
      <${EmptyState} />
      ${timeSlots.map(s => html`<${TimeRow} key=${s} slot=${s} />`)}
      ${blocks.value.map(b => html`<${PlacedBlock} key=${b.id} block=${b} />`)}
    </div>
  `;
}
