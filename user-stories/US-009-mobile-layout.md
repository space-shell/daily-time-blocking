# US-009 — Use the App on a Mobile Device

**As a** user on a phone,
**I want to** plan my day using a touch-friendly interface,
**So that** I can build my schedule without needing a desktop browser.

## Acceptance Criteria

- [ ] At ≤768px viewport width, the app switches from a 3-column grid to a single-panel tab layout
- [ ] Three tabs are shown: Palette, Timeline, Preview
- [ ] The app opens on the Palette tab by default
- [ ] Tapping a palette block selects it and auto-switches to the Timeline tab
- [ ] A hint bar at the top of the timeline shows which block is selected
- [ ] Tapping a time slot places the selected block; the hint bar disappears
- [ ] Tapping a palette block a second time deselects it
- [ ] Placed blocks always show the delete (×) button (no hover required)
- [ ] Resize handles are touch-friendly (20px tall, `touch-action: none`)
- [ ] The page header condenses: title hidden, date display shrinks, sub-label hidden
- [ ] The Refresh button is always accessible at the far right of the header

## Notes

Desktop drag-and-drop is disabled on mobile (`draggable` set to `false`, `paletteDragStart` is a no-op). All interaction goes through the tap flow.
