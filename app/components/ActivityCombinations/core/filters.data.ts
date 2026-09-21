// -----------------------------------------------------------------------------
// Filter config objects (the data)
// -----------------------------------------------------------------------------
// The real-world units and the built-in DEFAULT_FILTERS. The index calculators
// and types they reference live in filters.functions.
import {
  averageIndex,
  hoursToIndex,
  normalizedSumIndex,
  normalizedPartyCostIndex,
  partyCostToIndex,
  sumOf,
  sumPartyCost,
  type Filter,
  type Unit,
} from "./filters.functions";
import { VIBES } from "./activities.data";
import { maxPartyPrice } from "./activities.functions";
import type { Params } from "./curves.functions";
import { VIBE_UI_ENABLED } from "@/app/config/features";

export const HOURS_UNIT: Unit = { label: "Ώρες", suffix: "ω", toIndex: hoursToIndex };
// Targets are euros, converted to the 0–10 budget index against the active
// party's catalogue total (so a bigger party shifts the whole budget scale).
export const COST_UNIT: Unit = { label: "Ευρώ", suffix: "€", toIndex: partyCostToIndex };

// Per-person budget tiers (euros). The cost filter's options are rebuilt from
// these × the party headcount at runtime (see index.tsx), so the buckets shown
// read as PARTY totals — e.g. €50/person → "έως €150" for three travellers. The
// top bucket is open-ended ("€N+"): its target is the catalogue max so nothing
// above it is penalised, while only its LABEL scales with the party.
export const COST_TIERS = [20, 50, 90];
export function costOptionsForParty(travelers: number) {
  const n = Math.max(1, travelers);
  return [
    ...COST_TIERS.map((eur) => ({ name: `έως €${eur * n}`, target: eur * n })),
    { name: `€${90 * n}+`, target: maxPartyPrice() },
  ];
}

// ===========================================================================
// HOW IMPORTANT IS "tourist priority"?  ← the one knob to turn.
// ===========================================================================
// The weight of the "Tourist priority" filter below. A combo's priority score is
// the average `priority` (0–10) of its activities, so this filter contributes
// PRIORITY_WEIGHT × avgPriority to each day's score. Because the trip planner
// maximizes the day-score average, a high weight makes it fill the trip's limited
// slots with the must-see, high-priority sights first. For scale: the other
// filters' weights are ~0.2–0.9, so the default 3 already makes priority the
// single biggest factor. Raise it to make priority dominate even harder, lower it
// to soften it, 0 to ignore priority entirely.
export const PRIORITY_WEIGHT = 3;

// Asymmetric-linear ceiling: free below target, very steep above.
const CEILING_PARAMS: Params = { under: 0, over: 100 };

// ONE multi-select Vibe filter (Model B): each option scores a different vibe
// index at target 10 ("a lot"). No unit -> targets are plain 0–10 indexes.
const VIBE_FILTER: Filter = {
  name: "Vibe",
  weight: 0,
  scoreName: "Linear (symmetric)",
  params: { slope: 1 },
  multi: true,
  // Hidden app-wide while the vibe UI is off (#4). Kept in the list so indices
  // and the underlying logic stay intact; as a hidden multi filter it defaults
  // to no selection, so it scores nothing ("all vibes"). Flip VIBE_UI_ENABLED
  // back to true to restore the control unchanged.
  hidden: !VIBE_UI_ENABLED,
  hint: "Διάλεξε όσα θέλεις να έχει πολλά το πρόγραμμα",
  options: VIBES.map((vibe) => ({
    name: vibe.name,
    target: 10,
    value: averageIndex(vibe.key),
  })),
};

