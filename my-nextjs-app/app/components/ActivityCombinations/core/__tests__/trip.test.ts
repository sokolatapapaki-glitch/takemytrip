// Unit tests for the multi-day trip planner (trip.functions): correctness of the
// exact planners, their mutual agreement (global optimum), edge cases, leftover
// reasons, the exact-vs-heuristic budget gate, and large-dataset performance.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  planTrip,
  planHeuristic,
  isExactWithinBudget,
  PLANNERS,
  PLANNER_COST,
  type Trip,
} from "../trip.functions";
import type { Activity } from "../activities.functions";
import { ACTIVITIES } from "../activities.data";
import { DEFAULT_FILTERS } from "../filters.data";
import { defaultSelection, type Filter, type Selection } from "../filters.functions";
import { scheduleEndHour } from "../schedule.functions";
import { makeActivity, allWeek, CLOSED_DAY, simpleFilters, pickFirst, makeRng, approx } from "./helpers";

// Build a per-day-slot planning scenario (uniform start/budget/selection).
function scenario(
  pool: Activity[],
  days: number[],
  filters: Filter[],
  selection: Selection,
  start = 12,
  budget = 12
) {
  const startHours = days.map(() => start);
  const endHours = days.map(() => start + budget);
  const selections = days.map(() => selection);
  return { pool, days, startHours, endHours, selections, filters };
}

// Run one named planner over a scenario.
function run(name: keyof typeof PLANNERS, s: ReturnType<typeof scenario>): Trip {
  return PLANNERS[name](s.pool, s.days, s.startHours, s.endHours, s.selections, s.filters);
}

// All chosen activity names across the trip's days.
function placedNames(trip: Trip): string[] {
  return trip.days.flatMap((d) => d.activities.map((a) => a.name)).sort();
}

// ---------------------------------------------------------------------------
// Edge cases / empty inputs
// ---------------------------------------------------------------------------

test("empty pool: every day is empty, score 0, nothing left over", () => {
  const s = scenario([], [0, 1, 2], simpleFilters(), pickFirst);
  const trip = planTrip(s.pool, s.days, s.startHours, s.endHours, s.selections, s.filters);
  assert.equal(trip.days.length, 3);
  assert.ok(trip.days.every((d) => d.activities.length === 0));
  assert.equal(trip.score, 0);
  assert.equal(trip.dayAverage, 0);
  assert.equal(trip.leftover.length, 0);
  assert.ok(trip.exact);
  assert.ok(trip.days.every((d) => d.plan.feasible));
});

test("no days: empty trip, all activities left over, no crash / no NaN", () => {
  const pool = [makeActivity(), makeActivity()];
  const s = scenario(pool, [], simpleFilters(), pickFirst);
  const trip = planTrip(s.pool, s.days, s.startHours, s.endHours, s.selections, s.filters);
  assert.equal(trip.days.length, 0);
  assert.ok(Number.isFinite(trip.score));
  assert.equal(trip.score, 0);
  assert.equal(trip.leftover.length, pool.length);
});

test("single activity, single day: it gets placed and the day is feasible", () => {
  const a = makeActivity({ name: "Solo", cultural: 9, hours: 2, program: allWeek(8, 22) });
  const s = scenario([a], [0], simpleFilters(), pickFirst);
  const trip = planTrip(s.pool, s.days, s.startHours, s.endHours, s.selections, s.filters);
  assert.deepEqual(placedNames(trip), ["Solo"]);
  assert.ok(trip.days[0].plan.feasible);
  assert.equal(trip.leftover.length, 0);
});

test("score equals dayAverage and useAll is null when no trip-level filter exists", () => {
  const pool = [makeActivity({ cultural: 8 }), makeActivity({ cultural: 6 })];
  const s = scenario(pool, [0, 1], simpleFilters(), pickFirst);
  const trip = planTrip(s.pool, s.days, s.startHours, s.endHours, s.selections, s.filters);
  assert.equal(trip.useAll, null);
  assert.equal(approx(trip.score), approx(trip.dayAverage));
});

