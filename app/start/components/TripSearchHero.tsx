"use client";

// The trip-search landing hero (homepage `/`, also at `/start`).
//
// Background: one static full-bleed photo (`/homepage-hero.png`) with a light
// dark overlay. The image NEVER moves or scales on scroll (that drift used to
// leak horizontal overflow on mobile) — the only scroll effect is BLUR: a
// permanently-blurred copy sitting on top fades in via opacity as you scroll
// down (opacity-only → compositor-cheap, no transform → no x-overflow). The
// fixed layer is pinned to both edges and clips its own contents, so it can
// never widen the page.

import StartTripSearch from "./StartTripSearch";
import { useEffect, useRef, useState } from "react";

const HERO_IMAGE = "/homepage-hero.png";

declare global {
  interface Window {
    __ttkHomeEntrancePlayed?: boolean;
  }
}

export default function TripSearchHero() {
  // Decide ONCE, synchronously at mount, whether to play the entrance — so the
  // inputs render in their pre-pop (hidden) state on the very first paint and
  // animate in, instead of flashing fully-visible for a frame and THEN popping.
  // First load (flag unset, or SSR) animates; returning here later in the same
  // session (flag already set) shows them instantly with no animation.
  const [playEntranceAnimations] = useState(
    () => typeof window === "undefined" || !window.__ttkHomeEntrancePlayed
  );

  // Scroll-driven styling (the carousel card drift + the background blur fade) is
  // written straight to the DOM from one rAF loop — NO React state — and eased
  // toward its target so coarse wheel steps glide smoothly. The background image
  // POSITION/SCALE is never touched (only the blurred copy's opacity), so nothing
  // here can move the image or add horizontal overflow.
  const carouselRef = useRef<HTMLDivElement>(null);
  const bgBlurImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    window.__ttkHomeEntrancePlayed = true;
  }, []);

  useEffect(() => {
    let raf = 0;
    let current = window.scrollY; // the smoothed scroll position
    let target = window.scrollY;

    // Reduced-motion users get a fully static background (no blur fade either).
    const enableBlur = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const apply = () => {
      // Background blur: the permanently-blurred copy fades in over ~400px of
      // scroll (opacity only — no filter animation, no transform), so the photo
      // "picks up blur" as you scroll down. Position/scale are never touched.
      if (bgBlurImgRef.current) {
        bgBlurImgRef.current.style.opacity = enableBlur
          ? String(Math.min(1, current / 400))
          : "0";
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
    // `overflow-x-clip` (NOT hidden) gives the hero its own horizontal clip so
    // the scroll size-change effect, the entrance pop overshoot, and the blurred
    // decorative glow can bleed sideways WITHOUT ever widening the page / adding
    // mobile horizontal scroll. `clip` leaves vertical overflow visible, so the
    // field dropdowns (which open downward) are unaffected.
    <section className="relative flex min-h-screen flex-1 flex-col items-center justify-center overflow-x-clip bg-zinc-950 px-4 py-24">
      {/* Fixed background layer: ONE static photo (never moves or scales) plus a
          permanently-blurred copy that fades in on scroll. The container is
          pinned to BOTH horizontal edges and clips its own contents, and the
          images use no transform / scale (scale 1, `object-cover`), so nothing
          here can bleed sideways or add mobile horizontal overflow. */}
      <div className="fixed inset-x-0 top-0 h-[100lvh] z-0 overflow-hidden max-w-full" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative local background */}
        <img
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        {/* Permanently-blurred copy of the same photo — sits on top at opacity 0
            and fades in as you scroll (driven by the rAF loop above). Opacity
            only, never transform. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- blurred copy of the same background */}
        <img
          ref={bgBlurImgRef}
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top opacity-0 blur-md will-change-[opacity]"
        />
        {/* A little dark overlay so the white search card and text read clearly. */}
        <div className="absolute inset-0 bg-black/35" />
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
              Διάλεξε προορισμό, διάρκεια και Θα οργανώσουμε το ιδανικό πλάνο ταξιδιού!
            </p>
          </header>

          <StartTripSearch playEntranceAnimations={playEntranceAnimations} />
        </div>
      </div>
    </section>
  );
}
