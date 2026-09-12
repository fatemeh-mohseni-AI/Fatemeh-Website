"use client";

import { useCallback, useState } from "react";
import { AboutFatemeh } from "./about-fatemeh";
import { AnonymousLetterDialog, InkAndQuillIcon } from "./anonymous-letter";

type DeliveryState = "checking" | "animating" | "delivered";

export function GlobalGardenNav() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const [deliveryState, setDeliveryState] = useState<DeliveryState>("delivered");

  const openAbout = useCallback(() => {
    setDeliveryState("checking");
    setAboutOpen(true);
  }, []);

  const openLetterFromAbout = useCallback(() => {
    setDeliveryState("delivered");
    setAboutOpen(false);
    window.setTimeout(() => setLetterOpen(true), 120);
  }, []);

  const handleAboutChange = useCallback((open: boolean) => {
    setAboutOpen(open);
    if (!open) setDeliveryState("delivered");
  }, []);

  const letterHidden = aboutOpen && deliveryState !== "delivered";

  return (
    <>
      <nav className="garden-global-nav" aria-label="Fatemeh site navigation">
        <button type="button" className="global-about-link" onClick={openAbout} lang="fa" dir="rtl">
          درباره فاطمه
        </button>
        <span className="global-nav-divider" aria-hidden="true" />
        <button
          type="button"
          className={`global-letter-button ${letterHidden ? "is-awaiting-delivery" : ""}`}
          onClick={() => setLetterOpen(true)}
          aria-label="یک یادداشت ناشناس برای فاطمه بفرست"
          data-anonymous-letter-anchor
          disabled={letterHidden}
        >
          <InkAndQuillIcon />
          <span className="global-letter-label" lang="fa" dir="rtl">یادداشت ناشناس</span>
        </button>
      </nav>

      <AboutFatemeh
        open={aboutOpen}
        onOpenChange={handleAboutChange}
        onOpenLetter={openLetterFromAbout}
        onDeliveryStateChange={setDeliveryState}
      />
      <AnonymousLetterDialog open={letterOpen} onOpenChange={setLetterOpen} />
    </>
  );
}
