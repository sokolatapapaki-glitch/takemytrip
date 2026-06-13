"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { buttonStyles } from "./ui/buttonStyles";

// Take The Kids — a call-to-action banner rendered above the footer on every
// page (see app/layout.tsx). The card matches the site's glass-card look
// (rounded-3xl, white/80, soft orange shadow) and lifts on hover: it pops up,
// the shadow deepens, and the border warms to orange (the "intense color").
//
// On the HOMEPAGE it joins the hero's vertical-carousel scroll effect: while the
// search recedes "up and behind", this card rises from below — starting lower,
// smaller and faded, growing to full size as it scrolls into view.
//
// Copy is placeholder — edit the title/description freely.
export default function TakeTheKids() {
  const pathname = usePathname();
  // The carousel rise plays only on the homepage hero (`/`, `/start`).
  const isHome = pathname === "/" || pathname === "/start";
  // Measured on the OUTER section (which is never transformed) so the
  // progress→transform→position loop can't feed back into itself; the rise
  // styles are written to the INNER wrapper.
  const ref = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  // Scroll-driven rise, written straight to the DOM from a rAF loop — no React
  // state (state-per-scroll re-rendered every tick and made the motion step
  // between frames). The loop eases toward the target (lerp), so even coarse
  // mouse-wheel steps glide smoothly.
  useEffect(() => {
    if (!isHome) return;
    let raf = 0;
    let current = 0;
    let target = 0;

    const measure = () => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const vh = window.innerHeight;
      // Starts when the card's top enters the viewport bottom; done after it
      // has climbed ~55% of the screen.
      target = Math.min(1, Math.max(0, (vh - rect.top) / (vh * 0.55)));
    };

    const apply = () => {
      const el = innerRef.current;
      if (!el) return;
      if (current > 0.999) {
        // Arrived — drop the styles entirely (no lingering transform).
        el.style.transform = "";
        el.style.opacity = "";
        el.style.willChange = "";
      } else {
        el.style.transform = `translateY(${(1 - current) * 90}px) scale(${0.82 + current * 0.18})`;
        el.style.opacity = String(0.4 + current * 0.6);
        el.style.willChange = "transform";
      }
    };

    const tick = () => {
      current += (target - current) * 0.18;
      if (Math.abs(target - current) < 0.002) {
        current = target;
        apply();
        raf = 0;
        return; // settled — wait for the next scroll
      }
      apply();
      raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      measure();
      if (!raf) raf = requestAnimationFrame(tick);
    };

    measure();
    current = target; // no entrance lerp on load — start where the scroll says
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isHome]);

  // The map page is a full-viewport experience — no banner there.
  if (pathname === "/map") return null;
  return (
    <section ref={ref} className="relative z-30 px-4 py-10 sm:px-6">
      {/* The rise lives on this wrapper (not the <a>) so the card's own hover
          lift transform keeps working. Styled directly via innerRef from the
          rAF loop above; the inline style below is just the first-paint state
          on the homepage (fully "below and behind") before the loop takes over.
          Once arrived, the styles are dropped entirely. */}
      <div
        ref={innerRef}
        style={
          isHome
            ? {
              transform: "translateY(90px) scale(0.82)",
              opacity: 0.4,
              willChange: "transform",
            }
            : undefined
        }
      >
        <a
          href="https://www.takethekids.info"
          target="_blank"
          rel="noreferrer noopener"
          className="group relative isolate mx-auto flex max-w-5xl flex-col items-center gap-4 overflow-hidden rounded-3xl border border-white/60 bg-white px-6 py-10 text-center shadow-lg shadow-orange-900/5 transition duration-200 ease-out hover:-translate-y-1 hover:border-orange-300/70 hover:shadow-2xl hover:shadow-orange-900/15 dark:border-white/[.08] dark:bg-zinc-900"
        >
          {/* Decorative hover accents — invisible until hovered, then they fade/
            drift in behind the text (same family as the City/Activity cards):
            concentric rings rising from each bottom corner, a tilted dash near
            the title, and a small trail of dots down each side. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-20 -z-10 h-56 w-56 scale-75 rounded-full border-2 border-orange-500/20 opacity-0 transition-all duration-300 ease-out group-hover:scale-100 group-hover:opacity-100"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-12 -z-10 h-36 w-36 scale-75 rounded-full border-2 border-green-500/20 opacity-0 transition-all delay-75 duration-300 ease-out group-hover:scale-100 group-hover:opacity-100"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -right-20 -z-10 h-56 w-56 scale-75 rounded-full border-2 border-green-500/20 opacity-0 transition-all delay-75 duration-300 ease-out group-hover:scale-100 group-hover:opacity-100"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -right-12 -z-10 h-36 w-36 scale-75 rounded-full border-2 border-orange-500/20 opacity-0 transition-all delay-100 duration-300 ease-out group-hover:scale-100 group-hover:opacity-100"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-10 top-8 -z-10 h-0.5 w-16 -rotate-[14deg] translate-y-1 rounded-full bg-orange-500/15 opacity-0 transition-all delay-100 duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute right-10 top-8 -z-10 h-0.5 w-16 rotate-[14deg] translate-y-1 rounded-full bg-emerald-500/15 opacity-0 transition-all delay-100 duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-16 top-1/2 -z-10 h-2 w-2 scale-0 rounded-full bg-green-500/20 opacity-0 transition-all delay-150 duration-300 ease-out group-hover:scale-100 group-hover:opacity-100"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute right-16 top-1/2 -z-10 h-2 w-2 scale-0 rounded-full bg-orange-500/20 opacity-0 transition-all delay-150 duration-300 ease-out group-hover:scale-100 group-hover:opacity-100"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-24 top-2/3 -z-10 h-1.5 w-1.5 scale-0 rounded-full bg-orange-500/20 opacity-0 transition-all delay-200 duration-300 ease-out group-hover:scale-100 group-hover:opacity-100"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute right-24 top-2/3 -z-10 h-1.5 w-1.5 scale-0 rounded-full bg-emerald-500/20 opacity-0 transition-all delay-200 duration-300 ease-out group-hover:scale-100 group-hover:opacity-100"
          />

          <h2 className="text-3xl font-semibold text-zinc-800 dark:text-zinc-100">
            Take the kids
          </h2>

          <p className="max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
            Μάθε περισσότερα για τα οικογενειακά ταξίδια που οργανώνουμε!
          </p>

          {/* The button pops up on its own hover (separate from the card lift). */}
          <span className={`mt-2 inline-flex ${buttonStyles.primary} hover:-translate-y-1 hover:scale-105`}>
            Δες τη σελίδα μας
          </span>
        </a>
      </div>
    </section>
  );
}
