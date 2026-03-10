# Daily Time Blocking

A minimal, browser-based daily planner that turns your schedule into a phone wallpaper.

Plan your day by placing coloured time blocks on a 9am–8pm timeline, set a focus intention, then download the result as a PNG — ready to set as your lock screen so your plan is always in front of you. Blocks can also be exported as a calendar file and imported directly into Google Calendar, Apple Calendar, or Outlook.

## Features

- **Drag-and-drop timeline** — five block types (Deep Work, Focus Work, Meetings, Admin, Buffer), each in 30-min increments
- **Resize blocks** — drag the handle at the bottom of any placed block to change its duration
- **Focus intention** — one sentence that appears on the wallpaper as a daily anchor
- **Day navigation** — plan multiple days; each day stores its own blocks and intention
- **Four wallpaper themes** — Dark, Navy, Purple, Paper
- **Phone model presets** — export at the exact resolution for your device (iPhone, Samsung Galaxy, Pixel, or generic 1080p)
- **Calendar export** — download an `.ics` file to import your time blocks directly into any calendar app
- **Settings** — rename block types, set the default block size, and customise download filenames
- **Mobile-first tab layout** — Palette / Timeline / Preview tabs on small screens with tap-to-place interaction
- **Offline-ready** — no server, no login; everything lives in `localStorage`
- **MacroDroid integration** — save the wallpaper with a fixed filename and MacroDroid can apply it automatically each morning

## Usage

Serve the `public/` directory with any static file server:

```bash
npx serve public -l 8080
```

Then open `http://localhost:8080` in a browser.

### Desktop

1. Drag a coloured block from the left panel onto the timeline
2. Drag placed blocks to move them; drag the bottom handle to resize
3. Write a focus intention in the top-left input
4. Choose a wallpaper theme using the dots in the Preview panel
5. Click **Export to calendar (.ics)** to add your blocks to a calendar app
6. Click **Save to phone** to download the wallpaper PNG

### Mobile

1. Open the **Palette** tab — tap a block type to select it
2. The app switches to the **Timeline** tab — tap a time slot to place the block
3. Tap the delete button (×) on any placed block to remove it
4. Drag the resize handle at the bottom of a block to change its duration
5. Open the **Preview** tab to export to calendar or download the wallpaper

### Settings

Click **⚙ Settings** (below the legend in the Palette panel) to open the settings screen:

- **Block names** — rename each block type's label and description
- **Default block size** — choose 30 min, 1 hr, 1.5 hr, or 2 hr as the starting size for newly placed blocks
- **File names** — set the prefix for downloaded calendar (`.ics`) and wallpaper (`.png`) files

All settings are saved automatically and persist across sessions.

## Block Types

| Block | Colour | Intended use |
|---|---|---|
| Deep Work | Yellow-green | Best cognitive work — protect this time |
| Focus Work | Blue | Steady, heads-down effort |
| Meetings | Pink | Social / collaborative energy |
| Admin | Amber | Email, admin, low-effort tasks |
| Buffer / Break | Dark grey | Transitions, recovery, buffer time |

Block names and descriptions can be customised in Settings.

## Calendar Export

The **Export to calendar (.ics)** button in the Preview panel generates a standards-compliant iCalendar file. Each time block becomes a calendar event with the correct start and end time for the day currently shown. Open the file on any device to import into:

- Google Calendar (tap to import on Android/iOS, or drag into the web app)
- Apple Calendar
- Outlook
- Any app that supports the iCalendar standard (RFC 5545)

## Tech Stack

Preact + @preact/signals + htm, loaded from `esm.sh` via an importmap. No build step. No bundler. Served as static files.
