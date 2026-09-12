import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const vite = await createServer({ appType: "custom", configFile: false,
  root: fileURLToPath(new URL("..", import.meta.url)), server: { middlewareMode: true, hmr: false } });
after(() => vite.close());
const { cinemaTransition, galleryTransition, pickSceneImage, runSceneEntry, sceneTransitions } =
  await vite.ssrLoadModule("/lib/garden/scene-transitions.ts");
const fastConfig = { ...cinemaTransition,
  timing: { focus: 1, approach: 1, environment: 1, settle: 1, reveal: 1 } };

test("Cinema keeps its five images and Gallery opts into a short doorway transition", () => {
  assert.deepEqual(Object.keys(sceneTransitions), ["cinema", "gallery"]);
  assert.equal(galleryTransition.images[0], "/images/door.webp");
  const duration = Object.values(galleryTransition.timing).reduce((a, b) => a + b, 0);
  assert.ok(duration >= 1000 && duration <= 2000);
  assert.deepEqual(cinemaTransition.images, [1, 2, 3, 4, 5].map((n) => `/images/cinema/${n}.webp`));
});
test("image selection avoids the immediately previous path", () => {
  assert.equal(pickSceneImage(cinemaTransition.images, null, () => 0), cinemaTransition.images[0]);
  assert.equal(pickSceneImage(cinemaTransition.images, cinemaTransition.images[0], () => 0), cinemaTransition.images[1]);
  assert.equal(pickSceneImage(["only"], "only", () => 0.9), "only");
});
test("the full-motion entry is deliberately paced", () => {
  assert.equal(Object.values(cinemaTransition.timing).reduce((sum, value) => sum + value, 0), 7400);
  assert.equal(cinemaTransition.timing.focus + cinemaTransition.timing.approach, 4200);
});
test("room commit happens only behind the environment, before reveal", async () => {
  const events = [];
  await runSceneEntry({ config: fastConfig, reduced: false,
    signal: new AbortController().signal, onPhase: p => events.push(p), onCommit: () => events.push("commit") });
  assert.deepEqual(events, ["focus", "approach", "environment", "settle", "commit", "reveal"]);
});
test("reduced motion omits both camera-motion phases", async () => {
  const events = [];
  await runSceneEntry({ config: fastConfig, reduced: true,
    signal: new AbortController().signal, onPhase: p => events.push(p), onCommit: () => events.push("commit") });
  assert.deepEqual(events, ["environment", "settle", "commit", "reveal"]);
});
test("cancelling during approach never commits a stale room", async () => {
  const controller = new AbortController();
  let commits = 0;
  await assert.rejects(runSceneEntry({ config: fastConfig, reduced: false, signal: controller.signal,
    onPhase: p => { if (p === "approach") controller.abort(); }, onCommit: () => commits++ }), { name: "AbortError" });
  assert.equal(commits, 0);
});
test("an already cancelled entry does not change phase or navigate", async () => {
  const controller = new AbortController();
  controller.abort();
  await runSceneEntry({ config: fastConfig, reduced: false, signal: controller.signal,
    onPhase: () => assert.fail("Unexpected phase"), onCommit: () => assert.fail("Unexpected navigation") });
});
