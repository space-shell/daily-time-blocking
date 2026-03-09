# US-002 — Set a Daily Focus Intention

**As a** user,
**I want to** write a short focus intention for the day,
**So that** I have a single anchor sentence to keep me on track — and so it appears on my phone wallpaper.

## Acceptance Criteria

- [ ] A text input is visible in the Palette panel under "Focus intention"
- [ ] The placeholder text gives an example ("Ship the draft before lunch…")
- [ ] The intention is saved to `localStorage` per day as the user types
- [ ] The intention text appears on the wallpaper canvas in italics below the date
- [ ] Clearing the intention removes it from the wallpaper
- [ ] Each calendar day stores its own independent intention

## Notes

The intention is rendered in Fraunces italic at 42px on the 1080×1920 canvas. Long intentions word-wrap using the `wrapText()` helper.
