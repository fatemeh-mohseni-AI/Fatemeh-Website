export type Book = {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  description: string;
  quotes: string[];
  category?: string;
  personalNote?: string;
};

export const books: Book[] = [
  {
    id: "before-the-coffee-gets-cold",
    title: "Before the Coffee Gets Cold",
    author: "Toshikazu Kawaguchi",
    coverImage: "/images/books/before-the-coffee-gets-cold.webp",
    description:
      "A quiet story about memory, regret, and the conversations we wish we could have again.",
    quotes: [
      "No matter what choices you make, as long as you don't run away from reality, you can still find happiness.",
      "The past cannot be changed, but the feelings carried from it can be understood.",
    ],
    category: "Fiction",
    personalNote: "A reminder that meaningful moments are often found in the present.",
  },
  {
    id: "the-little-prince",
    title: "The Little Prince",
    author: "Antoine de Saint-Exupéry",
    coverImage: "/images/books/the-little-prince.webp",
    description: "A timeless reflection on friendship, imagination, and seeing beyond appearances.",
    quotes: [],
    category: "Classic",
  },
  {
    id: "sapiens",
    title: "Sapiens",
    author: "Yuval Noah Harari",
    coverImage: "/images/books/sapiens.webp",
    description: "A journey through human history and the ideas that shaped civilizations.",
    quotes: [],
    category: "History",
  },
  {
    id: "mans-search-for-meaning",
    title: "Man's Search for Meaning",
    author: "Viktor E. Frankl",
    coverImage: "/images/books/mans-search-for-meaning.webp",
    description: "A meditation on meaning, resilience, and the human experience.",
    quotes: [],
    category: "Psychology",
  },
  {
    id: "norwegian-wood",
    title: "Norwegian Wood",
    author: "Haruki Murakami",
    coverImage: "/images/books/norwegian-wood.webp",
    description: "A reflective novel about love, loss, and growing up.",
    quotes: [],
    category: "Fiction",
  },
  {
    id: "the-alchemist",
    title: "The Alchemist",
    author: "Paulo Coelho",
    coverImage: "/images/books/the-alchemist.webp",
    description: "A symbolic journey about dreams, purpose, and discovery.",
    quotes: [],
    category: "Fiction",
  },
];
