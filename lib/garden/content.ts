export type RoomId =
  | "courtyard"
  | "library"
  | "travel"
  | "gallery"
  | "cinema"
  | "lab";
export const rooms: {
  id: RoomId;
  name: string;
  persian: string;
  subtitle: string;
  number: string;
}[] = [
  {
    id: "courtyard",
    name: "The Courtyard",
    persian: "حیاط",
    subtitle: "A place to begin",
    number: "01",
  },
  {
    id: "library",
    name: "The Library",
    persian: "کتابخانه",
    subtitle: "Thoughts, between the lines",
    number: "02",
  },
  {
    id: "travel",
    name: "Travel Observatory",
    persian: "جهان‌نما",
    subtitle: "There is a whole world out there",
    number: "03",
  },
  {
    id: "gallery",
    name: "The Gallery",
    persian: "نگارخانه",
    subtitle: "An eye for the everyday",
    number: "04",
  },
  {
    id: "cinema",
    name: "Cinema & Culture",
    persian: "سینما",
    subtitle: "Other lives, other perspectives",
    number: "05",
  },
  {
    id: "lab",
    name: "The Curiosity Lab",
    persian: "آزمایشگاه",
    subtitle: "Ancient patterns. New possibilities.",
    number: "06",
  },
];
export const discoveries = [
  {
    id: "garden",
    title: "An open door",
    place: "The courtyard",
    text: "Every garden begins with a little curiosity.",
  },
  {
    id: "library",
    title: "Between the lines",
    place: "The library",
    text: "Some ideas need room to grow.",
  },
  {
    id: "travel",
    title: "A wider world",
    place: "The observatory",
    text: "A new perspective is a journey of its own.",
  },
  {
    id: "gallery",
    title: "Learning to look",
    place: "The gallery",
    text: "Beauty often waits in the details.",
  },
  {
    id: "cinema",
    title: "Through another lens",
    place: "The cinema",
    text: "A story can be a place to visit.",
  },
  {
    id: "lab",
    title: "A curious mind",
    place: "The laboratory",
    text: "What happens if we try something different?",
  },
  {
    id: "secret",
    title: "A moment of stillness",
    place: "By the water",
    text: "You do not have to go anywhere to discover something.",
  },
];
