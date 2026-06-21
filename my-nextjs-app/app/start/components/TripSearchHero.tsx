"use client";

// The trip-search landing hero (homepage `/`, also at `/start`).
//
// Background: one full-bleed image behind the trip search.

import StartTripSearch from "./StartTripSearch";
import { BG_IMAGE_URLS } from "../data/bgImages";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    __ttkHomeEntrancePlayed?: boolean;
  }
}

export default function TripSearchHero() {
  const heroImage = BG_IMAGE_URLS[0];
  // Decide ONCE, synchronously at mount, whether to play the entrance — so the
  // inputs render in their pre-pop (hidden) state on the very first paint and
  // animate in, instead of flashing fully-visible for a frame and THEN popping.
  // First load (flag unset, or SSR) animates; returning here later in the same
  // session (flag already set) shows them instantly with no animation.
  const [playEntranceAnimations] = useState(
    () => typeof window === "undefined" || !window.__ttkHomeEntrancePlayed
  );

  // All scroll-driven styling (background blur + parallax, hero carousel) is
  // written straight to the DOM from one rAF loop — NO React state. State-per-
  // scroll re-rendered the whole hero tree on every wheel tick, which made the
  // motion step visibly between frames. The loop also eases the value toward
  // its target (lerp), so even coarse mouse-wheel steps glide smoothly.
  //
  // The scroll blur does NOT animate `filter` (re-blurring the full screen every
  // frame janks badly). Instead a permanently-blurred COPY of the image sits on
  // top and fades in with scroll — opacity + transform animate on the
  // compositor, so every frame is cheap.
  const bgImgRef = useRef<HTMLImageElement>(null);
  const bgBlurImgRef = useRef<HTMLImageElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.__ttkHomeEntrancePlayed = true;
  }, []);

  useEffect(() => {
    let raf = 0;
    let current = window.scrollY; // the smoothed scroll position
    let target = window.scrollY;

    const apply = () => {
      // Background: parallax at 30% scroll speed; the blurred copy fades in
      // over ~400px of scroll (opacity only — no filter animation).
      const bgTransform = `translate3d(0, ${-current * 0.3}px, 0) scale(1.05)`;
      if (bgImgRef.current) {
        bgImgRef.current.style.transform = bgTransform;
      }
      if (bgBlurImgRef.current) {
        bgBlurImgRef.current.style.transform = bgTransform;
        bgBlurImgRef.current.style.opacity = String(Math.min(1, current / 400));
      }
      // Carousel: 0 at top → 1 after ~70% of a viewport. The centered block
      // drifts up faster than the page, shrinks and fades — "up and behind".
      // At rest the styles are REMOVED: a transform here creates a stacking
      // context that would trap the field dropdowns below Take-the-Kids/Footer
      // (see the note on the section below).
      const el = carouselRef.current;
      if (el) {
        // While an input dropdown is open (flagged on <body> by StartTripSearch),
        // keep the search block fully opaque — the dropdowns are its children, so
        // the scroll fade would otherwise dim the open modal too.
        const modalOpen = document.body.dataset.searchModalOpen === "1";
        const p = Math.min(1, Math.max(0, current / (window.innerHeight * 0.7)));
        if (p < 0.001) {
          el.style.transform = "";
          el.style.opacity = "";
          el.style.willChange = "";
        } else {
          el.style.transform = `translateY(${p * -70}px) scale(${1 - p * 0.18})`;
          el.style.opacity = modalOpen ? "1" : String(1 - p * 0.6);
          el.style.willChange = "transform";
        }
      }
    };

    const tick = () => {
      current += (target - current) * 0.18; // ease toward the real scroll
      if (Math.abs(target - current) < 0.5) {
        current = target;
        apply();
        raf = 0;
        return; // settled — stop the loop until the next scroll
      }
      apply();
      raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      target = window.scrollY;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    apply(); // initial paint (handles reload mid-page / scroll restoration)
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    // No z-index on the section/content below: a positive z here would create a
    // stacking context that traps the field dropdowns beneath the z-30 Take-the-
    // Kids / Footer sections. Without it, each dropdown's own z-[100] reaches the
    // page's top stacking level and opens in front of everything.
    <section className="relative flex min-h-screen flex-1 flex-col items-center justify-center bg-zinc-950 px-4 py-24">
      {/* Fixed background layer: the image scrolls slower than the page
          (parallax) and "picks up blur" the further down you go — really a
          permanently-blurred copy fading in on top (animating opacity, not
          filter, keeps every scroll frame on the compositor → fully smooth).
          The images are taller than the viewport so the upward drift never
          reveals an edge. */}
      <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative remote background */}
        <img
          ref={bgImgRef}
          src={heroImage}
          alt=""
          referrerPolicy="no-referrer"
          className="absolute left-0 top-0 h-[140%] w-full object-cover will-change-transform"
          style={{ transform: "translate3d(0, 0, 0) scale(1.05)" }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- blurred copy of the same background */}
        <img
          ref={bgBlurImgRef}
          src={heroImage}
          alt=""
          referrerPolicy="no-referrer"
          className="absolute left-0 top-0 h-[140%] w-full object-cover opacity-0 blur-md will-change-[transform,opacity]"
          style={{ transform: "translate3d(0, 0, 0) scale(1.05)" }}
        />
        {/* Scrim is a vertical gradient, not a flat fill: it stays light across
            the middle so the photo reads at full clarity, and only deepens at the
            very top/bottom edges where the header text and lower content need
            contrast. Keeps the high-res image looking crisp and vivid. */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/40" />
      </div>

      {/* Carousel card: scroll-styled directly via carouselRef (see the rAF loop
          above) — drifts up, shrinks and fades as you scroll. */}
      <div ref={carouselRef} className="relative w-full max-w-3xl lg:max-w-4xl">
        {/* Low-opacity dark panel behind the title + inputs + button — no glassy
            backdrop-blur "glare", just a quiet veil like the dimmed look the
            hero takes while scrolling down. (Skipping backdrop-filter here also
            keeps scroll frames compositor-only.) Absolute so it sits behind the
            content; `relative` (no z-index) on the wrapper below keeps it above
            the panel without trapping the field dropdowns. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-6 -inset-y-6 hidden rounded-2xl bg-black/25 sm:block"
        />

        <div className="relative">
          <header className="mb-8 text-center">
            {/* Title is intentionally static (no entrance animation) — only the
              search inputs animate in. */}
            <h1 className="text-3xl font-semibold tracking-tight text-white drop-shadow-lg sm:text-4xl">
              Οργανώσε το ταξίδι σου
            </h1>
            <p
              className={`${playEntranceAnimations ? "animate-pop-in" : ""} mt-2 text-zinc-100 drop-shadow`}
              style={{ animationDelay: "60ms" }}
            >
              Διάλεξε προορισμό, ημερομηνίες και ποιοι είναι οι ταξιδιώτες.
            </p>
          </header>

          <StartTripSearch playEntranceAnimations={playEntranceAnimations} />
        </div>
      </div>
    </section>
  );
}
