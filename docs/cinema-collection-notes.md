# Cinema collection

## Structure

The Cinema room keeps the existing Bagh-e Ferdows environment and adds two data-driven collections:

- **Fatemeh Recommends:** a six-title carousel with a local still, short quotation, character attribution, title type/year and IMDb rating.
- **Currently Watching:** three compact watchlist cards with a local still and IMDb rating.

Collection data lives in `lib/garden/cinema-collection.ts`. Add, remove or reorder entries there rather than editing the Cinema component. Images live in `public/images/cinema-titles/`; their temporary reference sources are documented in the adjacent `ATTRIBUTION.md`.

## Interaction and accessibility

The recommendation carousel supports Previous/Next controls, title selectors, horizontal swipe gestures and Left/Right keyboard keys. The selected title is announced through an `aria-live` heading. External IMDb links open in a new tab, and all motion is disabled when the visitor requests reduced motion.

IMDb ratings are deliberately stored as snapshot values. Refresh them manually when the collection changes and update `imdbRatingCheckedAt`. Do not scrape IMDb at runtime.

## Future extensions

- Move title data into the future admin/CMS flow.
- Add personal notes, genres, viewing dates and spoiler-safe longer reviews.
- Replace temporary stills with licensed, curated imagery.
- Add optional filters for films, series, recommendations and completed titles.
- Add a discreet progress indicator for currently watched seasons.
