"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { courtyardCover } from "@/lib/garden/courtyard";
import { useTehranLight } from "./use-tehran-light";

const lanterns = [
  { left: "18.5%", top: "41.5%", size: "6.2%", delay: "-1.7s", duration: "6.8s" },
  { left: "47.4%", top: "38.5%", size: "6.6%", delay: "-4.1s", duration: "7.6s" },
  { left: "73.2%", top: "40.8%", size: "7.2%", delay: "-2.8s", duration: "8.4s" },
  { left: "90.2%", top: "43.2%", size: "5.8%", delay: "-5.2s", duration: "7.1s" },
];

const particles = [
  { left: 12, top: 29, size: 1.4, delay: -2.1, duration: 18, drift: 22 },
  { left: 21, top: 36, size: 1.8, delay: -8.4, duration: 23, drift: -18 },
  { left: 31, top: 24, size: 1.2, delay: -12.7, duration: 20, drift: 14 },
  { left: 41, top: 32, size: 1.6, delay: -5.2, duration: 25, drift: -20 },
  { left: 52, top: 27, size: 1.3, delay: -16.5, duration: 22, drift: 18 },
  { left: 62, top: 35, size: 1.7, delay: -9.1, duration: 26, drift: -16 },
  { left: 72, top: 25, size: 1.1, delay: -14.9, duration: 19, drift: 13 },
  { left: 82, top: 34, size: 1.5, delay: -3.6, duration: 24, drift: -22 },
  { left: 90, top: 28, size: 1.2, delay: -11.3, duration: 21, drift: 16 },
  { left: 25, top: 52, size: 1.3, delay: -6.2, duration: 27, drift: 20 },
  { left: 58, top: 49, size: 1.4, delay: -18.2, duration: 28, drift: -17 },
  { left: 77, top: 56, size: 1.1, delay: -7.7, duration: 24, drift: 15 },
];

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
  const lighting = useTehranLight();
  const night = lighting === "night";
  const [nightLoaded, setNightLoaded] = useState(false);
  const [cover, setCover] = useState<ReturnType<typeof courtyardCover> | null>(null);
  const [birdActive, setBirdActive] = useState(false);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const measure = () =>
      setCover(
        courtyardCover(
          element.clientWidth,
          element.clientHeight,
          window.matchMedia("(max-width: 600px)").matches ? 0.54 : 0.5,
        ),
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!enabled || reduced) {
      setBirdActive(false);
      return;
    }

    let nextPass: number | undefined;
    let finishPass: number | undefined;
    let cancelled = false;

    const schedulePass = () => {
      const delay = 35_000 + Math.random() * 35_000;
      nextPass = window.setTimeout(() => {
        if (cancelled) return;
        setBirdActive(true);
        finishPass = window.setTimeout(() => {
          if (cancelled) return;
          setBirdActive(false);
          schedulePass();
        }, 7_800);
      }, delay);
    };

    schedulePass();
    return () => {
      cancelled = true;
      if (nextPass) window.clearTimeout(nextPass);
      if (finishPass) window.clearTimeout(finishPass);
    };
  }, [enabled, reduced]);

  return (
    <div ref={frame} className="courtyard-artwork" data-time={lighting}>
      <img
        className="scene-image"
        src="/images/courtyard.webp"
        alt={
          night && nightLoaded
            ? "A Persian courtyard at night, with softly lit Orosi windows and reflections in the turquoise pool"
            : "A sunlit Persian courtyard with Orosi windows, orange trees, and a turquoise reflecting pool"
        }
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
        <>
          <CourtyardAtmosphere
            cover={cover}
            enabled={enabled}
            reduced={reduced}
            birdActive={birdActive}
          />
          <FountainOverlay
            key={String(enabled)}
            cover={cover}
            enabled={enabled}
            reduced={reduced}
            onDiscover={onDiscover}
          />
        </>
      )}
    </div>
  );
}

