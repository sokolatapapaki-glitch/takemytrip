import type { Metadata } from "next";
import StartTripSearch from "./components/StartTripSearch";

export const metadata: Metadata = {
  title: "Plan a trip",
};

// Standalone trip-search homepage: a destination / dates / travelers search bar
// over a soft white–orange–green glassmorphism backdrop. Not wired to the rest
// of the app.
export default function StartPage() {
  return (
    <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 via-white to-emerald-50 px-4 py-24">
      {/* Soft colour blobs give the glass surfaces something to blur over. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-12 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl"
      />

      <div className="relative z-10 w-full max-w-3xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-800 sm:text-4xl">
            Where to next?
          </h1>
          <p className="mt-2 text-zinc-500">
            Pick a destination, your dates, and who&apos;s coming along.
          </p>
        </header>

        <StartTripSearch />
      </div>
    </section>
  );
}
