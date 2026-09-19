# The Memory Gallery — house rebuild

The previous CSS museum corridor, drawn architecture, frame components, detail
panel, navigation hook and Gallery styling have been removed. The replacement
uses photographic architecture derived from the supplied reference, real walnut
frame imagery, and independently rendered photographs. The site room dock is not
rendered inside the Gallery. Other rooms keep their existing navigation.

## Replace photographs

1. Add optimized WebP, AVIF, JPEG or PNG files to `public/gallery/`.
2. Edit `public/data/gallery.json`. Keep each `id` unique and stable.
3. Set one item to `featured: true` to select the first large frame.

Only `id` and `src` are required. All photo paths must be local. Example:

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
  "memory": "An optional memory, in your own words.",
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

Categories: `Places`, `People`, `Moments`, `Details`. Orientations: `landscape`,
`portrait`, `square`. Wall views crop using the optional `position`; portrait
artwork and all approached photos use `object-fit: contain`, never stretching.
Supply compressed images around 1200–1800px on their longest edge; keep camera
originals elsewhere. Smaller variants are optional. Titles and alt text have
fallbacks. Empty, invalid, failed and missing-image states remain usable.

Related memories match place, year, feeling, explicit connections or shared tags.
Missing matches are omitted. Links prefer unvisited memories. The trail remembers
the last 12 unique visits during the current Gallery visit. Optional `credit`
and HTTPS `source` preserve attribution. Temporary images retain their original
credits; they are not represented as Fatemeh's personal photographs.

## Structure

- `memory-gallery.tsx`: data, loading states, shared Tehran clock and motion preference.
- `house-environment.tsx`: scene composition, keyboard interaction and focus containment.
- `use-house-navigation.ts`: cancellable journeys, approach/retraction, resize, input cleanup.
- `photo-frame.tsx`: persistent physical frame and responsive/local image loading.
- `photo-focus.tsx`: editorial metadata and memory connections.
- `house-wayfinding.tsx`: attention filters, trail and unobtrusive room controls.
- `motion.ts`: retained bounded, abortable camera movement utility.
- `lib/garden/memories.ts`: schema, relationships, stable four-photo room grouping,
  bounded state and projection geometry. First featured image leads the collection.
- `app/memory-gallery.css`: scoped photographic environment, mobile composition,
  day/sunset/night grading, motion and focus states.

Desktop uses a panoramic room wide enough to preserve the architecture's aspect
ratio. Scroll, trackpad, drag on empty space, arrow keys, Home/End and doorway
links explore it. A second photographic backdrop reveals a reading alcove.
Mobile places photos along a touch-friendly wall with generous spacing rather
than shrinking the desktop composition. The next wall is discoverable by swiping.

The same physical frame DOM node approaches the viewer and returns to its wall
anchor. The room dims behind it; no duplicate photo/lightbox is mounted. Escape
retracts it and restores keyboard focus. Connections first retract, then travel,
then approach. New intentions cancel previous journeys. Resize observers, frame
loops and listeners are cleaned up. Reduced motion skips travel and transitions.

Only the current and adjacent rooms receive photo sources; native lazy loading
and asynchronous decoding handle distance within them. No new runtime dependency
was added. The collection is limited to 120 photos; larger archives should add
virtualization. Two photographic room plates repeat for longer collections; this
is a lightweight 2.5D environment, not unrestricted 3D movement.

The existing `/#gallery` routing/history and 1.53-second doorway transition are
retained. Tehran daytime starts at 06:00, sunset at 17:00 and night at 20:00,
using the courtyard's existing shared clock.

## Architecture asset provenance

`room.webp` / `room-mobile.webp`: supplied reference edited with built-in ImageGen
to remove UI and framed photos, preserving plaster, carved doorway, lamps, rug,
bench, plants and pool. `alcove.webp` / `alcove-mobile.webp`: matching adjacent
house room with a reading nook. `walnut-frame.webp`: generated orthographic walnut
frame with transparent aperture, sliced at 164px for scalable borders.
These are environmental assets; the collection's photographs are existing local
repository images. Photo replacement never requires regenerating the room.

## Verification

`npm run typecheck`, scoped Gallery ESLint, production build, Gallery data and DOM
integration tests, and real-browser desktop/mobile checks. See `design-qa.md`
for visual evidence and browser checks. DOM tests supply explicit geometry and
verify identity, focus, categories, relationships, mobile resizing, failures,
rapid cancellation, reduced motion, history and unmount cleanup.

The production HTML smoke test runs the built worker in Miniflare/workerd with
isolated bindings. Its previous direct Node import could not resolve
`cloudflare:workers`; the test now uses the same runtime model as deployment.
Miniflare was already installed transitively by Wrangler and is now pinned as an
explicit development dependency for this test. No client/runtime dependency changed.
