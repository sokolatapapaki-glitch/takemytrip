// -----------------------------------------------------------------------------
// Filters: index calculators, scoring, breakdown + types
// -----------------------------------------------------------------------------
// The filter config objects themselves (units, DEFAULT_FILTERS) live in
// filters.data. This file holds the reusable index calculators, the scoring
// math, and the types.
import { Activity, NumericKey, maxComboValue } from "./activities.functions";
import { CURVE_BY_NAME } from "./curves.data";
import type { Curve, Params, ScaleScore } from "./curves.functions";

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

// -----------------------------------------------------------------------------
// Filter types (data-driven config; the objects live in filters.data)
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
  // When present and it returns false for a combo, this filter is left out of
  // that combo's score ENTIRELY — not scored as 0, simply absent, as if the
  // filter didn't exist for it (e.g. route directness is meaningless for 1–2
  // stops). Code-bound (not user-edited); undefined = always applies.
  appliesTo?: (combo: Activity[]) => boolean;
  // TRIP-LEVEL flag: this filter doesn't score a single combo — it scores the
  // whole multi-day trip. "Use every activity" is one: its value is the count of
  // placeable activities LEFT OUT (target 0), so raising its weight makes the
  // planner keep more of them (lowers the "leave-out" sensitivity). It's kept in
  // the same editable store (weight/curve tunable in the editor) but is excluded
  // from every combo score and the results sidebar, and applied only by planTrip.
  // See usageBreakdown / tripUseAllFilter below. Code-bound (not user-edited).
  tripUseAll?: boolean;
  options: FilterOption[];
};

// Whether a filter scores the whole trip (not a single combo) — so it's left out
// of every combo score and the results sidebar, and applied only by planTrip.
export function isTripLevel(filter: Filter): boolean {
  return !!filter.tripUseAll;
}

// Whether a filter contributes to a given combo's score at all (see appliesTo).
export function filterApplies(filter: Filter, combo: Activity[]): boolean {
  return !filter.appliesTo || filter.appliesTo(combo);
}

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