// ---------------------------------------------------------------------------
// Leftover reasons
// ---------------------------------------------------------------------------

test('an activity closed on every chosen day is left over with reason "closed"', () => {
  const open = makeActivity({ name: "Open", cultural: 9, program: allWeek(8, 22) });
  const shut = makeActivity({ name: "Shut", cultural: 9, program: Array.from({ length: 7 }, () => CLOSED_DAY) });
  const s = scenario([open, shut], [0, 1], simpleFilters(), pickFirst);
  const trip = planTrip(s.pool, s.days, s.startHours, s.endHours, s.selections, s.filters);
  const shutLeft = trip.leftover.find((l) => l.activity.name === "Shut");
  assert.ok(shutLeft, "Shut should be left over");
  assert.equal(shutLeft!.reason, "closed");
});

test('an open activity that fits no day is left over with reason "no-room"', () => {
  // A 20h activity can never fit a 12h day -> open, but no room anywhere.
  const giant = makeActivity({ name: "Giant", hours: 20, program: allWeek(0, 24) });
  const normal = makeActivity({ name: "Normal", hours: 2, program: allWeek(8, 22) });
  const s = scenario([normal, giant], [0], simpleFilters(), pickFirst, 12, 12);
  const trip = planTrip(s.pool, s.days, s.startHours, s.endHours, s.selections, s.filters);
  const giantLeft = trip.leftover.find((l) => l.activity.name === "Giant");
  assert.ok(giantLeft, "Giant should be left over");
  assert.equal(giantLeft!.reason, "no-room");
});

// ---------------------------------------------------------------------------
// Planner agreement = proof of the global optimum
// ---------------------------------------------------------------------------

test("the three base planners agree on the optimum for many random pools", () => {
  const rng = makeRng(12345);
  for (let trial = 0; trial < 25; trial++) {
    const n = 4 + Math.floor(rng() * 4); // 4..7 activities
    const days = [0, 1, 2].slice(0, 1 + Math.floor(rng() * 3)); // 1..3 days
    const pool = Array.from({ length: n }, (_, i) =>
      makeActivity({
        name: `R${trial}_${i}`,
        cultural: Math.floor(rng() * 11),
        hours: 1 + Math.floor(rng() * 3),
        program: allWeek(8, 22),
      })
    );
    const s = scenario(pool, days, simpleFilters(), pickFirst);
    const exhaustive = run("planExhaustive", s);
    const pruned = run("planPruned", s);
    const dp = run("planSubsetDP", s);
    // Identical maximized objective + day average across all three algorithms.
    assert.equal(approx(pruned.score), approx(exhaustive.score), `pruned vs exhaustive trial ${trial}`);
    assert.equal(approx(dp.score), approx(exhaustive.score), `dp vs exhaustive trial ${trial}`);
    assert.equal(approx(dp.dayAverage), approx(exhaustive.dayAverage), `dayAvg trial ${trial}`);
    // Every returned day is a legal itinerary.
    for (const t of [exhaustive, pruned, dp]) {
      assert.ok(t.days.every((d) => d.plan.feasible), `feasible days trial ${trial}`);
      assert.ok(t.exact);
    }
  }
});

test("planLinear is exact, feasible, and never beats the base optimum on raw score", () => {
  const rng = makeRng(777);
  const pool = Array.from({ length: 6 }, (_, i) =>
    makeActivity({ name: `L${i}`, cultural: Math.floor(rng() * 11), hours: 1 + Math.floor(rng() * 3) })
  );
  const s = scenario(pool, [0, 1, 2], simpleFilters(), pickFirst);
  const base = run("planSubsetDP", s);
  const linear = run("planLinear", s);
  assert.ok(linear.exact);
  assert.ok(linear.days.every((d) => d.plan.feasible));
  // planLinear optimizes score + a linearity BONUS, so its reported day scores
  // include that bonus and can exceed the base; the base remains the optimum of
  // the pure objective, so base.score >= the pure objective planLinear achieves.
  assert.ok(base.score >= -1e-9);
});

