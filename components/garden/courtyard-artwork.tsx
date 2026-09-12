"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { courtyardCover } from "@/lib/garden/courtyard";
import { useTehranLight } from "./use-tehran-light";

export function CourtyardArtwork({
  enabled,
  reduced,
  onDiscover,
}: {
  enabled: boolean;
  reduced: boolean;
  onDiscover: () => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const night = useTehranLight() === "night";
  const [nightLoaded, setNightLoaded] = useState(false);
  const [cover, setCover] = useState<ReturnType<typeof courtyardCover> | null>(null);


  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const measure = () => setCover(courtyardCover(
      element.clientWidth,
      element.clientHeight,
      window.matchMedia("(max-width: 600px)").matches ? 0.54 : 0.5,
    ));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);


  return (
    <div ref={frame} className="courtyard-artwork" data-time={night ? "night" : "day"}>
      <img
        className="scene-image"
        src="/images/courtyard.webp"
        alt={night && nightLoaded
          ? "A Persian courtyard at night, with softly lit Orosi windows and reflections in the turquoise pool"
          : "A sunlit Persian courtyard with Orosi windows, orange trees, and a turquoise reflecting pool"}
        fetchPriority="high"
      />
      {(night || nightLoaded) && (
        <img
          className={`scene-image courtyard-night ${night && nightLoaded ? "is-loaded" : ""}`}
          src="/images/courtyard-night.webp"
          alt=""
          aria-hidden="true"
          onLoad={() => setNightLoaded(true)}
          onError={() => setNightLoaded(false)}
          fetchPriority="high"
        />
      )}
      {cover && (
        <FountainOverlay key={String(enabled)} cover={cover} enabled={enabled} reduced={reduced} onDiscover={onDiscover} />
      )}
    </div>
  );
}

function FountainOverlay({ cover, enabled, reduced, onDiscover }: {
  cover: ReturnType<typeof courtyardCover>;
  enabled: boolean;
  reduced: boolean;
  onDiscover: () => void;
}) {
  const lastPointer = useRef("mouse");
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tapped, setTapped] = useState(false);
  const active = enabled && (hovered || focused || tapped);
  return (
        <div className="fountain-registration" style={{
          width: cover.width,
          height: cover.height,
          left: cover.left,
          top: cover.top,
        }}>
          <svg
            className={`fountain-water ${active ? "is-flowing" : ""} ${reduced ? "is-still" : ""}`}
            viewBox="0 0 1672 941"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="fountain-stream" x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#f3fbff" stopOpacity=".8" />
                <stop offset="1" stopColor="#b7ecee" stopOpacity=".18" />
              </linearGradient>
            </defs>
            <g fill="none" stroke="url(#fountain-stream)" strokeLinecap="round">
              <path className="fountain-jet" d="M837 621 Q833 566 828 601 Q821 627 810 662 M837 621 Q840 574 844 605 Q851 636 864 662" strokeWidth="1.5" />
              <path className="fountain-jet fountain-jet--fine" d="M837 621 Q835 565 835 596 M837 621 Q847 593 855 625 L870 661 M837 621 Q824 592 819 625 L803 661" strokeWidth=".8" />
              {Array.from({ length: 19 }, (_, i) => {
                const x = 801 + i * 4;
                const outward = (x - 837) * 0.22;
                return <path key={i} className="fountain-fall"
                  style={{ "--stream-delay": `${-i * 0.071}s` } as CSSProperties}
                  d={`M${x} ${666 + Math.sin(i / 18 * Math.PI) * 3} Q${x + outward} 680 ${x + outward * 1.4} ${694 + Math.sin(i * 2) * 3}`}
                  strokeWidth={i % 3 === 0 ? 1.5 : 0.8} />;
              })}
            </g>
            <g fill="none" stroke="#d7f4ed" strokeWidth=".7">
              {[0, 1, 2].map((i) => <ellipse key={i} className="fountain-ripple" cx="837" cy="696" rx="47" ry="7"
                style={{ animationDelay: `${-i * 0.9}s` }} />)}
            </g>
            <g fill="#e9ffff">
              {Array.from({ length: 14 }, (_, i) => <circle key={i} className="fountain-droplet"
                cx={802 + i * 5.4} cy={690 + Math.sin(i * 8) * 3} r={i % 3 === 0 ? 1 : 0.65}
                style={{ animationDelay: `${-i * 0.13}s` }} />)}
            </g>
          </svg>
          <button
            type="button"
            className="fountain-hotspot"
            style={{ width: Math.max(44, 110 * cover.scale), height: Math.max(44, 115 * cover.scale) }}
            aria-label="Courtyard fountain"
            aria-pressed={active}
            title="Hover to wake the fountain · tap to toggle"
            disabled={!enabled}
            onPointerDown={(event) => { lastPointer.current = event.pointerType; }}
            onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(true); }}
            onPointerLeave={() => setHovered(false)}
            onPointerCancel={() => { setHovered(false); setTapped(false); }}
            onFocus={(event) => { if (event.currentTarget.matches(":focus-visible")) setFocused(true); }}
            onBlur={() => { setFocused(false); setTapped(false); }}
            onClick={(event) => {
              if (event.detail === 0 || lastPointer.current !== "mouse") {
                setFocused(false);
                setTapped((value) => !value);
              }
              onDiscover();
            }}
          >
            <span className="sr-only">Hover, focus, or tap to bring the water to life.</span>
          </button>
        </div>
  );
}