// Resolve a filter's scoring curve, falling back to symmetric linear. The whole
// Curve (fn + display metadata like its colour) so callers — scoring AND the
// proof graph — share one source of truth for which function actually scores.
function resolveCurve(filter: Filter): Curve {
  return CURVE_BY_NAME[filter.scoreName] ?? CURVE_BY_NAME["Linear (symmetric)"];
}
function scoreFn(filter: Filter): ScaleScore {
  return resolveCurve(filter).fn;
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
    if (!filterApplies(f, combo)) return sum; // filter absent for this combo
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

// -----------------------------------------------------------------------------
// Trip-level indices (scored across the whole multi-day trip, not one combo)
// -----------------------------------------------------------------------------
// Unlike the per-combo filters above, these score the WHOLE trip from a single
// trip-level VALUE (e.g. how many activities were left out). Each lives in the
// same editable store (so its weight and curve are tunable in the editor) but is
// flagged trip-level, so it's excluded from every combo score and the results
// sidebar, and applied only by planTrip. Its weighted, clamped curve score is
// ADDED to the average of the day scores.

// Locate the (single) "use every activity" filter among the runtime filters.
export function tripUseAllFilter(
  filters: Filter[]
): { filter: Filter; index: number } | null {
  const index = filters.findIndex((f) => f.tripUseAll);
  return index === -1 ? null : { filter: filters[index], index };
}

// The shared proof of one trip-level index: the value, the target, and the curve
// math (raw → clamp → × weight) that turns it into the contribution ADDED to the
// trip's day average.
export type TripIndexProof = {
  value: number; // the trip-level value on the curve's x-scale
  realTarget: number; // the option target in its real-world unit (or raw)
  targetIdx: number; // that target as an index
  raw: number; // curve(value, targetIdx, params) before clamping
  clamped: number; // raw clamped into 0–10
  weight: number; // the filter's weight
  contribution: number; // weight × clamped — what's ADDED to the day average
  scoreName: string;
  params: Params;
  fn: ScaleScore; // the curve that scored it (for the proof graph)
  curveColor: string;
};

// Score one trip-level value with a filter's curve, keeping every intermediate
// for the proof. `value` is already on the curve's x-scale (callers apply any
// unit conversion first).
function scoreTripIndex(filter: Filter, value: number): TripIndexProof {
  const curve = resolveCurve(filter);
  const option = filter.options[0];
  const realTarget = option?.target ?? 0;
  const targetIdx = filter.unit ? filter.unit.toIndex(realTarget) : realTarget;
  const raw = curve.fn(value, targetIdx, filter.params);
  const clamped = Math.max(0, Math.min(10, raw));
  return {
    value,
    realTarget,
    targetIdx,
    raw,
    clamped,
    weight: filter.weight,
    contribution: filter.weight * clamped,
    scoreName: filter.scoreName,
    params: filter.params,
    fn: curve.fn,
    curveColor: curve.color,
  };
}

// "Use every activity": value = how many placeable activities were LEFT OUT,
// scored toward a target of 0. A higher weight makes each left-out activity cost
// more, so the optimizer keeps more of them (lower leave-out sensitivity).
export type UseAllBreakdown = TripIndexProof & {
  leftoverCount: number; // placeable activities not used
  placedCount: number; // activities actually scheduled
};
export function usageBreakdown(
  filter: Filter,
  leftoverCount: number,
  placedCount: number
): UseAllBreakdown {
  const value = filter.unit ? filter.unit.toIndex(leftoverCount) : leftoverCount;
  return { ...scoreTripIndex(filter, value), leftoverCount, placedCount };
}

// -----------------------------------------------------------------------------
// Score breakdown (the "why this rank" proof)
// -----------------------------------------------------------------------------
// A step-by-step record of how comboScore arrives at its number, so the UI can
// show the math: per selected option, the index value, the target, the raw
// curve output, the clamp, and the weighted contribution.
export type OptionBreakdown = {
  optionName: string;
  value: number; // the 0–10 index this option scores for the combo
  realTarget: number; // option.target in the filter's unit (or raw index)
  targetIdx: number; // that target as a 0–10 index
  raw: number; // curve(value, targetIdx, params) before clamping
  clamped: number; // raw clamped into 0–10
  weight: number; // the filter's weight
  contribution: number; // weight × clamped (what lands in the total)
};

export type FilterBreakdown = {
  filterName: string;
  scoreName: string;
  weight: number;
  unitSuffix?: string; // e.g. "h", "€" — for showing real-world targets
  realWorld?: string; // e.g. "12h", "€80" — the combo's real total, if any
  params: Params;
  fn: ScaleScore; // the exact curve that scored this filter (for the proof graph)
  curveColor: string; // its display colour, so graph + legend match
  options: OptionBreakdown[];
  subtotal: number; // sum of this filter's contributions
};

export type ScoreBreakdown = {
  filters: FilterBreakdown[];
  total: number; // equals comboScore(...)
};

// Recompute comboScore with every intermediate value retained, for display.
export function scoreBreakdown(
  combo: Activity[],
  selection: Selection,
  filters: Filter[]
): ScoreBreakdown {
  const breakdown: FilterBreakdown[] = filters
    .map((f, fi): FilterBreakdown | null => {
    // A filter that doesn't apply to this combo is omitted from the proof
    // entirely — it contributes nothing and shouldn't be shown (see appliesTo).
    if (!filterApplies(f, combo)) return null;
    const curve = resolveCurve(f);
    const fn = curve.fn;
    const picked = selection[fi] ?? [];
    const options: OptionBreakdown[] = picked
      .map((i) => {
        const option = f.options[i];
        if (!option) return null;
        const value = optionValue(f, option)(combo);
        const targetIdx = targetIndex(f, option);
        const raw = fn(value, targetIdx, f.params);
        const clamped = Math.max(0, Math.min(10, raw));
        return {
          optionName: option.name,
          value,
          realTarget: option.target,
          targetIdx,
          raw,
          clamped,
          weight: f.weight,
          contribution: f.weight * clamped,
        } satisfies OptionBreakdown;
      })
      .filter((o): o is OptionBreakdown => o !== null);
    return {
      filterName: f.name,
      scoreName: f.scoreName,
      weight: f.weight,
      unitSuffix: f.unit?.suffix,
      realWorld: f.format ? f.format(combo) : undefined,
      params: f.params,
      fn,
      curveColor: curve.color,
      options,
      subtotal: options.reduce((s, o) => s + o.contribution, 0),
    } satisfies FilterBreakdown;
  })
    .filter((f): f is FilterBreakdown => f !== null);
  return {
    filters: breakdown,
    total: breakdown.reduce((s, f) => s + f.subtotal, 0),
  };
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
