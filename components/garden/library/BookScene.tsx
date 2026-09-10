"use client";

import { useState } from "react";

export function BookScene({ onOpen }: { onOpen: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      aria-label="Open the library book"
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`library-book-object ${hovered ? "is-hovered" : ""}`}
    >
      <span className="book-cover" />
      <span className="book-pages" />
      <span className="book-spine" />
    </button>
  );
}
