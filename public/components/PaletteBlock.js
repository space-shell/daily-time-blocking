import { html } from 'htm/preact';
import { durBadge, tapSelected, activeTab, isMobile } from '../state/signals.js';
import { paletteDragStart } from '../lib/drag.js';

const BLOCKS = [
  { type: 'peak',     label: 'Deep Work',      icon: '\u25C6' },
  { type: 'focus',    label: 'Focus Work',      icon: '\u25CF' },
  { type: 'meetings', label: 'Meetings',        icon: '\u25CE' },
  { type: 'admin',    label: 'Email \u0026 Admin', icon: '\u25A3' },
  { type: 'buffer',   label: 'Buffer / Break',  icon: '\u25CB' },
];

function PaletteBlock({ type, label, icon }) {
  const isSelected = tapSelected.value?.type === type;

  function handleDragStart(e) {
    paletteDragStart(e, type, label);
  }

  function handleClick() {
    if (!isMobile()) return;
    if (tapSelected.value?.type === type) {
      tapSelected.value = null;
    } else {
      tapSelected.value = { type, label };
      activeTab.value   = 'timeline';
    }
  }

  return html`
    <div
      class=${`palette-block ${type}${isSelected ? ' tap-selected' : ''}`}
      draggable=${!isMobile()}
      onDragStart=${handleDragStart}
      onClick=${handleClick}
    >
      ${icon} ${label}
      <span class="duration-badge">${durBadge.value}</span>
    </div>
  `;
}

export default function PaletteBlockList() {
  return html`
    <>
      ${BLOCKS.map(b => html`<${PaletteBlock} key=${b.type} ...${b} />`)}
    </>
  `;
}
