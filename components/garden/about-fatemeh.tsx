"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, X } from "lucide-react";
import { InkAndQuillIcon } from "./anonymous-letter";

const DELIVERY_KEY = "fatemeh-about-bird-delivered-v3";
const FLIGHT_DURATION_MS = 6800;
const DROP_AT_MS = 4400;
const FLIGHT_START_DELAY_MS = 640;

type CourierState = {
  birdActive: boolean;
  released: boolean;
  delivered: boolean;
};

function isLocalPreview() {
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

function prefersReducedMotion() {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem("fatemeh-garden-motion");
  } catch {
    saved = null;
  }
  return saved === "reduced" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function wasDeliveredThisSession() {
  if (isLocalPreview()) return false;
  try {
    return sessionStorage.getItem(DELIVERY_KEY) === "1";
  } catch {
    return false;
  }
}

function markDeliveredThisSession() {
  if (isLocalPreview()) return;
  try {
    sessionStorage.setItem(DELIVERY_KEY, "1");
  } catch {
    // The animation is decorative; blocked storage must not break About.
  }
}

function CourierEnvelope({ released }: { released: boolean }) {
  return (
    <span className={`courier-envelope ${released ? "is-released" : ""}`}>
      <span className="courier-envelope-paper" />
      <span className="courier-envelope-seal">✦</span>
    </span>
  );
}

function HoopoeCourier({
  birdRef,
  released,
  active,
}: {
  birdRef: RefObject<HTMLDivElement | null>;
  released: boolean;
  active: boolean;
}) {
  return (
    <div
      ref={birdRef}
      className={`about-courier-v2 ${active ? "is-active" : ""}`}
      aria-hidden="true"
    >
      <svg className="hoopoe-bird-v2" viewBox="0 0 180 108" fill="none">
        <ellipse className="bird-shadow" cx="83" cy="82" rx="46" ry="8" />
        <path className="bird-v2-tail" d="M54 60 12 51l35 22M55 67 18 82l39-7" />
        <path className="bird-v2-body" d="M48 58c11-24 39-36 68-23 16 8 24 23 20 40-26 15-58 16-78 5-8-5-12-13-10-22Z" />
        <path className="bird-v2-neck" d="M105 37c9-18 30-24 43-13 9 8 10 21 3 30-16-9-30-14-46-17Z" />
        <circle className="bird-v2-eye" cx="143" cy="32" r="2.4" />
        <path className="bird-v2-beak" d="M151 37 178 29l-24 15" />
        <g className="bird-v2-crest">
          <path d="M126 22 126 2" />
          <path d="M133 21 140 1" />
          <path d="M119 24 112 5" />
          <path d="M140 24 154 8" />
        </g>
        <path
          className="bird-v2-wing bird-v2-wing-upper"
          d="M65 55c12-27 42-38 65-22-20 5-35 17-48 36"
          style={{ animationDuration: ".44s", animationTimingFunction: "ease-in-out" }}
        />
        <path
          className="bird-v2-wing bird-v2-wing-lower"
          d="M65 63c22 8 43 4 62-12-7 27-36 42-59 29"
          style={{
            animationDuration: ".44s",
            animationDelay: "-.22s",
            animationTimingFunction: "ease-in-out",
          }}
        />
        <path className="bird-v2-stripe" d="M74 73c16 5 30 4 44-2M85 78c12 2 22 1 32-3" />
      </svg>
      <CourierEnvelope released={released} />
    </div>
  );
}

function AboutLetterArtwork() {
  return (
    <div
      className="about-v2-orosi-frame"
      style={{
        width: "min(390px, 100%)",
        aspectRatio: "16 / 10",
        borderRadius: "30% 30% 5% 5% / 17% 17% 5% 5%",
        background: "#0b1d17",
        boxShadow: "inset 0 0 70px #d3ad6b10, 0 34px 70px #0007",
      }}
    >
      <img
        src="/images/about-fatemeh-letter.webp"
        alt=""
        width={448}
        height={252}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        draggable={false}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          filter: "saturate(.92) brightness(.91) contrast(1.035)",
        }}
      />
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          background:
            "linear-gradient(180deg, rgba(3, 14, 11, .05), rgba(3, 14, 11, .22)), radial-gradient(circle at 67% 58%, rgba(220, 177, 102, .10), transparent 48%)",
          boxShadow: "inset 0 0 55px rgba(2, 11, 9, .55)",
        }}
      />
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 14,
          zIndex: 3,
          pointerEvents: "none",
          border: "1px solid rgba(220, 185, 121, .34)",
          borderRadius: "24% 24% 3% 3% / 15% 15% 3% 3%",
          boxShadow: "0 0 24px rgba(216, 177, 107, .07)",
        }}
      />
      <div className="about-v2-orosi-glow" style={{ zIndex: 3 }} />
    </div>
  );
}

