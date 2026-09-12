# Courtyard and travel update — 12 September 2026

Based on main commit `c1d6e62`.

## Behavior

- The entrance no longer displays “Open the garden”. Scroll or swipe up to open the doors. The entrance region also accepts Enter, Space and Arrow Down when focused; the skip link remains available.
- The “Walk in 3D” button is removed.
- Every one of the nine built-in travel destinations has three distinct, real photographs stored under `public/images/travel/`. The first selected photograph loads eagerly; the others load lazily. Click a photograph to open the local full-size image. A failed image displays an explicit loading-failure message instead of an unrelated placeholder.
- Travel has a black background with a faint, locally hosted Milky Way photograph. Its brightness is controlled in `app/courtyard-travel.css`.
- Hovering over the actual courtyard fountain starts water jets, falling streams, droplets and ripples. Leaving stops them. Touch users can tap to toggle. Keyboard focus activates the fountain, and Enter/Space can toggle it. Reduced-motion preferences show static water. Leaving the courtyard or opening an overlay clears the interaction.
- A separate night photograph appears from 20:00 until 06:00 in `Asia/Tehran`, regardless of the visitor's timezone. The open page checks every 15 seconds and on tab visibility changes. Day/night transitions crossfade. The day image remains a fallback if the night image fails to load.
- Fountain artwork and its hit area follow the original photograph's cover crop, resize and camera transform, including the mobile 54% horizontal crop.

## Assets and maintenance

All 27 destination photographs are encoded as WebP at up to 1200 × 900. The Milky Way is 1920 × 960. Together these files are approximately 4.3 MB; only the selected destination's gallery is rendered. Photographs are illustrative destination images, not claims about the owner's personal photography.

Captions and credits are in `public/data/locations.json`. Detailed sources, license URLs and original downloads are in `public/data/travel-photo-sources.json` and `public/images/travel/ATTRIBUTION.md`. Local derivatives retain their stated source licenses.

The night asset is `public/images/courtyard-night.webp`, 1672 × 941, created with the built-in image generation tool in lighting/weather edit mode from `public/images/courtyard.webp`. The request preserved camera, composition, architecture, trees, pool and fountain positions, changing only illumination to a calm midnight scene with cool moonlight and restrained warm window and lantern reflections. No new people, text, moon or objects were requested. The source image was inspected before editing; the generated result was inspected before use.

Night schedule and image-coordinate geometry: `lib/garden/courtyard.ts`.
Night loading and fountain interaction: `components/garden/courtyard-artwork.tsx`.

## Verification

- Production build passes.
- TypeScript checking passes.
- 23 automated tests pass, including timezone boundaries, midnight, winter, viewport crop registration, destination schema, distinct local photographs, attribution records, and production entrance HTML.
- Focused lint on the new artwork, travel UI, timezone helper and data schema passes with image-element warnings. Repository-wide lint retains existing errors in garden state handling, the unused spatial scene, and the collection-loading hook; these predate this update.
- The managed browser could not reach the local preview, so a full interactive browser/phone visual pass has not been completed. Source photos and the night image were visually inspected. The SVG water animation is a lightweight visual overlay, not a fluid simulation.

## Run locally

Use Node 22.13 or newer. Run `npm run install:ci`, then `npm run dev`. Use `npm run typecheck` and `npm test` for validation. Existing Docker and hosting configuration are unchanged.
