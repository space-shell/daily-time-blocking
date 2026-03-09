import { html } from 'htm/preact';

// Fixed-position ghost element — shown/hidden imperatively by drag.js
// at pointer-move frequency to avoid Preact reconciliation overhead.
export default function DragGhost() {
  return html`<div id="dragGhost"></div>`;
}
