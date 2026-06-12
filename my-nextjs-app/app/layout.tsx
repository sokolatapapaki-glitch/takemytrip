import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "./context/AppContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProvider>
          <Navbar />
          <main className="flex flex-1 flex-col">{children}</main>
          <TakeTheKids />
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