function CourtyardAtmosphere({
  cover,
  enabled,
  reduced,
  birdActive,
}: {
  cover: ReturnType<typeof courtyardCover>;
  enabled: boolean;
  reduced: boolean;
  birdActive: boolean;
}) {
  return (
    <div
      className={`courtyard-atmosphere ${enabled ? "is-enabled" : ""} ${reduced ? "is-reduced" : ""}`}
      style={{
        width: cover.width,
        height: cover.height,
        left: cover.left,
        top: cover.top,
      }}
      aria-hidden="true"
    >
      <div className="courtyard-lantern-layer">
        {lanterns.map((lantern, index) => (
          <span
            key={index}
            className="courtyard-lantern-glow"
            style={{
              left: lantern.left,
              top: lantern.top,
              width: lantern.size,
              animationDelay: lantern.delay,
              animationDuration: lantern.duration,
            }}
          />
        ))}
      </div>

      <svg
        className="courtyard-leaf-cluster courtyard-leaf-cluster--left"
        viewBox="0 0 150 105"
      >
        <path className="courtyard-branch" d="M8 94 C38 70 63 53 136 16" />
        <g className="courtyard-leaves">
          <ellipse cx="35" cy="72" rx="11" ry="5" transform="rotate(-28 35 72)" />
          <ellipse cx="53" cy="61" rx="10" ry="4.6" transform="rotate(25 53 61)" />
          <ellipse cx="69" cy="50" rx="12" ry="5" transform="rotate(-32 69 50)" />
          <ellipse cx="88" cy="40" rx="10" ry="4.4" transform="rotate(30 88 40)" />
          <ellipse cx="106" cy="30" rx="11" ry="4.8" transform="rotate(-24 106 30)" />
          <ellipse cx="124" cy="22" rx="9" ry="4" transform="rotate(28 124 22)" />
        </g>
      </svg>

      <svg
        className="courtyard-leaf-cluster courtyard-leaf-cluster--right"
        viewBox="0 0 170 118"
      >
        <path className="courtyard-branch" d="M163 106 C132 79 104 57 18 14" />
        <g className="courtyard-leaves">
          <ellipse cx="137" cy="82" rx="12" ry="5.2" transform="rotate(24 137 82)" />
          <ellipse cx="118" cy="68" rx="10" ry="4.5" transform="rotate(-28 118 68)" />
          <ellipse cx="98" cy="56" rx="12" ry="5" transform="rotate(26 98 56)" />
          <ellipse cx="76" cy="43" rx="11" ry="4.7" transform="rotate(-30 76 43)" />
          <ellipse cx="55" cy="31" rx="10" ry="4.3" transform="rotate(25 55 31)" />
          <ellipse cx="34" cy="21" rx="9" ry="4" transform="rotate(-22 34 21)" />
        </g>
      </svg>

      <div className="courtyard-particles">
        {particles.map((particle, index) => (
          <span
            key={index}
            className="courtyard-particle"
            style={
              {
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                width: particle.size,
                height: particle.size,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
                "--particle-drift": `${particle.drift}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className={`courtyard-bird-pass ${birdActive ? "is-active" : ""}`}>
        <svg className="courtyard-distant-bird courtyard-distant-bird--one" viewBox="0 0 48 22">
          <path d="M2 15 C10 6 18 7 24 13 C30 7 38 6 46 15 C38 11 31 12 24 18 C17 12 10 11 2 15Z" />
        </svg>
        <svg className="courtyard-distant-bird courtyard-distant-bird--two" viewBox="0 0 48 22">
          <path d="M2 15 C10 6 18 7 24 13 C30 7 38 6 46 15 C38 11 31 12 24 18 C17 12 10 11 2 15Z" />
        </svg>
      </div>
    </div>
  );
}

function FountainOverlay({
  cover,
  enabled,
  reduced,
  onDiscover,
}: {
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
    <div
      className="fountain-registration"
      style={{
        width: cover.width,
        height: cover.height,
        left: cover.left,
        top: cover.top,
      }}
    >
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
          <path
            className="fountain-jet"
            d="M837 621 Q827 500 804 575 Q787 625 767 663 M837 621 Q848 503 870 578 Q886 629 907 663"
            strokeWidth="2.2"
          />
          <path
            className="fountain-jet fountain-jet--fine"
            d="M837 621 Q836 488 836 565 M837 621 Q859 547 878 605 L900 663 M837 621 Q814 545 795 604 L773 663"
            strokeWidth="1.15"
          />
          {Array.from({ length: 23 }, (_, i) => {
            const x = 789 + i * 4.4;
            const outward = (x - 837) * 0.26;
            return (
              <path
                key={i}
                className="fountain-fall"
                style={{ "--stream-delay": `${-i * 0.061}s` } as CSSProperties}
                d={`M${x} ${663 + Math.sin((i / 22) * Math.PI) * 3.4} Q${x + outward} 682 ${x + outward * 1.55} ${704 + Math.sin(i * 2) * 3.5}`}
                strokeWidth={i % 3 === 0 ? 1.8 : 1}
              />
            );
          })}
        </g>
        <g fill="none" stroke="#d7f4ed" strokeWidth=".8">
          {[0, 1, 2].map((i) => (
            <ellipse
              key={i}
              className="fountain-ripple"
              cx="837"
              cy="706"
              rx="62"
              ry="9"
              style={{ animationDelay: `${-i * 0.9}s` }}
            />
          ))}
        </g>
        <g fill="#e9ffff">
          {Array.from({ length: 18 }, (_, i) => (
            <circle
              key={i}
              className="fountain-droplet"
              cx={790 + i * 5.5}
              cy={700 + Math.sin(i * 8) * 4}
              r={i % 3 === 0 ? 1.2 : 0.75}
              style={{ animationDelay: `${-i * 0.11}s` }}
            />
          ))}
        </g>
      </svg>
      <button
        type="button"
        className="fountain-hotspot"
        style={{
          width: Math.max(44, 128 * cover.scale),
          height: Math.max(44, 138 * cover.scale),
        }}
        aria-label="Courtyard fountain"
        aria-pressed={active}
        disabled={!enabled}
        onPointerDown={(event) => {
          lastPointer.current = event.pointerType;
        }}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setHovered(true);
        }}
        onPointerLeave={() => setHovered(false)}
        onPointerCancel={() => {
          setHovered(false);
          setTapped(false);
        }}
        onFocus={(event) => {
          if (event.currentTarget.matches(":focus-visible")) setFocused(true);
        }}
        onBlur={() => {
          setFocused(false);
          setTapped(false);
        }}
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
