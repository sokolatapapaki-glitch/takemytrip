// -----------------------------------------------------------------------------
// create-trip — v1, no camera move
// -----------------------------------------------------------------------------
// The core flow: land on the homepage, pick Ρώμη, set a trip length, search,
// then open the filters and try three time budgets before settling on one.
//
// Ρώμη is the demo destination on purpose — it is the city with the fullest
// activity catalogue (data/activities/rome.data.ts), so the plan the reel
// produces is a real, dense itinerary rather than a thin one. Together with the
// pinned clock in config.ts that makes this reel reproducible: the same source
// renders the same video tomorrow.

import { click, destinationHook, filterHook, goto, hook, preview, type } from "../actions.js";
import type { Outro, Reel, Step } from "../types.js";

// "Χρόνος" (the day's time budget) is filter 1 in DEFAULT_FILTERS; its options
// are 3ω / 6ω / 9ω / 12ω. "Κόστος" is filter 2 but is hidden while
// HIDE_ACTIVITY_PRICES is on, so the three filter beats below are three options
// of the one group the app actually shows — which reads on video as a traveller
// trying budgets, rather than as three unrelated toggles.
export const TIME_FILTER = 1;

/**
 * The flow, shared with the zoom variant so the two reels can never drift
 * apart: v2 is these exact steps plus a camera.
 */
export const CREATE_TRIP_STEPS: Step[] = [
  goto("/", "ΑΡΧΙΚΗ ΣΕΛΙΔΑ"),

  // --- the search bar ---
  type(hook("destination-input"), "Ρώμη", "ΔΙΑΛΕΞΕ ΠΡΟΟΡΙΣΜΟ"),
  click(destinationHook("rome"), "ΡΩΜΗ, ΙΤΑΛΙΑ"),
  // The picker stays open on its optional accommodation step; tapping the
  // headline dismisses it, the same way a thumb would.
  click(hook("hero-title")),
  click(hook("days"), "ΠΟΣΕΣ ΜΕΡΕΣ"),
  type(hook("days"), "3"),
  click(hook("search"), "ΑΝΑΖΗΤΗΣΗ ΤΑΞΙΔΙΟΥ", { settleMs: 1800 }),

  // --- the plan ---
  click(hook("close-hint"), "ΕΤΟΙΜΟ ΠΡΟΓΡΑΜΜΑ", { holdMs: 1200 }),
  click(hook("open-filters"), "ΑΝΟΙΞΕ ΤΑ ΦΙΛΤΡΑ"),

  // --- the three filters (the beats v2 zooms into) ---
  click(filterHook(TIME_FILTER, 0), "ΠΡΩΤΟ ΦΙΛΤΡΟ"),
  click(filterHook(TIME_FILTER, 1), "ΔΕΥΤΕΡΟ ΦΙΛΤΡΟ"),
  click(filterHook(TIME_FILTER, 2), "ΤΡΙΤΟ ΦΙΛΤΡΟ"),

  click(hook("close-filters"), "ΤΟ ΤΑΞΙΔΙ ΣΟΥ ΕΙΝΑΙ ΕΤΟΙΜΟ", { holdMs: 1500 }),

  // --- the ending: the whole plan, clean and static, then the outro ---
  preview(),
];

/** Index of the first filter click — where v2's camera pushes in. */
export const FIRST_FILTER_STEP = CREATE_TRIP_STEPS.findIndex(
  (s) => s.kind === "click" && s.target === filterHook(TIME_FILTER, 0)
);
/** Index of the step after the last filter click — where v2 pulls back out. */
export const AFTER_FILTERS_STEP = FIRST_FILTER_STEP + 3;

/**
 * The closing scene both reels share: the preview slides up to reveal the
 * globe, the plane and the brand line.
 */
export const OUTRO: Outro = {
  headline: ["TAKE", "MY", "TRIP"],
  tagline: "ΟΡΓΑΝΩΣΕ ΤΟ ΤΑΞΙΔΙ ΜΕ 3 ΚΛΙΚ!",
};

export const createTrip: Reel = {
  name: "create-trip",
  viewport: { width: 1080, height: 1920 },
  fps: 30,
  steps: CREATE_TRIP_STEPS,
  outro: OUTRO,
};

export default createTrip;
