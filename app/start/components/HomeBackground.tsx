"use client";

// Small, faded images scattered at random spots across the otherwise-white
// homepage background, each drifting slowly and out of sync. Purely decorative:
// sits behind everything and never intercepts clicks. The image URLs come from
// data/bgImages (paste your own there).

import { useMemo } from "react";
import { BG_IMAGE_URLS } from "../data/bgImages";

// Deterministic pseudo-random in [0,1) from a seed. Using this instead of
// Math.random() keeps the server and client renders identical (no hydration
// mismatch) while still looking scattered.
const rand = (seed: number) => {
  const x = Math.sin(seed * 99.13) * 10000;
  return x - Math.floor(x);
};

export default function HomeBackground() {
  const items = useMemo(
    () =>
      BG_IMAGE_URLS.map((url, i) => {
        const n = i + 1;
        return {
          url,
          left: `${Math.round(rand(n) * 84)}%`,
          top: `${Math.round(rand(n * 2.2) * 80)}%`,
          size: Math.round(64 + rand(n * 3.7) * 72), // 64–136px → small
          duration: `${Math.round(18 + rand(n * 4.5) * 16)}s`, // 18–34s → slow
          delay: `${-Math.round(rand(n * 5.1) * 20)}s`, // desync the drift
        };
      }),
    []
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((it, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- decorative, remote, hand-sized
        <img
          key={i}
          src={it.url}
          alt=""
          loading="lazy"
          // Helps some Google-hosted images load when hotlinked.
          referrerPolicy="no-referrer"
          // Hide a broken/blocked URL instead of showing a broken-image icon.
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          className="animate-bg-drift absolute rounded-2xl object-cover opacity-20 blur-[1px]"
          style={{
            left: it.left,
            top: it.top,
            width: it.size,
            height: it.size,
            animationDuration: it.duration,
            animationDelay: it.delay,
          }}
        />
      ))}
    </div>
  );
}
