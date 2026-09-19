"use client";
import { useEffect, useMemo, type CSSProperties, type KeyboardEvent } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { RoomId } from "@/lib/garden/content";
import { curateBays, type Memory } from "@/lib/garden/memories";
import { useHouseNavigation } from "./use-house-navigation";
import { PhotoFrame } from "./photo-frame";
import { PhotoFocus } from "./photo-focus";
import { HouseFilters, HouseTrail, HouseWalk } from "./house-wayfinding";

export function HouseEnvironment({ items, reduced, onDiscover, onRoom }: {
  items: Memory[]; reduced: boolean; onDiscover: () => void; onRoom: (id: RoomId) => void;
}) {
  const rooms = useMemo(() => curateBays(items), [items]);
  const { state, send, viewport: viewportRef, region: regionRef, details: detailsRef, anchors: anchorsRef, open, close, move, pointer } = useHouseNavigation(items, rooms, reduced, onDiscover);
  const focused = items.find((item) => item.id === state.focusedId);
  const active = !!focused;
  useEffect(() => {
    if (!active) return;
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".world-header, .ambient-controls, .garden-global-nav"));
    const previous = elements.map((element) => element.inert);
    elements.forEach((element) => { element.inert = true; });
    return () => { elements.forEach((element, i) => { element.inert = previous[i]; }); };
  }, [active]);
  const keydown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && state.phase !== "idle") { event.preventDefault(); event.stopPropagation(); void close(); return; }
    if (event.key === "Tab" && focused) {
      const controls = Array.from(regionRef.current?.querySelectorAll<HTMLElement>(".house-focus button, .house-focus a, .house-trail button") || []);
      const index = controls.indexOf(document.activeElement as HTMLElement);
      if (event.shiftKey && index <= 0) { event.preventDefault(); controls.at(-1)?.focus(); }
      else if (!event.shiftKey && (index < 0 || index === controls.length - 1)) { event.preventDefault(); controls[0]?.focus(); }
      return;
    }
    if (focused || (event.target as HTMLElement).closest("button,a")) return;
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      void move(event.key === "Home" ? 0 : event.key === "End" ? rooms.length - 1 : state.bay + (event.key === "ArrowRight" ? 1 : -1));
    }
  };
  return <div ref={regionRef} className="house-experience" data-phase={state.phase} data-has-focus={active || undefined}
    role={focused ? "dialog" : "region"} aria-modal={focused ? true : undefined} aria-labelledby={focused ? "house-photo-title" : undefined}
    aria-label={focused ? undefined : "Explore the memory gallery"} onKeyDown={keydown}>
    <header className="house-heading" inert={active}>
      <button className="house-back" onClick={() => onRoom("courtyard")}><ArrowLeft size={16} />Back to the courtyard</button>
      <p className="house-kicker">04 / THE MEMORY GALLERY</p>
      <h1 tabIndex={-1}>The things <em>we keep.</em></h1>
      <HouseFilters category={state.category} select={(category) => send({ type: "category", category })} />
    </header>
    <p className="house-whisper" aria-hidden="true">Take your time. There’s<br />no wrong way to wander.</p>
    <div ref={viewportRef} className="house-viewport" id="gallery-exploration" tabIndex={active ? -1 : 0}
      aria-label="Gallery corridor. Scroll, swipe, or use left and right arrow keys to explore." {...pointer}>
      <div className="house-track" style={{ "--rooms": rooms.length } as CSSProperties}>
        {rooms.map((room, index) => <div key={room.id} className="house-room" data-house-room={index} data-room-kind={room.kind} style={{ "--room": index } as CSSProperties} aria-hidden="true">
          <picture><source media="(max-width: 700px)" srcSet={index % 2 ? "/gallery/alcove-mobile.webp" : "/gallery/room-mobile.webp"} /><img src={index % 2 ? "/gallery/alcove.webp" : "/gallery/room.webp"} alt="" draggable={false} fetchPriority={index === 0 ? "high" : "auto"} decoding="async" loading={index === 0 ? "eager" : "lazy"} /></picture>
        </div>)}
        {rooms.flatMap((room, index) => room.items.map((item, slot) => <PhotoFrame key={item.id} item={item} room={index} slot={slot}
          focused={focused?.id === item.id} dimmed={!!state.category && state.category !== item.category} disabled={active && focused?.id !== item.id}
          nearby={Math.abs(state.bay - index) <= 1} register={(node) => { if (node) anchorsRef.current.set(item.id, node); else anchorsRef.current.delete(item.id); }} onOpen={() => { void open(item.id); }} />))}
        {rooms.map((room, index) => index < rooms.length - 1 && <button key={room.id} className="house-doorway" style={{ "--room": index } as CSSProperties}
          disabled={active} aria-label={`Explore ${index === 0 ? "the quiet alcove" : "beyond the doorway"}`} onClick={() => { void move(index + 1); }}>
          <span>{index === 0 ? "A quieter corner" : "Beyond the doorway"}<ArrowRight size={16} /></span>
        </button>)}
      </div>
    </div>
    <div className="house-veil" aria-hidden="true" />
    {focused && <PhotoFocus item={focused} items={items} trail={state.trail} detailRef={detailsRef} closing={state.phase === "closing"}
      close={() => { void close(); }} follow={(id) => { void open(id); }} onRoom={onRoom} />}
    <footer className="house-floorline">
      <HouseTrail items={items} trail={state.trail} focused={state.focusedId} follow={(id) => { void open(id); }} />
      <HouseWalk index={state.bay} count={rooms.length} disabled={active} move={(index) => { void move(index); }} />
    </footer>
    <span className="sr-only" role="status">{state.phase === "travelling" ? "Following a memory through the house" : state.category ? `${items.filter((item) => item.category === state.category).length} ${state.category.toLowerCase()} brought into the light` : "All memories in the light"}</span>
  </div>;
}
