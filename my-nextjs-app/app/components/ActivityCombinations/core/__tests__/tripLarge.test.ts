// Unit tests for the LARGE-POOL trip planner (planLargeHeuristic) — the mask-free
// fallback that handles the brief's hard case: up to 50 activities over 1–7 days,
// fast and reliably. Covers correctness invariants, edge/empty inputs, large
// datasets, performance, leftover reasons, the per-day cap, determinism, and that
// it never loses to the trivial empty trip and matches the exact optimum's
// objective on small pools where both can run.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  planTrip,
  planLargeHeuristic,
  isExactWithinBudget,
  MAX_DAY_ACTIVITIES,
  PLANNERS,
  type Trip,
} from "../trip.functions";
import type { Activity } from "../activities.functions";
import { makeActivity, allWeek, CLOSED_DAY, simpleFilters, pickFirst, makeRng, approx } from "./helpers";

// Build a per-day-slot planning scenario (uniform start/budget/selection).
function scenario(
  pool: Activity[],
  days: number[],
  start = 12,
  budget = 12
) {
  const filters = simpleFilters();
  const startHours = days.map(() => start);
  const endHours = days.map(() => start + budget);
  const selections = days.map(() => pickFirst);
  return { pool, days, startHours, endHours, selections, filters };
}

function runLarge(s: ReturnType<typeof scenario>): Trip {
  return planLargeHeuristic(s.pool, s.days, s.startHours, s.endHours, s.selections, s.filters);
}

function placedNames(trip: Trip): string[] {
  return trip.days.flatMap((d) => d.activities.map((a) => a.name)).sort();
}
function placedCount(trip: Trip): number {
  return trip.days.reduce((s, d) => s + d.activities.length, 0);
}
// A trip's identity: the sorted activity names per day. Distinct trips differ here.
function tripSig(trip: Trip): string {
  return trip.days.map((d) => d.activities.map((a) => a.name).sort().join(",")).join("|");
}

// A random-but-reproducible pool of `n` activities, mostly open all week.
function randomPool(rng: () => number, n: number, prefix = "A"): Activity[] {
  return Array.from({ length: n }, (_, i) =>
    makeActivity({
      name: `${prefix}${i}`,
      cultural: Math.floor(rng() * 11),
      hours: 1 + Math.floor(rng() * 3), // 1..3h
      coords: { lat: 41.9 + rng(), lng: 12.5 + rng() },
      program: allWeek(8, 22),
    })
  );
}

// Assert every structural invariant a returned Trip must satisfy.
function assertValidTrip(trip: Trip, days: number[], pool: Activity[], label: string) {
  assert.equal(trip.days.length, days.length, `${label}: day count`);
  assert.ok(trip.days.every((d) => d.plan.feasible), `${label}: every day legal`);
  assert.ok(Number.isFinite(trip.score), `${label}: finite score`);
  assert.ok(Number.isFinite(trip.dayAverage), `${label}: finite dayAverage`);
  const names = placedNames(trip);
  assert.equal(new Set(names).size, names.length, `${label}: no activity placed twice`);
  // Placed + leftover accounts for every activity exactly once.
  assert.equal(names.length + trip.leftover.length, pool.length, `${label}: full accounting`);
  // No day exceeds the per-day cap.
  assert.ok(
    trip.days.every((d) => d.activities.length <= MAX_DAY_ACTIVITIES),
    `${label}: day cap respected`
  );
  // The heuristic always reports exact:false. It MAY now surface ranked
  // alternatives — the best DISTINCT runner-ups found across its multi-start
  // restarts — and each must itself be a structurally valid, distinct trip.
  assert.equal(trip.exact, false, `${label}: exact flag`);
  const bestSig = tripSig(trip);
  const altSigs = new Set<string>();
  for (const alt of trip.alternatives) {
    assert.equal(alt.days.length, days.length, `${label}: alt day count`);
    assert.ok(alt.days.every((d) => d.plan.feasible), `${label}: alt days legal`);
    assert.ok(alt.score <= trip.score + 1e-9, `${label}: alt no better than best`);
    assert.equal(alt.alternatives.length, 0, `${label}: alt has no nested alternatives`);
    const sig = tripSig(alt);
    assert.notEqual(sig, bestSig, `${label}: alt distinct from best`);
    assert.ok(!altSigs.has(sig), `${label}: alts distinct from each other`);
    altSigs.add(sig);
  }
}

// ---------------------------------------------------------------------------
// Edge cases / empty inputs
// ---------------------------------------------------------------------------

