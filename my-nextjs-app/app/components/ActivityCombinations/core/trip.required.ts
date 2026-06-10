// "Must include" as a HARD constraint on a planned trip.
//
// planTrip optimizes freely over the pool; this post-pass then guarantees that
// every required activity actually appears in the trip (when feasible):
//   pass 1 — slot each missing required activity into a free window of some day
//            (between scheduled items, or before the first / after the last,
//            within that day's start/end budget and the activity's open hours);
//   pass 2 — if no window fits, displace a NON-required scheduled activity
//            whose slot the required one can legally take (same times kept,
//            like the /my-trips Replace). The displaced one moves to the
//            leftovers with reason "bumped".
// A required activity that fits nowhere (e.g. closed on all chosen days) stays
// in the leftovers with the planner's original reason.
//
// The modified days keep their planner score (recomputing it needs the live
// filter selections); `load` IS recomputed since it's just summed hours.
import { dayHours, isClosedDay, type Activity } from "./activities.functions";
import type { ScheduledItem } from "./schedule.functions";
import type { Trip } from "./trip.functions";

const EPS = 1e-9;

type Window = { start: number; end: number };

// The free windows of a day's schedule inside [dayStart, dayEnd].
function freeWindows(items: ScheduledItem[], dayStart: number, dayEnd: number): Window[] {
  if (items.length === 0) return [{ start: dayStart, end: dayEnd }];
  const wins: Window[] = [];
  if (items[0].start - dayStart > EPS) wins.push({ start: dayStart, end: items[0].start });
  for (let i = 0; i < items.length - 1; i++) {
    if (items[i + 1].start - items[i].end > EPS)
      wins.push({ start: items[i].end, end: items[i + 1].start });
  }
  const last = items[items.length - 1];
  if (dayEnd - last.end > EPS) wins.push({ start: last.end, end: dayEnd });
  return wins;
}

export function enforceRequired(
  trip: Trip,
  required: Set<string>,
  startHours: number[], // per day slot
  endHours: number[] // per day slot
): Trip {
  if (required.size === 0 || trip.days.length === 0) return trip;

  const placed = new Set(trip.days.flatMap((d) => d.activities.map((a) => a.name)));
  const missing = [...required].filter((n) => !placed.has(n));
  // Runner-up trips are shown as cards too — hold them to the same constraint.
  const alternatives = trip.alternatives.map((t) =>
    enforceRequired(t, required, startHours, endHours)
  );
  if (missing.length === 0) return { ...trip, alternatives };

  // Work on copies; the planner's Trip stays untouched.
  const days = trip.days.map((d) => ({
    ...d,
    activities: d.activities.slice(),
    plan: { ...d.plan, items: d.plan.items.slice() },
  }));
  let leftover = trip.leftover.slice();
  const reload = (d: (typeof days)[number]) => {
    d.load = d.plan.items.reduce((s, it) => s + (it.end - it.start), 0);
  };

  for (const name of missing) {
    const lo = leftover.find((l) => l.activity.name === name);
    if (!lo) continue; // not in this trip's pool at all
    const a: Activity = lo.activity;
    let done = false;

    // Pass 1: a free window somewhere, as early as the window + opening allow.
    for (let s = 0; s < days.length && !done; s++) {
      const d = days[s];
      const h = dayHours(a, d.day);
      if (isClosedDay(h)) continue;
      const wins = freeWindows(d.plan.items, startHours[s] ?? 9, endHours[s] ?? 21);
      for (const w of wins) {
        const start = Math.max(w.start, h.open);
        const end = start + a.hours;
        if (end <= Math.min(w.end, h.close) + EPS) {
          const item: ScheduledItem = { name: a.name, start, end, closed: false, lunch: false };
          const at = d.plan.items.findIndex((it) => it.start > start);
          d.plan.items.splice(at === -1 ? d.plan.items.length : at, 0, item);
          d.activities.push(a);
          reload(d);
          done = true;
          break;
        }
      }
    }

    // Pass 2: take over a non-required activity's slot (slot times kept).
    if (!done) {
      outer: for (let s = 0; s < days.length; s++) {
        const d = days[s];
        const h = dayHours(a, d.day);
        if (isClosedDay(h)) continue;
        for (let i = 0; i < d.plan.items.length; i++) {
          const it = d.plan.items[i];
          if (it.lunch || it.closed || required.has(it.name)) continue;
          if (
            h.open <= it.start + EPS &&
            h.close >= it.end - EPS &&
            a.hours <= it.end - it.start + EPS
          ) {
            const old = d.activities.find((x) => x.name === it.name);
            d.plan.items[i] = { ...it, name: a.name };
            d.activities = d.activities.filter((x) => x.name !== it.name);
            d.activities.push(a);
            if (old) leftover.push({ activity: old, reason: "bumped" });
            done = true;
            break outer;
          }
        }
      }
    }

    if (done) leftover = leftover.filter((l) => l.activity.name !== name);
  }

  return { ...trip, days, leftover, alternatives };
}
