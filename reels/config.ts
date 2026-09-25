// -----------------------------------------------------------------------------
// Reel renderer configuration
// -----------------------------------------------------------------------------
// Everything that is a knob rather than a per-reel decision. Reel files stay
// about content; this file is about the machine.

import path from "node:path";
import { fileURLToPath } from "node:url";

export const REELS_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(REELS_DIR, "..");
export const OUT_DIR = path.join(REELS_DIR, "out");

/** Step timing defaults, in ms. A reel overrides these per step when it wants. */
export const DEFAULTS = {
  /** Cursor travel time between targets. */
  moveMs: 600,
  /** Frames held after a click so the UI's reaction lands on screen. */
  settleMs: 420,
  /** Frames held after a navigation. */
  gotoSettleMs: 900,
  /** Typing cadence. */
  perCharMs: 70,
  /** Minimum time a caption stays legible. */
  captionHoldMs: 850,
  /** Caption stack transition length. */
  captionTransitionMs: 350,
  /** Click pulse (cursor squash + expanding ring). */
  clickPulseMs: 380,
  /** Smooth-scroll duration when a target is off screen. */
  scrollMs: 360,
  /** How long the clean plan preview stays on screen, static. */
  previewHoldMs: 3000,
  /** How long a `finish` step holds the cleared frame before the outro. */
  finishHoldMs: 900,
} as const;

/** Closing-scene timings, in ms — see Outro in types.ts. */
export const OUTRO_DEFAULTS = {
  slideMs: 700,
  /** One full orbit. Unhurried — a satellite does not dart. */
  flightMs: 5200,
  endHoldMs: 1000,
  /** Headline words start popping this far into the slide. */
  headlineStartMs: 520,
  /** Gap between one word's pop and the next. */
  wordStaggerMs: 150,
  /** One word's pop length. */
  wordPopMs: 320,
  /** Tagline rise-in length, after the last word lands. */
  taglineMs: 420,
} as const;

/** Capture defaults — see CaptureSettings in types.ts for what each means. */
export const CAPTURE_DEFAULTS = {
  cssWidth: 432,
  deviceScaleFactor: 5,
  frameFormat: "jpeg" as const,
  frameQuality: 94,
};

/**
 * Hard ceiling on the camera zoom. Above 2× a 2160-wide capture starts
 * upscaling, which softens the image — see reels/README.md §camera.
 */
export const MAX_ZOOM = 2.0;

/**
 * Exponential smoothing applied to the camera's follow target, per frame.
 * Lower = lazier camera. 0.12 keeps a 2× zoom from jittering on every pixel of
 * cursor movement while still keeping up with a deliberate move.
 */
export const CAMERA_FOLLOW = 0.12;

/**
 * Chromium executable. The image this repo's web sessions run in ships a
 * Chromium at a fixed path that may not match the `playwright` package's
 * expected build, so prefer it when present and fall back to Playwright's own
 * download otherwise.
 */
export const CHROMIUM_PATH = process.env.REEL_CHROMIUM ?? "/opt/pw-browsers/chromium";

/** Port the reel server listens on. */
export const SERVER_PORT = Number(process.env.REEL_PORT ?? 4310);
export const SERVER_ORIGIN = `http://127.0.0.1:${SERVER_PORT}`;

/**
 * The wall-clock instant every reel starts at. The app shows real dates ("21
 * ΣΕΠ"), so without pinning the clock the same reel renders differently every
 * day. Any future Monday works; this one is deliberately far enough out that
 * the planner never treats it as past.
 */
export const REEL_EPOCH = new Date("2026-06-01T09:00:00Z");

/** H.264 settings. yuv420p is non-negotiable — the platforms reject the rest. */
export const ENCODE_ARGS = [
  "-c:v", "libx264",
  "-pix_fmt", "yuv420p",
  "-crf", "18",
  "-preset", "slow",
  "-movflags", "+faststart",
];