test("large: empty pool over several days -> all empty, score 0", () => {
  const s = scenario([], [0, 1, 2, 3]);
  const trip = runLarge(s);
  assert.ok(trip.days.every((d) => d.activities.length === 0));
  assert.equal(trip.score, 0);
  assert.equal(trip.dayAverage, 0);
  assert.equal(trip.leftover.length, 0);
});

test("large: no days -> empty trip, everything left over, no NaN", () => {
  const pool = randomPool(makeRng(1), 20);
  const s = scenario(pool, []);
  const trip = runLarge(s);
  assert.equal(trip.days.length, 0);
  assert.equal(trip.score, 0);
  assert.ok(Number.isFinite(trip.score));
  assert.equal(trip.leftover.length, pool.length);
});

test("large: single activity over a week gets placed exactly once", () => {
  const a = makeActivity({ name: "Solo", cultural: 9, hours: 2, program: allWeek(8, 22) });
  const trip = runLarge(scenario([a], [0, 1, 2, 3, 4, 5, 6]));
  assert.deepEqual(placedNames(trip), ["Solo"]);
  assert.equal(trip.leftover.length, 0);
});

// ---------------------------------------------------------------------------
// Leftover reasons
// ---------------------------------------------------------------------------

test("large: closed-everywhere activity is left over with reason 'closed'", () => {
  const open = makeActivity({ name: "Open", cultural: 9, program: allWeek(8, 22) });
  const shut = makeActivity({
    name: "Shut",
    cultural: 9,
    program: Array.from({ length: 7 }, () => CLOSED_DAY),
  });
  const trip = runLarge(scenario([open, shut], [0, 1, 2]));
  const shutLeft = trip.leftover.find((l) => l.activity.name === "Shut");
  assert.ok(shutLeft, "Shut should be left over");
  assert.equal(shutLeft!.reason, "closed");
});

test("large: an open activity too big for any day -> reason 'no-room'", () => {
  const giant = makeActivity({ name: "Giant", hours: 20, program: allWeek(0, 24) });
  const fillers = randomPool(makeRng(5), 10);
  const trip = runLarge(scenario([giant, ...fillers], [0], 12, 12));
  const giantLeft = trip.leftover.find((l) => l.activity.name === "Giant");
  assert.ok(giantLeft, "Giant should be left over");
  assert.equal(giantLeft!.reason, "no-room");
});

// ---------------------------------------------------------------------------
// Large datasets: 50 activities × days 1..7 — the headline requirement
// ---------------------------------------------------------------------------

for (let days = 1; days <= 7; days++) {
  test(`large: 50 activities over ${days} day(s) is valid, fast, and routed to the heuristic`, () => {
    const pool = randomPool(makeRng(1000 + days), 50, "B");
    const dayList = Array.from({ length: days }, (_, i) => i);
    // 50 activities must exceed the exact budget -> planTrip uses the heuristic.
    assert.ok(!isExactWithinBudget(days, 50), "50 activities must fall back to heuristic");
    const s = scenario(pool, dayList);
    const t0 = performance.now();
    const trip = planTrip(pool, s.days, s.startHours, s.endHours, s.selections, s.filters);
    const elapsed = performance.now() - t0;
    assertValidTrip(trip, dayList, pool, `50x${days}`);
    assert.ok(elapsed < 2000, `50x${days} should be fast, took ${elapsed}ms`);
    // With this many cheap activities and open days, it should actually fill days.
    assert.ok(placedCount(trip) > 0, "should place at least some activities");
  });
}

test("large: a generous trip (50 activities, 7 days, roomy budget) places a lot", () => {
  // 1h activities, 7 days, 14h budget: each day can hold several -> most placed.
  const pool = Array.from({ length: 50 }, (_, i) =>
    makeActivity({ name: `C${i}`, cultural: 5 + (i % 6), hours: 1, program: allWeek(8, 23) })
  );
  const dayList = [0, 1, 2, 3, 4, 5, 6];
  const s = scenario(pool, dayList, 9, 14);
  const trip = planTrip(pool, s.days, s.startHours, s.endHours, s.selections, s.filters);
  assertValidTrip(trip, dayList, pool, "generous");
  // 7 days × up to MAX_DAY_ACTIVITIES capacity -> a substantial number placed.
  assert.ok(placedCount(trip) >= 7, `expected many placements, got ${placedCount(trip)}`);
});

// ---------------------------------------------------------------------------
// Quality: never worse than the trivial empty trip; matches exact on small pools
// ---------------------------------------------------------------------------

