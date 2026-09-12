"use client";
import { useEffect, useMemo, useSyncExternalStore, type KeyboardEvent } from "react";
import type { RoomId } from "@/lib/garden/content";
import { curateBays, memoriesSchema, type Memory } from "@/lib/garden/memories";
import { useData } from "../use-data";
import { useTehranLight } from "../use-tehran-light";
import { MemoryFrame } from "./memory-frame";
import { MemoryDetails } from "./memory-details";
import { MemoryFilters, MemoryNavigation, MemoryTrail } from "./memory-wayfinding";
import { useMemoryNavigation } from "./use-memory-navigation";

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(listener: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}
const motionSnapshot = () => window.matchMedia(motionQuery).matches;
const serverMotion = () => false;

export function MemoryGallery({ reduced, discover, onRoom }: { reduced: boolean; discover: (id: string) => void; onRoom: (id: RoomId) => void }) {
  const { data, error, retry } = useData("/data/gallery.json", memoriesSchema);
  const lighting = useTehranLight();
  const systemReduced = useSyncExternalStore(subscribeMotion, motionSnapshot, serverMotion);
  const reduceMotion = reduced || systemReduced;
  return <div className="memory-gallery" data-light={lighting} data-reduced={reduceMotion || undefined}>
    <header className="memory-heading"><div><p className="eyebrow">04 / THE MEMORY GALLERY</p><h1 tabIndex={-1}>The things <em>we keep.</em></h1></div><span lang="fa" dir="rtl">خانهٔ خاطره‌ها</span></header>
    {!data ? <div className="memory-loading" role="status"><span className="memory-loading-arch" />{error || "A little light, beyond the doorway…"}{error && <button type="button" onClick={retry}>Open the door again</button>}</div> : data.length ? (
      <MemoryEnvironment items={data} reduced={reduceMotion} discover={() => discover("gallery")} onRoom={onRoom} />
    ) : <div className="memory-loading"><span className="memory-loading-arch" /><p>The walls are ready for their first memories.</p></div>}
  </div>;
}

