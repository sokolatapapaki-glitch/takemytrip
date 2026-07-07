import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "./context/AppContext";
import Navbar from "./components/Navbar";
import ConditionalFooter from "./components/ConditionalFooter";
import TakeTheKids from "./components/TakeTheKids";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Take My Trip",
  description: "Οργάνωσε το επόμενο οικογενειακό σου ταξίδι.",
  // Same browser-tab icon as the takemytrip site (referenced by URL, as it is
  // there) instead of the default Next.js favicon.
  icons: {
    icon: "https://cdn-icons-png.flaticon.com/512/2983/2983787.png",
    apple: "https://cdn-icons-png.flaticon.com/512/2983/2983787.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The app's content is Greek. `lang="el"` is what makes browsers apply the
  // Greek casing rule to `text-transform: uppercase` — i.e. DROP the tonos on
  // all-caps words (ΒΑΡΚΕΛΩΝΗ, not ΒΑΡΚΕΛΏΝΗ), the correct monotonic typography.
  // This one attribute fixes every uppercased place name across the whole UI.
  return (
    <html
      lang="el"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProvider>
          <Navbar />
          <main className="flex flex-1 flex-col">{children}</main>
          <TakeTheKids />
          <ConditionalFooter />
        </AppProvider>
      </body>
    </html>
  );
}
