import assert from "node:assert/strict";
import test, { after } from "node:test";
import { readFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  server: { middlewareMode: true },
});
after(() => vite.close());
const { locationsSchema, writingSchema, gallerySchema, earthLink } =
  await vite.ssrLoadModule("/lib/garden/data.ts");
test("all published collections are valid and reference available images", async () => {
  const locations = locationsSchema.parse(
    JSON.parse(
      await readFile(
        new URL("../public/data/locations.json", import.meta.url),
        "utf8",
      ),
    ),
  );
  const writings = writingSchema.parse(
    JSON.parse(
      await readFile(
        new URL("../public/data/writings.json", import.meta.url),
        "utf8",
      ),
    ),
  );
  const gallery = gallerySchema.parse(
    JSON.parse(
      await readFile(
        new URL("../public/data/gallery.json", import.meta.url),
        "utf8",
      ),
    ),
  );
  assert.ok(locations.length);
  assert.ok(writings.every((a) => a.body.length));
  assert.ok(gallery.length);
  for (const image of gallery)
    await access(new URL("../public" + image.src, import.meta.url));
  await access(new URL("../public/images/earth.webp", import.meta.url));
});
test("location boundary checks reject invalid coordinates and duplicate IDs", () => {
  const place = {
    id: "one",
    name: "A place",
    latitude: 0,
    longitude: 0,
    type: "visited",
  };
  assert.equal(locationsSchema.parse([place])[0].description, "");
  for (const latitude of [NaN, Infinity, 91, -91])
    assert.equal(
      locationsSchema.safeParse([{ ...place, latitude }]).success,
      false,
    );
  for (const longitude of [181, -181])
    assert.equal(
      locationsSchema.safeParse([{ ...place, longitude }]).success,
      false,
    );
  assert.equal(locationsSchema.safeParse([place, place]).success, false);
  assert.equal(
    locationsSchema.safeParse(
      Array.from({ length: 251 }, (_, i) => ({ ...place, id: String(i) })),
    ).success,
    false,
  );
});
test("Earth links never use imported executable URLs or lookalike hosts", () => {
  const place = locationsSchema.parse([
    {
      id: "one",
      name: "A place",
      latitude: 35,
      longitude: 51,
      type: "visited",
    },
  ])[0];
  for (const url of [
    "javascript:alert(1)",
    "https://earth.google.com.evil.test/",
    "http://earth.google.com/",
    "data:text/html,abc",
  ])
    assert.equal(
      earthLink({ ...place, googleEarthLink: url }),
      "https://earth.google.com/web/search/35,51",
    );
  assert.equal(
    earthLink({
      ...place,
      googleEarthLink: "https://earth.google.com/web/search/Japan",
    }),
    "https://earth.google.com/web/search/Japan",
  );
});