function MemoryEnvironment({ items, reduced, discover, onRoom }: { items: Memory[]; reduced: boolean; discover: () => void; onRoom: (id: RoomId) => void }) {
  const bays = useMemo(() => curateBays(items), [items]);
  const { state, send, viewport: viewportRef, region: regionRef, detail: detailRef, anchors: anchorsRef, open, close, move, pointer } = useMemoryNavigation(items, bays, reduced, discover);
  const focused = items.find((item) => item.id === state.focusedId);
  const focusActive = !!focused;
  useEffect(() => {
    if (!focusActive) return;
    const surrounding = Array.from(document.querySelectorAll<HTMLElement>(".world-header, .room-dock, .room-topline, .world-footer, .ambient-controls"));
    const previous = surrounding.map((element) => element.inert);
    surrounding.forEach((element) => { element.inert = true; });
    return () => { surrounding.forEach((element, index) => { element.inert = previous[index]; }); };
  }, [focusActive]);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && state.phase !== "idle") { event.preventDefault(); event.stopPropagation(); void close(); return; }
    if (event.key === "Tab" && focused) {
      const controls = Array.from(regionRef.current?.querySelectorAll<HTMLElement>('.memory-details button:not(:disabled), .memory-details a, .memory-trail button') ?? []);
      if (!controls.length) return;
      const index = controls.indexOf(document.activeElement as HTMLElement);
      if (event.shiftKey && index <= 0) { event.preventDefault(); controls.at(-1)?.focus(); }
      else if (!event.shiftKey && (index < 0 || index === controls.length - 1)) { event.preventDefault(); controls[0].focus(); }
      return;
    }
    if (focused || event.target !== event.currentTarget && (event.target as HTMLElement).closest("button,a")) return;
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      void move(event.key === "Home" ? 0 : event.key === "End" ? bays.length - 1 : state.bay + (event.key === "ArrowRight" ? 1 : -1));
    }
  };
  return (
    <div ref={regionRef} className="memory-experience" data-phase={state.phase} data-has-focus={focusActive || undefined}
      role={focused ? "dialog" : "region"} aria-modal={focused ? true : undefined} aria-labelledby={focused ? "focused-memory-title" : undefined}
      aria-label={focused ? undefined : "Explore the memory gallery"} onKeyDown={onKeyDown}>
      <div className="memory-attention" inert={focusActive}>
        <MemoryFilters active={state.category} onSelect={(category) => send({ type: "category", category })} disabled={focusActive} />
        <span className="memory-explore-hint">Scroll, swipe, or linger a little.</span>
      </div>
      <div className="memory-stage">
        <div ref={viewportRef} className="memory-viewport" tabIndex={focusActive ? -1 : 0} aria-label="Gallery corridor. Use left and right arrow keys to explore." {...pointer}>
          <div className="memory-corridor">
            {bays.map((bay, index) => <section className={`memory-bay memory-bay--${bay.kind}`} key={bay.id} data-bay-index={index}
              data-active={state.bay === index || undefined} data-focus-bay={bay.items.some((item) => item.id === state.focusedId) || undefined}
              aria-label={bay.kind === "hero" ? "The keepsake wall" : `${bay.kind === "alcove" ? "A quiet alcove" : bay.kind === "corner" ? "Around the corner" : bay.kind === "doorway" ? "Through the doorway" : "Gallery wall"} ${index + 1}`}>
              <div className="memory-architecture" aria-hidden="true"><div className="memory-cornice" /><div className="memory-dado" /><div className="memory-floor"><div className="memory-runner" /></div><div className="memory-pier" /><div className="memory-recess" /><div className="memory-lightwash" /></div>
              {bay.kind === "hero" && <div className="memory-wall-intro" aria-hidden="true"><span>THE KEEPSAKE WALL</span><p>Some moments<br />ask us to <em>stay.</em></p><small>A personal house of photographs.<br />A doorway to another memory.</small></div>}
              {bay.items.map((item, slot) => <MemoryFrame key={item.id} item={item} slot={slot} hero={bay.kind === "hero"}
                focused={focused?.id === item.id} dimmed={!!state.category && state.category !== item.category}
                disabled={focusActive && focused?.id !== item.id} nearby={Math.abs(state.bay - index) <= 1}
                register={(node) => { if (node) anchorsRef.current.set(item.id, node); else anchorsRef.current.delete(item.id); }} onOpen={() => { void open(item.id); }} />)}
              <span className="memory-wall-number" aria-hidden="true">{String(index + 1).padStart(2, "0")} <i /> {bay.kind === "alcove" ? "A quieter corner" : bay.kind === "corner" ? "Something around the corner" : bay.kind === "doorway" ? "Beyond the threshold" : "A room for remembering"}</span>
              <button type="button" className="memory-doorway" tabIndex={focusActive ? -1 : 0} disabled={focusActive || index === bays.length - 1}
                aria-label={index < bays.length - 1 ? `Explore beyond wall ${index + 1}` : "End of the gallery"} onClick={() => { void move(index + 1); }}><span aria-hidden="true" /><small>{index < bays.length - 1 ? "A little further" : "Stay a while"}</small></button>
            </section>)}
          </div>
        </div>
        <div className="memory-foreground" aria-hidden="true" />
        {focused && <MemoryDetails item={focused} items={items} trail={state.trail} detailRef={detailRef}
          closing={state.phase === "closing"} onClose={() => { void close(); }} onFollow={(id) => { void open(id); }} onRoom={onRoom} />}
      </div>
      <footer className="memory-floorline"><MemoryTrail trail={state.trail} items={items} selected={state.focusedId} onFollow={(id) => { void open(id); }} />
        <MemoryNavigation index={state.bay} count={bays.length} disabled={focusActive} onMove={(index) => { void move(index); }} />
      </footer>
      <span className="sr-only" role="status">{state.phase === "travelling" ? "Following a memory through the gallery" : state.category ? `${items.filter((item) => item.category === state.category).length} ${state.category.toLowerCase()} brought into the light` : "All memories in the light"}</span>
    </div>
  );
}
