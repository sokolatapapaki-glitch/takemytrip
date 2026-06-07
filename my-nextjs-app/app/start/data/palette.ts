// -----------------------------------------------------------------------------
// Homepage colour palette — single source of truth & reference
// -----------------------------------------------------------------------------
// The trip-search hero used to be a muted mono-orange + pastel scheme; this is
// the brighter, more playful palette that replaced it. Two things live here:
//
//   • PALETTE  — the named colours (hex + the Tailwind class to reach them) with
//                a note on where each is used. Pure reference/documentation.
//   • homeStyles — ready-to-use Tailwind class strings for the hero's surfaces
//                (gradient, blobs, search bar, button…). Components import these
//                so the look stays consistent and tweakable from one place.
//
// Why the class strings live here: Tailwind v4 scans this file, so any literal
// class name written below is compiled even though it's used via an import. To
// add/replace a colour, edit it here and it propagates to every importer.

// --- Named palette (reference) -----------------------------------------------
// `class` is the Tailwind utility that produces the colour at full strength;
// `hex` is that colour's value (Tailwind's default palette) for design tools.
export const PALETTE = {
  // Primary / call-to-action. The coral that anchors the brand.
  coral: { hex: "#f97316", class: "orange-500", use: "primary buttons, selected states" },
  coralDeep: { hex: "#ea580c", class: "orange-600", use: "primary hover" },
  // Secondary — the playful pink the CTA fades into.
  pink: { hex: "#ec4899", class: "pink-500", use: "CTA gradient end, accents" },
  pinkDeep: { hex: "#db2777", class: "pink-600", use: "CTA hover gradient end" },
  // Cool accents — give the warm scheme some pop / contrast.
  sky: { hex: "#38bdf8", class: "sky-400", use: "background blob, cool accent" },
  mint: { hex: "#34d399", class: "emerald-400", use: "'default' tags, success accent" },
  sun: { hex: "#fcd34d", class: "amber-300", use: "warm background wash" },
  grape: { hex: "#a78bfa", class: "violet-400", use: "extra background blob" },
  // Neutrals — text and muted UI.
  ink: { hex: "#27272a", class: "zinc-800", use: "headings, primary text" },
  muted: { hex: "#71717a", class: "zinc-500", use: "secondary text" },
  faint: { hex: "#a1a1aa", class: "zinc-400", use: "placeholders, captions" },
} as const;

// --- Ready-to-use surface styles ---------------------------------------------
// Full Tailwind class strings for the hero. Layout/animation classes stay in the
// components; only the *colour* decisions are centralised here.
export const homeStyles = {
  // The hero background: a bright warm→cool wash (amber → rose → sky).
  heroGradient: "bg-gradient-to-br from-amber-100 via-rose-100 to-sky-100",

  // The drifting soft-colour blobs behind the glass. Brighter and more varied
  // than the old two-tone pair. `orange` and `sky` are the pointer-reactive
  // pair (#10); `grape` is a third, idle-drifting accent blob.
  blobOrange: "bg-orange-300/50",
  blobSky: "bg-sky-300/50",
  blobGrape: "bg-violet-300/45",

  // The glass search bar wrapper: soft warm border, no shadow.
  searchBar: "border border-orange-200/80 bg-white/70",

  // Idle vs. open field surfaces.
  fieldIdle: "bg-white/70 hover:bg-white",
  fieldActive: "bg-white shadow-sm ring-1 ring-orange-300",

  // Primary CTA: a coral→pink gradient that brightens on hover, with a flat
  // grey fallback while disabled (bg-none drops the gradient).
  primaryButton:
    "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-sm shadow-orange-500/30 transition-[background,box-shadow] hover:from-orange-600 hover:to-pink-600",
  primaryButtonDisabled:
    "disabled:cursor-not-allowed disabled:bg-none disabled:bg-zinc-300 disabled:text-white/80 disabled:shadow-none",
} as const;
