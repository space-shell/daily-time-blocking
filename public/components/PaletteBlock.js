import { html } from 'htm/preact';
import { tapSelected, activeTab, isMobile, blockSettings, BLOCK_TYPES, BLOCK_ICONS } from '../state/signals.js';
import { paletteDragStart } from '../lib/drag.js';

function PaletteBlock({ type }) {
  const { label } = blockSettings.value[type];
  const icon = BLOCK_ICONS[type];
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
    </div>
  `;
}

export default function PaletteBlockList() {
  return BLOCK_TYPES.map(type => html`<${PaletteBlock} key=${type} type=${type} />`);
}
