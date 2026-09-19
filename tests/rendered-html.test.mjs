import assert from "node:assert/strict";
import test from "node:test";
import { Miniflare } from "miniflare";
import { fileURLToPath } from "node:url";

test("the production worker renders the garden entrance and accessible controls", { timeout: 20_000 }, async (t) => {
  // The built worker imports cloudflare:workers. Exercise it in workerd rather
  // than Node's ESM loader, with isolated in-memory service/database bindings.
  const worker = new Miniflare({
    modules: true,
    scriptPath: fileURLToPath(new URL("../dist/server/index.js", import.meta.url)),
    modulesRoot: fileURLToPath(new URL("../dist/server", import.meta.url)),
    modulesRules: [{ type: "ESModule", include: ["**/*.js"] }],
    compatibilityDate: "2026-05-15",
    compatibilityFlags: ["nodejs_compat"],
    d1Databases: ["DB"],
    serviceBindings: { ASSETS: async () => new Response("Not found", { status: 404 }) },
  });
  t.after(() => worker.dispose());
  const response = await worker.dispatchFetch("https://example.test/", {
    headers: { accept: "text/html" },
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>Fatemeh Mohseni/);
  assert.doesNotMatch(html, /Open the garden|Walk in 3D/);
  assert.match(html, /Scroll or swipe up to open the door/);
  assert.match(html, /press Enter to open the door/);
  assert.match(html, /Skip to room navigation/);
  assert.match(html, /Experience settings/);
  assert.match(html, /\/images\/door.webp/);
  assert.doesNotMatch(html, /Starter Project|codex-preview/);
});
