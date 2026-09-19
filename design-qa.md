# Memory Gallery rebuild — design QA

final result: passed

## Evidence

- Source visual: supplied `ChatGPT Image Sep 17, 2026, 03_17_03 PM.png`,
  originally 1672 × 941 pixels, in `../upload/`.
- Browser-rendered implementation: `docs/gallery-qa/desktop.jpg`.
- Combined source/implementation comparison: `docs/gallery-qa/comparison.jpg`
  (source above, implementation below). Both images were opened together and reviewed.
- Mobile browser screenshot: `docs/gallery-qa/mobile.jpg`, 390 × 844 pixels.
- Desktop CSS viewport: 1672 × 941, inside a temporary browser iframe scaled
  to 1363 × 767 for capture at device density 1. Source was normalized to that
  same capture size. The temporary verification page was removed before build.
- State: `/#gallery`, first wall, no photograph focused, all categories, daylight.
  Also inspected a normal 1363 × 936 desktop window, photo focus on desktop and
  mobile, and the second room on mobile.

## Comparison history and fixes

1. The old implementation used flat CSS architecture, a boxed scene and a floating
   room dock. Those components and Gallery rules were removed. The new full-height
   room uses photographic architecture and independent photo elements.
2. [P2, fixed] Initial background dimensions compressed the room horizontally.
   Room width now preserves its architectural ratio and contains horizontal
   exploration within the Gallery viewport. Post-fix comparison preserves the
   door, bench, runner, lamps and doorway proportions.
3. [P2, fixed] The Details category reached into the hero frame. Reducing the
   category gap cleared the frame. The final desktop capture shows all labels
   on unobstructed background.
4. [P2, fixed] The global letter control inherited a mobile centering transform
   and overlapped the brand. Gallery-scoped positioning now places it at the
   upper right on mobile. The final mobile capture shows clear separation.
5. [P2, fixed] A repeated architectural plate weakened the sense of discovery.
   The second room now uses a distinct reading-alcove plate with matching materials
   and picture-placement regions. Its navigation and layout were inspected.

## Required fidelity surfaces

- Typography: restrained Georgia display/italic typography and the existing sans
  UI. Heading hierarchy, captions and editorial links remain readable. No text is
  baked into the room plate. Mobile wraps metadata in a separately scrollable area.
- Layout: asymmetric hero/supporting/right-wall positions follow the reference.
  The scene fills the viewport; the former floating room dock is absent. The
  doorway and bottom trail retain breathing room. Mobile has its own wide wall
  composition with large photographs and reachable controls.
- Colors: walnut, cream, aged brass and warm light match the source direction.
  Daylight is intentionally brighter than the supplied golden-hour image; the
  shared Tehran clock selects sunset/night grading without a separate environment.
- Image quality: architecture and walnut borders use optimized raster assets.
  Gallery photos are existing local repository content, as requested. Source
  picture choices, exact crops and some perspective are therefore intentionally
  different from the reference. Portraits and focused photographs are contained;
  other wall photos use crop positions rather than stretching.
- Copy: supplied heading and category labels are retained. Doorway actions,
  metadata, trail and connections describe real implemented behavior. Sample
  photographs keep their source credits. Three room groups replace the reference's
  illustrative seven-count indicator because that reflects the current collection.

The combined full-view image is large enough to inspect the heading, labels,
frame edges and spacing. Separate focused crops were unnecessary; exact frame
return was additionally checked with live DOM geometry.

## Browser interaction checks

- Direct `/#gallery` load and refresh display the Gallery.
- Back to courtyard restores the existing courtyard and its navigation.
- Gallery hotspot completes the existing short doorway entry sequence.
- Browser Back after entry returns along history; DOM integration tests also
  cover forward navigation and restoration after following an onward link.
- Opening a photo moves its original DOM frame into focus. Closing with Escape
  returns to exactly the measured initial bounds after hover ends:
  x 392.90625, y 244.65625, width 346.09375, height 263.46875 (desktop CSS pixels).
- People filtering dims 10 of the 11 sample frames without changing layout nodes.
- Follow the place travels from Stockholm's waterfront photo to Colours along
  the quay; the memory trail provides a return action.
- Desktop and mobile focus show the image, metadata, close action and connections.
  Tab containment and restored focus are covered by integration tests.
- Mobile horizontal scrolling changed corridor scrollLeft while document width
  remained exactly 390 pixels; room controls also moved to the next room.
- Console errors checked after loading the finished Gallery. An earlier preview
  restart resolved a development-cache module fetch error; no Gallery application
  error remained in the final session.

## Automated checks

- Production build: passed.
- Full test suite: 40 passed, 0 failed.
- TypeScript: passed.
- Gallery ESLint: no errors (two native-image optimization suggestions).
- Tests cover local data/defaults, missing images, portrait/square/landscape
  geometry, focus identity, filters, connections, keyboard, mobile resizing,
  cancellation, unmount cleanup, shared lighting, reduced motion and routing.
- The worker smoke test now uses the installed Miniflare/workerd runtime instead
  of trying to resolve `cloudflare:workers` through Node's ESM loader.

## Remaining limitations / follow-up polish

- The supplied image is an art-direction reference, not a pixel-identical photo
  inventory. Final personal photos can replace samples entirely through JSON.
- The 2.5D house intentionally reuses two architectural plates for longer
  collections; it is not a freely navigable 3D building.
- Native touch-device hardware and every tablet size were not available. Mobile
  layout/input was checked at 390 × 844 in a browser viewport, and responsive
  geometry/reduced motion were exercised in integration tests.
- No actionable P0/P1/P2 visual finding remains. Final personal photography and
  per-photo crop tuning are optional P3 polish.
