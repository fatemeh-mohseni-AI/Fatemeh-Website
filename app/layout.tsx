import type { Metadata } from "next";
import { GlobalGardenNav } from "@/components/garden/global-garden-nav";
import "./globals.css";
import "./cinema-transition.css";
import "./library-book.css";
import "./courtyard-travel.css";
import "./anonymous-letters.css";

export const metadata: Metadata = {
  title: "Fatemeh Mohseni — A Little World of My Own",
  description:
    "Step into Fatemeh’s Persian digital garden. A place for stories, faraway places, art, and curious experiments.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <GlobalGardenNav />
      </body>
    </html>
  );
}
