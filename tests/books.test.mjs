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

const { books } = await vite.ssrLoadModule("/lib/garden/books.ts");

test("the initial shelf contains the requested six discoveries", () => {
  assert.deepEqual(
    books.map(({ title }) => title),
    [
      "Before the Coffee Gets Cold",
      "The Little Prince",
      "Sapiens",
      "Man’s Search for Meaning",
      "Norwegian Wood",
      "The Alchemist",
    ],
  );
  assert.equal(books[0].author, "Toshikazu Kawaguchi");
});

test("book records are unique and contain literary content", () => {
  assert.equal(new Set(books.map(({ id }) => id)).size, books.length);
  for (const book of books) {
    assert.ok(book.description.length > 30);
    assert.ok(book.personalNote.length > 30);
    assert.ok(book.quotes.length > 0);
    assert.ok(book.quotes.every((quote) => quote.length > 0));
  }
});

test("every placeholder cover is a local available asset", async () => {
  for (const book of books) {
    assert.match(book.coverImage, /^\/images\/[a-z0-9/.-]+\.(webp|jpg|png)$/);
    await access(`${root}/public${book.coverImage}`);
  }
});
