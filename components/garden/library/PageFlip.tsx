"use client";

export function PageFlip({ onFlip }: { onFlip: () => void }) {
  return (
    <button
      type="button"
      aria-label="Turn to next book"
      onClick={onFlip}
      className="page-flip-control"
    >
      Turn page
    </button>
  );
}
