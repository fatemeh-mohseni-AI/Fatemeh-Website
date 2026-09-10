import assert from "node:assert/strict";
import test, { after } from "node:test";
import { access } from "node:fs/promises";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  server: { middlewareMode: true },
});
after(() => vite.close());

const { cinemaRecommendations, cinemaWatchlist } = await vite.ssrLoadModule(
  "/lib/garden/cinema-collection.ts",
);

test("the requested recommendations and watchlist are complete", () => {
  assert.deepEqual(
    cinemaRecommendations.map(({ title }) => title),
    [
      "Breaking Bad",
      "Peaky Blinders",
      "Better Call Saul",
      "Pirates of the Caribbean",
      "Prison Break",
      "Pride & Prejudice",
    ],
  );
  assert.deepEqual(
    cinemaWatchlist.map(({ title }) => title),
    ["Sherlock", "Silo", "Reacher"],
  );
});

test("Better Call Saul is the single favorite series", () => {
  const favorites = cinemaRecommendations.filter(({ favorite }) => favorite);
  assert.equal(favorites.length, 1);
  assert.equal(favorites[0].title, "Better Call Saul");
});

test("recommendations include quotations and IMDb snapshots", () => {
  for (const item of cinemaRecommendations) {
    assert.ok(item.quote.length > 0);
    assert.ok(item.speaker.length > 0);
    assert.match(item.imdbUrl, /^https:\/\/www\.imdb\.com\/title\/tt\d+\/$/);
    assert.ok(item.imdbRating >= 0 && item.imdbRating <= 10);
  }
});

test("every cinema title references a committed local image", async () => {
  for (const item of [...cinemaRecommendations, ...cinemaWatchlist]) {
    assert.match(item.image, /^\/images\/cinema-titles\/[a-z0-9-]+\.jpg$/);
    await access(`${root}/public${item.image}`);
  }
});