export const DEFAULT_FILTERS: Filter[] = [
  VIBE_FILTER,
  {
    name: "Χρόνος",
    weight: 0.5,
    scoreName: "Asymmetric linear",
    params: CEILING_PARAMS,
    hint: "Μείνε μέσα σε αυτό το όριο",
    unit: HOURS_UNIT,
    value: normalizedSumIndex("hours"),
    format: (combo) => `${sumOf("hours")(combo)}ω`,
    // Default to the 12h option (index 3 of the array below).
    defaultOption: 3,
    // Targets are stored in HOURS (the unit); converted to index when scoring.
    // Capped at 15h — the most a single day can realistically hold.
    options: [3, 6, 9, 12].map((h) => ({
      name: `έως ${h}ω`,
      target: h,
    })),
  },
  {
    name: "Κόστος",
    weight: 10,
    scoreName: "Asymmetric linear",
    params: CEILING_PARAMS,
    hint: "Μείνε μέσα σε αυτό το όριο",
    unit: COST_UNIT,
    // Cost = what the chosen traveller party pays (per-age prices, cheaper family
    // bundle when it matches), not the flat adult `cost` — see activityPrice.
    value: normalizedPartyCostIndex,
    format: (combo) => `€${sumPartyCost(combo)}`,
    // Default to the third option (index 2 — the "€90×party" bucket).
    defaultOption: 2,
    // Targets are stored in EUROS (the unit); converted to index when scoring.
    // Seeded per-person (travelers = 1); index.tsx rebuilds these for the actual
    // party so the buckets read as party totals (see costOptionsForParty).
    options: costOptionsForParty(1),
  },
  {
    // TOURIST PRIORITY: how must-see the combo's activities are, on average. The
    // value is the mean of each activity's `priority` (0–10); the target is 10 (a
    // combo of all must-sees). Scored with symmetric linear toward 10, so for any
    // value in 0–10 the contribution is simply weight × avgPriority — i.e. higher
    // priority always scores higher. Weighted by PRIORITY_WEIGHT (heavy by
    // default), this is what pushes the planner to include the big sights over
    // the niche ones when slots are limited. Edit the weight via PRIORITY_WEIGHT.
    name: "Τουριστική προτεραιότητα",
    weight: PRIORITY_WEIGHT,
    scoreName: "Linear (symmetric)",
    params: { slope: 1 },
    // Retired knob (#5): the control confused users, but it's the heaviest factor
    // in the ranking, so we KEEP it scoring (default "must-see" selected) and only
    // hide its control. Single-select + hidden ⇒ default option stays selected, so
    // the combo ranking is unchanged.
    hidden: true,
    hint: "Προτίμησε τα μεγάλα must-see αξιοθέατα",
    value: averageIndex("priority"),
    format: (combo) =>
      `${(combo.reduce((s, a) => s + a.priority, 0) / (combo.length || 1)).toFixed(1)}/10`,
    // Targets are already 0–10 priority indexes (no unit conversion).
    options: [{ name: "must-see", target: 10 }],
    // (label kept short — "must-see" is common usage in Greek too)
  },
  {
    // TRIP-LEVEL index (not per-combo): controls how easily the planner LEAVES
    // ACTIVITIES OUT of the multi-day trip. value = the number of placeable
    // activities left unused; target = 0 (use them all). "Asymmetric linear" with
    // under:0 / over:1 means raw = 10 − 1·(left out), so each extra left-out
    // activity drops the score by one point → costs `weight` of the trip
    // objective. Raising the weight makes the optimizer keep more activities even
    // if a day gets fuller (lower leave-out sensitivity); weight 0 = off.
    // DEFAULT 0 so behaviour is unchanged until you tune it on the editor page.
    name: "Χρήση όλων των δραστηριοτήτων",
    weight: 10,
    scoreName: "Asymmetric linear",
    params: { under: 0, over: 1 },
    hint: "Ανέβασε το βάρος για να μένουν έξω λιγότερες δραστηριότητες",
    tripUseAll: true,
    // Never scored at the combo level — it's a whole-trip measure.
    appliesTo: () => false,
    // One target: how many left-out activities are acceptable (0 = use them all).
    options: [{ name: "χρησιμοποίησέ τες όλες", target: 0 }],
  },
  {
    // TRIP-LEVEL "day balance": pushes the planner to even out the NUMBER of
    // activities across the days (no near-empty first day). Implemented as a
    // per-day reward `weight × (count − count²/(2·MAX_DAY_ACTIVITIES))` folded
    // into each day's score — concave, so for a given set of placed activities the
    // total is highest when the per-day counts are equal, and increasing in count
    // so it never makes the planner drop activities. Only the WEIGHT is used (the
    // curve/options are inert); weight 0 = off. Tune the weight in the editor.
    name: "Ισορροπία ημερών",
    weight: 10,
    scoreName: "Linear (symmetric)",
    params: { slope: 1 },
    hint: "Ανέβασε το βάρος για πιο ίσο αριθμό δραστηριοτήτων ανά ημέρα",
    tripBalance: true,
    // Never scored at the combo level — it's a whole-trip measure.
    appliesTo: () => false,
    // Inert placeholder option (the term uses only the filter's weight).
    options: [{ name: "ισορροπημένες ημέρες", target: 0 }],
  },
];
