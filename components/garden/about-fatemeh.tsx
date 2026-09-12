"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { ArrowLeft, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { InkAndQuillIcon } from "./anonymous-letter";

const DELIVERY_KEY = "fatemeh-about-bird-delivered-v2";
const FLIGHT_DURATION_MS = 3900;
const DROP_AT_MS = 2700;

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
    // The animation is decorative; blocked session storage must not break About.
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
}: {
  birdRef: RefObject<HTMLDivElement | null>;
  released: boolean;
}) {
  return (
    <div ref={birdRef} className="about-courier-v2" aria-hidden="true">
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
        <path className="bird-v2-wing bird-v2-wing-upper" d="M65 55c12-27 42-38 65-22-20 5-35 17-48 36" />
        <path className="bird-v2-wing bird-v2-wing-lower" d="M65 63c22 8 43 4 62-12-7 27-36 42-59 29" />
        <path className="bird-v2-stripe" d="M74 73c16 5 30 4 44-2M85 78c12 2 22 1 32-3" />
      </svg>
      <CourierEnvelope released={released} />
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
      const startY = Math.max(112, Math.min(window.innerHeight * 0.24, 210));
      const firstArcY = Math.min(window.innerHeight * 0.38, startY + 125);
      const approachY = Math.max(72, targetY + 72);
      const exitY = Math.max(44, targetY - 145);

      animationRef.current = bird.animate(
        [
          {
            transform: `translate3d(-210px, ${startY}px, 0) rotate(-4deg)`,
            opacity: 0,
            offset: 0,
          },
          {
            transform: `translate3d(-80px, ${startY - 10}px, 0) rotate(-2deg)`,
            opacity: 1,
            offset: 0.07,
          },
          {
            transform: `translate3d(${Math.max(160, window.innerWidth * 0.33)}px, ${firstArcY}px, 0) rotate(5deg)`,
            opacity: 1,
            offset: 0.34,
          },
          {
            transform: `translate3d(${Math.max(260, targetX - 190)}px, ${approachY}px, 0) rotate(-4deg)`,
            opacity: 1,
            offset: 0.58,
          },
          {
            transform: `translate3d(${targetX}px, ${targetY}px, 0) rotate(0deg)`,
            opacity: 1,
            offset: 0.7,
          },
          {
            transform: `translate3d(${targetX + 20}px, ${targetY - 8}px, 0) rotate(1deg)`,
            opacity: 1,
            offset: 0.76,
          },
          {
            transform: `translate3d(${window.innerWidth + 210}px, ${exitY}px, 0) rotate(6deg)`,
            opacity: 0.94,
            offset: 1,
          },
        ],
        {
          duration: FLIGHT_DURATION_MS,
          easing: "cubic-bezier(.18,.72,.2,1)",
          fill: "forwards",
        },
      );

      const dropTimer = window.setTimeout(() => {
        if (cancelled) return;
        setCourier((current) => ({
          ...current,
          released: true,
          delivered: true,
        }));
      }, DROP_AT_MS);

      const finishTimer = window.setTimeout(() => {
        if (cancelled) return;
        setCourier((current) => ({ ...current, birdActive: false }));
        markDeliveredThisSession();
      }, FLIGHT_DURATION_MS + 80);

      timersRef.current.push(dropTimer, finishTimer);
    }, 420);

    timersRef.current.push(startTimer);

    return () => {
      cancelled = true;
      clearTimers();
      animationRef.current?.cancel();
      animationRef.current = null;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="about-fatemeh-v2"
        showCloseButton={false}
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100dvh",
          maxWidth: "none",
          transform: "none",
        }}
      >
        <div className="about-v2-backdrop" aria-hidden="true" />
        <div className="about-v2-pattern" aria-hidden="true" />

        <div className="about-v2-topbar">
          <button
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

        <HoopoeCourier birdRef={birdRef} released={courier.released} />

        <div className="about-v2-content" dir="rtl">
          <div className="about-v2-copy-column">
            <div className="about-v2-kicker">
              <span>درباره فاطمه</span>
              <span className="about-v2-line" aria-hidden="true" />
              <span dir="ltr">ABOUT THE PERSON BEHIND THE GARDEN</span>
            </div>

            <DialogTitle className="about-v2-title">
              میان ریشه‌های قدیمی،
              <br />
              <em>و جهان‌های تازه.</em>
            </DialogTitle>
            <DialogDescription className="about-v2-description">
              فاطمه محسنی · Fatemeh Mohseni
            </DialogDescription>

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
            <div className="about-v2-orosi-frame">
              <div className="about-v2-monogram">
                <span>fm</span>
                <small>فاطمه</small>
              </div>
              <div className="about-v2-orosi-glow" />
            </div>
            <p dir="ltr">ROOTS · CURIOSITY · POSSIBILITY</p>
          </div>
        </div>

        {!courier.delivered && !courier.birdActive && (
          <span className="about-v2-delivery-status" role="status">
            یک مهمان کوچک در راه است…
          </span>
        )}
      </DialogContent>
    </Dialog>
  );
}
