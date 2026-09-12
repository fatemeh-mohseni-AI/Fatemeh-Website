import assert from "node:assert/strict";
import test, { after } from "node:test";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
const vite = await createServer({ appType: "custom", configFile: false, root: fileURLToPath(new URL("..", import.meta.url)), server: { middlewareMode: true, hmr: false } });
after(() => vite.close());
const { memorySchema, memoriesSchema, relatedMemory, curateBays, initialMemoryState, memoryReducer, focusFrame } = await vite.ssrLoadModule("/lib/garden/memories.ts");
const { tehranLighting } = await vite.ssrLoadModule("/lib/garden/courtyard.ts");
const items = memoriesSchema.parse(JSON.parse(await readFile(new URL("../public/data/gallery.json", import.meta.url), "utf8")));

test("all memories use real local assets and valid connection targets", async () => {
  assert.ok(items.length >= 8);
  for (const item of items) {
    await access(new URL("../public" + item.src, import.meta.url));
    assert.ok(item.connections.every((id) => items.some((target) => target.id === id)));
  }
  assert.deepEqual(new Set(items.map((item) => item.orientation)), new Set(["portrait", "landscape", "square"]));
});
test("minimal metadata, an empty collection, and invalid sources are handled deliberately", () => {
  const minimal = memorySchema.parse({ id: "new-photo", src: "/gallery/photo.webp" });
  assert.equal(minimal.title, "An untitled memory");
  assert.deepEqual(minimal.tags, []);
  assert.equal(minimal.orientation, "landscape");
  assert.deepEqual(curateBays([]), []);
  for (const src of ["https://example.com/a.jpg", "/gallery/../secrets.jpg", "javascript:alert(1)", "/gallery/a.svg"])
    assert.equal(memorySchema.safeParse({ id: "a", src }).success, false);
  assert.equal(memoriesSchema.safeParse([minimal, minimal]).success, false);
  assert.equal(relatedMemory([minimal], minimal, "place"), null);
});
test("curation puts the featured memory first and every other frame on exactly one wall", () => {
  const bays = curateBays(items);
  assert.equal(bays[0].items[0].featured, true);
  assert.equal(new Set(bays.flatMap((bay) => bay.items.map((item) => item.id))).size, items.length);
  for (const kind of ["alcove", "corner", "doorway"]) assert.ok(bays.some((bay) => bay.kind === kind));
});
test("connections follow metadata, skip self and dangling IDs, and prefer unseen memories", () => {
  const current = items.find((item) => item.id === "afternoon");
  for (const kind of ["place", "year", "feeling", "thread"]) {
    const related = relatedMemory(items, current, kind);
    assert.ok(related && related.id !== current.id, kind);
  }
  const target = relatedMemory(items, current, "place");
  assert.notEqual(relatedMemory(items, current, "place", [target.id]).id, target.id);
  const minimal = memorySchema.parse({ id: "isolated", src: "/gallery/a.jpg", connections: ["missing"] });
  assert.equal(relatedMemory([minimal], minimal, "thread"), null);
});
test("filtering never alters focus or trail; exploration history is bounded and revisitable", () => {
  let state = initialMemoryState;
  for (let i = 0; i < 30; i++) state = memoryReducer(state, { type: "focus", id: `photo-${i}` });
  assert.equal(state.trail.length, 12);
  const filtered = memoryReducer(state, { type: "category", category: "People" });
  assert.equal(filtered.trail, state.trail);
  assert.equal(filtered.focusedId, state.focusedId);
  state = memoryReducer(filtered, { type: "focus", id: "photo-20" });
  assert.equal(state.trail.at(-1), "photo-20");
  assert.equal(state.trail.filter((id) => id === "photo-20").length, 1);
  assert.equal(memoryReducer(state, { type: "rest" }).focusedId, null);
});
test("focused portrait, square and landscape frames fit desktop and mobile viewing areas", () => {
  for (const mobile of [true, false]) for (const [width, height] of [[400, 260], [220, 320], [300, 300]]) {
    const view = { left: 20, top: 150, width: mobile ? 350 : 1200, height: 500 };
    const transform = focusFrame({ left: 85, top: 220, width, height }, view, mobile);
    const [, x, y, scale] = transform.match(/translate3d\(([-.\d]+)px, ([-.\d]+)px, 0\) scale\(([-.\d]+)\)/).map(Number);
    assert.ok(Number.isFinite(x) && Number.isFinite(y) && scale > 0);
    assert.ok(width * scale <= (mobile ? view.width - 40 : view.width * .61) + 1e-7);
    assert.ok(height * scale <= (mobile ? view.height * .51 : view.height - 48) + 1e-7);
  }
});
test("day, golden-hour and night share the Tehran clock", () => {
  for (const [hour, light] of [[6, "day"], [16, "day"], [17, "sunset"], [19, "sunset"], [20, "night"], [0, "night"]])
    assert.equal(tehranLighting(new Date(`2026-09-12T${String(hour).padStart(2, "0")}:00:00+03:30`)), light);
});
