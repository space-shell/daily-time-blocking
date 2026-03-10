# US-006 — Select Block Duration Before Placing

**As a** user,
**I want to** choose how long a block will be before I place it,
**So that** I can quickly drop the right-sized block without resizing afterwards.

## Acceptance Criteria

- [ ] Four duration options: 30 min, 1 hr, 1.5 hr, 2 hr
- [ ] Newly placed blocks use the currently selected duration
- [ ] Duration preference is saved to `localStorage` and restored on next visit
- [ ] The default block size can be changed in Settings (US-012)

## Notes

Duration is stored as minutes in the `selectedDur` signal. The default value (used when placing a new block) is configurable in Settings — the Settings screen provides the same four options (30 / 60 / 90 / 120 min). The block duration can be changed after placement by dragging the resize handle (US-007).
