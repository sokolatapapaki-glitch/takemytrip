// =============================================================================
// Concurrent property-based tests for the multi-day trip planner (planTrip)
// =============================================================================
// Vitest + fast-check. Run with `npm run test:planner`. This suite generates
// hundreds of randomized (pool, days, hours, selections, filters) inputs that
// match the REAL shapes the app passes to planTrip (see index.tsx), and checks
// the planner's invariants on every one: structural validity, schedule legality
// (opening hours, the required lunch, the day budget), filter semantics,
// determinism, non-mutation, exactness gating, planner agreement, and speed.
//
// Module-state notes (why this file is safe to run concurrently):
//   • planTrip is synchronous, so test.concurrent interleaves only BETWEEN
//     solves, never mid-solve. Tests that touch engine module state
//     (setActiveParty) do set → solve → restore with no `await` in between and
//     live in a sequential describe at the end.
//   • bestRouteLinearity memoizes by activity NAME, so every generated activity
//     name embeds its coordinates — identical names always mean identical
//     coords, and the cache can never be poisoned across runs.
import { describe, test, expect } from "vitest";
import * as fc from "fast-check";
import {
  planTrip,
  planHeuristic,
  isExactWithinBudget,
  PLANNERS,
  MAX_DAY_ACTIVITIES,
  type Trip,
} from "./trip.functions";
import { ACTIVITIES } from "./activities.data";
import { DEFAULT_FILTERS } from "./filters.data";
import { defaultParamsFor } from "./curves.data";
import {
  comboScore,
  defaultSelection,
  type Filter,
  type Selection,
} from "./filters.functions";
import { scheduleEndHour } from "./schedule.functions";
import { LUNCH_CLOSE, LUNCH_NAME } from "./schedule.data";
import {
  dayHours,
  isClosedDay,
  setActiveParty,
  getActiveParty,
  EMPTY_ACTIVITY_META,
  type Activity,
  type DayHours,
} from "./activities.functions";

const EPS = 1e-6;

// =============================================================================
// Section A — Arbitraries (input generators matching the real shapes)
// =============================================================================

// One day's opening window: closed, open 24h, or a realistic daytime window.
const arbDayWindow: fc.Arbitrary<DayHours> = fc.oneof(
  { weight: 1, arbitrary: fc.constant({ open: 0, close: 0 }) }, // closed
  { weight: 1, arbitrary: fc.constant({ open: 0, close: 24 }) }, // open 24h
  {
    weight: 6,
    arbitrary: fc
      .tuple(fc.integer({ min: 6, max: 13 }), fc.integer({ min: 4, max: 11 }))
      .map(([open, len]) => ({ open, close: Math.min(24, open + len) })),
  }
);

// A 7-day program (Mon..Sun), as every Activity carries.
const arbProgram = fc.array(arbDayWindow, { minLength: 7, maxLength: 7 });

// The raw numeric fields of one activity. Hours come in half-hour steps
// (0.5h..4h) so day budgets bite realistically; coords sit in a small box
// around Rome's centre so route metrics have meaningful distances.
type ActivityCore = {
  hoursHalf: number;
  cost: number;
  latStep: number;
  lngStep: number;
  cultural: number;
  foodie: number;
  adventurous: number;
  relaxing: number;
  priority: number;
  isLunch: boolean;
  program: DayHours[];
};
const arbActivityCore: fc.Arbitrary<ActivityCore> = fc.record({
  hoursHalf: fc.integer({ min: 1, max: 8 }), // 0.5..4 hours
  cost: fc.integer({ min: 0, max: 60 }),
  latStep: fc.integer({ min: 0, max: 60 }),
  lngStep: fc.integer({ min: 0, max: 60 }),
  cultural: fc.integer({ min: 0, max: 10 }),
  foodie: fc.integer({ min: 0, max: 10 }),
  adventurous: fc.integer({ min: 0, max: 10 }),
  relaxing: fc.integer({ min: 0, max: 10 }),
  priority: fc.integer({ min: 0, max: 10 }),
  isLunch: fc.boolean(),
  program: arbProgram,
});

