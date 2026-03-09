# US-007 — Resize Placed Blocks

**As a** user,
**I want to** drag the bottom edge of a placed block to change its duration,
**So that** I can adjust my plan without deleting and re-placing blocks.

## Acceptance Criteria

- [ ] Each placed block has a resize handle (drag bar) at its bottom edge
- [ ] On desktop: dragging the handle with the mouse resizes the block in 30-minute increments
- [ ] On mobile: touch-dragging the handle resizes the block in 30-minute increments
- [ ] Minimum duration is 30 minutes (one slot)
- [ ] The block cannot extend past 8:00pm (the end of the timeline)
- [ ] The time range label on the block updates in real time during resize
- [ ] The wallpaper re-renders after resize ends

## Implementation Notes

The resize handle has `touch-action: none` to prevent the browser scroll from intercepting the gesture. Touch events use `{ passive: false }` so `preventDefault()` can suppress scroll during a drag.
