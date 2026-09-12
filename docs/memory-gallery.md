# The Memory Gallery

The Gallery is a horizontal house corridor with cream plaster, walnut frames,
restrained arches, brass lamps and a runner. A featured keepsake wall leads into
paired walls, an alcove, a corner and a doorway. Category selection dims other
photographs without changing frame positions. The selected frame itself moves
forward and reverses to its original anchor; no replacement lightbox is mounted.

## Replace the sample photographs

1. Add compressed photographs to `public/gallery/`.
2. Edit `public/data/gallery.json` (a JSON array). Keep IDs unique and stable.
3. Set one photograph to `featured: true` to choose the keepsake wall. The first
   featured entry wins; without one, the first photograph becomes featured.
4. Run `npm run typecheck` and `npm test` before publishing.

A complete example (replace file names with files you have actually added):

```json
{
  "id": "stockholm-winter",
  "src": "/gallery/stockholm-winter.webp",
  "title": "The quiet after snow",
  "alt": "Snow beside the water in Stockholm",
  "location": "Stockholm",
  "year": 2025,
  "category": "Places",
  "mood": "Quiet",
  "tags": ["winter", "water"],
  "connections": ["another-memory-id"],
  "orientation": "landscape",
  "featured": true,
  "caption": "A small pause beside the water.",
  "memory": "An optional longer memory, in your own words.",
  "color": "#9babb3",
  "position": [50, 40],
  "variants": [
    { "src": "/gallery/stockholm-winter-640.webp", "width": 640 },
    { "src": "/gallery/stockholm-winter-1280.webp", "width": 1280 }
  ],
  "onward": {
    "room": "travel",
    "label": "Follow this memory into the Observatory"
  }
}
```

Only `id` and `src` are required. Missing text gets restrained defaults; optional
connections without matching memories are omitted. An empty collection displays
a quiet welcome. Invalid JSON or metadata shows a retry action. An unavailable
image leaves an accessible neutral frame with its title and metadata.

- Categories: `Places`, `People`, `Moments`, `Details`.
- Orientation: `landscape`, `portrait`, `square`; images are never stretched.
  `position` is an optional `[horizontal, vertical]` crop position in percentages.
  An approached photograph uses `contain` to reveal the whole photograph.
- Related links match location, year or mood, preferring unvisited photographs.
  Explicit `connections` and shared `tags` provide an additional thread.
- Optional `onward.room`: `travel`, `cinema`, `library`.
- Optional `credit` and HTTPS `source` preserve attribution for borrowed images.
- The schema accepts up to 120 photographs. For a substantially larger archive,
  add wall virtualization before increasing this limit.

Keep original camera files elsewhere; export web-sized images (roughly 1200–1800px
on the long edge is a useful starting point) and optionally supply smaller
`variants`. Only current/adjacent walls request eager loading; distant images
use native lazy loading and asynchronous decoding. All gallery image paths are
local. The sample content uses only assets that already existed in the project.

## Interaction and architecture

- `components/garden/memory-gallery/`: environment, navigation hook, physical
  frame, editorial details, category/trail/navigation controls, motion utility.
- `lib/garden/memories.ts`: validated content, wall curation, relationships,
  bounded history reducer, frame projection geometry.
- `app/memory-gallery.css`: architecture, responsive composition and lighting.
- `use-tehran-light.ts` shares one clock with the courtyard; daytime begins at
  06:00, sunset grading at 17:00, and night at 20:00 in `Asia/Tehran`.
- `scene-transitions.ts` reuses the existing cancellable entry runner for a
  1.53-second wooden-door transition. System or local reduced-motion settings
  remove the camera movement and shorten entry to 320ms.

Desktop supports wheel/trackpad, dragging empty wall space, arrow keys, Home/End
and explicit previous/next wall controls. Mobile uses native horizontal swiping
and a separate stacked frame composition. ESC retracts an approached frame;
keyboard focus returns to its original button. Tab stays with the approached
memory and trail; surrounding site controls become inert until it closes.

Connected-memory actions retract the current frame, travel along the corridor,
then approach the related frame. The trail retains the last 12 unique visits.
It resets when leaving the Gallery. Refreshing `/#gallery` opens the room directly;
room changes push history entries so browser Back/Forward restores destinations.
Animation waits, animation frames, resize observers and event listeners are
cancelled/removed when leaving the room.

## Verification

`npm test` builds production assets and runs the project tests. Gallery tests cover
content defaults/assets/connections, lighting boundaries, portrait/square/landscape
projection at desktop and mobile sizes, frame DOM identity and retraction,
keyboard focus and ESC, category stability, connected navigation, trail returns,
resize/image failure, reduced motion, cancellation/unmount cleanup, direct room
navigation and browser history using the actual Garden component in jsdom.

DOM geometry is explicitly supplied in integration tests: they verify interaction
logic, not browser layout or appearance. A real-browser visual pass is still
required before visual sign-off; the available browser could not reach the local
preview in this work environment. Check desktop, tablet and 360px mobile widths,
scroll containment, frame alignment during approach/retraction and the three
lighting states. Repository-wide lint has existing errors in Garden and the
unused spatial renderer; the new Gallery modules are linted separately.