// Materialize a core into a real Activity. The NAME embeds the pool index (so
// names are unique within a pool) AND the coordinates (so the global
// bestRouteLinearity name-keyed memo can never associate one name with two
// different locations across generated pools).
function toActivity(core: ActivityCore, i: number): Activity {
  const lat = 41.85 + core.latStep * 0.002;
  const lng = 12.4 + core.lngStep * 0.002;
  return {
    name: `P${i}@${lat.toFixed(3)},${lng.toFixed(3)}`,
    description: "",
    hours: core.hoursHalf / 2,
    cost: core.cost,
    coords: { lat, lng },
    program: core.program,
    cultural: core.cultural,
    foodie: core.foodie,
    adventurous: core.adventurous,
    relaxing: core.relaxing,
    priority: core.priority,
    ...EMPTY_ACTIVITY_META,
    ...(core.isLunch && core.foodie >= 5 ? { is_lunch: true } : {}),
  };
}

const poolOf = (min: number, max: number): fc.Arbitrary<Activity[]> =>
  fc
    .array(arbActivityCore, { minLength: min, maxLength: max })
    .map((cores) => cores.map(toActivity));

// Small pools stay within the exact planner's budget; large pools exercise the
// heuristic fallback (and, at exactly 14×1 day, the exact gate's edge).
const arbSmallPool = poolOf(1, 7);
const arbLargePool = poolOf(14, 16);

// Chosen weekdays: 1..3 distinct day indices (0=Mon..6=Sun), as the app's
// "Days after" control produces.
const arbDays = fc.uniqueArray(fc.integer({ min: 0, max: 6 }), {
  minLength: 1,
  maxLength: 3,
});

// Per-filter SELECTION against the DEFAULT_FILTERS shape: multi filters pick
// any subset of their options, single filters pick one; fc.option randomly
// OMITS a filter's key entirely (sparse selections are legal — comboScore
// falls back to []).
const arbSelection: fc.Arbitrary<Selection> = fc
  .tuple(
    ...DEFAULT_FILTERS.map((f) =>
      fc.option(
        f.multi
          ? fc.uniqueArray(fc.integer({ min: 0, max: f.options.length - 1 }), {
              minLength: 0,
              maxLength: f.options.length,
            })
          : fc.integer({ min: 0, max: f.options.length - 1 }).map((i) => [i]),
        { nil: undefined }
      )
    )
  )
  .map((picks) => {
    const sel: Selection = {};
    picks.forEach((p, i) => {
      if (p !== undefined) sel[i] = p;
    });
    return sel;
  });

// Runtime FILTERS: the real DEFAULT_FILTERS with randomized weights and (for
// some) a different scoring curve + its default params — exactly the knobs the
// filter editor exposes. Index calculators, units, options, and the trip-level
// flag are preserved (they're code-bound, not user-edited).
const CURVE_CHOICES = [
  "Linear (symmetric)",
  "Asymmetric linear",
  "Gaussian",
  "Exponential decay",
] as const;
const arbFilters: fc.Arbitrary<Filter[]> = fc
  .tuple(
    ...DEFAULT_FILTERS.map((f) =>
      fc.record({
        weight: f.tripUseAll
          ? fc.oneof(
              fc.constant(0),
              fc.double({ min: 0, max: 5, noNaN: true })
            )
          : fc.double({ min: 0, max: 3, noNaN: true }),
        curve: fc.option(fc.constantFrom(...CURVE_CHOICES), { nil: undefined }),
      })
    )
  )
  .map((mods) =>
    DEFAULT_FILTERS.map((f, i) => ({
      ...f,
      weight: mods[i].weight,
      ...(mods[i].curve
        ? { scoreName: mods[i].curve, params: defaultParamsFor(mods[i].curve) }
        : {}),
    }))
  );

