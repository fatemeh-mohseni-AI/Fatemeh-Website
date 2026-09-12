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

test("About is an independent viewport portal with an internal courier target", async () => {
  const source = await read("components/garden/about-fatemeh.tsx");
  const sceneCss = await read("app/anonymous-letters-layer.css");
  const portalCss = await read("app/about-portal.css");
  const layout = await read("app/layout.tsx");

  assert.match(source, /createPortal/);
  assert.match(source, /document\.body/);
  assert.match(source, /role="dialog"/);
  assert.doesNotMatch(source, /<Dialog(?:\s|>)/);
  assert.match(source, /about-letter-perch/);
  assert.match(source, /CourierEnvelope/);
  assert.match(source, /HoopoeCourier/);
  assert.doesNotMatch(source, /querySelector<HTMLElement>\("\[data-anonymous-letter-anchor\]"\)/);

  assert.match(portalCss, /\.about-fatemeh-v2[\s\S]*position:\s*fixed\s*!important/);
  assert.match(portalCss, /\.about-fatemeh-v2[\s\S]*inset:\s*0\s*!important/);
  assert.match(portalCss, /\.about-fatemeh-v2[\s\S]*width:\s*100%\s*!important/);
  assert.match(portalCss, /\.about-fatemeh-v2[\s\S]*height:\s*100dvh\s*!important/);
  assert.match(layout, /import "\.\/about-portal\.css"/);

  assert.match(sceneCss, /\.about-courier-v2/);
  assert.match(sceneCss, /@keyframes about-envelope-open/);
});
