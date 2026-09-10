import assert from "node:assert/strict";
import test, { after } from "node:test";
import { access, readFile } from "node:fs/promises";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const vite = await createServer({ appType: "custom", configFile: false,
  root: fileURLToPath(new URL("..", import.meta.url)), server: { middlewareMode: true } });
after(() => vite.close());
const { cinemaTransition, runSceneEntry, sceneTransitions } =
  await vite.ssrLoadModule("/lib/garden/scene-transitions.ts");
const fastConfig = { ...cinemaTransition,
  timing: { focus: 1, approach: 1, environment: 1, settle: 1, reveal: 1 } };

test("only Cinema opts in and its real local image and license are available", async () => {
  assert.deepEqual(Object.keys(sceneTransitions), ["cinema"]);
  await access(new URL("../public" + cinemaTransition.image, import.meta.url));
  const license = await readFile(new URL("../public/images/cinema/ATTRIBUTION.md", import.meta.url), "utf8");
  assert.match(license, /BardiaSaeedi/);
  assert.match(license, /CC BY-SA 4.0/);
  const content = await readFile(new URL("../components/garden/rooms.tsx", import.meta.url), "utf8");
  for (const title of ["The art of noticing", "A different kind of window", "Rooms we return to"])
    assert.ok(content.includes(title));
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
