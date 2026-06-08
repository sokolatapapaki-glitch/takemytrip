"use client";

// The trip-search landing hero (homepage `/`, also at `/start`).
//
// Background: one full-bleed image behind the trip search.

import StartTripSearch from "./StartTripSearch";
import { BG_IMAGE_URLS } from "../data/bgImages";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    __ttkHomeEntrancePlayed?: boolean;
  }
}

export default function TripSearchHero() {
  const heroImage = BG_IMAGE_URLS[0];
  const [playEntranceAnimations, setPlayEntranceAnimations] = useState(false);

  useEffect(() => {
    if (window.__ttkHomeEntrancePlayed) return;
    window.__ttkHomeEntrancePlayed = true;
    setPlayEntranceAnimations(true);
  }, []);

  return (
    <section className="relative z-20 flex flex-1 flex-col items-center justify-center bg-zinc-950 px-4 py-24">
      {/* One background image fills the whole hero area. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative remote background */}
      <img
        src={heroImage}
        alt=""
        aria-hidden
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px]" />

      <div className="relative z-10 w-full max-w-3xl">
        <header className="mb-8 text-center">
          {/* Title is intentionally static (no entrance animation) — only the
              search inputs animate in. */}
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-800 sm:text-4xl">
            Where to next?
          </h1>
          <p
            className={`${playEntranceAnimations ? "animate-pop-in" : ""} mt-2 text-zinc-500`}
            style={{ animationDelay: "60ms" }}
          >
            Pick a destination, your dates, and who&apos;s coming along.
          </p>
        </header>

        <StartTripSearch playEntranceAnimations={playEntranceAnimations} />
      </div>
    </section>
  );
}
