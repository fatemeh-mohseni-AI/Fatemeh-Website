import { ArrowUpRight, X } from "lucide-react";
import type { RefObject } from "react";
import { relatedMemory, type ConnectionKind, type Memory } from "@/lib/garden/memories";
import type { RoomId } from "@/lib/garden/content";
const threads: [ConnectionKind, string][] = [["place", "Follow the place"], ["year", "Follow the year"], ["feeling", "Follow the feeling"], ["thread", "Another thread to follow"]];

export function PhotoFocus({ item, items, trail, detailRef, closing, close, follow, onRoom }: {
  item: Memory; items: Memory[]; trail: string[]; detailRef: RefObject<HTMLDivElement | null>; closing: boolean;
  close: () => void; follow: (id: string) => void; onRoom: (id: RoomId) => void;
}) {
  return <aside ref={detailRef} className="house-focus" data-closing={closing || undefined} aria-label="About this memory">
    <button className="house-close" type="button" onClick={close} aria-label="Step back from photograph"><X size={16} /><span>Step back</span></button>
    <p className="house-kicker">{[item.location, item.year].filter(Boolean).join(" / ") || "A personal collection"}</p>
    <h2 id="house-photo-title">{item.title}</h2>
    {item.caption && <p>{item.caption}</p>}{item.memory && <p className="house-story">{item.memory}</p>}
    <div className="house-connections" aria-label="Connected memories">{threads.map(([kind, label]) => {
      const target = relatedMemory(items, item, kind, trail);
      return target && <button key={kind} type="button" onClick={() => follow(target.id)}><span>{label}<small>{kind === "place" ? item.location : kind === "year" ? item.year : kind === "feeling" ? item.mood : target.title}</small></span><ArrowUpRight size={14} /></button>;
    })}</div>
    {item.onward && <button className="house-onward" onClick={() => onRoom(item.onward!.room)}>{item.onward.label}<ArrowUpRight size={14} /></button>}
    {item.credit && <small className="house-credit">{item.source ? <a href={item.source} target="_blank" rel="noopener noreferrer">{item.credit}</a> : item.credit}</small>}
  </aside>;
}