// One full planTrip input. Start hours, budgets, circular flags, and selections
// are generated PER DAY SLOT (length 7, sliced to the day count) — the app
// passes per-slot arrays too.
export type PlanInput = {
  pool: Activity[];
  days: number[];
  startHours: number[];
  endHours: number[];
  selections: Selection[];
  filters: Filter[];
  circulars: boolean[];
};

function arbInputWith(poolArb: fc.Arbitrary<Activity[]>): fc.Arbitrary<PlanInput> {
  return fc
    .record({
      pool: poolArb,
      days: arbDays,
      starts: fc.array(fc.integer({ min: 7, max: 14 }), { minLength: 7, maxLength: 7 }),
      budgets: fc.array(fc.integer({ min: 4, max: 14 }), { minLength: 7, maxLength: 7 }),
      circs: fc.array(fc.boolean(), { minLength: 7, maxLength: 7 }),
      sels: fc.array(arbSelection, { minLength: 7, maxLength: 7 }),
      filters: arbFilters,
    })
    .map(({ pool, days, starts, budgets, circs, sels, filters }) => {
      const D = days.length;
      const startHours = starts.slice(0, D);
      const endHours = startHours.map((s, i) => s + budgets[i]);
      return {
        pool,
        days,
        startHours,
        endHours,
        selections: sels.slice(0, D),
        filters,
        circulars: circs.slice(0, D),
      };
    });
}

const arbPlanInput = arbInputWith(arbSmallPool); // exact-planner region
const arbLargeInput = arbInputWith(arbLargePool); // heuristic region
const arbAnyInput = fc.oneof(
  { weight: 3, arbitrary: arbPlanInput },
  { weight: 1, arbitrary: arbLargeInput }
);

const runPlan = (input: PlanInput): Trip =>
  planTrip(
    input.pool,
    input.days,
    input.startHours,
    input.endHours,
    input.selections,
    input.filters,
    input.circulars
  );

// All placed activities across the trip's days.
const placedActivities = (trip: Trip): Activity[] =>
  trip.days.flatMap((d) => d.activities);

// Shared structural assertions for a Trip against its input.
function assertStructure(trip: Trip, input: PlanInput) {
  expect(trip).toBeDefined();
  expect(trip.days).toHaveLength(input.days.length);
  trip.days.forEach((d, slot) => {
    expect(d.day).toBe(input.days[slot]);
    expect(Array.isArray(d.activities)).toBe(true);
    expect(d.activities.length).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(d.score)).toBe(true);
    expect(Number.isFinite(d.load)).toBe(true);
  });
  // Full accounting: placed + leftover covers the pool exactly once.
  const placed = placedActivities(trip);
  expect(placed.length + trip.leftover.length).toBe(input.pool.length);
  for (const l of trip.leftover) {
    expect(["closed", "no-room", "score", "removed", "bumped"]).toContain(l.reason);
  }
  expect(Number.isFinite(trip.score)).toBe(true);
  expect(Number.isFinite(trip.dayAverage)).toBe(true);
  // The reported score is the day average + the use-all contribution.
  expect(
    Math.abs(trip.score - (trip.dayAverage + (trip.useAll?.contribution ?? 0)))
  ).toBeLessThan(EPS);
  // Exactness is exactly what the budget gate predicts.
  expect(trip.exact).toBe(isExactWithinBudget(input.days.length, input.pool.length));
  expect(trip.elapsedMs).toBeGreaterThanOrEqual(0);
}

// =============================================================================
// Section B — Property tests (fast-check × Vitest concurrent)
// =============================================================================