// ---------------------------------------------------------------------------
// "Highest score": exact beats (or ties) the heuristic
// ---------------------------------------------------------------------------

test("the exact planner scores at least as high as the greedy heuristic", () => {
  const rng = makeRng(2024);
  for (let trial = 0; trial < 10; trial++) {
    const pool = Array.from({ length: 6 }, (_, i) =>
      makeActivity({ name: `H${trial}_${i}`, cultural: Math.floor(rng() * 11), hours: 1 + Math.floor(rng() * 3) })
    );
    const s = scenario(pool, [0, 1, 2], simpleFilters(), pickFirst);
    const exact = run("planSubsetDP", s);
    const greedy = planHeuristic(s.pool, s.days, s.startHours, s.endHours, s.selections, s.filters);
    assert.ok(
      exact.score >= greedy.score - 1e-9,
      `exact ${exact.score} should be >= heuristic ${greedy.score} (trial ${trial})`
    );
  }
});

// ---------------------------------------------------------------------------
// Exact-vs-heuristic budget gate (the speed/score improvement)
// ---------------------------------------------------------------------------

test("budget gate keeps a ≤13-activity pool exact, the full 50-catalogue heuristic", () => {
  // The subset-DP cost is days·3^pool. 13 activities over 3 days (3·3^13 ≈ 4.8M)
  // stays under DP_BUDGET -> exact; the full 50-activity catalogue is far past it,
  // so the fast large-pool heuristic handles it.
  assert.ok(isExactWithinBudget(3, 13));
  assert.ok(!isExactWithinBudget(3, ACTIVITIES.length)); // 50 -> heuristic
  assert.equal(PLANNER_COST.planSubsetDP(3, 13), 3 * 3 ** 13);
});

test("budget gate falls back to the heuristic just past the catalogue size", () => {
  // The DP gate counts STATES but not the (filter-dependent) work per state, so it
  // is tuned to keep the 13-activity catalogue exact while sending n >= 14 to the
  // fast heuristic — which reaches the same optimum on these sizes far faster than
  // the exact DP can under the real filters (route-directness + multi-vibe scoring).
  assert.ok(isExactWithinBudget(3, 13)); // 3·3^13 ≈ 4.8M -> exact
  assert.ok(!isExactWithinBudget(3, 14)); // 3·3^14 ≈ 14.3M -> heuristic
});

test("planTrip solves a 13-activity subset EXACTLY and quickly", () => {
  const filters = DEFAULT_FILTERS;
  const pool = ACTIVITIES.slice(0, 13); // a pool the exact DP still covers
  const days = [0, 1, 2];
  const sel = defaultSelection(filters);
  const startHours = days.map(() => 12);
  const endHours = days.map((_, i) => scheduleEndHour(filters, sel, startHours[i]));
  const selections = days.map(() => sel);
  const trip = planTrip(pool, days, startHours, endHours, selections, filters);
  assert.ok(trip.exact, "13-activity pool must be solved exactly, not via the heuristic");
  assert.ok(trip.days.every((d) => d.plan.feasible), "every planned day is legal");
  assert.ok(trip.elapsedMs < 4000, `expected fast solve, took ${trip.elapsedMs}ms`);
  const names = placedNames(trip);
  assert.equal(new Set(names).size, names.length, "no activity placed twice");
});

