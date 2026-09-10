# Travel Observatory — future roadmap

The current atlas keeps its locations in a validated seed file and uses placeholder gallery images. A future content workflow can build on the same location shape without changing the globe interaction.

## Next steps

- Add an authenticated admin panel for creating, editing, ordering, and archiving travel locations.
- Upload real photos and videos per location, with captions, alt text, focal points, and credits.
- Edit descriptions, short notes, coordinates, and Google Earth links.
- Manage categories and marker styles without changing application code.
- Add category and date filters while keeping the globe visually primary.
- Introduce a travel timeline for visited places.
- Draw optional route lines between related journeys.
- Expand the preview strip into richer, keyboard-accessible galleries.
- Support Markdown travel notes for longer stories.
- Add location search for a larger atlas.
- Offer finer marker customization, clustering, and accessible marker labels.
- Add an explicit reduced-motion mode for camera flights and ambient rotation.
- Improve the mobile experience with a compact details drawer and touch-tuned globe controls.

## Suggested migration path

Keep the `TravelLocation` contract as the boundary between the globe and storage. Replace the current JSON loader with a CMS/API adapter, validate responses with the existing Zod schema, and keep presentation components independent from the admin implementation.
