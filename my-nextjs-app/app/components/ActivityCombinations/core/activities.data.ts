// -----------------------------------------------------------------------------
// Activity data (vibe list, day labels) + catalogue re-exports
// -----------------------------------------------------------------------------
// The activity CATALOGUE literals (Rome + Paris) and the small builders that
// construct them now live in data/activities.data.ts (the project-root `data`
// folder), which imports nothing — it's pure data. This module keeps the
// lightweight reference constants (day labels, the vibe list) and RE-EXPORTS the
// catalogue + CLOSED under their historical names WITH the planner's types
// applied, so every existing `import { ACTIVITIES, CLOSED } from "./activities.data"`
// keeps resolving here unchanged. Types and helper functions live in
// activities.functions.
import type { Activity, DayHours, VibeKey } from "./activities.functions";
import { ROME_ACTIVITIES, CLOSED as RAW_CLOSED } from "../../../../data/activities.data";

// Re-export the data-folder catalogue + "closed that day" constant, typed.
export const CLOSED: DayHours = RAW_CLOSED;
export const ACTIVITIES: Activity[] = ROME_ACTIVITIES;

// Days of the week, Monday-first. A `program` holds one entry per day IN THIS
// ORDER (index 0 = Mon … 6 = Sun).
export const DAYS = ["Δευ", "Τρί", "Τετ", "Πέμ", "Παρ", "Σάβ", "Κυρ"] as const;

// Full weekday names (same Monday-first order), for places that have room for the
// whole word — e.g. the trip card's day headings.
export const DAYS_FULL = [
  "Δευτέρα",
  "Τρίτη",
  "Τετάρτη",
  "Πέμπτη",
  "Παρασκευή",
  "Σάββατο",
  "Κυριακή",
] as const;

export const VIBES: { key: VibeKey; name: string }[] = [
  { key: "cultural", name: "Πολιτισμός" },
  { key: "foodie", name: "Φαγητό" },
  { key: "adventurous", name: "Περιπέτεια" },
  { key: "relaxing", name: "Χαλάρωση" },
];
