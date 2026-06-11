"use client";

import { usePathname } from "next/navigation";
import { buttonStyles } from "./ui/buttonStyles";

// Take The Kids — a call-to-action banner rendered above the footer on every
// page (see app/layout.tsx). The card matches the site's glass-card look
// (rounded-3xl, white/80, soft orange shadow) and lifts on hover: it pops up,
// the shadow deepens, and the border warms to orange (the "intense color").
//
// Copy is placeholder — edit the title/description freely.
export default function TakeTheKids() {
  const pathname = usePathname();
  // The map page is a full-viewport experience — no banner there.
  if (pathname === "/map") return null;
  return (
    <section className="relative z-30 px-0 py-10 sm:px-6">
      <a
        href="https://www.takethekids.info"
        target="_blank"
        rel="noreferrer noopener"
        className="group mx-auto flex max-w-5xl flex-col items-center gap-4 rounded-none border border-white/60 bg-white/80 px-6 py-10 text-center shadow-lg shadow-orange-900/5 backdrop-blur-md transition duration-200 ease-out hover:-translate-y-1 hover:border-orange-300/70 hover:shadow-2xl hover:shadow-orange-900/15 sm:rounded-3xl dark:border-white/[.08] dark:bg-white/[.04]"
      >
        <h2 className="text-3xl font-semibold text-zinc-800 dark:text-zinc-100">
          Title here
        </h2>

        <p className="max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
          Description here — a short line about planning the perfect day out
          with the kids. Replace this with your real copy.
        </p>

        {/* The button pops up on its own hover (separate from the card lift). */}
        <span className={`mt-2 inline-flex ${buttonStyles.primary} hover:-translate-y-1 hover:scale-105`}>
          Take The Kids
        </span>
      </a>
    </section>
  );
}
