"use client";
import { useCallback, useEffect, useReducer, useRef, type PointerEvent } from "react";
import { focusFrame, initialMemoryState, memoryReducer, type Memory, type MemoryAction, type MemoryBay } from "@/lib/garden/memories";
import { pause, travelTo } from "./motion";

export function useMemoryNavigation(items: Memory[], bays: MemoryBay[], reduced: boolean, onDiscover: () => void) {
  const [state, dispatch] = useReducer(memoryReducer, initialMemoryState);
  const live = useRef(initialMemoryState);
  const viewport = useRef<HTMLDivElement>(null);
  const region = useRef<HTMLDivElement>(null);
  const detail = useRef<HTMLDivElement>(null);
  const anchors = useRef(new Map<string, HTMLDivElement>());
  const operation = useRef<AbortController | null>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const send = useCallback((action: MemoryAction) => {
    live.current = memoryReducer(live.current, action);
    dispatch(action);
  }, []);
  const begin = () => {
    operation.current?.abort();
    const controller = new AbortController();
    operation.current = controller;
    return controller.signal;
  };
  const shellFor = (id: string) => anchors.current.get(id)?.querySelector<HTMLElement>(".memory-frame-shell");
  const frameTransform = useCallback((id: string) => {
    const anchor = anchors.current.get(id);
    const view = viewport.current;
    const shell = anchor?.querySelector<HTMLElement>(".memory-frame-shell");
    if (anchor && view && shell) shell.style.transform = focusFrame(anchor.getBoundingClientRect(), view.getBoundingClientRect(), view.clientWidth <= 700);
  }, []);
  const retract = async (signal: AbortSignal) => {
    const id = live.current.focusedId;
    if (!id) return;
    send({ type: "phase", phase: "closing" });
    const shell = shellFor(id);
    if (shell) shell.style.transform = "none";
    await pause(reduced ? 0 : 460, signal);
    send({ type: "rest" });
  };
  const bayPosition = (index: number) => {
    const view = viewport.current;
    const bay = view?.querySelector<HTMLElement>(`[data-bay-index="${index}"]`);
    return view && bay ? bay.offsetLeft - (view.clientWidth - bay.clientWidth) / 2 : 0;
  };
  const close = async () => {
    const signal = begin();
    const id = live.current.focusedId;
    try {
      await retract(signal);
      send({ type: "rest" });
      anchors.current.get(id ?? "")?.querySelector<HTMLButtonElement>(".memory-frame-button")?.focus({ preventScroll: true });
    } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) throw error; }
  };
  const open = async (id: string) => {
    const item = items.find((entry) => entry.id === id);
    const view = viewport.current;
    if (!item || !view || (live.current.focusedId === id && live.current.phase === "open")) return;
    const signal = begin();
    try {
      await retract(signal);
      send({ type: "phase", phase: "travelling" });
      const index = bays.findIndex((bay) => bay.items.some((entry) => entry.id === id));
      await travelTo(view, bayPosition(index), reduced, signal);
      if (signal.aborted) return;
      send({ type: "bay", bay: index });
      send({ type: "focus", id });
      frameTransform(id);
      onDiscover();
      await pause(reduced ? 0 : 560, signal);
      send({ type: "phase", phase: "open" });

    } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) throw error; }
  };
  const move = async (index: number) => {
    if (!viewport.current || live.current.focusedId) return;
    const next = Math.max(0, Math.min(index, bays.length - 1));
    const signal = begin();
    send({ type: "phase", phase: "travelling" });
    try {
      await travelTo(viewport.current, bayPosition(next), reduced, signal);
      send({ type: "bay", bay: next });
      send({ type: "rest" });
    } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) throw error; }
  };

  useEffect(() => {
    const view = viewport.current;
    if (!view) return;
    const update = () => {
      const middle = view.scrollLeft + view.clientWidth / 2;
      const elements = Array.from(view.querySelectorAll<HTMLElement>("[data-bay-index]"));
      const nearest = elements.reduce((best, element, index) => Math.abs(element.offsetLeft + element.clientWidth / 2 - middle) < best.distance
        ? { index, distance: Math.abs(element.offsetLeft + element.clientWidth / 2 - middle) } : best, { index: 0, distance: Infinity });
      send({ type: "bay", bay: nearest.index });
      view.style.setProperty("--walk", String(view.scrollLeft * .025));
    };
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey || live.current.focusedId || (event.target as HTMLElement).closest(".memory-details")) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      const factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? view.clientWidth : 1;
      event.preventDefault();
      operation.current?.abort();
      if (live.current.phase === "travelling") send({ type: "rest" });
      view.scrollLeft += delta * factor;
    };
    const resize = new ResizeObserver(() => {
      if (live.current.focusedId && live.current.phase !== "closing") frameTransform(live.current.focusedId);
      update();
    });
    resize.observe(view);
    view.addEventListener("scroll", update, { passive: true });
    view.addEventListener("wheel", wheel, { passive: false });
    return () => {
      resize.disconnect();
      view.removeEventListener("scroll", update);
      view.removeEventListener("wheel", wheel);
    };
  }, [send, frameTransform]);
  useEffect(() => () => { operation.current?.abort(); }, []);
  useEffect(() => {
    if (state.phase === "open") detail.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
  }, [state.phase, state.focusedId]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0 || live.current.focusedId || (event.target as HTMLElement).closest("button,a")) return;
    operation.current?.abort();
    send({ type: "rest" });
    drag.current = { x: event.clientX, left: event.currentTarget.scrollLeft, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current) {
      const delta = event.clientX - drag.current.x;
      if (Math.abs(delta) > 4) drag.current.moved = true;
      event.currentTarget.scrollLeft = drag.current.left - delta;
    }
  };
  return { state, send, viewport, region, detail, anchors, open, close, move,
    pointer: { onPointerDown, onPointerMove, onPointerUp: () => { drag.current = null; }, onPointerCancel: () => { drag.current = null; } } };
}
