export type CinemaTitle = {
  id: string;
  title: string;
  type: "Film" | "Series";
  year: number;
  image: string;
  imageAlt: string;
  imdbRating: number;
  imdbUrl: string;
};

export type CinemaRecommendation = CinemaTitle & {
  quote: string;
  speaker: string;
  favorite?: boolean;
};

export const cinemaRecommendations: CinemaRecommendation[] = [
  {
    id: "breaking-bad",
    title: "Breaking Bad",
    type: "Series",
    year: 2008,
    image: "/images/cinema-titles/breaking-bad.jpg",
    imageAlt: "Walter White standing in the New Mexico desert",
    quote: "I am the one who knocks.",
    speaker: "Walter White",
    imdbRating: 9.5,
    imdbUrl: "https://www.imdb.com/title/tt0903747/",
  },
  {
    id: "peaky-blinders",
    title: "Peaky Blinders",
    type: "Series",
    year: 2013,
    image: "/images/cinema-titles/peaky-blinders.jpg",
    imageAlt: "Thomas Shelby beneath the station clock",
    quote: "By order of the Peaky Blinders.",
    speaker: "Thomas Shelby",
    imdbRating: 8.7,
    imdbUrl: "https://www.imdb.com/title/tt2442560/",
  },
  {
    id: "better-call-saul",
    title: "Better Call Saul",
    type: "Series",
    year: 2015,
    image: "/images/cinema-titles/better-call-saul.jpg",
    imageAlt: "Jimmy McGill beside his yellow car",
    quote: "S’all good, man.",
    speaker: "Jimmy McGill",
    imdbRating: 9.0,
    imdbUrl: "https://www.imdb.com/title/tt3032476/",
    favorite: true,
  },
  {
    id: "pirates-caribbean",
    title: "Pirates of the Caribbean",
    type: "Film",
    year: 2003,
    image: "/images/cinema-titles/pirates.jpg",
    imageAlt: "Captain Jack Sparrow in The Curse of the Black Pearl",
    quote: "Not all treasure is silver and gold, mate.",
    speaker: "Jack Sparrow",
    imdbRating: 8.1,
    imdbUrl: "https://www.imdb.com/title/tt0325980/",
  },
  {
    id: "prison-break",
    title: "Prison Break",
    type: "Series",
    year: 2005,
    image: "/images/cinema-titles/prison-break.jpg",
    imageAlt: "Michael Scofield looking through the bars of his cell",
    quote: "I’m getting you out of here.",
    speaker: "Michael Scofield",
    imdbRating: 8.3,
    imdbUrl: "https://www.imdb.com/title/tt0455275/",
  },
  {
    id: "pride-prejudice",
    title: "Pride & Prejudice",
    type: "Film",
    year: 2005,
    image: "/images/cinema-titles/pride-prejudice.jpg",
    imageAlt: "Mr Darcy walking through a misty field",
    quote: "You have bewitched me, body and soul.",
    speaker: "Mr Darcy",
    imdbRating: 7.8,
    imdbUrl: "https://www.imdb.com/title/tt0414387/",
  },
];

export const cinemaWatchlist: CinemaTitle[] = [
  {
    id: "sherlock",
    title: "Sherlock",
    type: "Series",
    year: 2010,
    image: "/images/cinema-titles/sherlock.jpg",
    imageAlt: "Sherlock Holmes and John Watson outside 221B Baker Street",
    imdbRating: 9.0,
    imdbUrl: "https://www.imdb.com/title/tt1475582/",
  },
  {
    id: "silo",
    title: "Silo",
    type: "Series",
    year: 2023,
    image: "/images/cinema-titles/silo.jpg",
    imageAlt: "Juliette Nichols inside the Silo",
    imdbRating: 8.2,
    imdbUrl: "https://www.imdb.com/title/tt14688458/",
  },
  {
    id: "reacher",
    title: "Reacher",
    type: "Series",
    year: 2022,
    image: "/images/cinema-titles/reacher.jpg",
    imageAlt: "Jack Reacher in a diner",
    imdbRating: 8.0,
    imdbUrl: "https://www.imdb.com/title/tt9288030/",
  },
];

export const imdbRatingCheckedAt = "September 2026";