function DeliveredLetterButton({
  targetRef,
  delivered,
  onClick,
}: {
  targetRef: RefObject<HTMLDivElement | null>;
  delivered: boolean;
  onClick: () => void;
}) {
  return (
    <div ref={targetRef} className={`about-letter-perch ${delivered ? "has-letter" : ""}`}>
      <span className="about-letter-perch-mark" aria-hidden="true" />
      <button
        type="button"
        className={`about-delivered-letter ${delivered ? "is-delivered" : ""}`}
        onClick={onClick}
        disabled={!delivered}
        aria-label="یک یادداشت ناشناس برای فاطمه بفرست"
      >
        <span className="about-envelope" aria-hidden="true">
          <span className="about-envelope-body" />
          <span className="about-envelope-flap" />
          <span className="about-envelope-note">
            <InkAndQuillIcon />
          </span>
        </span>
        <span className="about-delivered-copy">
          <small>یک یادداشت بگذار</small>
          <strong>ناشناس برای فاطمه</strong>
        </span>
      </button>
    </div>
  );
}

export function AboutFatemeh({
  open,
  onOpenChange,
  onOpenLetter,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenLetter: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const birdRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const timersRef = useRef<number[]>([]);
  const [courier, setCourier] = useState<CourierState>({
    birdActive: false,
    released: false,
    delivered: false,
  });

  useEffect(() => {
    if (!open) return;

    const previousActive = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
        return;
      }
      if (event.key !== "Tab") return;

      const root = rootRef.current;
      if (!root) return;
      const focusable = Array.from(
        root.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActive?.focus();
    };
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const clearTimers = () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };

    animationRef.current?.cancel();
    animationRef.current = null;
    clearTimers();

    if (prefersReducedMotion() || wasDeliveredThisSession()) {
      setCourier({ birdActive: false, released: true, delivered: true });
      markDeliveredThisSession();
      return clearTimers;
    }

    setCourier({ birdActive: false, released: false, delivered: false });

    const startTimer = window.setTimeout(() => {
      if (cancelled) return;
      const bird = birdRef.current;
      const target = targetRef.current;
      if (!bird || !target) {
        setCourier({ birdActive: false, released: true, delivered: true });
        markDeliveredThisSession();
        return;
      }

      setCourier({ birdActive: true, released: false, delivered: false });

      const targetRect = target.getBoundingClientRect();
      const targetX = targetRect.left + targetRect.width / 2 - 88;
      const targetY = targetRect.top + targetRect.height / 2 - 54;
      const startY = Math.max(104, Math.min(window.innerHeight * 0.2, 184));
      const sweepY = Math.min(window.innerHeight * 0.36, startY + 112);
      const approachY = Math.max(72, targetY + 100);
      const exitY = Math.max(44, targetY - 118);
      const cruiseX = Math.max(
        72,
        Math.min(targetX * 0.46, window.innerWidth * 0.38),
      );
      const approachX = Math.max(
        cruiseX + 68,
        targetX - Math.min(220, window.innerWidth * 0.18),
      );
      const preDeliveryX = targetX - Math.min(78, window.innerWidth * 0.06);

      animationRef.current = bird.animate(
        [
          {
            transform: `translate3d(-220px, ${startY}px, 0) rotate(-3deg)`,
            opacity: 0,
            offset: 0,
            easing: "cubic-bezier(.3,.05,.35,1)",
          },
          {
            transform: `translate3d(-72px, ${startY - 12}px, 0) rotate(-1.5deg)`,
            opacity: 1,
            offset: 0.08,
            easing: "cubic-bezier(.22,.62,.28,1)",
          },
          {
            transform: `translate3d(${cruiseX}px, ${sweepY}px, 0) rotate(3.5deg)`,
            opacity: 1,
            offset: 0.31,
            easing: "cubic-bezier(.28,.56,.32,1)",
          },
          {
            transform: `translate3d(${approachX}px, ${approachY}px, 0) rotate(-2.5deg)`,
            opacity: 1,
            offset: 0.5,
            easing: "cubic-bezier(.24,.7,.28,1)",
          },
          {
            transform: `translate3d(${preDeliveryX}px, ${targetY + 26}px, 0) rotate(-1deg)`,
            opacity: 1,
            offset: 0.59,
            easing: "cubic-bezier(.18,.72,.2,1)",
          },
          {
            transform: `translate3d(${targetX}px, ${targetY}px, 0) rotate(0deg)`,
            opacity: 1,
            offset: 0.65,
            easing: "cubic-bezier(.16,.8,.2,1)",
          },
          {
            transform: `translate3d(${targetX + 12}px, ${targetY - 7}px, 0) rotate(.6deg)`,
            opacity: 1,
            offset: 0.73,
            easing: "cubic-bezier(.35,0,.25,1)",
          },
          {
            transform: `translate3d(${targetX + 150}px, ${targetY - 66}px, 0) rotate(3deg)`,
            opacity: 1,
            offset: 0.82,
            easing: "cubic-bezier(.2,.55,.28,1)",
          },
          {
            transform: `translate3d(${window.innerWidth + 220}px, ${exitY}px, 0) rotate(5deg)`,
            opacity: 0,
            offset: 1,
          },
        ],
        {
          duration: FLIGHT_DURATION_MS,
          easing: "linear",
          fill: "forwards",
        },
      );

      const dropTimer = window.setTimeout(() => {
        if (cancelled) return;
        setCourier((current) => ({ ...current, released: true, delivered: true }));
      }, DROP_AT_MS);

      const finishTimer = window.setTimeout(() => {
        if (cancelled) return;
        animationRef.current?.cancel();
        animationRef.current = null;
        setCourier((current) => ({ ...current, birdActive: false }));
        markDeliveredThisSession();
      }, FLIGHT_DURATION_MS + 120);

      timersRef.current.push(dropTimer, finishTimer);
    }, FLIGHT_START_DELAY_MS);

    timersRef.current.push(startTimer);

    return () => {
      cancelled = true;
      clearTimers();
      animationRef.current?.cancel();
      animationRef.current = null;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={rootRef}
      className="about-fatemeh-v2"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-fatemeh-title"
      aria-describedby="about-fatemeh-description"
    >
      <div className="about-v2-backdrop" aria-hidden="true" />
      <div className="about-v2-pattern" aria-hidden="true" />

      <div className="about-v2-topbar">
        <button
          ref={closeRef}
          type="button"
          className="about-v2-close"
          onClick={() => onOpenChange(false)}
          aria-label="بستن درباره فاطمه"
        >
          <X size={18} />
        </button>

        <DeliveredLetterButton
          targetRef={targetRef}
          delivered={courier.delivered}
          onClick={onOpenLetter}
        />
      </div>

      <HoopoeCourier
        birdRef={birdRef}
        released={courier.released}
        active={courier.birdActive}
      />

      <div className="about-v2-content" dir="rtl">
        <div className="about-v2-copy-column">
          <div className="about-v2-kicker">
            <span>درباره فاطمه</span>
            <span className="about-v2-line" aria-hidden="true" />
            <span dir="ltr">ABOUT THE PERSON BEHIND THE GARDEN</span>
          </div>

          <h1 id="about-fatemeh-title" className="about-v2-title">
            میان ریشه‌های قدیمی،
            <br />
            <em>و جهان‌های تازه.</em>
          </h1>
          <p id="about-fatemeh-description" className="about-v2-description">
            فاطمه محسنی · Fatemeh Mohseni
          </p>

          <div className="about-v2-body-copy">
            <p>
              من فاطمه محسنی‌ام؛ مهندس نرم‌افزار و توسعه‌دهنده هوش مصنوعی، با
              کنجکاوی‌ای که فقط به صفحه‌نمایش محدود نمی‌شود.
            </p>
            <p>
              این باغ جایی برای تکنولوژی، هنر، سفر، سینما، کتاب‌ها و چیزهایی
              است که در مسیر زندگی توجهم را می‌گیرند؛ فضایی برای ساختن، کشف
              کردن و نزدیک ماندن به ریشه‌های ایرانی‌ام.
            </p>
          </div>

          <div className="about-v2-identity" dir="ltr">
            MAKER <span>·</span> TRAVELER <span>·</span> EXPLORER
          </div>

          <button className="about-v2-letter-cta" type="button" onClick={onOpenLetter}>
            <InkAndQuillIcon />
            <span>یک یادداشت برایم بگذار</span>
            <ArrowLeft size={16} />
          </button>
        </div>

        <div className="about-v2-portrait-column" aria-hidden="true">
          <AboutLetterArtwork />
          <p dir="ltr">ROOTS · CURIOSITY · POSSIBILITY</p>
        </div>
      </div>

      {!courier.delivered && !courier.birdActive && (
        <span className="about-v2-delivery-status" role="status">
          یک مهمان کوچک در راه است…
        </span>
      )}
    </div>,
    document.body,
  );
}
