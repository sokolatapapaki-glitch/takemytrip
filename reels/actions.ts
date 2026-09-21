// -----------------------------------------------------------------------------
// Step builders
// -----------------------------------------------------------------------------
// Thin, typed constructors so a reel file reads as a script rather than as a
// pile of object literals, plus `hook()` — the one place that knows the shape
// of the app's `data-reel` attributes.

import type { Caption, Step } from "./types.js";

/**
 * A `data-reel` hook as a selector.
 *
 * Reels address the app ONLY through these. Selecting by visible Greek text
 * would make every reel break on a copy tweak; the hooks are stable by
 * contract, and a reel that cannot find one fails loudly instead of rendering
 * a wrong video.
 */
export const hook = (name: string): string => `[data-reel="${name}"]`;

/** A filter option, addressed by index so Greek copy can never move it. */
export const filterHook = (filterIndex: number, optionIndex: number): string =>
  hook(`filter-${filterIndex}-${optionIndex}`);

/** A destination row in the homepage picker. */
export const destinationHook = (id: string): string =>
  `[data-reel="destination-option"][data-reel-id="${id}"]`;

const caption = (text?: string, holdMs?: number): Caption | undefined =>
  text === undefined ? undefined : holdMs === undefined ? { text } : { text, holdMs };

export const goto = (
  url: string,
  text?: string,
  opts: { settleMs?: number; holdMs?: number } = {}
): Step => ({ kind: "goto", url, settleMs: opts.settleMs, caption: caption(text, opts.holdMs) });

export const click = (
  target: string,
  text?: string,
  opts: { moveMs?: number; settleMs?: number; holdMs?: number } = {}
): Step => ({
  kind: "click",
  target,
  moveMs: opts.moveMs,
  settleMs: opts.settleMs,
  caption: caption(text, opts.holdMs),
});

export const type = (
  target: string,
  text: string,
  captionText?: string,
  opts: { perCharMs?: number; moveMs?: number; settleMs?: number; holdMs?: number } = {}
): Step => ({
  kind: "type",
  target,
  text,
  perCharMs: opts.perCharMs,
  moveMs: opts.moveMs,
  settleMs: opts.settleMs,
  caption: caption(captionText, opts.holdMs),
});

export const wait = (ms: number, text?: string, holdMs?: number): Step => ({
  kind: "wait",
  ms,
  caption: caption(text, holdMs),
});

/** Let the UI breathe — never changes the caption. */
export const hold = (ms: number): Step => ({ kind: "hold", ms });
