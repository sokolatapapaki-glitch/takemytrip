"use client";

// The trip-search landing hero (homepage `/`, also at `/start`).
//
// Background: a plain white page with small, faded images drifting slowly at
// random spots (HomeBackground). Paste your own image URLs in data/bgImages.

import StartTripSearch from "./StartTripSearch";
import HomeBackground from "./HomeBackground";

export default function TripSearchHero() {
  return (
    <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-white px-4 py-24">
      {/* Small faded images scattered across the white background. */}
      <HomeBackground />

      <div className="relative z-10 w-full max-w-3xl">
        <header className="mb-8 text-center">
          {/* Title is intentionally static (no entrance animation) — only the
              search inputs animate in. */}
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-800 sm:text-4xl">
            Where to next?
          </h1>
          <p
            className="animate-pop-in mt-2 text-zinc-500"
            style={{ animationDelay: "60ms" }}
          >
            Pick a destination, your dates, and who&apos;s coming along.
          </p>
        </header>

        <StartTripSearch />
      </div>
    </section>
  );
}
