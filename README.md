# Daily Time Blocking

A minimal, browser-based daily planner that turns your schedule into a phone wallpaper.

Plan your day by placing coloured time blocks on a 9am–8pm timeline, set a focus intention, then download the result as a 1080×1920 PNG — ready to set as your lock screen so your plan is always in front of you.

## Features

- **Drag-and-drop timeline** — five block types (Deep Work, Focus Work, Meetings, Admin, Buffer), each in 30-min increments up to 2 hours
- **Resize blocks** — drag the handle at the bottom of any placed block to change its duration
- **Focus intention** — one sentence that appears on the wallpaper as a daily anchor
- **Day navigation** — plan multiple days; each day stores its own blocks and intention
- **Four wallpaper themes** — Dark, Navy, Purple, Paper
- **Mobile-first tab layout** — Palette / Timeline / Preview tabs on small screens with tap-to-place interaction
- **Offline-ready** — no server, no login; everything lives in `localStorage`
- **MacroDroid integration** — save the wallpaper with a fixed filename and MacroDroid can apply it automatically each morning

## Usage

Open `public/index.html` directly in a browser, or serve with any static file server:

```bash
npx http-server public
```

### Desktop

1. Pick a block duration (30 min, 1 hr, 1.5 hr, or 2 hr)
2. Drag a coloured block from the left panel onto the timeline
3. Drag placed blocks to move them; drag the bottom handle to resize
4. Write a focus intention in the top-left input
5. Choose a wallpaper theme using the dots in the Preview panel
6. Click **Save to phone** to download the PNG

### Mobile

1. Open the **Palette** tab — choose a block duration, then tap a block type
2. The app switches to the **Timeline** tab — tap a time slot to place the block
3. Tap the delete button (×) on any placed block to remove it
4. Drag the resize handle at the bottom of a block to change its duration
5. Open the **Preview** tab, tap **Save to phone** to download

## Block Types

| Block | Colour | Intended use |
|---|---|---|
| Deep Work | Yellow-green | Best cognitive work — protect this time |
| Focus Work | Blue | Steady, heads-down effort |
| Meetings | Pink | Social / collaborative energy |
| Admin | Amber | Email, admin, low-effort tasks |
| Buffer / Break | Dark grey | Transitions, recovery, buffer time |

## Tech Stack

Vanilla HTML, CSS, and JavaScript. No framework. No build step. No dependencies beyond an optional Google Fonts load for typography.
