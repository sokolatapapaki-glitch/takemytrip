// Shared builders + utilities for the trip-planner unit tests. Pure data only —
// no test framework imports here, so it can be reused by every test file.
import type { Activity, DayHours } from "../activities.functions";
import type { Filter } from "../filters.functions";

// A window open every day of the week.
export const allWeek = (open: number, close: number): DayHours[] =>
  Array.from({ length: 7 }, () => ({ open, close }));

export const CLOSED_DAY: DayHours = { open: 0, close: 0 };

// Build a test activity with sensible defaults; override only what a test needs.
let coordSeed = 0;
export function makeActivity(over: Partial<Activity> = {}): Activity {
  // Spread default coordinates apart deterministically so routes have length.
  const i = coordSeed++;
  return {
    name: over.name ?? `A${i}`,
    description: over.description ?? "",
    hours: over.hours ?? 2,
    cost: over.cost ?? 10,
    coords: over.coords ?? { lat: 41.9 + i * 0.01, lng: 12.5 + i * 0.01 },
    program: over.program ?? allWeek(8, 22),
    cultural: over.cultural ?? 5,
    foodie: over.foodie ?? 5,
    adventurous: over.adventurous ?? 5,
    relaxing: over.relaxing ?? 5,
    priority: over.priority ?? 5,
    ...(over.is_lunch !== undefined ? { is_lunch: over.is_lunch } : {}),
  };
}

// A minimal single-filter set: one symmetric-linear vibe filter scoring the
// combo's average `cultural` toward a target, weight 1. Deterministic + simple,
// so combo scores are easy to reason about in assertions.
export function simpleFilters(): Filter[] {
  return [
    {
      name: "Cultural",
      weight: 1,
      scoreName: "Linear (symmetric)",
      params: { slope: 1 },
      value: (combo: Activity[]) =>
        combo.reduce((s, a) => s + a.cultural, 0) / combo.length,
      options: [{ name: "a lot", target: 10 }],
    },
  ];
}

// A simple selection picking option 0 of filter 0 for a single-filter set.
export const pickFirst = { 0: [0] } as Record<number, number[]>;

// Deterministic linear-congruential PRNG so "random" tests are reproducible.
export function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// Round to a few decimals for tolerant float comparisons.
export const approx = (x: number, places = 6): number =>
  Math.round(x * 10 ** places) / 10 ** places;