describe.concurrent("Trip Planner — Property Tests", () => {
  test.concurrent("always returns a structurally valid plan", async () => {
    fc.assert(
      fc.property(arbAnyInput, (input) => {
        const trip = runPlan(input);
        assertStructure(trip, input);
        // Ranked alternatives (exact mode only) are themselves valid trips over
        // the same pool, sorted best-first, and secondBest names the runner-up.
        for (const alt of trip.alternatives) {
          const altPlaced = placedActivities(alt);
          expect(altPlaced.length + alt.leftover.length).toBe(input.pool.length);
          expect(alt.score).toBeLessThanOrEqual(trip.score + EPS);
          expect(alt.alternatives).toHaveLength(0);
        }
        if (trip.alternatives.length > 0 && trip.secondBest !== null) {
          expect(Math.abs(trip.secondBest - trip.alternatives[0].score)).toBeLessThan(EPS);
        }
      }),
      { numRuns: 300, seed: 42 }
    );
  });

  test.concurrent(
    "every placed activity comes from the pool, and none is placed twice",
    async () => {
      fc.assert(
        fc.property(arbAnyInput, (input) => {
          const trip = runPlan(input);
          const poolSet = new Set(input.pool);
          const seen = new Set<Activity>();
          for (const day of trip.days) {
            const dayNames = day.activities.map((a) => a.name);
            // no duplicates within a single day
            expect(new Set(dayNames).size).toBe(dayNames.length);
            for (const act of day.activities) {
              // identity: the exact pool object, not a copy or an invention
              expect(poolSet.has(act)).toBe(true);
              // no duplicates ACROSS days either
              expect(seen.has(act)).toBe(false);
              seen.add(act);
            }
          }
          // leftovers are pool members too, and never also placed
          for (const l of trip.leftover) {
            expect(poolSet.has(l.activity)).toBe(true);
            expect(seen.has(l.activity)).toBe(false);
          }
        }),
        { numRuns: 300, seed: 42 }
      );
    }
  );

  test.concurrent(
    "every day's itinerary is legal: opening hours, required lunch, day budget",
    async () => {
      fc.assert(
        fc.property(arbAnyInput, (input) => {
          const trip = runPlan(input);
          trip.days.forEach((day, slot) => {
            const plan = day.plan;
            expect(plan.feasible).toBe(true);
            // Day budget: the itinerary ends by the slot's end hour and never
            // starts before its start hour.
            expect(plan.endsAt).toBeLessThanOrEqual(input.endHours[slot] + EPS);
            for (const item of plan.items) {
              expect(item.start).toBeGreaterThanOrEqual(input.startHours[slot] - EPS);
              expect(item.end).toBeLessThanOrEqual(input.endHours[slot] + EPS);
              expect(item.closed).toBe(false);
            }
            // Opening windows: every non-lunch item sits inside its activity's
            // window for that weekday (and the activity is open that day).
            const byName = new Map(day.activities.map((a) => [a.name, a]));
            for (const item of plan.items) {
              if (item.lunch && item.name === LUNCH_NAME) continue; // generic break
              const act = byName.get(item.name);
              expect(act, `scheduled item ${item.name} must be a placed activity`).toBeDefined();
              const h = dayHours(act!, day.day);
              expect(isClosedDay(h)).toBe(false);
              expect(item.start).toBeGreaterThanOrEqual(h.open - EPS);
              expect(item.end).toBeLessThanOrEqual(h.close + EPS);
            }
            // Lunch rule: 2+ activity days carry exactly one lunch slot that
            // starts by 4 PM; single-activity and empty days carry none.
            const lunches = plan.items.filter((i) => i.lunch);
            if (day.activities.length >= 2) {
              expect(lunches).toHaveLength(1);
              expect(lunches[0].start).toBeLessThanOrEqual(LUNCH_CLOSE + EPS);
            } else {
              expect(lunches).toHaveLength(0);
            }
            // The scheduled stops are exactly the day's activities (plus the
            // generic break, when the lunch isn't a foodie activity).
            const scheduledNames = plan.items
              .filter((i) => !(i.lunch && i.name === LUNCH_NAME))
              .map((i) => i.name)
              .sort();
            expect(scheduledNames).toEqual(
              day.activities.map((a) => a.name).sort()
            );
          });
        }),
        { numRuns: 300, seed: 42 }
      );
    }
  );

  test.concurrent(
    "leftover reasons are truthful: 'closed' exactly when shut on every chosen day",
    async () => {
      fc.assert(
        fc.property(arbAnyInput, (input) => {
          const trip = runPlan(input);
          for (const l of trip.leftover) {
            const openSomewhere = input.days.some(
              (d) => !isClosedDay(dayHours(l.activity, d))
            );
            if (l.reason === "closed") expect(openSomewhere).toBe(false);
            else expect(openSomewhere).toBe(true);
          }
          // And nothing PLACED is ever scheduled on a day it's closed.
          trip.days.forEach((day) => {
            for (const act of day.activities) {
              expect(isClosedDay(dayHours(act, day.day))).toBe(false);
            }
          });
        }),
        { numRuns: 300, seed: 99 }
      );
    }
  );

  test.concurrent(
    "day scores follow the active filters: comboScore (+ a non-negative route bonus on 3+ stop days)",
    async () => {
      fc.assert(
        fc.property(arbPlanInput, (input) => {
          const trip = runPlan(input);
          trip.days.forEach((day, slot) => {
            if (day.activities.length === 0) {
              expect(day.score).toBe(0);
              return;
            }
            const base = comboScore(day.activities, input.selections[slot], input.filters);
            if (day.activities.length < 3) {
              // No route bonus below 3 stops: the day score IS the combo score.
              expect(Math.abs(day.score - base)).toBeLessThan(EPS);
            } else {
              // 3+ stops earn LINEARITY_WEIGHT × linearity (0..10) on top.
              expect(day.score).toBeGreaterThanOrEqual(base - EPS);
              expect(day.score).toBeLessThanOrEqual(base + 10 + EPS);
            }
          });
          // dayAverage really is the mean of the day scores.
          const mean =
            trip.days.reduce((s, d) => s + d.score, 0) / (trip.days.length || 1);
          expect(Math.abs(trip.dayAverage - mean)).toBeLessThan(EPS);
        }),
        { numRuns: 300, seed: 42 }
      );
    }
  );

  test.concurrent("completes within 1500ms for any valid input", async () => {
    fc.assert(
      fc.property(arbAnyInput, (input) => {
        const start = performance.now();
        runPlan(input);
        const elapsed = performance.now() - start;
        expect(elapsed).toBeLessThan(1500);
      }),
      { numRuns: 200, seed: 42 }
    );
  });

  test.concurrent("does not mutate any of its inputs", async () => {
    fc.assert(
      fc.property(arbAnyInput, (input) => {
        const snapshot = JSON.stringify({
          pool: input.pool,
          days: input.days,
          startHours: input.startHours,
          endHours: input.endHours,
          selections: input.selections,
          circulars: input.circulars,
          // filters hold functions (skipped by JSON) — snapshot the data knobs
          filters: input.filters.map((f) => ({
            name: f.name,
            weight: f.weight,
            scoreName: f.scoreName,
            params: f.params,
            targets: f.options.map((o) => o.target),
          })),
        });
        runPlan(input);
        expect(
          JSON.stringify({
            pool: input.pool,
            days: input.days,
            startHours: input.startHours,
            endHours: input.endHours,
            selections: input.selections,
            circulars: input.circulars,
            filters: input.filters.map((f) => ({
              name: f.name,
              weight: f.weight,
              scoreName: f.scoreName,
              params: f.params,
              targets: f.options.map((o) => o.target),
            })),
          })
        ).toBe(snapshot);
      }),
      { numRuns: 200, seed: 42 }
    );
  });

  test.concurrent("is deterministic for identical inputs", async () => {
    fc.assert(
      fc.property(arbAnyInput, (input) => {
        const a = runPlan(input);
        const b = runPlan(input);
        expect(Math.abs(a.score - b.score)).toBeLessThan(EPS);
        expect(
          a.days.map((d) => d.activities.map((x) => x.name))
        ).toEqual(b.days.map((d) => d.activities.map((x) => x.name)));
        expect(a.leftover.map((l) => l.reason)).toEqual(
          b.leftover.map((l) => l.reason)
        );
      }),
      { numRuns: 200, seed: 42 }
    );
  });

  test.concurrent(
    "the three base exact planners agree on the global optimum",
    async () => {
      // Small pools/days keep the (D+1)^n exhaustive baseline cheap.
      const arbTiny = arbInputWith(poolOf(1, 5)).map((inp) => ({
        ...inp,
        days: inp.days.slice(0, 2),
        startHours: inp.startHours.slice(0, Math.min(2, inp.days.length)),
        endHours: inp.endHours.slice(0, Math.min(2, inp.days.length)),
        selections: inp.selections.slice(0, Math.min(2, inp.days.length)),
        circulars: inp.circulars.slice(0, Math.min(2, inp.days.length)),
      }));
      fc.assert(
        fc.property(arbTiny, (input) => {
          const D = Math.min(2, input.days.length);
          const days = input.days.slice(0, D);
          const args = [
            input.pool,
            days,
            input.startHours.slice(0, D),
            input.endHours.slice(0, D),
            input.selections.slice(0, D),
            input.filters,
            input.circulars.slice(0, D),
          ] as const;
          const exhaustive = PLANNERS.planExhaustive(...args);
          const pruned = PLANNERS.planPruned(...args);
          const dp = PLANNERS.planSubsetDP(...args);
          expect(Math.abs(pruned.score - exhaustive.score)).toBeLessThan(EPS);
          expect(Math.abs(dp.score - exhaustive.score)).toBeLessThan(EPS);
          expect(Math.abs(dp.dayAverage - exhaustive.dayAverage)).toBeLessThan(EPS);
          // And the exact optimum never loses to the greedy heuristic.
          const greedy = planHeuristic(...args);
          expect(dp.score).toBeGreaterThanOrEqual(greedy.score - EPS);
        }),
        { numRuns: 300, seed: 42 }
      );
    }
  );

  test.concurrent(
    "heuristic mode respects the per-day activity cap",
    async () => {
      fc.assert(
        fc.property(arbLargeInput, (input) => {
          const trip = runPlan(input);
          if (!trip.exact) {
            for (const day of trip.days) {
              expect(day.activities.length).toBeLessThanOrEqual(MAX_DAY_ACTIVITIES);
            }
          }
        }),
        { numRuns: 100, seed: 99 }
      );
    }
  );
});

