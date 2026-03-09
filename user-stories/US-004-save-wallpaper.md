# US-004 — Save Schedule as Phone Wallpaper

**As a** user,
**I want to** download my daily schedule as a phone wallpaper image,
**So that** my plan is visible on my lock screen throughout the day without opening an app.

## Acceptance Criteria

- [ ] A "Save to phone" button is visible at the top of the Preview panel (above the wallpaper canvas)
- [ ] Clicking the button downloads a PNG file named `timeblock.png`
- [ ] The PNG is 1080 × 1920 pixels (standard phone wallpaper resolution)
- [ ] The wallpaper includes: date, day name, focus intention, time blocks, hour lines, and a footer quote
- [ ] The download link updates automatically whenever any block, intention, or theme changes
- [ ] The canvas preview is a scaled-down version of the full-resolution wallpaper

## MacroDroid Integration

Save the file as the same filename every time (`timeblock.png`). A MacroDroid macro can watch for that file and apply it as wallpaper automatically at a set time (e.g. 8:50am) so it's on your screen when you arrive at work.
