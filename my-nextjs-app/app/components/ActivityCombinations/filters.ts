// -----------------------------------------------------------------------------
// Filters, index calculators, and scoring
// -----------------------------------------------------------------------------
import { Activity, NumericKey, VIBES, maxComboValue } from "./activities";
import { CURVE_BY_NAME, type Params, type ScaleScore } from "./curves";

// -----------------------------------------------------------------------------
// Reusable index calculators
// -----------------------------------------------------------------------------
// An "index" maps a combination of activities to a single 0–10 number.

// AVERAGE — mean of a field across the combo (character, e.g. how foodie it is).
export function averageIndex(key: NumericKey) {
  return (combo: Activity[]): number =>
    combo.reduce((s, a) => s + a[key], 0) / combo.length;
}

// NORMALIZED SUM — total of a field, scaled to 0–10 against the maximum possible
// total (magnitude, e.g. how long / how expensive the whole combo is).
export function normalizedSumIndex(key: NumericKey) {
  const max = maxComboValue(key);
  return (combo: Activity[]): number =>
    (combo.reduce((s, a) => s + a[key], 0) / max) * 10;
}

// Raw total of a field across the combo (the real-world value, not the index).
export function sumOf(key: NumericKey) {
  return (combo: Activity[]): number => combo.reduce((s, a) => s + a[key], 0);
}

// Convert real-world units into the 0–10 index used by an option's target.
export const hoursToIndex = (hours: number) =>
  (hours / maxComboValue("hours")) * 10;
export const costToIndex = (cost: number) => (cost / maxComboValue("cost")) * 10;

// A real-world UNIT for a filter's option targets. When present, option targets
// are entered/stored in this unit (e.g. hours, euros) and converted to the 0–10
// index at scoring time. Code-bound (not user-edited).
export type Unit = { label: string; suffix: string; toIndex: (raw: number) => number };

export const HOURS_UNIT: Unit = { label: "Hours", suffix: "h", toIndex: hoursToIndex };
export const COST_UNIT: Unit = { label: "Euros", suffix: "€", toIndex: costToIndex };

// -----------------------------------------------------------------------------
// Filters (data-driven config)
// -----------------------------------------------------------------------------
// Each filter scores its index with a CURVE (referenced by name) shaped by
// `params`. A budget "ceiling" is just `asymmetricLinear` with no below-target
// penalty and a steep above-target slope.
//   name    — sidebar label
//   weight  — share of the ranking each selected option controls
//   scoreName / params — the curve and its constants (editable in the UI)
//   multi   — pick several options at once (checkboxes) vs one (radio)
//   hint    — short sidebar description
//   unit    — if set, option targets are in this real-world unit (hours/euros)
//   value / format — index calculator + real-world label (code-bound, not edited)
//   options — child list. Each has name, target, and an optional per-option
//             `value` (the multi-select Vibe filter scores a different index
//             per option towards target 10).
export type FilterOption = {
  name: string;
  target: number; // in the filter's `unit` if set, else already a 0–10 index
  value?: (combo: Activity[]) => number;
};

export type Filter = {
  name: string;
  weight: number;
  scoreName: string;
  params: Params;
  multi?: boolean;
  hint?: string;
  unit?: Unit;
  value?: (combo: Activity[]) => number;
  format?: (combo: Activity[]) => string;
  options: FilterOption[];
};

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
    weight: 0.9,
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
    weight: 0.5,
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
];

// Selection = the chosen option INDEXES per filter, keyed by FILTER INDEX (so
// renaming a filter doesn't lose its selection). Single-select filters hold one.
export type Selection = Record<number, number[]>;

export function defaultSelection(filters: Filter[]): Selection {
  return Object.fromEntries(
    filters.map((f, i) => [
      i,
      f.multi ? [0] : [Math.floor((f.options.length - 1) / 2)],
    ])
  );
}

// The 0–10 index a target represents: converted from the filter's unit if any.
export function targetIndex(filter: Filter, option: FilterOption): number {
  return filter.unit ? filter.unit.toIndex(option.target) : option.target;
}

// The index value behind an option: its own `value`, else the filter's default,
// else a constant 0 (for freshly-added options with nothing bound yet).
export function optionValue(
  filter: Filter,
  option: FilterOption
): (combo: Activity[]) => number {
  return option.value ?? filter.value ?? (() => 0);
}

// Resolve a filter's scoring curve, falling back to symmetric linear.
function scoreFn(filter: Filter): ScaleScore {
  return (CURVE_BY_NAME[filter.scoreName] ?? CURVE_BY_NAME["Linear (symmetric)"]).fn;
}

// -----------------------------------------------------------------------------
// Combination logic
// -----------------------------------------------------------------------------
// Combined score: every SELECTED option of every filter contributes
// weight × clamp(curve(value, targetIndex, params)).
export function comboScore(
  combo: Activity[],
  selection: Selection,
  filters: Filter[]
): number {
  return filters.reduce((sum, f, fi) => {
    const fn = scoreFn(f);
    const picked = selection[fi] ?? [];
    return (
      sum +
      picked.reduce((s, i) => {
        const option = f.options[i];
        if (!option) return s;
        const value = optionValue(f, option)(combo);
        const raw = fn(value, targetIndex(f, option), f.params);
        return s + f.weight * Math.max(0, Math.min(10, raw));
      }, 0)
    );
  }, 0);
}

// Enumerate every non-empty subset, then order by score for the given filters.
export function buildCombinations(
  activities: Activity[],
  selection: Selection,
  filters: Filter[]
): Activity[][] {
  const result: Activity[][] = [];
  const total = 1 << activities.length;

  for (let mask = 1; mask < total; mask++) {
    const combo: Activity[] = [];
    for (let i = 0; i < activities.length; i++) {
      if (mask & (1 << i)) {
        combo.push(activities[i]);
      }
    }
    result.push(combo);
  }

  return result.sort(
    (a, b) => comboScore(b, selection, filters) - comboScore(a, selection, filters)
  );
}
