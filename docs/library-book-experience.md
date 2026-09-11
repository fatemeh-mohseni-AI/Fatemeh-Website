# Library book experience

## What changed

The existing Library room, fixed Persian reading-room background, essay list, article dialogs and shared garden navigation remain in place. `BookScene` adds one physical-book interaction over that room without creating a new route.

The closed book sits over the table area on desktop and becomes an in-flow discovery before the essay list on small screens. Its low-frequency lift, changing shadow and restrained halo make it discoverable without presenting it as a conventional app button.

## Opening sequence

The viewer reuses the project’s accessible Dialog primitive for focus management and modal semantics. Its visual sequence is driven by a small local state machine:

1. `focus`: the room darkens and softens while the book moves from the table toward the viewport center.
2. `opening`: the two covers/pages rotate away from the spine with CSS 3D transforms.
3. `open`: the spread becomes interactive.
4. `closing`: the pages close and the book returns toward the table before the dialog unmounts.

Visitors who prefer reduced motion go directly to the open state and page changes complete without animated travel.

## Page turning

Each spread represents one book. Dragging the lower-right page corner toward the left previews the next discovery; dragging the lower-left corner toward the right previews the previous one. The turning sheet follows pointer distance, rotates around the spine, and settles forward after the drag passes its completion threshold. Previous/Next buttons and Left/Right keyboard keys provide equivalent access.

CSS perspective, preserve-3d, backface visibility, separate boards, a layered page block, spine shading and moving sheet shadows create the physical depth. No WebGL renderer or additional dependency is required.

## Data and adding books

Book data is defined in `lib/garden/books.ts`. Add a new object to the exported `books` array with:

- a unique `id`, `title` and `author`;
- a local `coverImage` path, useful alternative text and optional focal position;
- a short `description`, selected `quotes` and `personalNote`;
- an optional `category` and one of the supported visual themes.

The current images intentionally reuse existing garden assets as placeholders. Put replacement covers under a dedicated local image folder, update `coverImage`, and keep their aspect ratios large enough for the visual page’s portrait crop. This data boundary can later be replaced by an admin/CMS response without changing the viewer.

## Current limitations and future work

- Covers are atmospheric placeholders rather than final licensed cover artwork.
- Page curvature is simulated with planar CSS 3D surfaces; a future WebGL version could add mesh deformation and physically based lighting.
- Personal notes are static seed content and are not editable yet.
- Future additions can include an admin panel, real cover uploads, reading dates, favorite passages, progress, richer paper sound/shadow cues and optional restrained sound design.
