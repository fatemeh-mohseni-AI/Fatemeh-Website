"use client";
import { useCallback, useEffect, useReducer, useRef, type PointerEvent } from "react";
import { focusFrame, initialMemoryState, memoryReducer, type Memory, type MemoryAction, type MemoryBay } from "@/lib/garden/memories";
import { pause, travelTo } from "./motion";

/** Each operation owns an abort signal. A new intention cancels the previous journey. */
export function useHouseNavigation(items: Memory[], rooms: MemoryBay[], reduced: boolean, discover: () => void) {
  const [state, dispatch] = useReducer(memoryReducer, initialMemoryState);
  const live = useRef(state);
  const viewport = useRef<HTMLDivElement>(null);
  const region = useRef<HTMLDivElement>(null);
  const details = useRef<HTMLDivElement>(null);
  const anchors = useRef(new Map<string, HTMLDivElement>());
  const operation = useRef<AbortController | null>(null);
  const drag = useRef<{ x: number; left: number; pointer: number } | null>(null);
  const send = useCallback((action: MemoryAction) => { live.current = memoryReducer(live.current, action); dispatch(action); }, []);
  const flight = (id: string) => anchors.current.get(id)?.querySelector<HTMLElement>(".house-frame-flight");
  const project = useCallback((id: string) => {
    const anchor = anchors.current.get(id);
    const view = viewport.current;
    const shell = anchor?.querySelector<HTMLElement>(".house-frame-flight");
    if (anchor && view && shell) shell.style.transform = focusFrame(anchor.getBoundingClientRect(), view.getBoundingClientRect(), view.clientWidth <= 700);
  }, []);
  const start = () => { operation.current?.abort(); operation.current = new AbortController(); return operation.current.signal; };
  const position = (index: number) => viewport.current?.querySelector<HTMLElement>(`[data-house-room="${index}"]`)?.offsetLeft ?? 0;
  const retract = async (signal: AbortSignal) => {
    const id = live.current.focusedId;
    if (!id) return;
    send({ type: "phase", phase: "closing" });
    const shell = flight(id);
    if (shell) shell.style.transform = "none";
    await pause(reduced ? 0 : 520, signal);
    send({ type: "rest" });
  };
  const cancelled = (error: unknown) => { if (!(error instanceof DOMException && error.name === "AbortError")) throw error; };
  const close = async () => {
    const id = live.current.focusedId;
    const signal = start();
    try {
      await retract(signal); send({ type: "rest" });
      anchors.current.get(id || "")?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    } catch (error) { cancelled(error); }
  };
  const open = async (id: string) => {
    const view = viewport.current;
    if (!view || !items.some((item) => item.id === id) || (live.current.focusedId === id && live.current.phase === "open")) return;
    const signal = start();
    try {
      await retract(signal);
      send({ type: "phase", phase: "travelling" });
      const index = rooms.findIndex((room) => room.items.some((item) => item.id === id));
      const anchor = anchors.current.get(id);
      // On phones, approach from the photo's own position in the long, swipeable wall.
      const target = view.clientWidth <= 700 && anchor ? anchor.offsetLeft - (view.clientWidth - anchor.clientWidth) / 2 : position(index);
      await travelTo(view, target, reduced, signal);
      if (signal.aborted) return;
      send({ type: "bay", bay: index });
      send({ type: "focus", id });
      project(id); discover();
      await pause(reduced ? 0 : 650, signal);
      send({ type: "phase", phase: "open" });
    } catch (error) { cancelled(error); }
  };
  const move = async (index: number) => {
    if (!viewport.current || live.current.focusedId) return;
    const next = Math.max(0, Math.min(index, rooms.length - 1));
    const signal = start();
    send({ type: "phase", phase: "travelling" });
    try {
      await travelTo(viewport.current, position(next), reduced, signal);
      send({ type: "bay", bay: next }); send({ type: "rest" });
    } catch (error) { cancelled(error); }
  };
  useEffect(() => {
    const view = viewport.current;
    if (!view) return;
    const update = () => {
      const roomWidth = view.querySelector<HTMLElement>("[data-house-room]")?.clientWidth || view.clientWidth;
      send({ type: "bay", bay: Math.max(0, Math.min(rooms.length - 1, Math.floor((view.scrollLeft + view.clientWidth / 2) / roomWidth))) });
    };
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return;
      if (live.current.focusedId) { event.preventDefault(); return; }
      event.preventDefault(); operation.current?.abort();
      if (live.current.phase === "travelling") send({ type: "rest" });
      const amount = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      view.scrollLeft += amount * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? view.clientWidth : 1);
    };
    const resize = new ResizeObserver(() => {
      if (live.current.focusedId && live.current.phase !== "closing") project(live.current.focusedId);
      update();
    });
    resize.observe(view);
    view.addEventListener("scroll", update, { passive: true });
    view.addEventListener("wheel", wheel, { passive: false });
    return () => { resize.disconnect(); view.removeEventListener("scroll", update); view.removeEventListener("wheel", wheel); };
  }, [project, rooms.length, send]);
  useEffect(() => () => { operation.current?.abort(); }, []);
  useEffect(() => {
    if (state.phase === "open") details.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
  }, [state.phase, state.focusedId]);
  const release = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current && event.currentTarget.hasPointerCapture?.(drag.current.pointer)) event.currentTarget.releasePointerCapture(drag.current.pointer);
    drag.current = null;
  };
  return { state, send, viewport, region, details, anchors, open, close, move, pointer: {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== "mouse" || event.button !== 0 || live.current.focusedId || (event.target as HTMLElement).closest("button,a")) return;
      operation.current?.abort(); send({ type: "rest" });
      drag.current = { x: event.clientX, left: event.currentTarget.scrollLeft, pointer: event.pointerId };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      if (drag.current) event.currentTarget.scrollLeft = drag.current.left - (event.clientX - drag.current.x);
      else if (!reduced && !live.current.focusedId && event.pointerType === "mouse") {
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty("--look", `${((event.clientX - rect.left) / rect.width - .5) * 3}px`);
      }
    },
    onPointerUp: release, onPointerCancel: release, onLostPointerCapture: () => { drag.current = null; },
  } };
}
