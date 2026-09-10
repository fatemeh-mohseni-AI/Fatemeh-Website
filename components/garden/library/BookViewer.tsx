"use client";

import { books } from "@/lib/garden/books";

export function BookViewer({ index = 0, onClose }: { index?: number; onClose: () => void }) {
  const book = books[index];

  return (
    <section className="book-viewer" aria-label="Opened book">
      <button type="button" onClick={onClose} className="book-close">
        Back to Library
      </button>
      <div className="book-spread">
        <article className="book-left-page">
          <p className="eyebrow">{book.category}</p>
          <h2>{book.title}</h2>
          <h3>{book.author}</h3>
          <p>{book.description}</p>
          {book.quotes.map((quote) => (
            <blockquote key={quote}>{quote}</blockquote>
          ))}
          {book.personalNote && <p>{book.personalNote}</p>}
        </article>
        <aside className="book-right-page">
          <img src={book.coverImage} alt={`${book.title} cover`} />
        </aside>
      </div>
    </section>
  );
}
