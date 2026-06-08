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
import { bestRouteLinearity, maxComboValue, maxPartyPrice } from "./activities.functions";
import type { Params } from "./curves.functions";

export const HOURS_UNIT: Unit = { label: "Hours", suffix: "h", toIndex: hoursToIndex };
// Targets are euros, converted to the 0–10 budget index against the active
// party's catalogue total (so a bigger party shifts the whole budget scale).
export const COST_UNIT: Unit = { label: "Euros", suffix: "€", toIndex: partyCostToIndex };

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
  weight: 0.2,
  scoreName: "Linear (symmetric)",
  params: { slope: 1 },
  multi: true,
  hint: "Pick any you want a lot of",
  options: VIBES.map((vibe) => ({
    name: vibe.name,
    target: 10,
    value: averageIndex(vibe.key),
  })),
};

export const DEFAULT_FILTERS: Filter[] = [
  VIBE_FILTER,
  {
    name: "Time budget",
    weight: 0.5,
    scoreName: "Asymmetric linear",
    params: CEILING_PARAMS,
    hint: "Stay within this budget",
    unit: HOURS_UNIT,
    value: normalizedSumIndex("hours"),
    format: (combo) => `${sumOf("hours")(combo)}h`,
    // Targets are stored in HOURS (the unit); converted to index when scoring.
    options: [3, 6, 9, 12, maxComboValue("hours")].map((h) => ({
      name: `up to ${h}h`,
      target: h,
    })),
  },
  {
    name: "Cost budget",
    weight: 0.9,
    scoreName: "Asymmetric linear",
    params: CEILING_PARAMS,
    hint: "Stay within this budget",
    unit: COST_UNIT,
    // Cost = what the chosen traveller party pays (per-age prices, cheaper family
    // bundle when it matches), not the flat adult `cost` — see activityPrice.
    value: normalizedPartyCostIndex,
    format: (combo) => `€${sumPartyCost(combo)}`,
    // Targets are stored in EUROS (the unit); converted to index when scoring.
    options: [20, 50, 90, maxPartyPrice()].map((eur) => ({
      name: `up to €${eur}`,
      target: eur,
    })),
  },
  {
    // Route directness: how straight the best path through the combo is (0–10,
    // see bestRouteLinearity). The value is the SET's best achievable linearity,
    // so it's order-independent like every other index. "Asymmetric linear" with
    // a below-target slope but ZERO above-target slope means: being straighter
    // than the target is free (capped at 10), being less direct is penalised —
    // so a higher target demands a straighter route. Edit weight/curve/targets
    // in the filter editor like any other filter.
    name: "Route directness",
    weight: 0.4,
    scoreName: "Asymmetric linear",
    params: { under: 1, over: 0 },
    hint: "Prefer direct routes (less back-and-forth)",
    value: (combo) => bestRouteLinearity(combo),
    format: (combo) => `${bestRouteLinearity(combo).toFixed(1)}/10`,
    // Directness is meaningless for 1–2 stops (any two points are trivially
    // "straight"), so this filter is left out of those combos' scores entirely
    // — not scored 0 — so it never inflates a short combo's rank.
    appliesTo: (combo) => combo.length >= 3,
    // Targets are already 0–10 directness indexes (no unit conversion).
    options: [
      { name: "fairly direct", target: 6 },
      { name: "very direct", target: 8 },
      { name: "near-straight", target: 10 },
    ],
  },
  {
    // TOURIST PRIORITY: how must-see the combo's activities are, on average. The
    // value is the mean of each activity's `priority` (0–10); the target is 10 (a
    // combo of all must-sees). Scored with symmetric linear toward 10, so for any
    // value in 0–10 the contribution is simply weight × avgPriority — i.e. higher
    // priority always scores higher. Weighted by PRIORITY_WEIGHT (heavy by
    // default), this is what pushes the planner to include the big sights over
    // the niche ones when slots are limited. Edit the weight via PRIORITY_WEIGHT.
    name: "Tourist priority",
    weight: PRIORITY_WEIGHT,
    scoreName: "Linear (symmetric)",
    params: { slope: 1 },
    hint: "Favour the big must-see sights",
    value: averageIndex("priority"),
    format: (combo) =>
      `${(combo.reduce((s, a) => s + a.priority, 0) / (combo.length || 1)).toFixed(1)}/10`,
    // Targets are already 0–10 priority indexes (no unit conversion).
    options: [{ name: "must-see", target: 10 }],
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
    name: "Use every activity",
    weight: 0,
    scoreName: "Asymmetric linear",
    params: { under: 0, over: 1 },
    hint: "Raise the weight to leave out fewer activities",
    tripUseAll: true,
    // Never scored at the combo level — it's a whole-trip measure.
    appliesTo: () => false,
    // One target: how many left-out activities are acceptable (0 = use them all).
    options: [{ name: "use them all", target: 0 }],
  },
];
