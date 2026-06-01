// -----------------------------------------------------------------------------
// Filter config objects (the data)
// -----------------------------------------------------------------------------
// The real-world units and the built-in DEFAULT_FILTERS. The index calculators
// and types they reference live in filters.functions.
import {
  averageIndex,
  costToIndex,
  hoursToIndex,
  normalizedSumIndex,
  sumOf,
  type Filter,
  type Unit,
} from "./filters.functions";
import { VIBES } from "./activities.data";
import { bestRouteLinearity, maxComboValue } from "./activities.functions";
import type { Params } from "./curves.functions";

export const HOURS_UNIT: Unit = { label: "Hours", suffix: "h", toIndex: hoursToIndex };
export const COST_UNIT: Unit = { label: "Euros", suffix: "€", toIndex: costToIndex };

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
    value: normalizedSumIndex("cost"),
    format: (combo) => `€${sumOf("cost")(combo)}`,
    // Targets are stored in EUROS (the unit); converted to index when scoring.
    options: [20, 50, 90, maxComboValue("cost")].map((eur) => ({
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
];
