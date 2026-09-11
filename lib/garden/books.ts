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
    coverImage: "/images/books/before-the-coffee-gets-cold.jpg",
    coverAlt: "Published cover of Before the Coffee Gets Cold",
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
    coverImage: "/images/books/the-little-prince.jpg",
    coverAlt: "Published cover of The Little Prince",
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
    coverImage: "/images/books/sapiens.jpg",
    coverAlt: "Published cover of Sapiens",
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
    coverImage: "/images/books/mans-search-for-meaning.jpg",
    coverAlt: "Published cover of Man’s Search for Meaning",
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
    coverImage: "/images/books/norwegian-wood.jpg",
    coverAlt: "Published cover of Norwegian Wood",
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
    coverImage: "/images/books/the-alchemist.jpg",
    coverAlt: "Published cover of The Alchemist",
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
  {
    id: "the-prince-and-the-pauper",
    title: "The Prince and the Pauper",
    author: "Mark Twain",
    coverImage: "/images/books/the-prince-and-the-pauper.jpg",
    coverAlt: "Penguin Classics cover of The Prince and the Pauper",
    description: "Two boys exchange clothes and discover how differently the same face is treated on either side of wealth and power in Tudor England.",
    quotes: [],
    personalNote: "A reading prompt: how much of our identity belongs to us, and how much is assigned by the clothes and circumstances others see?",
    category: "Identity & inequality",
    theme: "saffron",
  },
  {
    id: "the-master-and-margarita",
    title: "The Master and Margarita",
    author: "Mikhail Bulgakov",
    coverImage: "/images/books/the-master-and-margarita.jpg",
    coverAlt: "Penguin Classics Deluxe cover of The Master and Margarita",
    description: "A mysterious visitor unsettles Moscow while a writer and Margarita struggle for love and artistic freedom in a story where satire and the impossible meet.",
    quotes: [],
    personalNote: "A reading prompt: what survives when art is silenced? Notice how tenderness and absurdity share the same space.",
    category: "Art, love & the uncanny",
    theme: "indigo",
  },
  {
    id: "one-hundred-years-of-solitude",
    title: "One Hundred Years of Solitude",
    author: "Gabriel García Márquez",
    coverImage: "/images/books/one-hundred-years-of-solitude.jpg",
    coverAlt: "Penguin Modern Classics cover of One Hundred Years of Solitude",
    description: "Across generations of the Buendía family, the town of Macondo grows into a world of recurring names, extraordinary events, memory and solitude.",
    quotes: [],
    personalNote: "A reading prompt: follow what repeats across generations, and ask whether remembering the past is enough to escape it.",
    category: "Memory, family & magical realism",
    theme: "forest",
  },
];
