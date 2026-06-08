// -----------------------------------------------------------------------------
// Named button styles — single source of truth
// -----------------------------------------------------------------------------
// The four reusable button looks for this project. Import the class string you
// need (e.g. `buttonStyles.common`) instead of re-typing Tailwind classes, so
// every "common button" / "secondary button" / … stays identical and is
// tweakable from one place.
//
//   underline  — text only, animated left→right orange underline on hover
//   secondary  — green→emerald gradient, white text, rounded-xl
//   common     — black text, gray bg only on hover, rounded-xl
//   primary    — the homepage CTA: coral→pink gradient (from palette.homeStyles)
//
// Tailwind v4 scans this file, so the literal class names below are compiled
// even though they're consumed via an import. Only the *look* lives here;
// layout/animation that varies per use (width, icon gap, shrink, self-start)
// stays in the component and is appended at the call site, e.g.:
//
//   <button className={`inline-flex items-center gap-1.5 ${buttonStyles.common}`}>
//
// Keep this file and CLAUDE.md's "Button styles (named)" section in sync.

import { homeStyles } from "@/app/start/data/palette";

export const buttonStyles = {
  // underline button — no background or padding box; orange text with an
  // underline that scales in from the left on hover.
  underline:
    "relative text-sm font-medium text-emerald-600 after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-emerald-500 after:transition-transform after:duration-300 after:ease-out after:content-[''] hover:after:scale-x-100",

  // secondary button — a green→emerald gradient pill.
  secondary:
    "rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-green-900/10 transition-[background,box-shadow] hover:from-emerald-500 hover:to-emerald-600",

  // common button — quiet: black text, no resting bg, light gray bg on hover.
  common:
    "rounded-xl px-3 py-1.5 text-sm font-medium text-black transition-colors bg-gray-50 hover:bg-gray-100",

  // primary button — the homepage CTA. The brand gradient comes from
  // palette.homeStyles (defined in exactly one place); the rounded-xl box is
  // added here. A leading icon is optional content, not part of the style.
  primary: `rounded-xl px-6 py-3 font-medium ${homeStyles.primaryButton}`,
} as const;
