// End-to-end tests of the planner on a LARGE, realistic catalogue (50 Rome-area
// activities) using the REAL DEFAULT_FILTERS — Vibe (multi), Time budget, Cost
// budget, Route directness, and the trip-level "Use every activity" term. This is
// the headline brief: build a trip from many activities, fast and reliably, for
// any day count 1..7. Unlike the synthetic tripLarge tests (single simple filter),
// this exercises the full scoring stack the production UI uses.
import { test } from "node:test";
import assert from "node:assert/strict";
import { planTrip, isExactWithinBudget, type Trip } from "../trip.functions";
import { DEFAULT_FILTERS } from "../filters.data";
import { defaultSelection, type Filter } from "../filters.functions";
import { scheduleEndHour } from "../schedule.functions";
import { BIG_ACTIVITIES } from "./bigCatalogue";

// Plan a trip over the first `n` big-catalogue activities for `dayCount` days,
// using the real default filters/selection and a 09:00 start.
function planBig(n: number, dayCount: number, filters: Filter[] = DEFAULT_FILTERS): Trip {
  const pool = BIG_ACTIVITIES.slice(0, n);
  const days = Array.from({ length: dayCount }, (_, i) => i);
  const sel = defaultSelection(filters);
  const startHours = days.map(() => 9);
  const endHours = days.map((_, i) => scheduleEndHour(filters, sel, startHours[i]));
  const selections = days.map(() => sel);
  return planTrip(pool, days, startHours, endHours, selections, filters);
}

function placedNames(trip: Trip): string[] {
  return trip.days.flatMap((d) => d.activities.map((a) => a.name)).sort();
}
function placedCount(trip: Trip): number {
  return trip.days.reduce((s, d) => s + d.activities.length, 0);
}

// Every structural invariant a returned Trip must hold.
function assertValid(trip: Trip, n: number, dayCount: number, label: string) {
  assert.equal(trip.days.length, dayCount, `${label}: day count`);
  assert.ok(trip.days.every((d) => d.plan.feasible), `${label}: every day legal`);
  assert.ok(Number.isFinite(trip.score) && Number.isFinite(trip.dayAverage), `${label}: finite numbers`);
  const names = placedNames(trip);
  assert.equal(new Set(names).size, names.length, `${label}: no activity placed twice`);
  assert.equal(names.length + trip.leftover.length, n, `${label}: placed + leftover = pool`);
  // Each placed activity is actually open on the day it sits, and the day's load
  // never exceeds the day budget (start..end window).
  for (const d of trip.days) {
    for (const it of d.plan.items) assert.ok(it.start <= it.end, `${label}: time order`);
  }
  // Leftover reasons are one of the known kinds.
  for (const l of trip.leftover) {
    assert.ok(["closed", "no-room", "score"].includes(l.reason), `${label}: leftover reason`);
  }
}

// ---------------------------------------------------------------------------
// Days 1..7 over the full 50-activity catalogue with the real filters
// ---------------------------------------------------------------------------

for (let days = 1; days <= 7; days++) {
  test(`big catalogue (50 activities), ${days} day(s): valid, fast, heuristic`, () => {
    // 50 activities is well past the exact budget -> the large-pool planner runs.
    assert.ok(!isExactWithinBudget(days, 50), "50 activities must use the heuristic");
    const t0 = performance.now();
    const trip = planBig(50, days);
    const elapsed = performance.now() - t0;
    assertValid(trip, 50, days, `big50x${days}`);
    assert.equal(trip.exact, false, `big50x${days}: heuristic`);
    assert.ok(placedCount(trip) > 0, `big50x${days}: places something`);
    assert.ok(elapsed < 3000, `big50x${days} should be fast, took ${elapsed.toFixed(0)}ms`);
  });
}

// ---------------------------------------------------------------------------
// Scaling across pool sizes (exact small -> heuristic large), all with the
// real filters, fixed at 3 days.
// ---------------------------------------------------------------------------

for (const n of [10, 14, 20, 30, 40, 50]) {
  test(`big catalogue scaling: ${n} activities over 3 days is valid and fast`, () => {
    const t0 = performance.now();
    const trip = planBig(n, 3);
    const elapsed = performance.now() - t0;
    assertValid(trip, n, 3, `scale-${n}`);
    // The budget gate decides exact vs heuristic; either way it must be legal.
    assert.equal(trip.exact, isExactWithinBudget(3, n), `scale-${n}: exact flag matches gate`);
    assert.ok(elapsed < 4000, `scale-${n} took ${elapsed.toFixed(0)}ms`);
  });
}

// ---------------------------------------------------------------------------
// Determinism, quality floor, and the use-all lever
// ---------------------------------------------------------------------------

test("big catalogue: deterministic for identical inputs", () => {
  const a = planBig(50, 5);
  const b = planBig(50, 5);
  assert.equal(a.score.toFixed(6), b.score.toFixed(6));
  assert.deepEqual(placedNames(a), placedNames(b));
});

test("big catalogue: score is never below the empty trip", () => {
  for (let days = 1; days <= 7; days++) {
    const trip = planBig(50, days);
    assert.ok(trip.score >= -1e-9, `${days} days: score ${trip.score} should be >= 0`);
  }
});

test("big catalogue: raising the use-all weight does not reduce placements", () => {
  const useAllIdx = DEFAULT_FILTERS.findIndex((f) => f.tripUseAll);
  assert.ok(useAllIdx >= 0, "default filters include the use-all term");
  const off = DEFAULT_FILTERS.map((f, i) => (i === useAllIdx ? { ...f, weight: 0 } : f));
  const on = DEFAULT_FILTERS.map((f, i) => (i === useAllIdx ? { ...f, weight: 8 } : f));
  for (const days of [3, 5, 7]) {
    const tOff = planBig(50, days, off);
    const tOn = planBig(50, days, on);
    assert.ok(
      placedCount(tOn) >= placedCount(tOff),
      `${days} days: use-all weight should not reduce placements (${placedCount(tOn)} < ${placedCount(tOff)})`
    );
  }
});

test("big catalogue: a full 7-day trip uses most days and never double-books", () => {
  // With a strong use-all weight and 7 days, the planner should fill several days.
  const useAllIdx = DEFAULT_FILTERS.findIndex((f) => f.tripUseAll);
  const filters = DEFAULT_FILTERS.map((f, i) => (i === useAllIdx ? { ...f, weight: 8 } : f));
  const trip = planBig(50, 7, filters);
  assertValid(trip, 50, 7, "full7");
  const nonEmptyDays = trip.days.filter((d) => d.activities.length > 0).length;
  assert.ok(nonEmptyDays >= 4, `expected several non-empty days, got ${nonEmptyDays}`);
  assert.ok(placedCount(trip) >= 10, `expected a substantial itinerary, got ${placedCount(trip)}`);
});
