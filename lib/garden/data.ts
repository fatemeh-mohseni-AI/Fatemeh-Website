import { z } from "zod";
export const locationSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(120),
  country: z.string().min(1).max(120).default("Imported place"),
  label: z.string().min(1).max(120).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  type: z.enum(["home", "visited", "dream"]),
  description: z.string().max(2000).default(""),
  shortNote: z.string().max(240).optional(),
  markerIcon: z.enum(["home", "compass", "star"]).optional(),
  images: z.array(z.string().startsWith("/images/")).max(12).default([]),
  googleEarthLink: z.string().default(""),
});
export const locationsSchema = z
  .array(locationSchema)
  .max(250)
  .refine(
    (v) => new Set(v.map((p) => p.id)).size === v.length,
    "Location IDs must be unique.",
  );
export type Location = z.infer<typeof locationSchema>;
export const writingSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    category: z.string(),
    minutes: z.number(),
    status: z.string(),
    excerpt: z.string(),
    body: z.array(z.string()),
  }),
);
export type Writing = z.infer<typeof writingSchema>[number];
export const gallerySchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    caption: z.string(),
    src: z.string().startsWith("/images/"),
    alt: z.string(),
    credit: z.string(),
  }),
);
export type GalleryItem = z.infer<typeof gallerySchema>[number];
export function earthLink(p: Location) {
  try {
    const u = new URL(p.googleEarthLink);
    if (u.protocol === "https:" && u.hostname === "earth.google.com")
      return u.href;
  } catch {}
  return `https://earth.google.com/web/search/${p.latitude},${p.longitude}`;
}
export function parseKml(text: string): Location[] {
  if (text.length > 2_000_000)
    throw new Error("Please choose a KML file smaller than 2 MB.");
  if (/<!DOCTYPE|<!ENTITY/i.test(text))
    throw new Error("This file contains unsupported XML declarations.");
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.getElementsByTagName("parsererror").length)
    throw new Error("This KML file could not be read.");
  const nodes = Array.from(doc.getElementsByTagNameNS("*", "Placemark"));
  const result: Location[] = [];
  for (const [i, node] of nodes.entries()) {
    const point = node.getElementsByTagNameNS("*", "Point")[0];
    if (!point) continue;
    const coordinates = point
      .getElementsByTagNameNS("*", "coordinates")[0]
      ?.textContent?.trim()
      .split(/\s+/)[0]
      .split(",");
    if (
      !coordinates ||
      coordinates.length < 2 ||
      !coordinates[0].trim() ||
      !coordinates[1].trim()
    )
      continue;
    const longitude = Number(coordinates[0]),
      latitude = Number(coordinates[1]);
    const name =
      node
        .getElementsByTagNameNS("*", "name")[0]
        ?.textContent?.trim()
        .slice(0, 120) || `Place ${i + 1}`;
    const rawDescription =
      node.getElementsByTagNameNS("*", "description")[0]?.textContent || "";
    // Preserve descriptions as plain text. Never insert imported markup into the DOM.
    const description = rawDescription.replace(/<[^>]*>/g, "").slice(0, 2000);
    const parsed = locationSchema.safeParse({
      id: `import-${i}`,
      name,
      country: "Imported from KML",
      longitude,
      latitude,
      description,
      shortNote: "A place from your Google Earth file.",
      markerIcon: "compass",
      images: [],
      type: "visited",
    });
    if (parsed.success) result.push(parsed.data);
  }
  if (!result.length)
    throw new Error(
      "No valid point locations were found. Export places as KML with Point placemarks.",
    );
  if (result.length > 250)
    throw new Error("Please import no more than 250 locations at once.");
  return result;
}
