import assert from "node:assert/strict";
import test, { after } from "node:test";
import { access } from "node:fs/promises";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  cacheDir: '.sites-runtime/test-vite',
  root,
  server: { middlewareMode: true },
});
after(() => vite.close());

const { books } = await vite.ssrLoadModule("/lib/garden/books.ts");
const { sheetPoint, tableAnchor, restingPageHeight, turningPagePoint } = await vite.ssrLoadModule('/lib/garden/book-geometry.ts');

test("the shelf contains nine distinct book discoveries", () => {
  assert.deepEqual(
    books.map(({ title }) => title),
    [
      "Before the Coffee Gets Cold",
      "The Little Prince",
      "Sapiens",
      "Man’s Search for Meaning",
      "Norwegian Wood",
      "The Alchemist",
      "The Prince and the Pauper",
      "The Master and Margarita",
      "One Hundred Years of Solitude",
    ],
  );
  assert.equal(books[0].author, "Toshikazu Kawaguchi");
});

test("book records are unique and contain literary content", () => {
  assert.equal(new Set(books.map(({ id }) => id)).size, books.length);
  for (const book of books) {
    assert.ok(book.description.length > 30);
    assert.ok(book.personalNote.length > 30);
    assert.ok(Array.isArray(book.quotes));
    assert.ok(book.quotes.every((quote) => quote.length > 0));
  }
});

test("every published cover is a dedicated local asset", async () => {
  for (const book of books) {
    assert.equal(book.coverImage, `/images/books/${book.id}.jpg`);
    await access(`${root}/public${book.coverImage}`);
  }
});

test('mesh sheet pins the spine, stays flat at endpoints and bends mid-turn', () => {
  for (const p of [0, .2, .5, .8, 1]) assert.deepEqual(sheetPoint(0,p), {x:0,z:0});
  assert.ok(Math.abs(sheetPoint(1,0).x-3.2)<1e-10);
  assert.ok(Math.abs(sheetPoint(1,1).x+3.2)<1e-10);
  assert.ok(Math.abs(sheetPoint(1,1).z)<1e-10);
  const edge=sheetPoint(1,.5), middle=sheetPoint(.25,.5);
  assert.ok(edge.z>2);
  assert.ok(Math.abs(edge.x/edge.z-middle.x/middle.z)>.01, 'sheet is curved, not one rigid plane');
});
test('book projects onto the table through the room cover crop', () => {
  assert.equal(tableAnchor(1672,941).x,1672*.515);
  assert.equal(tableAnchor(1672,941).y,941*.584);
  for (const [w,h] of [[1920,1080],[1280,720],[800,1000],[390,220]]) {
    const a=tableAnchor(w,h); assert.ok(a.x>0&&a.x<w&&a.y>0&&a.y<h);
  }
});

test('bound pages arch out of the gutter and turning endpoints join the stack', () => {
  assert.ok(restingPageHeight(.3,.5)>restingPageHeight(0,.5)+.15);
  for(const u of [0,.25,.5,.75,1]) for(const v of [0,.5,1]) {
    for(const p of [0,1]) {
      const point=turningPagePoint(u,v,p);
      assert.ok(Math.abs(point.z-restingPageHeight(u,v))<1e-9);
      assert.ok(Math.abs(point.x-(p===0?1:-1)*u*3.2)<1e-9);
    }
  }
});
