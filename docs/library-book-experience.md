# Library book experience

The existing Library room, essays and garden navigation remain unchanged. No new route or dependency was added.

## Scene and fixes
- `BookScene` uses Radix modal primitives for focus trapping, Escape and focus restoration. A fullscreen grid keeps the book centered and controls on screen. It deliberately does not use the shared DialogContent's individual translate utilities: combining those with the old CSS translate caused the upper-left cropping.
- The closed book is a plain walnut-brown leather volume, with no title or catalogue cover. It is anchored to a tabletop point in the 1672×941 room photograph through the same cover-crop calculation as the background. A five-second, low-intensity light pulse attracts attention without moving the book. Its label appears only on hover/focus. On mobile the room vignette stays in normal flow.
- Opening darkens/blurs the room, moves attention from the table to the centered book and opens the boards. Animation begins after the graphics renderer is ready. Closing/Escape immediately returns to the Library.
- Reduced-motion users skip the travel/open/flip animation. The visible Reading view and its toggle have been removed at the owner's request. A screen-reader-only semantic copy still exposes the current record. Graphics failure shows a short status message and leaves Back/Escape usable; it does not open an alternate reader.

## Actual mesh page turning
`components/garden/book-mesh.tsx` lazy-loads the existing Three.js dependency. Covers, page blocks and spine have physical thickness. A 48×12 segmented sheet bends by integrating its tangent along the width (`lib/garden/book-geometry.ts`); vertex positions and normals change with drag progress. Separate front/back textures, directional lighting and soft shadows reveal curvature. This is a deformable WebGL mesh, not a rigid CSS plane.

The open spread now has permanent curvature at rest, with a low central gutter and raised shoulders. Each half has a solid extruded curved page block and eighteen staggered leaf surfaces above a thick leather board. A more oblique camera exposes the lower page edges. The turning sheet meets the resting curvature at both endpoints. Procedural fine paper grain, subtle patina, gutter occlusion and restrained tone-mapped lighting replace the flat bright yellow surface. Canvas text explicitly falls back to a serif family. The published cover is presented at a slight angle on the right-hand page; its small mounting shadow is painted into that page texture, while the surrounding book is actual geometry.

Drag either lower outer corner. Passing 25% of the drag distance completes the turn; a short drag, pointer cancellation or lost capture returns the sheet. Buttons and arrow keys provide equivalents; bounds and an interaction lock prevent overlapping turns. Every completed turn advances exactly one book discovery, not another page of the same novel.

The scene renders only on state, resize or texture updates, caps pixel ratio and disposes GPU resources when closed. Paper deformation is an artistic curve, not a full cloth-physics simulation.

## Data and assets
`lib/garden/books.ts` contains nine records, including The Prince and the Pauper, The Master and Margarita and One Hundred Years of Solitude. First is Before the Coffee Gets Cold. Each spread has literary text on the left and the actual published cover on the right.

Covers live at `public/images/books/<id>.jpg`; they are English-language editions, locally served without runtime hotlinks. See `docs/book-cover-sources.md` for provenance and rights caveats. Add a record with id, title, author, coverImage, coverAlt, description, quotes array (can be empty), personalNote, category and theme. Notes are labeled drafts, not claims about the owner's personal experience. New books omit quotations pending selection from a verified edition. Existing seed quotations should also be editorially checked against chosen translations before public publication.

`public/images/library/walnut-leather.webp` is an original generated material texture, created on 11 September 2026 and shared by the table book and WebGL binding. It contains no text or book-specific artwork. Paper grain is computed deterministically in the renderer; no new font or graphics dependency is required.

## Validation and remaining QA
TypeScript, production build and six data/geometry regression tests are used. The tests cover nine distinct records, local assets, spine anchoring, flat integration endpoints, genuine intermediate curvature, table projection and continuity between the curved rest/turn states. Test Vite caches are isolated from the live preview. This environment still fails to load the dynamic graphics module, so final visual matching, interactive WebGL, Firefox and touch-device verification remain required; do not treat a successful build as visual verification.

## Future work
Admin/CMS editing, owner-authored notes, reading dates, verified favorite passages, permission-cleared cover uploads, higher-order page physics and optional quiet paper audio. Keep sound opt-in and preserve reduced motion and semantic screen-reader content.
