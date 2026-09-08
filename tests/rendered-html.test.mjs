import assert from "node:assert/strict";
import test from "node:test";

test("the production worker renders the garden entrance and accessible controls", async () => {
  const { default: worker } = await import("../dist/server/index.js");
  assert.equal(typeof worker.fetch, "function");
  const response = await worker.fetch(
    new Request("https://example.test/", { headers: { accept: "text/html" } }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>Fatemeh Mohseni/);
  assert.match(html, /Open the garden/);
  assert.match(html, /Skip to room navigation/);
  assert.match(html, /Experience settings/);
  assert.match(html, /\/images\/door.webp/);
  assert.doesNotMatch(html, /Starter Project|codex-preview/);
});
