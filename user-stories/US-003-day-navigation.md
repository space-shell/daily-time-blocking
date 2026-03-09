# US-003 — Navigate Between Days

**As a** user,
**I want to** move between calendar days,
**So that** I can plan ahead or review how previous days were structured.

## Acceptance Criteria

- [ ] Left (‹) and right (›) arrow buttons shift the current day backwards and forwards
- [ ] A "Today" button jumps immediately to the current calendar date
- [ ] The header shows the current day name (e.g. "MONDAY") and full date (e.g. "9 March · Today")
- [ ] Switching day loads the saved blocks and intention for that day
- [ ] Each day's data is stored and retrieved independently from `localStorage`
- [ ] The wallpaper preview updates to reflect the new day's data

## Notes

`currentDate` is a plain `Date` object stored in memory; the `dateKey()` helper produces the `YYYY-MM-DD` string used as the `localStorage` key. The "· Today" suffix is shown only when viewing the current calendar date.
