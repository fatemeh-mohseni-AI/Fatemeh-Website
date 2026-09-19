import assert from "node:assert/strict";
import test, { after, afterEach } from "node:test";
import { readFile, mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";
import { dirname } from 'node:path';
import { build } from "vite";
import React, { act } from "react";

// Bundle the real component graph once; native imports share React with the DOM renderer.
const project = fileURLToPath(new URL('..', import.meta.url));
const directory = await mkdtemp(`${project}/node_modules/.memory-test-`);
const nodeEnv = process.env.NODE_ENV;
const bundle = await build({ configFile: false, root: project, logLevel: 'error', resolve: { alias: { '@': project } }, build: { ssr: true, write: false, minify: false, rollupOptions: { input: { gallery: `${project}/components/garden/memory-gallery/memory-gallery.tsx`, garden: `${project}/components/garden/garden.tsx` }, external: ['react', 'react/jsx-runtime', 'lucide-react', 'zod'] } } });
if (nodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = nodeEnv;
for (const output of bundle.output) {
  const path = `${directory}/${output.fileName}`;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, output.type === 'chunk' ? output.code : output.source);
}
const entry = bundle.output.find((output) => output.type === 'chunk' && output.name === 'gallery');
await import('zod');
await import('react/jsx-runtime');
await import('lucide-react');
const { MemoryGallery } = await import(pathToFileURL(`${directory}/${entry.fileName}`).href);

// DOM integration tests, not a substitute for a real-browser visual pass.
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/#gallery', pretendToBeVisual: true });
for (const name of ["window", "document", "HTMLElement", "Element", "Node", "DOMException", "Event", "KeyboardEvent", "MouseEvent", "Image", "localStorage"])
  Object.defineProperty(globalThis, name, { value: dom.window[name], configurable: true, writable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let width = 1200;
let observerCount = 0;
const observers = new Set();
globalThis.ResizeObserver = class {
  constructor(callback) { this.callback = callback; }
  observe() { observerCount++; observers.add(this); }
  disconnect() { observerCount--; observers.delete(this); }
};
let frameCount = 0;
const rafs = new Map();
globalThis.requestAnimationFrame = (callback) => {
  const id = ++frameCount;
  rafs.set(id, setTimeout(() => { rafs.delete(id); callback(performance.now()); }, 8));
  return id;
};
globalThis.cancelAnimationFrame = (id) => { clearTimeout(rafs.get(id)); rafs.delete(id); };
window.matchMedia = () => ({ matches: systemReduced, addEventListener() {}, removeEventListener() {} });
HTMLElement.prototype.setPointerCapture = () => {};
Object.defineProperties(HTMLElement.prototype, {
  clientWidth: { get() { return this.matches('.house-viewport') ? width : this.matches('.house-room') ? 900 : 300; }, configurable: true },
  clientHeight: { get() { return 500; }, configurable: true },
  scrollWidth: { get() { return this.matches('.house-viewport') ? 5400 : width; }, configurable: true },
  offsetLeft: { get() { return Number(this.dataset.houseRoom || 0) * 900; }, configurable: true },
});
HTMLElement.prototype.getBoundingClientRect = function () {
  if (this.matches('.house-viewport')) return { left: 20, top: 150, width, height: 500, right: 20 + width, bottom: 650 };
  const bay = this.closest('[data-room-index]');
  return { left: 110 + Number(this.dataset.roomIndex || 0) * 900 - (document.querySelector('.house-viewport')?.scrollLeft || 0), top: 240, width: 300, height: this.matches('.house-anchor--portrait') ? 410 : 200, right: 410, bottom: 440 };
};
const fixture = JSON.parse(await readFile(new URL('../public/data/gallery.json', import.meta.url), 'utf8'));
let responseData = fixture;
let fetchFails = false;
let systemReduced = false;
globalThis.fetch = async () => ({ ok: !fetchFails, json: async () => responseData });
const { createRoot } = await import('react-dom/client');
const wait = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms));
let root;
let onward;
async function mount(reduced = true) {
  onward = null;
  root = createRoot(document.querySelector('#root'));
  await act(async () => { root.render(React.createElement(MemoryGallery, { reduced, discover() {}, onRoom: (room) => { onward = room; } })); await wait(); });
  await act(async () => { await wait(); });
}
async function unmount() { if (root) { await act(async () => root.unmount()); root = null; } }
afterEach(unmount);
const query = (selector) => document.querySelector(selector);
async function click(element, ms = 20) { assert.ok(element, 'click target exists'); await act(async () => { element.click(); await wait(ms); }); }
async function key(element, name, shiftKey = false) { await act(async () => { element.dispatchEvent(new KeyboardEvent('keydown', { key: name, shiftKey, bubbles: true, cancelable: true })); await wait(20); }); }
after(async () => { dom.window.close(); await rm(directory, { recursive: true, force: true }); });

test('opening and Escape closing preserve the actual frame node and restore keyboard focus', async () => {
  await mount();
  const anchor = query('[data-memory-id="afternoon"]');
  const shell = anchor.querySelector('.house-frame-flight');
  const button = anchor.querySelector('button');
  await click(button);
  assert.equal(query('[role="dialog"]')?.dataset.phase, 'open');
  assert.ok(anchor.querySelector('.house-frame-flight') === shell);
  assert.match(shell.style.transform, /translate3d/);
  assert.ok(document.activeElement === query('.house-close'), 'close control receives focus');
  await key(query('.house-close'), 'Escape');
  assert.equal(query('.house-experience').dataset.phase, 'idle');
  assert.equal(shell.style.transform, 'none');
  assert.ok(document.activeElement === button, 'original frame receives focus');
  await unmount();
});
test('category attention preserves layout nodes and connected memories travel instead of swapping an image', async () => {
  await mount();
  const anchors = [...document.querySelectorAll('.house-anchor')];
  await click([...document.querySelectorAll('.house-categories button')].find((button) => button.textContent === 'People'));
  assert.ok([...document.querySelectorAll('.house-anchor')].every((node, index) => node === anchors[index]));
  assert.equal(document.querySelectorAll('.house-anchor[data-dimmed]').length, fixture.length - 1);
  await click(query('[data-memory-id="afternoon"] button'));
  await click([...document.querySelectorAll('.house-connections button')].find((button) => button.textContent.includes('Follow the place')));
  assert.notEqual(query('.house-anchor[data-focused]').dataset.memoryId, 'afternoon');
  assert.equal(query('.house-viewport').scrollLeft, Number(query('.house-anchor[data-focused]').dataset.roomIndex) * 900);
  assert.equal(document.querySelectorAll('.house-trail li').length, 2);
  await click(query('.house-trail button[aria-label="Return to A quiet afternoon"]'));
  assert.equal(query('.house-anchor[data-focused]').dataset.memoryId, 'afternoon');
  await unmount();
});
test('keyboard exploration, focus trap and narrative onward links are functional', async () => {
  await mount();
  const view = query('.house-viewport');
  await key(view, 'End');
  assert.ok(view.scrollLeft >= 1800);
  await key(view, 'Home');
  assert.equal(view.scrollLeft, 0);
  await click(query('[data-memory-id="stockholm-water"] button'));
  const first = query('.house-close');
  const last = [...document.querySelectorAll('.house-trail button')].at(-1);
  first.focus(); await key(first, 'Tab', true); assert.ok(document.activeElement === last);
  await key(last, 'Tab'); assert.ok(document.activeElement === first);
  await click(query('.house-onward'));
  assert.equal(onward, 'travel');
  await unmount();
});
test('mobile geometry, portrait images, resizing and an unavailable photograph remain usable', async () => {
  width = 360;
  await mount();
  const anchor = query('[data-memory-id="little-prince"]');
  assert.ok(anchor.classList.contains('house-anchor--portrait'));
  await click(anchor.querySelector('button'));
  assert.match(anchor.querySelector('.house-frame-flight').style.transform, /scale/);
  const before = anchor.querySelector('.house-frame-flight').style.transform;
  width = 1000;
  await act(async () => { observers.forEach((observer) => observer.callback()); });
  assert.notEqual(anchor.querySelector('.house-frame-flight').style.transform, before);
  await act(async () => anchor.querySelector('img').dispatchEvent(new Event('error')));
  assert.ok(anchor.textContent.includes('waiting for its photograph'));
  await key(query('.house-close'), 'Escape');
  await unmount(); width = 1200;
});
test('full-motion operations cancel safely during rapid follow/close and unmount', async () => {
  await mount(false);
  await click(query('[data-memory-id="stockholm-water"] button'), 20);
  assert.equal(query('.house-experience').dataset.phase, 'opening');
  await key(query('.house-close'), 'Escape');
  await act(async () => { await wait(580); });
  assert.equal(query('.house-experience').dataset.phase, 'idle');
  await click(query('[data-memory-id="venice"] button'), 20);
  assert.equal(query('.house-experience').dataset.phase, 'travelling');
  await unmount();
  assert.equal(rafs.size, 0);
  assert.equal(observerCount, 0);
});
test('minimal and empty metadata plus retryable loading errors do not break the room', async () => {
  responseData = [{ id: 'minimal', src: '/gallery/missing.webp' }];
  await mount();
  await click(query('.house-frame'));
  assert.equal(query('#house-photo-title').textContent, 'An untitled memory');
  assert.equal(document.querySelectorAll('.house-connections button').length, 0);
  await unmount();
  responseData = [];
  await mount(); assert.match(document.body.textContent, /first memories/); await unmount();
  responseData = fixture; fetchFails = true;
  await mount(); assert.match(document.body.textContent, /could not be loaded/);
  fetchFails = false;
  await click(query('.house-waiting button')); assert.equal(document.querySelectorAll('.house-anchor').length, fixture.length);
  await unmount();
});

test('system reduced motion also disables travel when the local setting allows motion', async () => {
  systemReduced = true;
  await mount(false);
  await click(query('[data-memory-id="venice"] button'));
  assert.equal(query('.house-experience').dataset.phase, 'open');
  assert.equal(rafs.size, 0);
  await unmount(); systemReduced = false;
});
test('the actual Garden restores a direct gallery URL and follows back/forward history', async () => {
  const entry = bundle.output.find((output) => output.type === 'chunk' && output.name === 'garden');
  const { default: Garden } = await import(pathToFileURL(`${directory}/${entry.fileName}`).href);
  window.history.replaceState(null, '', '#gallery');
  localStorage.setItem('fatemeh-garden-motion', 'reduced');
  root = createRoot(query('#root'));
  await act(async () => { root.render(React.createElement(Garden)); await wait(30); });
  await act(async () => { await wait(100); });
  assert.ok(query('.room-gallery'), 'direct URL renders gallery');
  assert.ok(query('.house-frame'), 'direct URL loads gallery content');
  await click(query('[data-memory-id="stockholm-water"] button'));
  assert.equal(query('.world-header').inert, true);
  await click(query('.house-onward'));
  assert.equal(window.location.hash, '#travel');
  assert.ok(query('.room-travel'));
  assert.ok(!query('.world-header').inert, 'site controls restored after leaving a frame');
  await act(async () => { window.history.back(); await wait(60); });
  await act(async () => { await wait(30); });
  assert.equal(window.location.hash, '#gallery');
  assert.ok(query('.house-gallery'), 'back restores gallery');
  await act(async () => { window.history.forward(); await wait(60); });
  assert.equal(window.location.hash, '#travel');
  assert.ok(query('.room-travel'), 'forward restores destination');
  await unmount();
  assert.equal(rafs.size, 0);
  assert.equal(observerCount, 0);
});
