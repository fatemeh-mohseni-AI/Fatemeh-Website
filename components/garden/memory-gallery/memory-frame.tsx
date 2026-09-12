"use client";
import { useState, type CSSProperties } from "react";
import type { Memory } from "@/lib/garden/memories";

export function MemoryFrame({ item, slot, hero, focused, dimmed, disabled, nearby, register, onOpen }: {
  item: Memory; slot: number; hero: boolean; focused: boolean; dimmed: boolean; disabled: boolean; nearby: boolean;
  register: (node: HTMLDivElement | null) => void; onOpen: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div ref={register} className={`memory-anchor memory-anchor--${item.orientation} memory-anchor--slot-${slot} ${hero ? "memory-anchor--hero" : ""}`}
      data-memory-id={item.id} data-focused={focused || undefined} data-dimmed={dimmed && !focused || undefined}
      style={{ "--photo-color": item.color, "--reveal-delay": `${slot * 90}ms` } as CSSProperties}>
      <span className="memory-wall-lamp" aria-hidden="true"><i /></span>
      <div className="memory-frame-shell">
        <button type="button" className="memory-frame-button" onClick={onOpen} disabled={disabled}
          tabIndex={focused ? -1 : 0} aria-label={`Approach ${item.title}`} aria-expanded={focused}>
          <span className={`memory-mat ${loaded ? "is-loaded" : ""}`}>
            {failed ? <span className="memory-image-failed">This memory is waiting for its photograph.</span> : (
              <img src={item.src} alt={item.alt || item.title} loading={nearby ? "eager" : "lazy"} decoding="async"
                srcSet={item.variants.length ? item.variants.map((variant) => `${variant.src} ${variant.width}w`).join(", ") : undefined}
                sizes={focused ? "(max-width: 700px) 88vw, 60vw" : "(max-width: 700px) 65vw, 420px"}
                style={{ objectPosition: `${item.position[0]}% ${item.position[1]}%` }}
                onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
            )}
          </span>
        </button>
      </div>
      <span className="memory-plaque"><strong>{item.title}</strong><span>{[item.location, item.year].filter(Boolean).join(" · ") || "A moment worth keeping"}</span></span>
    </div>
  );
}
