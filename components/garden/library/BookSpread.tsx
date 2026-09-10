import type { Book } from "@/lib/garden/books";

export function BookSpread({ book }: { book: Book }) {
  return (
    <div className="book-spread-content">
      <div>
        <h2>{book.title}</h2>
        <p>{book.author}</p>
        <p>{book.description}</p>
      </div>
      <img src={book.coverImage} alt={book.title} />
    </div>
  );
}
