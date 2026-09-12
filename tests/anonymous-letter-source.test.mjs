import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("anonymous-letter API bootstraps D1 storage and does not hard-fail without the HMAC secret", async () => {
  const source = await read("app/api/anonymous-letter/route.ts");

  assert.match(source, /CREATE TABLE IF NOT EXISTS anonymous_messages/);
  assert.match(source, /CREATE INDEX IF NOT EXISTS anonymous_messages_ip_created_idx/);
  assert.match(source, /ephemeralHmacSecret/);
  assert.doesNotMatch(source, /if\s*\(\s*!secret\s*\|\|\s*!env\.DB\s*\)/);
  assert.match(source, /await db\.insert\(anonymousMessages\)\.values/);
});

test("About uses an internal delivery target and a full-screen courier scene", async () => {
  const source = await read("components/garden/about-fatemeh.tsx");
  const css = await read("app/anonymous-letters-layer.css");

  assert.match(source, /about-letter-perch/);
  assert.match(source, /CourierEnvelope/);
  assert.match(source, /HoopoeCourier/);
  assert.doesNotMatch(source, /querySelector<HTMLElement>\("\[data-anonymous-letter-anchor\]"\)/);
  assert.match(css, /\.about-fatemeh-v2[\s\S]*width:\s*100vw\s*!important/);
  assert.match(css, /\.about-courier-v2/);
  assert.match(css, /@keyframes about-envelope-open/);
});
