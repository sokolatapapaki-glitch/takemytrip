// Tests for the "Tourist priority" score: a per-activity priority (0–10) that the
// planner weights heavily (PRIORITY_WEIGHT) so it fills a trip's limited slots
// with the must-see sights first, preferring high-priority activities over
// low-priority ones.
import { test } from "node:test";
import assert from "node:assert/strict";
import { planTrip } from "../trip.functions";
import { comboScore, defaultSelection } from "../filters.functions";
import { DEFAULT_FILTERS, PRIORITY_WEIGHT } from "../filters.data";
import { scheduleEndHour } from "../schedule.functions";
import { makeActivity, allWeek } from "./helpers";
import type { Activity } from "../activities.functions";

const sel = defaultSelection(DEFAULT_FILTERS);
// All test activities sit at the SAME point, so route directness is neutral
// (a zero-length path scores a flat 10) and only `priority` distinguishes them.
const SAME = { coords: { lat: 41.9, lng: 12.5 }, program: allWeek(8, 22) };

function planOneDay(pool: Activity[], dayCount = 1) {
  const days = Array.from({ length: dayCount }, (_, i) => i);
  const startHours = days.map(() => 9);
  const endHours = days.map((_, i) => scheduleEndHour(DEFAULT_FILTERS, sel, startHours[i]));
  const selections = days.map(() => sel);
  return planTrip(pool, days, startHours, endHours, selections, DEFAULT_FILTERS);
}

// ---------------------------------------------------------------------------
// The filter exists and is weighted by the constant
// ---------------------------------------------------------------------------

test("priority: DEFAULT_FILTERS includes a 'Tourist priority' filter weighted by PRIORITY_WEIGHT", () => {
  const f = DEFAULT_FILTERS.find((x) => x.name === "Tourist priority");
  assert.ok(f, "Tourist priority filter must exist");
  assert.equal(f!.weight, PRIORITY_WEIGHT);
  assert.ok(PRIORITY_WEIGHT > 0, "priority must matter by default");
});

// ---------------------------------------------------------------------------
// Scoring: higher priority -> higher combo score, and it DOMINATES
// ---------------------------------------------------------------------------

test("priority: a higher-priority combo scores higher (all else equal)", () => {
  const hi = [makeActivity({ ...SAME, name: "Hi", priority: 10, cultural: 5 })];
  const lo = [makeActivity({ ...SAME, name: "Lo", priority: 1, cultural: 5 })];
  const dHi = comboScore(hi, sel, DEFAULT_FILTERS);
  const dLo = comboScore(lo, sel, DEFAULT_FILTERS);
  assert.ok(dHi > dLo, `high-priority ${dHi} should beat low-priority ${dLo}`);
  // The gap is exactly PRIORITY_WEIGHT × the priority difference (9), since the
  // symmetric-linear curve maps value 0–10 toward target 10 one-for-one.
  assert.ok(
    Math.abs((dHi - dLo) - PRIORITY_WEIGHT * 9) < 1e-6,
    `priority gap should be PRIORITY_WEIGHT*9 = ${PRIORITY_WEIGHT * 9}, got ${dHi - dLo}`
  );
});

test("priority: it outweighs the vibe score (a must-see beats a vibe-perfect skip)", () => {
  // High priority but zero vibes vs low priority but maxed vibes: priority wins.
  const mustSee = [makeActivity({ ...SAME, name: "MustSee", priority: 10, cultural: 0, foodie: 0, adventurous: 0, relaxing: 0 })];
  const niceSkip = [makeActivity({ ...SAME, name: "NiceSkip", priority: 1, cultural: 10, foodie: 10, adventurous: 10, relaxing: 10 })];
  assert.ok(
    comboScore(mustSee, sel, DEFAULT_FILTERS) > comboScore(niceSkip, sel, DEFAULT_FILTERS),
    "a high-priority must-see should outscore a low-priority vibe-perfect activity"
  );
});

// ---------------------------------------------------------------------------
// Inclusion: the planner fills limited slots with high-priority activities
// ---------------------------------------------------------------------------

test("priority: limited-capacity trip includes the high-priority activities, drops the low", () => {
  // 8 high + 8 low, identical except priority. One day fits only a few, so the
  // planner must choose — and it should choose the must-sees.
  const hi = Array.from({ length: 8 }, (_, i) => makeActivity({ ...SAME, name: `HI${i}`, priority: 10, cultural: 5, hours: 2 }));
  const lo = Array.from({ length: 8 }, (_, i) => makeActivity({ ...SAME, name: `LO${i}`, priority: 1, cultural: 5, hours: 2 }));
  const trip = planOneDay([...lo, ...hi]); // low listed first so order can't help
  const placed = trip.days.flatMap((d) => d.activities);
  assert.ok(placed.length > 0, "should place at least one activity");
  assert.ok(
    placed.every((a) => a.priority === 10),
    `every placed activity should be high-priority, got ${placed.map((a) => a.name).join(",")}`
  );
  // The dropped (low-priority) ones show up as leftovers for a score reason.
  const droppedLow = trip.leftover.filter((l) => l.activity.priority === 1);
  assert.ok(droppedLow.length > 0, "low-priority activities should be left out");
});

test("priority: a higher PRIORITY-style weight never reduces how many high-priority items are placed", () => {
  // Build two filter sets differing only in the priority weight; the heavier one
  // must place at least as many high-priority activities as the lighter one.
  const prioIdx = DEFAULT_FILTERS.findIndex((f) => f.name === "Tourist priority");
  const light = DEFAULT_FILTERS.map((f, i) => (i === prioIdx ? { ...f, weight: 0.1 } : f));
  const heavy = DEFAULT_FILTERS.map((f, i) => (i === prioIdx ? { ...f, weight: 8 } : f));
  const hi = Array.from({ length: 6 }, (_, i) => makeActivity({ ...SAME, name: `H${i}`, priority: 10, cultural: 2, hours: 2 }));
  // Low priority but high cultural, so a low-priority weight might prefer them.
  const lo = Array.from({ length: 6 }, (_, i) => makeActivity({ ...SAME, name: `L${i}`, priority: 1, cultural: 9, hours: 2 }));
  const pool = [...hi, ...lo];
  const days = [0, 1];
  const run = (filters: typeof DEFAULT_FILTERS) => {
    const s = defaultSelection(filters);
    const sh = days.map(() => 9);
    const eh = days.map((_, i) => scheduleEndHour(filters, s, sh[i]));
    const trip = planTrip(pool, days, sh, eh, days.map(() => s), filters);
    return trip.days.flatMap((d) => d.activities).filter((a) => a.priority === 10).length;
  };
  assert.ok(run(heavy) >= run(light), "a heavier priority weight should not place fewer must-sees");
});
