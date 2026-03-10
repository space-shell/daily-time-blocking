# US-011 — Export Schedule to Calendar

**As a** user,
**I want to** download my time blocks as a calendar file,
**So that** I can import them into my calendar app and have them as real events on my day.

## Acceptance Criteria

- [ ] An "Export to calendar (.ics)" button is visible in the Preview panel, above "Save to phone"
- [ ] Clicking the button downloads a `.ics` file for the day currently shown
- [ ] The filename follows the pattern `{icsPrefix}-YYYY-MM-DD.ics` (default: `timeblocks-2026-03-10.ics`)
- [ ] Each placed block becomes a VEVENT with the correct DTSTART and DTEND
- [ ] Event summaries use the block's label as displayed on the timeline
- [ ] The day's focus intention is included as the calendar description (X-WR-CALDESC)
- [ ] If there are no blocks on the current day, the user is shown an alert instead of an empty file
- [ ] The filename prefix is configurable in Settings (US-012)

## File Format

Standards-compliant iCalendar (RFC 5545). Compatible with:

- Google Calendar (drag-and-drop into web app, or tap on Android/iOS)
- Apple Calendar (tap on macOS/iOS)
- Outlook (double-click on Windows)
- Any app that supports `.ics` import

## Notes

The export is entirely client-side — a `Blob` is created from the `.ics` string and a temporary `<a>` element triggers the download. The exported events use local wall-clock times (no timezone suffix), which matches the intent of the planner (scheduling your own day, not coordinating across time zones).

## Related

- **US-004** — Save Schedule as Phone Wallpaper (the companion PNG export)
- **US-012** — Settings (configurable filename prefix)
