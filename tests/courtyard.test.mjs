import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const vite = await createServer({
  appType: "custom", configFile: false,
  root: fileURLToPath(new URL("..", import.meta.url)),
  server: { middlewareMode: true },
});
after(() => vite.close());
const { isTehranNight, courtyardCover } = await vite.ssrLoadModule("/lib/garden/courtyard.ts");

test("Tehran switches at 20:00 and 06:00, including midnight and winter", () => {
  for (const day of ["2026-09-12", "2026-01-12"]) {
    for (const [time, expected] of [
      ["00:00:00", true], ["05:59:59", true], ["06:00:00", false],
      ["19:59:59", false], ["20:00:00", true], ["23:59:59", true],
    ]) assert.equal(isTehranNight(new Date(`${day}T${time}+03:30`)), expected, time);
  }
  assert.equal(isTehranNight(new Date("2026-09-12T16:30:00Z")), true);
  assert.equal(isTehranNight(new Date("2026-09-12T09:30:00-07:00")), true);
});

test("fountain registration follows the image cover crop on desktop and mobile", () => {
  const native = courtyardCover(1672, 941);
  assert.equal(native.scale, 1);
  assert.equal(native.left, 0);
  assert.equal(native.top, 0);
  const wide = courtyardCover(1920, 900);
  assert.equal(wide.width, 1920);
  assert.ok(wide.top < 0);
  const portrait = courtyardCover(390, 844, .54);
  assert.equal(portrait.height, 844);
  assert.ok(portrait.left < 0);
  assert.ok(Math.abs(portrait.left - (390 - portrait.width) * .54) < 1e-8);
  const fountainX = portrait.left + 837 * portrait.scale;
  assert.ok(fountainX > 100 && fountainX < 250, "the cropped fountain stays aligned and visible");
});