// =============================================================================
// Section C — Hand-crafted edge cases (concurrent)
// =============================================================================

// A fixed, realistic activity (open all week) for deterministic edges.
function fixedActivity(i: number, over: Partial<Activity> = {}): Activity {
  const lat = 41.88 + i * 0.004;
  const lng = 12.45 + i * 0.004;
  return {
    name: `E${i}@${lat.toFixed(3)},${lng.toFixed(3)}`,
    description: "",
    hours: 2,
    cost: 15,
    coords: { lat, lng },
    program: Array.from({ length: 7 }, () => ({ open: 8, close: 22 })),
    cultural: 6,
    foodie: 5,
    adventurous: 4,
    relaxing: 5,
    priority: 6,
    ...EMPTY_ACTIVITY_META,
    ...over,
  };
}

const CLOSED_WEEK = Array.from({ length: 7 }, () => ({ open: 0, close: 0 }));

// Uniform planTrip call with the real DEFAULT_FILTERS + a given selection.
function planWith(
  pool: Activity[],
  days: number[],
  selection: Selection,
  start = 9,
  budget?: number
): Trip {
  const filters = DEFAULT_FILTERS;
  const startHours = days.map(() => start);
  const endHours = days.map(
    () => (budget !== undefined ? start + budget : scheduleEndHour(filters, selection, start))
  );
  const selections = days.map(() => selection);
  return planTrip(pool, days, startHours, endHours, selections, filters);
}

