"use client";

// Faded, slowly-drifting background photos of the chosen city's activities (or a
// spread of cities when nothing is picked). Purely decorative — sits behind the
// hero content, never intercepts clicks, and a soft white wash keeps the search
// bar readable on top. See data/heroPhotos for where the images come from.

import { useMemo } from "react";
import { heroPhotoUrls } from "../data/heroPhotos";

// Fixed scatter positions so the photos spread across the hero rather than
// stacking. Up to 5 (matches MAX_HERO_PHOTOS).
const SLOTS = [
  "left-[-6%] top-[4%] h-64 w-64",
  "right-[-5%] top-[12%] h-72 w-72",
  "left-[10%] bottom-[-8%] h-72 w-72",
  "right-[12%] bottom-[2%] h-60 w-60",
  "left-1/2 top-1/3 h-56 w-56 -translate-x-1/2",
];

export default function HeroPhotos({ destId }: { destId: string | null }) {
  // Re-resolve (and so re-fetch) the photo set only when the city changes.
  const urls = useMemo(() => heroPhotoUrls(destId), [destId]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {urls.map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- decorative, remote, no fixed dims
        <img
          // key includes the city so React swaps (re-fades) images on change.
          key={`${destId ?? "all"}-${i}`}
          src={url}
          alt=""
          loading="lazy"
          className={`animate-photo-pan absolute rounded-[2rem] object-cover opacity-20 blur-sm ${SLOTS[i % SLOTS.length]}`}
          // Stagger the drift so they don't move in lockstep.
          style={{ animationDelay: `${i * -7}s` }}
        />
      ))}
      {/* Light wash over the photos so the glass search bar stays legible while
          still letting the bright background gradient show through. */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/35 via-white/10 to-white/35" />
    </div>
  );
}