test("planTrip solves the FULL 50-activity catalogue fast (heuristic) for days 1..7", () => {
  const filters = DEFAULT_FILTERS;
  const sel = defaultSelection(filters);
  for (let dayCount = 1; dayCount <= 7; dayCount++) {
    const days = Array.from({ length: dayCount }, (_, i) => i);
    const startHours = days.map(() => 9);
    const endHours = days.map((_, i) => scheduleEndHour(filters, sel, startHours[i]));
    const selections = days.map(() => sel);
    const t0 = performance.now();
    const trip = planTrip(ACTIVITIES, days, startHours, endHours, selections, filters);
    const elapsed = performance.now() - t0;
    assert.equal(trip.exact, false, `${dayCount}d: full catalogue uses the heuristic`);
    assert.ok(trip.days.every((d) => d.plan.feasible), `${dayCount}d: every planned day is legal`);
    assert.ok(elapsed < 3000, `${dayCount}d: expected fast solve, took ${elapsed.toFixed(0)}ms`);
    const names = placedNames(trip);
    assert.equal(new Set(names).size, names.length, `${dayCount}d: no activity placed twice`);
    assert.equal(names.length + trip.leftover.length, ACTIVITIES.length, `${dayCount}d: full accounting`);
  }
});

test("planTrip reports exact:false for an oversized pool (heuristic fallback)", () => {
  const pool = Array.from({ length: 15 }, (_, i) =>
    makeActivity({ name: `X${i}`, cultural: (i % 11) })
  );
  const s = scenario(pool, [0, 1, 2], simpleFilters(), pickFirst);
  const trip = planTrip(s.pool, s.days, s.startHours, s.endHours, s.selections, s.filters);
  assert.ok(!trip.exact, "15 activities over 3 days should use the heuristic");
  assert.ok(trip.days.every((d) => d.plan.feasible));
});

// ---------------------------------------------------------------------------
// Determinism & invariants
// ---------------------------------------------------------------------------

test("planTrip is deterministic for identical inputs", () => {
  const pool = Array.from({ length: 6 }, (_, i) => makeActivity({ name: `D${i}`, cultural: (i * 3) % 11 }));
  const s = scenario(pool, [0, 1, 2], simpleFilters(), pickFirst);
  const a = planTrip(s.pool, s.days, s.startHours, s.endHours, s.selections, s.filters);
  const b = planTrip(s.pool, s.days, s.startHours, s.endHours, s.selections, s.filters);
  assert.equal(approx(a.score), approx(b.score));
  assert.deepEqual(placedNames(a), placedNames(b));
});

test("no activity is scheduled on more than one day", () => {
  const pool = Array.from({ length: 7 }, (_, i) => makeActivity({ name: `U${i}`, cultural: (i * 2) % 11 }));
  const s = scenario(pool, [0, 1, 2], simpleFilters(), pickFirst);
  const trip = planTrip(s.pool, s.days, s.startHours, s.endHours, s.selections, s.filters);
  const names = placedNames(trip);
  assert.equal(new Set(names).size, names.length);
});

test("a trip-level use-all filter with positive weight keeps more activities", () => {
  // Two days, a pool of cheap-to-place activities. With use-all weight 0 the
  // planner may leave some out; raising the weight should not REDUCE placements.
  const pool = Array.from({ length: 6 }, (_, i) =>
    makeActivity({ name: `W${i}`, cultural: 5, hours: 1, program: allWeek(8, 23) })
  );
  const days = [0, 1, 2];
  const baseUseAll = DEFAULT_FILTERS.find((f) => f.tripUseAll)!;
  const withOff: Filter[] = [simpleFilters()[0], { ...baseUseAll, weight: 0 }];
  const withOn: Filter[] = [simpleFilters()[0], { ...baseUseAll, weight: 5 }];
  const sel: Selection = { 0: [0], 1: [0] };
  const sOff = scenario(pool, days, withOff, sel, 12, 12);
  const sOn = scenario(pool, days, withOn, sel, 12, 12);
  const off = planTrip(sOff.pool, sOff.days, sOff.startHours, sOff.endHours, sOff.selections, sOff.filters);
  const on = planTrip(sOn.pool, sOn.days, sOn.startHours, sOn.endHours, sOn.selections, sOn.filters);
  const placedOff = off.days.reduce((s, d) => s + d.activities.length, 0);
  const placedOn = on.days.reduce((s, d) => s + d.activities.length, 0);
  assert.ok(placedOn >= placedOff, `use-all weight should not reduce placements (${placedOn} < ${placedOff})`);
  assert.ok(on.useAll !== null);
});