describe.concurrent("Trip Planner — Edge Cases", () => {
  const sel = defaultSelection(DEFAULT_FILTERS);

  test.concurrent("1 day trip places at least one open activity", async () => {
    const pool = Array.from({ length: 5 }, (_, i) => fixedActivity(i));
    const trip = planWith(pool, [0], sel, 9, 12);
    expect(trip.days).toHaveLength(1);
    expect(trip.days[0].plan.feasible).toBe(true);
    expect(placedActivities(trip).length).toBeGreaterThan(0);
  });

  test.concurrent("maximum days: all 7 weekdays stay legal and fast", async () => {
    const pool = Array.from({ length: 10 }, (_, i) => fixedActivity(i));
    const t0 = performance.now();
    const trip = planWith(pool, [0, 1, 2, 3, 4, 5, 6], sel, 9, 12);
    expect(performance.now() - t0).toBeLessThan(3000);
    expect(trip.days).toHaveLength(7);
    expect(trip.days.every((d) => d.plan.feasible)).toBe(true);
    const names = placedActivities(trip).map((a) => a.name);
    expect(new Set(names).size).toBe(names.length);
  });

  test.concurrent("all filters active simultaneously (every option selected)", async () => {
    const allSel: Selection = Object.fromEntries(
      DEFAULT_FILTERS.map((f, i) => [
        i,
        f.multi ? f.options.map((_, oi) => oi) : [0],
      ])
    );
    const pool = Array.from({ length: 8 }, (_, i) => fixedActivity(i));
    const trip = planWith(pool, [0, 1], allSel, 9, 12);
    expect(trip.days.every((d) => d.plan.feasible)).toBe(true);
    expect(Number.isFinite(trip.score)).toBe(true);
  });

  test.concurrent("no filters at all (blank slate) still yields a valid trip", async () => {
    const pool = Array.from({ length: 5 }, (_, i) => fixedActivity(i));
    const trip = planTrip(pool, [0, 1], [9, 9], [21, 21], [{}, {}], []);
    expect(trip.days).toHaveLength(2);
    expect(trip.days.every((d) => d.plan.feasible)).toBe(true);
    expect(trip.score).toBe(0); // nothing scores, so the objective is flat 0
  });

  test.concurrent("filters leaving very few matches: only one activity open", async () => {
    // Everything closed on Monday except one — the planner may only place that one.
    const open = fixedActivity(0);
    const shut = Array.from({ length: 5 }, (_, i) =>
      fixedActivity(i + 1, { program: CLOSED_WEEK })
    );
    const trip = planWith([open, ...shut], [0], sel, 9, 12);
    const placed = placedActivities(trip);
    expect(placed.length).toBeLessThanOrEqual(1);
    for (const l of trip.leftover) {
      if (l.activity !== open) expect(l.reason).toBe("closed");
    }
  });

  test.concurrent("zero matching activities: graceful all-leftover trip", async () => {
    const pool = Array.from({ length: 4 }, (_, i) =>
      fixedActivity(i, { program: CLOSED_WEEK })
    );
    const trip = planWith(pool, [0, 1], sel, 9, 12);
    expect(placedActivities(trip)).toHaveLength(0);
    expect(trip.leftover).toHaveLength(4);
    expect(trip.leftover.every((l) => l.reason === "closed")).toBe(true);
    expect(trip.days.every((d) => d.plan.feasible)).toBe(true);
    expect(trip.score).toBeDefined();
    expect(Number.isFinite(trip.score)).toBe(true);
  });

  test.concurrent("tight budget: a 4h day can hold at most one 2h activity (lunch rule)", async () => {
    // Two activities need a 3h lunch too: 2+2+3 = 7h > 4h, so max one per day.
    const pool = Array.from({ length: 4 }, (_, i) => fixedActivity(i));
    const trip = planWith(pool, [0, 1], sel, 9, 4);
    for (const day of trip.days) {
      expect(day.activities.length).toBeLessThanOrEqual(1);
      expect(day.plan.feasible).toBe(true);
    }
  });

  test.concurrent("sparse pool: a single activity over a week is placed once", async () => {
    const trip = planWith([fixedActivity(0)], [0, 1, 2, 3, 4, 5, 6], sel, 9, 12);
    expect(placedActivities(trip)).toHaveLength(1);
    expect(trip.leftover).toHaveLength(0);
  });

  test.concurrent("large pool: the full 50-activity catalogue over 7 days (heuristic)", async () => {
    const days = [0, 1, 2, 3, 4, 5, 6];
    const startHours = days.map(() => 9);
    const endHours = days.map(() => scheduleEndHour(DEFAULT_FILTERS, sel, 9));
    const selections = days.map(() => sel);
    const t0 = performance.now();
    const trip = planTrip(ACTIVITIES, days, startHours, endHours, selections, DEFAULT_FILTERS);
    expect(performance.now() - t0).toBeLessThan(3000);
    expect(trip.exact).toBe(false);
    expect(trip.days.every((d) => d.plan.feasible)).toBe(true);
    const names = placedActivities(trip).map((a) => a.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names.length + trip.leftover.length).toBe(ACTIVITIES.length);
  });

  test.concurrent("circular days stay legal and scored", async () => {
    const pool = Array.from({ length: 6 }, (_, i) => fixedActivity(i));
    const days = [0, 1];
    const trip = planTrip(
      pool,
      days,
      [9, 9],
      [21, 21],
      [sel, sel],
      DEFAULT_FILTERS,
      [true, true]
    );
    expect(trip.days.every((d) => d.plan.feasible)).toBe(true);
    expect(Number.isFinite(trip.score)).toBe(true);
  });

  test.concurrent("empty pool: clean empty trip", async () => {
    const trip = planWith([], [0, 1, 2], sel, 9, 12);
    expect(trip.days).toHaveLength(3);
    expect(placedActivities(trip)).toHaveLength(0);
    expect(trip.leftover).toHaveLength(0);
    expect(trip.score).toBe(0);
  });
});

