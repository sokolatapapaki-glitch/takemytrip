// -----------------------------------------------------------------------------
// Hover-reveal scrollbar — single source of truth
// -----------------------------------------------------------------------------
// A thin, simple gray scrollbar whose thumb only shows while you hover the
// scroll container (the track stays transparent). Works in Firefox via the
// `scrollbar-*` properties and in WebKit/Chromium via `::-webkit-scrollbar`.
// Apply alongside any `overflow-auto` / `overflow-x-auto` / `overflow-y-auto`.
//
// Tailwind v4 scans this file, so the literal class tokens below are compiled
// even though they're consumed via an import.
export const hoverScrollbar =
  // Firefox: thin width; thumb transparent until hover, then zinc-300.
  "[scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:#d4d4d8_transparent] " +
  // WebKit: thin bar, transparent track, rounded thumb hidden until hover.
  "[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 " +
  "[&::-webkit-scrollbar-track]:bg-transparent " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent " +
  "hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300";
