# US-012 — Customise App Settings

**As a** user,
**I want to** personalise the block names, default block size, and download filenames,
**So that** the app fits my own terminology and workflow without extra steps each session.

## Acceptance Criteria

- [ ] A **⚙ Settings** button is visible below the legend in the Palette panel
- [ ] Clicking it opens a full-screen settings overlay with a back (← Back) button to return
- [ ] Settings changes take effect immediately — no save button required
- [ ] All settings survive a page refresh (persisted via `localStorage`)

### Block names

- [ ] Each of the five block types has an editable label field
- [ ] Each block type has an editable hint/description field (shown in the legend)
- [ ] Changes update the palette blocks and legend live
- [ ] A "Reset to defaults" button restores the original labels and hints

### Default block size

- [ ] A dropdown lets the user choose 30 min, 1 hr, 1.5 hr, or 2 hr as the default for newly placed blocks
- [ ] The selected value is the same `selectedDur` signal used by the duration selector elsewhere

### File names

- [ ] A "Calendar export prefix" field controls the prefix of downloaded `.ics` files
  - Downloaded filename: `{prefix}-YYYY-MM-DD.ics`
- [ ] A "Wallpaper filename" field controls the prefix of downloaded `.png` files
  - Downloaded filename: `{prefix}.png`

## Notes

Block name changes do not retroactively update blocks already placed on the timeline — those blocks store the label that was current at placement time. The settings overlay is rendered as a fixed-position layer over the entire app (`z-index: 200`) so it works identically on desktop and mobile without any tab-bar interaction.

## Storage Keys

| Setting | `localStorage` key |
|---|---|
| Block labels and hints | `tb_block_settings` |
| Default block size | `tb_dur` |
| Calendar filename prefix | `tb_ics_prefix` |
| Wallpaper filename prefix | `tb_img_prefix` |

## Related

- **US-001** — Plan My Day (block names shown on palette and legend)
- **US-004** — Save Schedule as Phone Wallpaper (configurable filename)
- **US-006** — Select Block Duration (default size configured here)
- **US-010** — Data Persistence (all settings stored in `localStorage`)
- **US-011** — Calendar Export (configurable filename prefix)