// Party size changes engine module state (pricing), so these run SEQUENTIALLY
// and restore the default party synchronously — no awaits between set/solve.
describe("Trip Planner — traveller party (module state, sequential)", () => {
  const sel = defaultSelection(DEFAULT_FILTERS);
  const pool = Array.from({ length: 6 }, (_, i) => fixedActivity(i));

  test("1 person and a 20-person party both plan valid trips", () => {
    const before = getActiveParty();
    try {
      for (const party of [
        { adults: 1, childAges: [] as number[] },
        { adults: 20, childAges: [] as number[] },
        { adults: 2, childAges: [4, 9] },
      ]) {
        setActiveParty(party);
        const trip = planWith(pool, [0, 1], sel, 9, 12);
        expect(trip.days.every((d) => d.plan.feasible)).toBe(true);
        expect(Number.isFinite(trip.score)).toBe(true);
      }
    } finally {
      setActiveParty(before);
    }
  });
});

// =============================================================================
// Section D — Concurrent load test (stateless under simultaneous calls)
// =============================================================================

test("50 simultaneous plan generations complete correctly", async () => {
  const sel = defaultSelection(DEFAULT_FILTERS);
  const inputs = Array.from({ length: 50 }, (_, i) => {
    const pool = ACTIVITIES.slice(i % 40, (i % 40) + 6 + (i % 3)); // 6..8 activities
    const days = Array.from({ length: (i % 3) + 1 }, (_, d) => (d + i) % 7);
    const startHours = days.map(() => 8 + (i % 4));
    const endHours = startHours.map((s) => s + 10 + (i % 3));
    const selections = days.map(() => sel);
    return { pool, days, startHours, endHours, selections };
  });

  const start = performance.now();
  const results = await Promise.all(
    inputs.map((inp) =>
      Promise.resolve().then(() =>
        planTrip(inp.pool, inp.days, inp.startHours, inp.endHours, inp.selections, DEFAULT_FILTERS)
      )
    )
  );
  const elapsed = performance.now() - start;

  expect(results).toHaveLength(50);
  results.forEach((trip, i) => {
    expect(trip).toBeDefined();
    expect(trip.days).toHaveLength(inputs[i].days.length);
    expect(trip.days.every((d) => d.plan.feasible)).toBe(true);
    const names = placedActivities(trip).map((a) => a.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names.length + trip.leftover.length).toBe(inputs[i].pool.length);
  });
  expect(elapsed).toBeLessThan(5000);
});
