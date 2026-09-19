"use client";
import { useState, type CSSProperties } from "react";
import type { Memory } from "@/lib/garden/memories";

export function PhotoFrame({ item, room, slot, focused, dimmed, disabled, nearby, register, onOpen }: {
  item: Memory; room: number; slot: number; focused: boolean; dimmed: boolean; disabled: boolean; nearby: boolean;
  register: (element: HTMLDivElement | null) => void; onOpen: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return <div ref={register} className={`house-anchor house-anchor--${item.orientation} house-anchor--${slot}`}
    data-memory-id={item.id} data-room-index={room} data-focused={focused || undefined} data-dimmed={dimmed && !focused || undefined}
    style={{ "--room": room, "--slot": slot, "--photo-color": item.color } as CSSProperties}>
    <div className="house-frame-flight">
      <button className="house-frame" type="button" onClick={onOpen} disabled={disabled} tabIndex={focused ? -1 : 0}
        aria-label={`Approach ${item.title}`} aria-expanded={focused}>
        <span className="house-mount" data-loaded={loaded || undefined}>
          {failed ? <span className="house-missing">This memory is waiting for its photograph.</span> : <img
            src={nearby || focused ? item.src : undefined} alt={item.alt || item.title} draggable={false}
            loading={room === 0 ? "eager" : "lazy"} decoding="async"
            srcSet={(nearby || focused) && item.variants.length ? item.variants.map((v) => `${v.src} ${v.width}w`).join(", ") : undefined}
            sizes={focused ? "(max-width: 700px) 88vw, 57vw" : "(max-width: 700px) 70vw, 450px"}
            style={{ objectPosition: `${item.position[0]}% ${item.position[1]}%` }} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />}
        </span>
      </button>
    </div>
    <div className="house-label"><strong>{item.title}</strong><span>{[item.location, item.year].filter(Boolean).join(" · ") || "A moment worth keeping"}</span></div>
  </div>;
}
