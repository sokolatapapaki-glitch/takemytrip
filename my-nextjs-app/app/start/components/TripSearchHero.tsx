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
  // Background blur grows a little as you scroll down (capped so it stays subtle).
  const [scrollBlur, setScrollBlur] = useState(0);
  // Parallax: how far (px) the background has drifted up — a fraction of scroll.
  const [parallax, setParallax] = useState(0);

  useEffect(() => {
    if (window.__ttkHomeEntrancePlayed) return;
    window.__ttkHomeEntrancePlayed = true;
    setPlayEntranceAnimations(true);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      // ~6px max blur, reached after ~400px of scroll.
      setScrollBlur(Math.min(6, y / 70));
      // Background moves up at 50% of scroll speed → 100px scrolled moves it 50px.
      setParallax(y * 0.3);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    // No z-index on the section/content below: a positive z here would create a
    // stacking context that traps the field dropdowns beneath the z-30 Take-the-
    // Kids / Footer sections. Without it, each dropdown's own z-[100] reaches the
    // page's top stacking level and opens in front of everything.
    <section className="relative flex min-h-screen flex-1 flex-col items-center justify-center bg-zinc-950 px-4 py-24">
      {/* Fixed background layer: the image scrolls slower than the page (parallax)
          and picks up a little blur the further down you go. The image is taller
          than the viewport so the upward drift never reveals an edge. */}
      <div
        className="fixed inset-0 z-0 overflow-hidden will-change-[filter]"
        style={{ filter: `blur(${scrollBlur}px)` }}
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative remote background */}
        <img
          src={heroImage}
          alt=""
          referrerPolicy="no-referrer"
          className="absolute left-0 top-0 h-[140%] w-full object-cover will-change-transform"
          style={{ transform: `translate3d(0, ${-parallax}px, 0) scale(1.05)` }}
        />
        {/* Light scrim only — keeps the night Duomo photo clearly visible while
            giving the text enough contrast to read. */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="relative w-full max-w-3xl">
        {/* Soft light-gray panel behind the title + inputs + button. Absolute so
            it sits behind the content; `relative` (no z-index) on the wrapper
            below keeps it above the panel without trapping the field dropdowns. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-6 -inset-y-6 hidden rounded-2xl bg-gray-200/30 backdrop-blur-sm sm:block"
        />

        <div className="relative">
          <header className="mb-8 text-center">
            {/* Title is intentionally static (no entrance animation) — only the
              search inputs animate in. */}
            <h1 className="text-3xl font-semibold tracking-tight text-white drop-shadow-lg sm:text-4xl">
              Where to next?
            </h1>
            <p
              className={`${playEntranceAnimations ? "animate-pop-in" : ""} mt-2 text-zinc-100 drop-shadow`}
              style={{ animationDelay: "60ms" }}
            >
              Pick a destination, your dates, and who&apos;s coming along.
            </p>
          </header>

          <StartTripSearch playEntranceAnimations={playEntranceAnimations} />
        </div>
      </div>
    </section>
  );
}