test("large: objective is never below the empty trip (score >= 0)", () => {
  const rng = makeRng(42);
  for (let trial = 0; trial < 15; trial++) {
    const pool = randomPool(rng, 8 + Math.floor(rng() * 20));
    const days = Array.from({ length: 1 + Math.floor(rng() * 7) }, (_, i) => i);
    const trip = runLarge(scenario(pool, days));
    assert.ok(trip.score >= -1e-9, `trial ${trial}: score ${trip.score} should be >= 0`);
    assertValidTrip(trip, days, pool, `quality-${trial}`);
  }
});

test("large: matches the exact optimum's objective on small pools", () => {
  // On pools the exact subset-DP can also solve, the heuristic's local optimum
  // should reach the SAME global objective for these easy (all-open, roomy) cases.
  const rng = makeRng(99);
  for (let trial = 0; trial < 20; trial++) {
    const n = 4 + Math.floor(rng() * 4); // 4..7
    const days = Array.from({ length: 1 + Math.floor(rng() * 3) }, (_, i) => i);
    const pool = randomPool(rng, n, `E${trial}_`);
    const s = scenario(pool, days);
    const exact = PLANNERS.planLinear(s.pool, s.days, s.startHours, s.endHours, s.selections, s.filters);
    const heur = runLarge(s);
    assert.equal(
      approx(heur.score),
      approx(exact.score),
      `trial ${trial}: heuristic ${heur.score} vs exact ${exact.score}`
    );
  }
});

// ---------------------------------------------------------------------------
// Determinism & invariants
// ---------------------------------------------------------------------------

test("large: deterministic for identical inputs", () => {
  const pool = randomPool(makeRng(7), 30);
  const s = scenario(pool, [0, 1, 2, 3, 4]);
  const a = runLarge(s);
  const b = runLarge(s);
  assert.equal(approx(a.score), approx(b.score));
  assert.deepEqual(placedNames(a), placedNames(b));
});

test("large: per-day cap is enforced even with very short activities", () => {
  // 30 activities of 0.25h with a 24h day: time-wise dozens would fit, but the
  // hard cap keeps each day to MAX_DAY_ACTIVITIES so scheduleCombo stays bounded.
  const pool = Array.from({ length: 30 }, (_, i) =>
    makeActivity({ name: `T${i}`, hours: 0.25, cultural: 8, program: allWeek(0, 24) })
  );
  const trip = runLarge(scenario(pool, [0], 0, 24));
  assert.ok(trip.days[0].activities.length <= MAX_DAY_ACTIVITIES, "day cap holds");
  assert.ok(trip.days[0].plan.feasible);
});

test("large: a positive use-all weight does not reduce placements", () => {
  const pool = Array.from({ length: 25 }, (_, i) =>
    makeActivity({ name: `U${i}`, cultural: 5, hours: 1, program: allWeek(8, 23) })
  );
  const days = [0, 1, 2, 3];
  const startHours = days.map(() => 12);
  const endHours = days.map(() => 24);
  const selections = days.map(() => ({ 0: [0] }));
  const useAllBase = {
    name: "Use every activity",
    weight: 0,
    scoreName: "Asymmetric linear",
    params: { under: 0, over: 1 },
    tripUseAll: true,
    appliesTo: () => false,
    options: [{ name: "use them all", target: 0 }],
  };
  const off = [simpleFilters()[0], { ...useAllBase, weight: 0 }];
  const on = [simpleFilters()[0], { ...useAllBase, weight: 5 }];
  const tOff = planLargeHeuristic(pool, days, startHours, endHours, selections, off);
  const tOn = planLargeHeuristic(pool, days, startHours, endHours, selections, on);
  assert.ok(
    placedCount(tOn) >= placedCount(tOff),
    `use-all weight should not reduce placements (${placedCount(tOn)} < ${placedCount(tOff)})`
  );
  assert.ok(tOn.useAll !== null);
});

test("large: stress — 50 activities, 7 days, all-open, completes well under budget", () => {
  const pool = randomPool(makeRng(2026), 50, "S");
  const days = [0, 1, 2, 3, 4, 5, 6];
  const s = scenario(pool, days, 8, 13);
  const t0 = performance.now();
  const trip = planTrip(pool, s.days, s.startHours, s.endHours, s.selections, s.filters);
  const elapsed = performance.now() - t0;
  assertValidTrip(trip, days, pool, "stress");
  assert.ok(elapsed < 2000, `stress run should be fast, took ${elapsed}ms`);
});
