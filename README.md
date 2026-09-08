# Fatemeh’s Digital Garden

An immersive personal world for Fatemeh Mohseni: Iranian cultural roots, contemporary technology, and global curiosity. No political or governmental visual identity.

## What works

- Full-screen photographic Orosi doors: scroll/swipe controls the hinged opening; a button and reduced-motion setting bypass the animation.
- Cinematic courtyard with bounded camera panning, keyboard/touch controls, physical hotspots, and direct room navigation.
- Optional true Three.js walking courtyard: bounded movement, pool collision, labeled interactive doors, water, curtains, and WebGL fallback. This is a deliberately simplified architectural prototype, separate from the photoreal cinematic view.
- Library with readable concept essays; framed gallery and full-screen image viewer; cinema with three silent visual essays; laboratory with a live radial geometry experiment.
- Lazy-loaded Three.js Earth using NASA Blue Marble imagery, correct geographic markers, rotation/zoom controls, accessible destination list, visited/dream/meaningful filters, and Google Earth links.
- External validated JSON content. Local KML Point import (2 MB / 250 markers); imported markup is rendered as plain text. KML stays in the current tab. KMZ must be unzipped first.
- Seven discoveries recorded in a device-local journal. Storage failure is handled without blocking navigation. Sound defaults off; synthesized wind only starts after opt-in.
- Responsive room navigation, accessible dialogs, keyboard alternatives, reduced-motion preference, deep links via URL hashes, and connection through the provided GitHub profile.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

```bash
npm run typecheck
npm test
```

`npm run build` uses the preserved Vinext/Cloudflare build. `npm test` builds and then checks server-rendered HTML and content contracts. No browser automation or device FPS profiling was performed in the initial build.

## Architecture

React 19 + TypeScript; Next.js App Router-compatible source on Vinext; Three.js loaded only for Earth or walking mode. Styling uses shared Tailwind tokens and custom CSS. Radix-backed dialog, switch, and slider primitives retain accessibility behavior. There is no external AI API, tracking, CMS, database, or server-side guestbook.

- `components/garden/garden.tsx`: entrance, room navigation, preferences, journal and courtyard shell.
- `components/garden/spatial-garden.tsx`: the walkable WebGL courtyard; resource cleanup and bounded movement.
- `components/garden/rooms.tsx`: reading, travel, gallery, cinema, and generative experiment.
- `components/garden/globe.tsx`: lazy-loaded Earth renderer, texture, markers, controls, fallback.
- `lib/garden/data.ts`: Zod schemas, safe Earth links, and bounded KML parsing.
- `public/data/`: editable content, with locations fetched independently from the application code.
- `public/images/`: locally served compressed assets; there are no hotlinked image dependencies.

## Personalizing

The supplied brief gives Fatemeh’s name and interests, but no personal portrait, verified travel history, original essays, photographs, favorite films, or project descriptions. The site therefore uses clearly labeled concept material, an FM monogram, and example locations. It does not attribute invented trips, photography, or film preferences to her.

1. Replace the concept essays in `public/data/writings.json` with personal writing.
2. Replace `public/data/gallery.json` and add personal photos to `public/images/`; supply accurate credits.
3. Edit `public/data/locations.json`: each location needs a unique `id`, name, numeric latitude/longitude, and one of `visited`, `dream_destination`, or `meaningful_location`. Optional fields default safely. Set `sample: false` for verified personal entries.
4. Add an approved portrait and replace the monogram in the about dialog.
5. Replace the concept cinema programme with selected films and licensed media; extend the lab with real project descriptions.

The current contact option opens `https://github.com/fatemeh-mohseni-AI`. No email address has been invented and no messages are sent by this app.

## Publishing and repository

The built preview is privately hosted through Sites. `.openai/hosting.json` belongs to that deployment; its project ID is not a secret but must not be reused for a different Site.

Requested source destination: `https://github.com/fatemeh-mohseni-AI/Fatemeh-Website`. The connected GitHub account returned 404 for both the repository and its contents during the initial implementation, so this build has not been pushed there. Grant the GitHub connection access to that repository before syncing. Preserve any existing repository history and integrate on a feature branch when access is restored.

For Vercel, the UI source is Next.js compatible but the current build command targets Cloudflare through Vinext. Use a dedicated Vercel integration commit with `next build`, remove Cloudflare-only build artifacts from that deployment’s TypeScript scope, and validate it there before publishing. Vercel deployment was not performed.

## Performance and limitations

Textures are compressed and served locally. Three.js code is split from initial page content; device pixel ratio and scene geometry are capped. Earth rotates only while active, pauses during user manipulation, supports render-on-demand while paused, and stops when its room is unmounted. Both WebGL views dispose renderer, geometry, texture, event, and observer resources.

60 FPS is a design target, not a measured guarantee. The walking view is lightweight procedural architecture, not a production scanned environment. The cinematic entrance and room imagery are photographic concept assets with image-based camera movement. There is no free-roaming connected 3D interior for every room yet. Personal media, custom modeled rooms, KML/KMZ persistence, a CMS, a shared moderated guestbook, and device profiling are future production work.

## Asset credits

Three architectural assets were generated with the built-in image generator for this project. Exact prompts and source provenance: `public/data/asset-provenance.json`. They are marked as architectural concepts in the gallery, not personal photographs.

Earth: NASA Earth Observatory, Blue Marble Next Generation with topography and bathymetry, January 2004; reduced to a 2048 × 1024 WebP for this app.

Source: https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography-bathymetry/

Original: https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography-bathymetry/january/world.topo.bathy.200401.3x5400x2700.jpg
