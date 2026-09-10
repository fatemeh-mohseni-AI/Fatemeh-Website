# Courtyard → Cinema entry

## Existing architecture, preserved

- React 19 + TypeScript, Vite 8 / Vinext; app entry is `app/page.tsx` → `Garden`.
- Room selection is React state synchronized with URL hashes, not separate route pages.
- Default courtyard: local photograph with CSS pan/zoom (pseudo-3D). Optional walking courtyard: imperative Three.js. No Framer Motion or GSAP dependency was added.
- Existing Cinema programme, three visual essays, playback, discovery stamps and bottom navigation remain intact. Travel and the other rooms were not redesigned.

## Entry flow

All user navigation from an entered courtyard to Cinema (hotspot, dock, garden map and 3D doorway) passes through `goTo`. Only destinations present in `sceneTransitions` opt in; initially this is only Cinema. Initial `#cinema` visits and external hash changes load directly into the final environment, without replaying a courtyard the visitor has not seen.

1. **Preparing:** lock synchronously against double clicks, choose one of the five local photographs, preload the existing lazy room module and decode the selected image. Hover/focus on the hotspot and dock warms all five small WebP assets. Image preparation has a 2.5s deadline; room-module preparation has an 8s deadline. A failed image uses a dark transition surface; a module failure leaves the visitor in the courtyard with a retry message.
2. **Focus + approach, 4.2s:** the state machine retains two semantic phases, but the visible courtyard now uses one uninterrupted CSS keyframe from its current surface toward the Cinema hotspot. This removes the previous two-step bump. Mobile uses a smaller endpoint. The optional Three.js view follows the same total duration with a continuous ease toward the west-side doorway.
3. **Environment, 1.8s:** crossfade to the selected Bagh-e Ferdows photograph and a small forward drift.
4. **Settle, 300ms:** once covered, commit `room=cinema` and `#cinema`, keeping the shared shell and navigation mounted. The preloaded Cinema content mounts behind the cover.
5. **Reveal, 1.1s:** fade the cover out as the existing Cinema UI fades in over the same selected photograph, now darkened and softened. The final environment sits outside the scrollable room so it stays steady while content scrolls.

Normal animation is approximately **7.4s**, excluding cold resource loading. The selected image is stable for the entire transition and final Cinema scene, and the immediately previous path is excluded from the next random choice. Reduced-motion entry skips focus and approach and uses a **320ms** stationary crossfade. System preference is checked at navigation, and CSS also honors it. No sound is started by this transition.

A restrained `details` disclosure says “On the way to Bagh-e Ferdows, Tehran” during entry. It opens a five-line history note. The same disclosure remains available beneath the Cinema heading after arrival so the story is not lost when the transition completes.

During entry, the underlying shell is `inert`; focus moves to a visible Back button. Escape or Back cancels the abortable sequence and returns to the courtyard. External valid hash changes cancel pending navigation before proceeding. Unmount cleanup cancels waits and prevents stale room commits. Once entry finishes, focus moves to the Cinema heading with no forced scrolling.

## Files and responsibilities

- `lib/garden/scene-transitions.ts`: typed destination config, phase ordering and abortable timing runner.
- `components/garden/use-scene-transition.ts`: single-flight lock, preload/decode, cancellation, phase state, completion and failure handling.
- `components/garden/scene-transition.tsx`: reusable environment and transition overlay; accessible status and cancellation.
- `components/garden/garden.tsx`: navigation interception and late room/history commit; retains the existing shell.
- `components/garden/spatial-garden.tsx`: optional 3D camera cue without recreating the WebGL scene.
- `app/cinema-transition.css`: scoped imagery, overlay, motion, responsive and reduced-motion styling.
- `public/images/cinema/1.webp` through `5.webp`: user-supplied entry/final backgrounds. The selected path is reused after arrival to prevent a flash.
- `public/images/cinema/ATTRIBUTION.md`: asset provenance notes. Source and reuse rights for user-supplied images should be recorded here before public release.

## Replacing images

Use rights-cleared images, optimize them to WebP, and replace the numbered files or change `cinemaTransition.images`. Keep the transition and settled background on the same selected asset/crop to avoid a flash. Adjust `object-position` for the chosen composition and record source and reuse terms in the attribution document.

## Extending the pattern later

Add a typed config for Library, Gallery, Observatory or Lab in `sceneTransitions`, with its own title, Persian label, image, hotspot and timing. Generalize the final environment selection in Garden, add destination-scoped styles, and supply a camera cue if that destination should also work in the optional 3D view. Do not enable unbuilt destinations merely by adding a name.

Possible follow-ups: transitions for the other four rooms; independently masked foreground/tree layers for richer parallax; opt-in sound design respecting the existing mute control; more advanced pseudo-3D depth; collision-aware 3D paths or a true 3D courtyard upgrade; browser interaction testing on touch devices and low-end GPUs.

## Validation

Phase-order and abort tests live in `tests/scene-transition.test.mjs`, alongside checks for the local image and unchanged programme content. Typecheck, production build and existing tests remain the validation baseline. Browser/visual QA should check source pan continuity, repeated clicks, cancellation, slow-loading assets, direct hashes, both courtyard modes, narrow screens and reduced-motion before public release.
