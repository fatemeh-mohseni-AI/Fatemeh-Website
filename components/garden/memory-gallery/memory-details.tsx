"use client";
import type { RefObject } from "react";
import { X, ArrowUpRight } from "lucide-react";
import { relatedMemory, type Memory, type ConnectionKind } from "@/lib/garden/memories";
import type { RoomId } from "@/lib/garden/content";

const links: [ConnectionKind, string][] = [["place", "Follow the place"], ["year", "Follow the year"], ["feeling", "Follow the feeling"], ["thread", "An unexpected connection"]];
export function MemoryDetails({ item, items, trail, detailRef, closing, onClose, onFollow, onRoom }: {
  item: Memory; items: Memory[]; trail: string[]; detailRef: RefObject<HTMLDivElement | null>; closing: boolean;
  onClose: () => void; onFollow: (id: string) => void; onRoom: (id: RoomId) => void;
}) {
  return (
    <div ref={detailRef} className="memory-details" data-closing={closing || undefined}>
      <button type="button" className="memory-close" onClick={onClose} aria-label="Step back from photograph"><X size={17} /><span>Step back</span></button>
      <p className="memory-kicker">{[item.location, item.year].filter(Boolean).join(" / ") || "A personal collection"}</p>
      <h2 id="focused-memory-title">{item.title}</h2>
      {item.caption && <p className="memory-caption">{item.caption}</p>}
      {item.memory && <p className="memory-story">{item.memory}</p>}
      <div className="memory-connections" aria-label="Connected memories">
        {links.map(([kind, label]) => {
          const target = relatedMemory(items, item, kind, trail);
          return target && <button type="button" key={kind} onClick={() => onFollow(target.id)}>
            <span>{label}</span><small>{kind === "feeling" ? item.mood : kind === "year" ? item.year : kind === "place" ? item.location : target.title}</small><ArrowUpRight size={13} />
          </button>;
        })}
      </div>
      {item.onward && <button type="button" className="memory-onward" onClick={() => onRoom(item.onward!.room)}>{item.onward.label}<ArrowUpRight size={13} /></button>}
      {item.credit && <small className="memory-credit">{item.source ? <a href={item.source} target="_blank" rel="noopener noreferrer">{item.credit}</a> : item.credit}</small>}
    </div>
  );
}
