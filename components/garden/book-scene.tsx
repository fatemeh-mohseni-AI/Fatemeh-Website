"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ArrowLeft, ArrowRight, BookOpenText, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { books, type Book } from "@/lib/garden/books";

type BookSceneProps = {
  reduced: boolean;
  onDiscover: () => void;
};

type ScenePhase = "idle" | "focus" | "opening" | "open" | "closing";
type FlipDirection = -1 | 1;
type FlipState = {
  direction: FlipDirection;
  pointerId: number | null;
  progress: number;
  settling: boolean;
  startX: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function LiteraryPage({ book, compact = false }: { book: Book; compact?: boolean }) {
  return (
    <div className={`literary-page ${compact ? "literary-page--compact" : ""}`}>
      <p className="book-category">{book.category}</p>
      <h2>{book.title}</h2>
      <p className="book-author">by {book.author}</p>
      <p className="book-description">{book.description}</p>
      <div className="book-quotes" aria-label="Selected passages">
        {book.quotes.map((quote) => (
          <blockquote key={quote}>“{quote}”</blockquote>
        ))}
      </div>
      <div className="book-reflection">
        <span>Why it stays with me</span>
        <p>{book.personalNote}</p>
      </div>
    </div>
  );
}

function VisualPage({ book, compact = false }: { book: Book; compact?: boolean }) {
  const coverStyle = {
    "--book-cover-position": book.coverPosition ?? "center",
  } as CSSProperties;

  return (
    <div
      className={`visual-page ${compact ? "visual-page--compact" : ""}`}
      data-theme={book.theme}
      style={coverStyle}
    >
      <img src={book.coverImage} alt={book.coverAlt} />
      <span className="visual-page__wash" aria-hidden="true" />
      <span className="visual-page__frame" aria-hidden="true" />
      <div className="visual-page__copy">
        <span>{book.category}</span>
        <strong>{book.title}</strong>
        <small>{book.author}</small>
      </div>
    </div>
  );
}

export function BookScene({ reduced, onDiscover }: BookSceneProps) {
  const [phase, setPhase] = useState<ScenePhase>("idle");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [flip, setFlip] = useState<FlipState | null>(null);
  const flipRef = useRef<FlipState | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  };

  const queue = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(callback, delay);
    timers.current.push(timer);
    return timer;
  };

  const updateFlip = (next: FlipState | null) => {
    flipRef.current = next;
    setFlip(next);
  };

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  const openBook = () => {
    if (phase !== "idle") return;
    clearTimers();
    onDiscover();
    setDialogOpen(true);
    if (reduced) {
      setPhase("open");
      return;
    }
    setPhase("focus");
    queue(() => setPhase("opening"), 620);
    queue(() => setPhase("open"), 1480);
  };

  const closeBook = () => {
    if (!dialogOpen || phase === "closing") return;
    clearTimers();
    updateFlip(null);
    if (reduced) {
      setDialogOpen(false);
      setPhase("idle");
      return;
    }
    setPhase("closing");
    queue(() => {
      setDialogOpen(false);
      setPhase("idle");
    }, 680);
  };

  const canTurn = (direction: FlipDirection) => {
    const target = activeIndex + direction;
    return phase === "open" && !flipRef.current && target >= 0 && target < books.length;
  };

  const finishFlip = (complete: boolean) => {
    const current = flipRef.current;
    if (!current) return;
    const settling = { ...current, progress: complete ? 1 : 0, settling: true };
    updateFlip(settling);
    queue(() => {
      if (complete) setActiveIndex((index) => index + current.direction);
      updateFlip(null);
    }, reduced ? 0 : 560);
  };

  const startDrag = (
    direction: FlipDirection,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (!canTurn(direction)) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFlip({
      direction,
      pointerId: event.pointerId,
      progress: 0,
      settling: false,
      startX: event.clientX,
    });
  };

  const dragPage = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = flipRef.current;
    if (!current || current.pointerId !== event.pointerId || current.settling)
      return;
    const width = Math.max(stageRef.current?.getBoundingClientRect().width ?? 700, 1);
    const distance =
      current.direction === 1
        ? current.startX - event.clientX
        : event.clientX - current.startX;
    updateFlip({ ...current, progress: clamp(distance / (width * 0.43), 0, 1) });
  };

  const endDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = flipRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    finishFlip(current.progress >= 0.28);
  };

  const turnPage = (direction: FlipDirection) => {
    if (!canTurn(direction)) return;
    updateFlip({
      direction,
      pointerId: null,
      progress: 0,
      settling: true,
      startX: 0,
    });
    window.requestAnimationFrame(() => {
      const current = flipRef.current;
      if (!current) return;
      updateFlip({ ...current, progress: 1 });
      queue(() => {
        setActiveIndex((index) => index + direction);
        updateFlip(null);
      }, reduced ? 0 : 560);
    });
  };

  const book = books[activeIndex];
  const targetBook = flip ? books[activeIndex + flip.direction] : null;
  const flipStyle = {
    "--page-turn": flip?.progress ?? 0,
    "--page-turn-angle": `${
      (flip?.progress ?? 0) * (flip?.direction === -1 ? 180 : -180)
    }deg`,
    "--page-turn-shadow": Math.sin((flip?.progress ?? 0) * Math.PI),
  } as CSSProperties;

  return (
    <>
      <button className="table-book" type="button" onClick={openBook}>
        <span className="table-book__halo" aria-hidden="true" />
        <span className="closed-book" data-theme={books[0].theme}>
          <span className="closed-book__page-edge" aria-hidden="true" />
          <span className="closed-book__spine" aria-hidden="true" />
          <span className="closed-book__cover">
            <img src={books[0].coverImage} alt="" />
            <span aria-hidden="true" />
            <strong>{books[0].title}</strong>
            <small>{books[0].author}</small>
          </span>
        </span>
        <span className="table-book__hint">
          <BookOpenText size={16} aria-hidden="true" />
          A book is waiting
        </span>
        <span className="sr-only">Open the library book experience</span>
      </button>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeBook();
        }}
      >
        <DialogContent
          className="book-viewer-dialog"
          data-phase={phase}
          showCloseButton={false}
          onEscapeKeyDown={(event) => {
            event.preventDefault();
            closeBook();
          }}
          onPointerDownOutside={(event) => event.preventDefault()}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") turnPage(-1);
            if (event.key === "ArrowRight") turnPage(1);
          }}
        >
          <DialogTitle className="sr-only">The Library book collection</DialogTitle>
          <DialogDescription className="sr-only">
            Turn each physical page to discover a different book.
          </DialogDescription>

          <div className="book-viewer__atmosphere" aria-hidden="true" />
          <div className="book-viewer__topbar">
            <span>THE LIBRARY · PERSONAL SHELF</span>
            <button type="button" onClick={closeBook} aria-label="Back to the Library">
              <span>Back to Library</span>
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="book-stage" ref={stageRef}>
            <div className="open-book" data-theme={book.theme}>
              <span className="book-board book-board--left" aria-hidden="true" />
              <span className="book-board book-board--right" aria-hidden="true" />
              <span className="book-page-stack" aria-hidden="true" />
              <div className="book-page book-page--left">
                <LiteraryPage book={book} />
              </div>
              <div className="book-page book-page--right">
                <VisualPage book={book} />
              </div>
              <span className="book-gutter" aria-hidden="true" />

              {flip && targetBook && (
                <div
                  className={`turning-sheet ${
                    flip.direction === 1
                      ? "turning-sheet--next"
                      : "turning-sheet--previous"
                  } ${flip.settling ? "is-settling" : ""}`}
                  style={flipStyle}
                  aria-hidden="true"
                >
                  <div className="turning-sheet__face turning-sheet__front">
                    {flip.direction === 1 ? (
                      <VisualPage book={book} compact />
                    ) : (
                      <LiteraryPage book={book} compact />
                    )}
                  </div>
                  <div className="turning-sheet__face turning-sheet__back">
                    {flip.direction === 1 ? (
                      <LiteraryPage book={targetBook} compact />
                    ) : (
                      <VisualPage book={targetBook} compact />
                    )}
                  </div>
                </div>
              )}

              <button
                className="page-corner page-corner--previous"
                type="button"
                disabled={
                  activeIndex === 0 ||
                  phase !== "open" ||
                  (!!flip && flip.direction !== -1)
                }
                aria-label="Drag the left page corner for the previous book"
                onPointerDown={(event) => startDrag(-1, event)}
                onPointerMove={dragPage}
                onPointerUp={endDrag}
                onPointerCancel={() => finishFlip(false)}
              >
                <span aria-hidden="true" />
              </button>
              <button
                className="page-corner page-corner--next"
                type="button"
                disabled={
                  activeIndex === books.length - 1 ||
                  phase !== "open" ||
                  (!!flip && flip.direction !== 1)
                }
                aria-label="Drag the right page corner for the next book"
                onPointerDown={(event) => startDrag(1, event)}
                onPointerMove={dragPage}
                onPointerUp={endDrag}
                onPointerCancel={() => finishFlip(false)}
              >
                <span aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="book-viewer__controls">
            <button
              type="button"
              onClick={() => turnPage(-1)}
              disabled={activeIndex === 0 || phase !== "open" || !!flip}
              aria-label="Previous book"
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
            <div aria-live="polite">
              <span>
                {activeIndex + 1} / {books.length} books
              </span>
              <small>Drag a page corner to continue</small>
            </div>
            <button
              type="button"
              onClick={() => turnPage(1)}
              disabled={
                activeIndex === books.length - 1 || phase !== "open" || !!flip
              }
              aria-label="Next book"
            >
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
