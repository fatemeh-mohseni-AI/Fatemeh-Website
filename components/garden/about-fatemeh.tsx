"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { InkAndQuillIcon } from "./anonymous-letter";

const DELIVERY_KEY = "fatemeh-about-bird-delivered-v1";

type DeliveryState = "checking" | "animating" | "delivered";

function prefersReducedMotion() {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem("fatemeh-garden-motion");
  } catch {
    saved = null;
  }
  return saved === "reduced" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function wasDelivered() {
  try {
    return sessionStorage.getItem(DELIVERY_KEY) === "1";
  } catch {
    return false;
  }
}

function markDelivered() {
  try {
    sessionStorage.setItem(DELIVERY_KEY, "1");
  } catch {
    // Session storage is optional; the interaction still works without it.
  }
}

function HoopoeCourier({
  dropped,
  birdRef,
}: {
  dropped: boolean;
  birdRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div ref={birdRef} className="about-courier" aria-hidden="true">
      <svg className="hoopoe-bird" viewBox="0 0 120 70" fill="none">
        <path className="bird-body" d="M34 38c13-16 31-19 45-10 7 4 12 10 15 17-13 8-29 12-45 9-8-2-13-7-15-16Z" />
        <path className="bird-head" d="M72 28c8-10 20-11 27-4 4 4 5 9 2 14-8-4-17-7-29-10Z" />
        <path className="bird-beak" d="M99 28l19-5-16 10" />
        <path className="bird-crest" d="M82 21l4-15 4 14M88 20l10-13-3 16M77 23l-2-15 7 13" />
        <path className="bird-tail" d="M37 42 7 34l25 17M40 47 13 55l25-3" />
        <path className="bird-wing bird-wing-top" d="M47 37c13-18 29-20 39-10-9 1-17 7-24 18" />
        <path className="bird-wing bird-wing-bottom" d="M48 43c13 4 25 3 37-5-6 13-19 20-32 16" />
      </svg>
      <span className={`courier-token ${dropped ? "is-dropped" : ""}`}>
        <InkAndQuillIcon />
      </span>
    </div>
  );
}

export function AboutFatemeh({
  open,
  onOpenChange,
  onOpenLetter,
  onDeliveryStateChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenLetter: () => void;
  onDeliveryStateChange: (state: DeliveryState) => void;
}) {
  const birdRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const timersRef = useRef<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [dropped, setDropped] = useState(false);

  useEffect(() => {
    if (!open) return;

    const clearTimers = () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };

    if (wasDelivered() || prefersReducedMotion()) {
      markDelivered();
      setPlaying(false);
      setDropped(true);
      onDeliveryStateChange("delivered");
      return clearTimers;
    }

    setPlaying(true);
    setDropped(false);
    onDeliveryStateChange("animating");

    const start = window.setTimeout(() => {
      const bird = birdRef.current;
      const anchor = document.querySelector<HTMLElement>("[data-anonymous-letter-anchor]");
      if (!bird || !anchor) {
        setPlaying(false);
        setDropped(true);
        onDeliveryStateChange("delivered");
        markDelivered();
        return;
      }

      const target = anchor.getBoundingClientRect();
      const dropX = target.left + target.width / 2 - 28;
      const dropY = target.top + target.height / 2 - 24;
      const startY = Math.max(92, window.innerHeight * 0.18);
      const midY = Math.max(48, dropY + 110);
      const exitY = Math.max(36, dropY - 82);

      animationRef.current = bird.animate(
        [
          { transform: `translate3d(-130px, ${startY}px, 0) rotate(-5deg)`, offset: 0 },
          { transform: `translate3d(${Math.max(120, dropX * 0.34)}px, ${midY}px, 0) rotate(4deg)`, offset: 0.3 },
          { transform: `translate3d(${Math.max(180, dropX - 130)}px, ${Math.max(40, dropY - 54)}px, 0) rotate(-3deg)`, offset: 0.58 },
          { transform: `translate3d(${dropX}px, ${dropY}px, 0) rotate(0deg)`, offset: 0.73 },
          { transform: `translate3d(${window.innerWidth + 150}px, ${exitY}px, 0) rotate(4deg)`, offset: 1 },
        ],
        {
          duration: 3100,
          easing: "cubic-bezier(.2,.72,.18,1)",
          fill: "forwards",
        },
      );

      const dropTimer = window.setTimeout(() => {
        setDropped(true);
        onDeliveryStateChange("delivered");
      }, 2260);
      const finishTimer = window.setTimeout(() => {
        setPlaying(false);
        markDelivered();
      }, 3150);
      timersRef.current.push(dropTimer, finishTimer);
    }, 280);

    timersRef.current.push(start);
    return () => {
      clearTimers();
      animationRef.current?.cancel();
      animationRef.current = null;
      onDeliveryStateChange("delivered");
    };
  }, [open, onDeliveryStateChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="about-fatemeh-page" showCloseButton>
        <div className="about-page-backdrop" aria-hidden="true" />
        {playing && <HoopoeCourier dropped={dropped} birdRef={birdRef} />}
        <div className="about-page-content" dir="rtl">
          <div className="about-kicker">
            <span>درباره فاطمه</span>
            <span className="about-kicker-line" />
            <span>ABOUT THE PERSON BEHIND THE GARDEN</span>
          </div>

          <DialogTitle className="about-page-title">
            میان ریشه‌های قدیمی،<br />
            <em>و جهان‌های تازه.</em>
          </DialogTitle>
          <DialogDescription className="about-page-description">
            فاطمه محسنی · Fatemeh Mohseni
          </DialogDescription>

          <div className="about-page-grid">
            <div className="about-monogram" aria-label="Fatemeh Mohseni monogram">
              <span>fm</span>
              <small>فاطمه</small>
            </div>
            <div className="about-copy">
              <p>
                من فاطمه محسنی‌ام؛ مهندس نرم‌افزار و توسعه‌دهنده هوش مصنوعی، با کنجکاوی‌ای که فقط به صفحه‌نمایش محدود نمی‌شود.
              </p>
              <p>
                این باغ جایی برای تکنولوژی، هنر، سفر، سینما، کتاب‌ها و چیزهایی است که در مسیر زندگی توجهم را می‌گیرند؛ فضایی برای ساختن، کشف کردن و نزدیک ماندن به ریشه‌های ایرانی‌ام.
              </p>
              <div className="about-identity" dir="ltr">
                MAKER <span>·</span> TRAVELER <span>·</span> EXPLORER
              </div>
              <button className="about-letter-cta" type="button" onClick={onOpenLetter}>
                <InkAndQuillIcon />
                <span>یک یادداشت برایم بگذار</span>
                <ArrowLeft size={16} />
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
