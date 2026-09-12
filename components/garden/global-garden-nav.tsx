"use client";

import { useCallback, useState } from "react";
import { AboutFatemeh } from "./about-fatemeh";
import { AnonymousLetterDialog, InkAndQuillIcon } from "./anonymous-letter";

export function GlobalGardenNav() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);

  const openLetterFromAbout = useCallback(() => {
    // Switch dialogs in one render so the background does not flash between
    // the About scene and the stationery overlay.
    setLetterOpen(true);
    setAboutOpen(false);
  }, []);

  return (
    <>
      <nav className="garden-global-nav" aria-label="Fatemeh site navigation">
        <button
          type="button"
          className="global-about-link"
          onClick={() => setAboutOpen(true)}
          lang="fa"
          dir="rtl"
        >
          درباره فاطمه
        </button>
        <span className="global-nav-divider" aria-hidden="true" />
        <button
          type="button"
          className="global-letter-button"
          onClick={() => setLetterOpen(true)}
          aria-label="یک یادداشت ناشناس برای فاطمه بفرست"
        >
          <InkAndQuillIcon />
          <span className="global-letter-label" lang="fa" dir="rtl">
            یادداشت ناشناس
          </span>
        </button>
      </nav>

      <AboutFatemeh
        open={aboutOpen}
        onOpenChange={setAboutOpen}
        onOpenLetter={openLetterFromAbout}
      />
      <AnonymousLetterDialog open={letterOpen} onOpenChange={setLetterOpen} />
    </>
  );
}
