export type BookTheme =
  | "coffee"
  | "starlight"
  | "earth"
  | "indigo"
  | "forest"
  | "saffron";

export type Book = {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  coverAlt: string;
  coverPosition?: string;
  description: string;
  quotes: string[];
  personalNote: string;
  category?: string;
  theme: BookTheme;
};

export const books: Book[] = [
  {
    id: "before-the-coffee-gets-cold",
    title: "Before the Coffee Gets Cold",
    author: "Toshikazu Kawaguchi",
    coverImage: "/images/library.webp",
    coverAlt: "A sunlit reading table in the Persian library",
    coverPosition: "58% center",
    description:
      "In a quiet Tokyo café, visitors may return to one moment in their past, but only until their coffee grows cold.",
    quotes: [
      "The present doesn’t change.",
      "Drink the coffee before it gets cold.",
    ],
    personalNote:
      "A gentle reminder that closure is not always about changing what happened. Sometimes it is about meeting it with a different heart.",
    category: "Time, memory & tenderness",
    theme: "coffee",
  },
  {
    id: "the-little-prince",
    title: "The Little Prince",
    author: "Antoine de Saint-Exupéry",
    coverImage: "/images/earth.webp",
    coverAlt: "The blue curve of Earth against a field of stars",
    coverPosition: "center",
    description:
      "A small traveler moves between planets, asking the simple questions grown-ups have forgotten how to hear.",
    quotes: [
      "What is essential is invisible to the eye.",
      "You become responsible for what you have tamed.",
    ],
    personalNote:
      "It makes tenderness feel like a form of knowledge, and attention like a promise we make to another life.",
    category: "Wonder & responsibility",
    theme: "starlight",
  },
  {
    id: "sapiens",
    title: "Sapiens",
    author: "Yuval Noah Harari",
    coverImage: "/images/courtyard.webp",
    coverAlt: "A Persian courtyard seen through a wide historic frame",
    coverPosition: "center",
    description:
      "A broad journey through the stories, systems, and shared beliefs that shaped Homo sapiens and the world we built.",
    quotes: ["Culture tends to argue that it forbids only that which is unnatural."],
    personalNote:
      "The scale of the book invites distance: to step outside the habits of the present and see them as one possibility among many.",
    category: "History & human systems",
    theme: "earth",
  },
  {
    id: "mans-search-for-meaning",
    title: "Man’s Search for Meaning",
    author: "Viktor E. Frankl",
    coverImage: "/images/door.webp",
    coverAlt: "A carved wooden doorway opening toward colored glass",
    coverPosition: "center",
    description:
      "Frankl’s account of survival and logotherapy explores how meaning can remain possible even under profound suffering.",
    quotes: ["Those who have a why to live can bear almost any how."],
    personalNote:
      "A difficult, humane book about the small inner freedom that can remain when almost every outer freedom has been taken away.",
    category: "Meaning & resilience",
    theme: "indigo",
  },
  {
    id: "norwegian-wood",
    title: "Norwegian Wood",
    author: "Haruki Murakami",
    coverImage: "/images/cinema/bagh-ferdows.webp",
    coverAlt: "The garden path and historic mansion at Bagh-e Ferdows",
    coverPosition: "center",
    description:
      "A memory of youth, love, grief, and the quiet distances that can grow between people who care for one another.",
    quotes: [
      "If you only read what everyone else is reading, you can only think what everyone else is thinking.",
    ],
    personalNote:
      "Its melancholy is not loud. It lingers like a song remembered from another room, beautiful because it cannot be held still.",
    category: "Memory, love & loss",
    theme: "forest",
  },
  {
    id: "the-alchemist",
    title: "The Alchemist",
    author: "Paulo Coelho",
    coverImage: "/images/earth.webp",
    coverAlt: "A warm view of Earth floating in the dark",
    coverPosition: "45% center",
    description:
      "A shepherd follows a recurring dream across the desert and learns to listen for the language of his own life.",
    quotes: [
      "The simple things are also the most extraordinary things.",
      "There is only one thing that makes a dream impossible: fear of failure.",
    ],
    personalNote:
      "I return to its faith in movement: the idea that a path becomes visible only after we decide to take the first step.",
    category: "Dreams & becoming",
    theme: "saffron",
  },
];
