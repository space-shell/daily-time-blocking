# US-006 — Select Block Duration Before Placing

**As a** user,
**I want to** choose how long a block will be before I place it,
**So that** I can quickly drop the right-sized block without resizing afterwards.

## Acceptance Criteria

- [ ] Four duration options: 30 min, 1 hr, 1.5 hr, 2 hr
- [ ] The active duration is visually highlighted
- [ ] Each palette block shows a badge indicating the current duration (e.g. "1h")
- [ ] Newly placed blocks use the currently selected duration
- [ ] Duration preference is saved to `localStorage` and restored on next visit
- [ ] Changing duration updates all badge labels immediately

## Notes

Duration is stored as minutes in `selectedDur`. The block duration can be changed after placement by dragging the resize handle (US-007).
