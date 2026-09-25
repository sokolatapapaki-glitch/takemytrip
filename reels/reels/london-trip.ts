// -----------------------------------------------------------------------------
// london-trip — a 4-day Λονδίνο trip, straight through, ending on a slow scroll
// through the finished plan and the globe outro
// -----------------------------------------------------------------------------
// The short version of the story: search, and the plan is there. No filters, no
// camera moves — just the one gesture and the result. create-trip is where the
// filters get their moment; this reel is the "it just works" cut.
//
// Λονδίνο instead of Ρώμη and 4 days instead of 3, so the two reels do not look
// like re-runs of each other. Λονδίνο has the largest catalogue in
// data/activities, which is what makes that final scroll worth watching.

import { click, destinationHook, finish, goto, hook, scroll, type, wait } from "../actions.js";
import type { Reel, Step } from "../types.js";
import { OUTRO } from "./create-trip.js";

const TRIP_PLAN = hook("trip-plan");

export const LONDON_TRIP_STEPS: Step[] = [
  goto("/", "ΑΡΧΙΚΗ ΣΕΛΙΔΑ"),

  // --- the search bar (full frame: it reads fine without a push-in) ---
  type(hook("destination-input"), "Λονδίνο", "ΔΙΑΛΕΞΕ ΠΡΟΟΡΙΣΜΟ"),
  click(destinationHook("london"), "ΛΟΝΔΙΝΟ, ΗΝΩΜΕΝΟ ΒΑΣΙΛΕΙΟ"),
  // The picker stays open on its optional accommodation step; tapping the
  // headline dismisses it, the same way a thumb would. A utility beat with no
  // caption, so it is kept quick.
  click(hook("hero-title"), undefined, { moveMs: 300, settleMs: 200 }),
  click(hook("days"), "ΠΟΣΕΣ ΜΕΡΕΣ"),
  type(hook("days"), "4"),

  // --- search ---
  click(hook("search"), "ΑΝΑΖΗΤΗΣΗ ΤΑΞΙΔΙΟΥ", { settleMs: 1300 }),

  // --- the plan, straight away: no filters in this reel ---
  click(hook("close-hint"), "ΤΟ ΠΛΑΝΟ ΣΟΥ ΕΙΝΑΙ ΕΤΟΙΜΟ"),
  scroll(TRIP_PLAN, 9000, "ΔΕΣ ΟΛΟ ΤΟ ΠΡΟΓΡΑΜΜΑ"),
  wait(900, "4 ΜΕΡΕΣ ΣΤΟ ΛΟΝΔΙΝΟ"),

  // --- the ending: the scroll's last frame, cleared, is what the outro takes ---
  finish(),
];

// No camera at all now. The only push-in this reel had was on the filter
// options, and with the filters gone there is nothing left that is too small to
// read at full frame — the search bar, the plan and the closing scroll all are.
export const londonTrip: Reel = {
  name: "london-trip",
  viewport: { width: 1080, height: 1920 },
  fps: 30,
  steps: LONDON_TRIP_STEPS,
  outro: OUTRO,
};

export default londonTrip;
