// -----------------------------------------------------------------------------
// Multi-day trip planning (best trip by average day score)
// -----------------------------------------------------------------------------
// Split the activity pool across N days with each activity used AT MOST ONCE.
// Each day is scored EXACTLY like a regular combo (comboScore). The trip's score
// is the AVERAGE of the day scores PLUS a trip-level "use every activity" term:
// the weighted penalty for placeable activities left out (raising its weight
// keeps more of them). With that filter's default weight 0 the score is just the
// average. We pick the assignment that maximizes that combined objective. "Legal"
// days are decided by the same scheduleCombo as the combos
// (opening/closing hours, the required midday lunch, route ordering, the time
// budget), so every day obeys the existing rules. An empty day scores 0, so the
// optimizer is pushed to actually use every chosen day. The number of days is
// whatever `dayIndices` holds (driven by the "Days after" control), not fixed.
//
// Search: EXHAUSTIVE — every assignment of each activity to {none, or one of the
// D days} is evaluated (closed-day placements pruned, day evaluations memoized),
// giving the true global optimum. The state space is (D+1)^pool; when that grows
// past STATE_BUDGET we fall back to a greedy heuristic and report exact:false.
import { Activity, dayHours, isClosedDay } from "./activities.functions";
import {
  comboScore,
  tripUseAllFilter,
  usageBreakdown,
  type Filter,
  type Selection,
  type UseAllBreakdown,
} from "./filters.functions";
import { scheduleCombo, type ComboSchedule } from "./schedule.functions";
import { LUNCH_HOURS } from "./schedule.data";

export type TripDay = {
  day: number; // weekday index (0=Mon … 6=Sun)
  activities: Activity[]; // the set assigned to this day (scheduleCombo orders it)
  plan: ComboSchedule; // the timed itinerary for that set on that day
  load: number; // occupied hours = Σ(item.end − item.start), INCLUDING lunch
  score: number; // comboScore of this day's set (0 for an empty day)
};

// closed: shut on all chosen days · no-room: can't fit any day legally · score:
// could be placed, but adding it anywhere would lower the average day score.
export type LeftoverReason = "closed" | "no-room" | "score";
export type Leftover = { activity: Activity; reason: LeftoverReason };

export type Trip = {
  days: TripDay[];
  leftover: Leftover[];
  // The maximized objective: the average of the day scores PLUS the weighted
  // "use every activity" term. With that filter's weight 0 this equals dayAverage.
  score: number;
  dayAverage: number; // just the average of the three days' combo scores
  useAll: UseAllBreakdown | null; // the "use every activity" term (null if absent)
  secondBest: number | null; // next-best objective (for "why this beats the rest")
  // Ranked runner-up trips (2nd-best, 3rd-best, …), each a fully assembled Trip
  // with its own empty `alternatives`. Only populated on the BEST trip, and only
  // in exhaustive mode (the heuristic yields a single solution → []).
  alternatives: Trip[];
  evaluated: number; // feasible assignments considered (for the proof)
  exact: boolean; // true = exhaustive global optimum; false = heuristic fallback
  elapsedMs: number; // wall-clock time the search took (set by planTrip)
};

// Cost ceilings for the exact planners. Each planner has a DIFFERENT true cost,
// so a single (days+1)^pool gate would needlessly demote the cheap subset-DP to
// the heuristic on pools it can still solve exactly. We gate each planner on ITS
// OWN cost estimate (see PLANNER_COST) against the matching ceiling:
//   • BACKTRACK_BUDGET — for the (days+1)^pool backtracking planners. Tuned so the
//     classic 3-day trip stays exact for the same pool sizes as before: 4^9 ≈ 262k
//     is well under, 4^10 ≈ 1.05M is just over.
//   • DP_BUDGET — for the O(days·3^pool) subset-partition DP planners. Tuned so the
//     WHOLE production catalogue stays exact at 3 days (3 · 3^13 ≈ 4.8M, under the
//     ceiling) but n ≥ 14 falls to the heuristic (3 · 3^14 ≈ 14.3M, over it). This
//     gate counts STATES, not the work per state — and the per-state cost is far
//     higher under the real filters (route-directness runs a factorial best-route
//     search, the multi-option Vibe filter scores several indices, etc.), so a
//     state count that is "a few million" can still mean tens of seconds of real
//     scheduling. The large-pool heuristic reaches the SAME optimum on these sizes
//     (see the "matches the exact optimum" tests) in milliseconds, so the tighter
//     ceiling trades a slow exactness proof for a fast, equally-good answer.
const BACKTRACK_BUDGET = 1_000_000;
const DP_BUDGET = 10_000_000;
const EPS = 1e-9;
// How many ranked trips (best + runner-ups) the exhaustive search keeps, so the
// UI can reveal the 2nd-best, 3rd-best, … on demand.
const TOP_K = 10;

// Occupied hours of a scheduled day: the sum of every slot's duration. INCLUDES
// the lunch slot and excludes idle waiting — the load shown/balanced per day.
function loadOf(plan: ComboSchedule): number {
  return plan.items.reduce((s, it) => s + (it.end - it.start), 0);
}

// A trivial schedule for a day with nothing on it (an empty day is always legal
// with zero load and zero score).
function emptyPlan(startHour: number): ComboSchedule {
  return {
    items: [],
    feasible: true,
    withinHours: true,
    endsAt: startHour,
    linearity: 0,
    feasibleOrderings: 0,
  };
}

// How many of the chosen days an activity is open on (0 = shut every chosen day).
function openDayCount(activity: Activity, dayIndices: number[]): number {
  return dayIndices.filter((d) => !isClosedDay(dayHours(activity, d))).length;
}

type DayEval = {
  feasible: boolean;
  plan: ComboSchedule;
  load: number;
  score: number;
};

// Evaluate (and memoize) one day-set on one day: its legality, itinerary, load,
// and combo score. Keyed by the day slot + the activity-membership bitmask. Each
// day slot has its OWN start hour, end hour (time budget), and filter selection,
// so a day is scheduled and scored with that day's filters.
function makeDayEvaluator(
  pool: Activity[],
  dayIndices: number[],
  startHours: number[],
  endHours: number[],
  selections: Selection[],
  filters: Filter[]
) {
  const memo = new Map<number, DayEval>();
  return (slot: number, mask: number): DayEval => {
    // Numeric memo key (slot < 8 -> 3 bits) — far cheaper than a string at the
    // millions of lookups the 3^pool submask sweep performs.
    const key = (mask << 3) | slot;
    const cached = memo.get(key);
    if (cached) return cached;

    const set: Activity[] = [];
    for (let i = 0; i < pool.length; i++) if (mask & (1 << i)) set.push(pool[i]);

    let evalResult: DayEval;
    if (set.length === 0) {
      evalResult = { feasible: true, plan: emptyPlan(startHours[slot]), load: 0, score: 0 };
    } else {
      const plan = scheduleCombo(set, dayIndices[slot], startHours[slot], endHours[slot]);
      evalResult = {
        feasible: plan.feasible,
        plan,
        load: loadOf(plan),
        score: comboScore(set, selections[slot], filters),
      };
    }
    memo.set(key, evalResult);
    return evalResult;
  };
}

function popcount(mask: number): number {
  let n = 0;
  while (mask) {
    mask &= mask - 1;
    n++;
  }
  return n;
}

type Candidate = { masks: number[]; objective: number; placed: number; spread: number };

// Strictly better trip? Primary: higher combined objective (day average + the
// weighted "use every activity" term). Ties (within EPS): place more activities,
// then a smaller hours spread.
function isBetter(c: Candidate, best: Candidate | null): boolean {
  if (best === null) return true;
  if (c.objective > best.objective + EPS) return true;
  if (c.objective < best.objective - EPS) return false;
  if (c.placed !== best.placed) return c.placed > best.placed;
  return c.spread < best.spread;
}

// Build the final Trip (days + leftovers + proof numbers) from chosen day masks.
function assembleTrip(
  pool: Activity[],
  dayIndices: number[],
  best: Candidate,
  secondBest: number | null,
  evaluated: number,
  exact: boolean,
  evalDay: (slot: number, mask: number) => DayEval,
  useAllFilter: Filter | null
): Trip {
  const days: TripDay[] = dayIndices.map((d, slot) => {
    const mask = best.masks[slot];
    const e = evalDay(slot, mask);
    const activities: Activity[] = [];
    for (let i = 0; i < pool.length; i++) if (mask & (1 << i)) activities.push(pool[i]);
    return { day: d, activities, plan: e.plan, load: e.load, score: e.score };
  });

  const placedMask = best.masks.reduce((a, b) => a | b, 0);
  const leftover: Leftover[] = [];
  for (let i = 0; i < pool.length; i++) {
    if (placedMask & (1 << i)) continue;
    const activity = pool[i];
    let reason: LeftoverReason;
    if (openDayCount(activity, dayIndices) === 0) {
      reason = "closed";
    } else {
      // Could this single activity sit on ANY day legally? If so it was left out
      // for SCORE (placing it would lower the average), not for lack of room.
      const fitsSomewhere = dayIndices.some(
        (_, slot) => evalDay(slot, 1 << i).feasible
      );
      reason = fitsSomewhere ? "score" : "no-room";
    }
    leftover.push({ activity, reason });
  }

  // The trip score = average of the day scores + the weighted "use every
  // activity" term. Recomputed here from the chosen days so it's the single
  // source of truth for both the number shown and the proof (matches
  // best.objective).
  const dayAverage =
    days.reduce((s, d) => s + d.score, 0) / (days.length || 1);

  // Placeable activities left out = leftovers that aren't "closed" (a closed one
  // could never be placed, so it isn't counted against the "use all" target).
  // This matches the placeable-and-unplaced count the search optimizes.
  const placedCount = days.reduce((s, d) => s + d.activities.length, 0);
  const leftoverCount = leftover.filter((l) => l.reason !== "closed").length;
  const useAll = useAllFilter
    ? usageBreakdown(useAllFilter, leftoverCount, placedCount)
    : null;

  const score = dayAverage + (useAll?.contribution ?? 0);

  return {
    days,
    leftover,
    score,
    dayAverage,
    useAll,
    secondBest,
    alternatives: [],
    evaluated,
    exact,
    elapsedMs: 0, // filled in by planTrip
  };
}

// Exhaustive optimum: enumerate every assignment, memoizing day evaluations.
function planExhaustive(
  pool: Activity[],
  dayIndices: number[],
  startHours: number[],
  endHours: number[],
  selections: Selection[],
  filters: Filter[]
): Trip {
  const evalDay = makeDayEvaluator(pool, dayIndices, startHours, endHours, selections, filters);
  const useAll = tripUseAllFilter(filters);
  const n = pool.length;
  const D = dayIndices.length;
  // Activities that COULD be placed (open on at least one chosen day). Closed-on-
  // every-day activities are excluded from the "use all" count — they can never
  // be scheduled, so they aren't held against the target.
  let placeableMask = 0;
  for (let i = 0; i < n; i++)
    if (openDayCount(pool[i], dayIndices) > 0) placeableMask |= 1 << i;

  // Keep the TOP_K best candidates by DISTINCT objective (ties on score collapse
  // to their best representative), sorted best-first — the best trip plus ranked,
  // meaningfully-different runner-ups for the "show next-best" button.
  const top: Candidate[] = [];
  let evaluated = 0;

  const offer = (cand: Candidate) => {
    for (let i = 0; i < top.length; i++) {
      // Same score already kept? Keep the better representative; order unchanged.
      if (Math.abs(top[i].objective - cand.objective) <= EPS) {
        if (isBetter(cand, top[i])) top[i] = cand;
        return;
      }
    }
    if (top.length < TOP_K) {
      top.push(cand);
    } else if (cand.objective > top[top.length - 1].objective + EPS) {
      top[top.length - 1] = cand; // bump the weakest kept trip
    } else {
      return;
    }
    top.sort(
      (a, b) =>
        b.objective - a.objective || b.placed - a.placed || a.spread - b.spread
    );
  };

  const consider = (masks: number[]) => {
    let scoreSum = 0;
    let placedUnion = 0;
    let minLoad = Infinity;
    let maxLoad = -Infinity;
    let placed = 0;
    for (let s = 0; s < D; s++) {
      const e = evalDay(s, masks[s]);
      if (!e.feasible) return; // a day isn't legal
      scoreSum += e.score;
      placedUnion |= masks[s];
      placed += popcount(masks[s]);
      if (e.load < minLoad) minLoad = e.load;
      if (e.load > maxLoad) maxLoad = e.load;
    }
    evaluated++;

    const avg = D === 0 ? 0 : scoreSum / D;
    const leftoverCount = popcount(placeableMask & ~placedUnion);
    // Combined objective: day average + the weighted "use every activity" term.
    const objective =
      avg +
      (useAll ? usageBreakdown(useAll.filter, leftoverCount, 0).contribution : 0);
    const cand: Candidate = {
      masks: masks.slice(),
      objective,
      placed,
      spread: maxLoad - minLoad,
    };
    offer(cand);
  };

  // Assign activity i to none, or to any one of the D days (closed days pruned).
  // `masks` is mutated in place and restored on backtrack; consider() copies it.
  const masks = new Array<number>(D).fill(0);
  const rec = (i: number) => {
    if (i === n) {
      consider(masks);
      return;
    }
    const bit = 1 << i;
    const a = pool[i];
    rec(i + 1); // leave out
    for (let s = 0; s < D; s++) {
      if (isClosedDay(dayHours(a, dayIndices[s]))) continue;
      masks[s] |= bit;
      rec(i + 1);
      masks[s] &= ~bit;
    }
  };
  rec(0);

  // The all-empty assignment is always feasible, so `top` is never empty. Assemble
  // the best trip + ranked alternatives (each cheap — evalDay is memoized); the
  // best carries the runner-ups, and secondBest is the next trip's objective.
  const trips = top.map((c, i) =>
    assembleTrip(
      pool, dayIndices, c, top[i + 1]?.objective ?? null, evaluated, true, evalDay,
      useAll?.filter ?? null
    )
  );
  const bestTrip = trips[0];
  bestTrip.alternatives = trips.slice(1);
  return bestTrip;
}

// -----------------------------------------------------------------------------
// Alternative exact planners (same Trip output, swappable in planTrip)
// -----------------------------------------------------------------------------
// Two interchangeable alternatives to planExhaustive. Both return an IDENTICAL
// best Trip (and ranked alternatives) — they only reach it faster — so switching
// between them is just changing EXACT_PLANNER in planTrip; nothing else changes.
//
//   planPruned    — the SAME (days+1)^pool backtracking as planExhaustive, but a
//                   day-set whose unavoidable occupied time already overflows the
//                   day budget is rejected WITHOUT running the (factorial)
//                   scheduleCombo. The prune is admissible (it only skips sets
//                   scheduleCombo would also reject), so the optimum is unchanged.
//   planSubsetDP  — exploits that each day is scored independently of the others:
//                   a subset-partition DP over the set of placed activities, costing
//                   O(days · 3^pool) (the submask sum) instead of (days+1)^pool.
//                   The win grows fast with the day count. Uses the same prune.

// A day evaluator with the admissible duration prune (see planPruned). Identical
// to makeDayEvaluator for every set it doesn't prune, so it never changes a score.
function makePrunedDayEvaluator(
  pool: Activity[],
  dayIndices: number[],
  startHours: number[],
  endHours: number[],
  selections: Selection[],
  filters: Filter[]
) {
  const memo = new Map<number, DayEval>();
  return (slot: number, mask: number): DayEval => {
    // Numeric memo key (slot < 8 -> 3 bits) — far cheaper than a string at the
    // millions of lookups the 3^pool submask sweep performs.
    const key = (mask << 3) | slot;
    const cached = memo.get(key);
    if (cached) return cached;

    const set: Activity[] = [];
    for (let i = 0; i < pool.length; i++) if (mask & (1 << i)) set.push(pool[i]);

    let evalResult: DayEval;
    if (set.length === 0) {
      evalResult = { feasible: true, plan: emptyPlan(startHours[slot]), load: 0, score: 0 };
    } else {
      // The day's occupied time is AT LEAST Σ(activity hours) plus a forced lunch
      // (3h, only when there are 2+ activities and none can itself fill the midday
      // lunch). Waiting for openings only adds more. So if this floor already
      // passes the day's budget, no ordering can be legal — skip the factorial
      // scheduleCombo. Admissible: it never rejects a set scheduleCombo would keep.
      const budget = endHours[slot] - startHours[slot];
      const sumHours = set.reduce((s, a) => s + a.hours, 0);
      const forcedLunch =
        set.length >= 2 && !set.some((a) => a.is_lunch) ? LUNCH_HOURS : 0;
      if (sumHours + forcedLunch > budget + EPS) {
        evalResult = { feasible: false, plan: emptyPlan(startHours[slot]), load: 0, score: 0 };
      } else {
        const plan = scheduleCombo(set, dayIndices[slot], startHours[slot], endHours[slot]);
        evalResult = {
          feasible: plan.feasible,
          plan,
          load: loadOf(plan),
          score: comboScore(set, selections[slot], filters),
        };
      }
    }
    memo.set(key, evalResult);
    return evalResult;
  };
}

// Score one full day-assignment (a mask per day). Returns null if any day is
// illegal, else the Candidate exactly as planExhaustive.consider would build it.
function evalMasks(
  masks: number[],
  evalDay: (slot: number, mask: number) => DayEval,
  D: number,
  placeableMask: number,
  useAll: { filter: Filter; index: number } | null
): Candidate | null {
  let scoreSum = 0;
  let placedUnion = 0;
  let minLoad = Infinity;
  let maxLoad = -Infinity;
  let placed = 0;
  for (let s = 0; s < D; s++) {
    const e = evalDay(s, masks[s]);
    if (!e.feasible) return null;
    scoreSum += e.score;
    placedUnion |= masks[s];
    placed += popcount(masks[s]);
    if (e.load < minLoad) minLoad = e.load;
    if (e.load > maxLoad) maxLoad = e.load;
  }
  const avg = D === 0 ? 0 : scoreSum / D;
  const leftoverCount = popcount(placeableMask & ~placedUnion);
  const objective =
    avg +
    (useAll ? usageBreakdown(useAll.filter, leftoverCount, 0).contribution : 0);
  return { masks: masks.slice(), objective, placed, spread: maxLoad - minLoad };
}

// Insert a candidate into a best-first, distinct-objective TOP_K list — the same
// rule planExhaustive.offer uses (ties on objective keep the better representative).
function offerInto(top: Candidate[], cand: Candidate): void {
  for (let i = 0; i < top.length; i++) {
    if (Math.abs(top[i].objective - cand.objective) <= EPS) {
      if (isBetter(cand, top[i])) top[i] = cand;
      return;
    }
  }
  if (top.length < TOP_K) {
    top.push(cand);
  } else if (cand.objective > top[top.length - 1].objective + EPS) {
    top[top.length - 1] = cand; // bump the weakest kept trip
  } else {
    return;
  }
  top.sort(
    (a, b) =>
      b.objective - a.objective || b.placed - a.placed || a.spread - b.spread
  );
}

// Turn a ranked Candidate list into the best Trip carrying the ranked runner-ups.
function assembleTopK(
  pool: Activity[],
  dayIndices: number[],
  top: Candidate[],
  evaluated: number,
  exact: boolean,
  evalDay: (slot: number, mask: number) => DayEval,
  useAll: { filter: Filter; index: number } | null
): Trip {
  const trips = top.map((c, i) =>
    assembleTrip(
      pool, dayIndices, c, top[i + 1]?.objective ?? null, evaluated, exact, evalDay,
      useAll?.filter ?? null
    )
  );
  const bestTrip = trips[0];
  bestTrip.alternatives = trips.slice(1);
  return bestTrip;
}

// ALGORITHM 2 — exhaustive backtracking (the SAME search as planExhaustive) with
// the admissible duration prune, so hopeless day-sets skip scheduleCombo.
function planPruned(
  pool: Activity[],
  dayIndices: number[],
  startHours: number[],
  endHours: number[],
  selections: Selection[],
  filters: Filter[]
): Trip {
  const evalDay = makePrunedDayEvaluator(pool, dayIndices, startHours, endHours, selections, filters);
  const useAll = tripUseAllFilter(filters);
  const n = pool.length;
  const D = dayIndices.length;
  let placeableMask = 0;
  for (let i = 0; i < n; i++)
    if (openDayCount(pool[i], dayIndices) > 0) placeableMask |= 1 << i;

  const top: Candidate[] = [];
  let evaluated = 0;

  // Assign activity i to none, or any one open day, exactly as planExhaustive.
  const masks = new Array<number>(D).fill(0);
  const rec = (i: number) => {
    if (i === n) {
      const cand = evalMasks(masks, evalDay, D, placeableMask, useAll);
      if (cand) {
        evaluated++;
        offerInto(top, cand);
      }
      return;
    }
    const bit = 1 << i;
    const a = pool[i];
    rec(i + 1); // leave out
    for (let s = 0; s < D; s++) {
      if (isClosedDay(dayHours(a, dayIndices[s]))) continue;
      masks[s] |= bit;
      rec(i + 1);
      masks[s] &= ~bit;
    }
  };
  rec(0);

  return assembleTopK(pool, dayIndices, top, evaluated, true, evalDay, useAll);
}

// ALGORITHM 1 — subset-partition DP. Because each day's score depends ONLY on the
// set placed on it, we never enumerate joint assignments: we sweep day by day,
// keeping for every "set of activities used so far" the TOP_K best running score
// sums, then read the answer off the final layer. Cost is O(days · 3^pool) — the
// submask sum — versus (days+1)^pool for the backtracking search.
// One running day-assignment reaching a union, stored with a BACK-POINTER instead
// of a copied mask list: `T` is this day's chosen submask, and (prevU, prevIdx)
// locate the predecessor entry in the PREVIOUS (already-finalised) layer. The full
// per-day mask list is reconstructed only for the handful of TOP_K final entries —
// avoiding millions of `[...masks, T]` array copies across the 3^pool submask
// sweep, which was the exact planner's dominant cost.
type DPEntry = { score: number; T: number; prevU: number; prevIdx: number };

// Keep the TOP_K highest running score-sums reaching one union (sorted desc).
// TOP_K per union is enough: a day's objective is monotonic in its score sum, so
// the global TOP_K distinct objectives can never need a deeper-ranked entry.
function insertDPEntry(arr: DPEntry[], cand: DPEntry): void {
  if (arr.length >= TOP_K && cand.score <= arr[arr.length - 1].score) return;
  arr.push(cand);
  arr.sort((a, b) => b.score - a.score);
  if (arr.length > TOP_K) arr.length = TOP_K;
}

// The shared DP core: given ANY day evaluator, sweep day by day keeping the
// TOP_K running score-sums per placed-set, then rank the final layer into a
// TOP_K Candidate list. planSubsetDP and planLinear differ ONLY in the evaluator
// they hand in, so the search itself lives here once.
function subsetDPTop(
  pool: Activity[],
  dayIndices: number[],
  evalDay: (slot: number, mask: number) => DayEval,
  useAll: { filter: Filter; index: number } | null
): { top: Candidate[]; evaluated: number } {
  const n = pool.length;
  const D = dayIndices.length;
  const fullMask = n === 0 ? 0 : (1 << n) - 1;
  let placeableMask = 0;
  for (let i = 0; i < n; i++)
    if (openDayCount(pool[i], dayIndices) > 0) placeableMask |= 1 << i;

  // layers[s] = placed-set bitmask -> the TOP_K running day-assignments reaching
  // it AFTER s days. Each layer is finalised before the next is built, so a
  // back-pointer (prevU, prevIdx) into layers[s] stays valid forever.
  const layers: Map<number, DPEntry[]>[] = [];
  layers[0] = new Map<number, DPEntry[]>([[0, [{ score: 0, T: -1, prevU: -1, prevIdx: -1 }]]]);

  for (let s = 0; s < D; s++) {
    const prev = layers[s];
    const next = new Map<number, DPEntry[]>();
    for (const [U, entries] of prev) {
      const free = fullMask & ~U; // activities still unplaced
      // Visit every subset T of the free activities (including the empty set) as
      // day s's set; keep only the legal ones (evalDay rules out over-budget and
      // closed-on-this-day sets). Standard descending-submask enumeration.
      for (let T = free; ; T = (T - 1) & free) {
        const e = evalDay(s, T);
        if (e.feasible) {
          const newU = U | T;
          let arr = next.get(newU);
          if (!arr) {
            arr = [];
            next.set(newU, arr);
          }
          for (let idx = 0; idx < entries.length; idx++) {
            insertDPEntry(arr, { score: entries[idx].score + e.score, T, prevU: U, prevIdx: idx });
          }
        }
        if (T === 0) break;
      }
    }
    layers[s + 1] = next;
  }

  // Every full assignment now sits in the final layer. Reconstruct each one's
  // per-day mask list by walking the back-pointers, then rank exactly as the other
  // planners (offerInto dedupes by objective and keeps the TOP_K best). `evaluated`
  // counts the complete feasible assignments the DP carried to the end.
  const top: Candidate[] = [];
  let evaluated = 0;
  for (const entries of layers[D].values()) {
    for (const ent of entries) {
      const masks = new Array<number>(D);
      let cur = ent;
      for (let s = D - 1; s >= 0; s--) {
        masks[s] = cur.T;
        cur = layers[s].get(cur.prevU)![cur.prevIdx];
      }
      const cand = evalMasks(masks, evalDay, D, placeableMask, useAll);
      if (cand) {
        evaluated++;
        offerInto(top, cand);
      }
    }
  }

  return { top, evaluated };
}

function planSubsetDP(
  pool: Activity[],
  dayIndices: number[],
  startHours: number[],
  endHours: number[],
  selections: Selection[],
  filters: Filter[]
): Trip {
  const evalDay = makePrunedDayEvaluator(pool, dayIndices, startHours, endHours, selections, filters);
  const useAll = tripUseAllFilter(filters);
  const { top, evaluated } = subsetDPTop(pool, dayIndices, evalDay, useAll);
  return assembleTopK(pool, dayIndices, top, evaluated, true, evalDay, useAll);
}

// -----------------------------------------------------------------------------
// ALGORITHM 3 — linearity-forcing planner (planLinear)
// -----------------------------------------------------------------------------
// Same exact subset-partition DP as planSubsetDP, but each day that has a REAL
// route (3+ stops) earns an extra reward proportional to how straight that
// route is, so the optimizer is pushed to GROUP activities onto direct,
// low-backtrack routes instead of zig-zagging across the map.
//
// Why gated at 3+ stops: routeLinearity is trivially 10 for 1–2 stops (any two
// points are "straight"), so rewarding raw linearity everywhere would just split
// the trip into tiny days. Gating means the bonus is 0 for empty/1-/2-stop days
// and only rewards keeping 3+ activities together on a straight path — a positive
// pull toward bigger, straighter days. The bonus is baked into the day SCORE, so
// every reported number (per-day score, day average, trip score) stays consistent
// with what the search optimized. Raise LINEARITY_WEIGHT to push directness harder.
const LINEARITY_WEIGHT = 1.0; // reward per directness point (0–10) on a 3+ stop day
const LINEARITY_MIN_STOPS = 3; // below this a route is trivially "straight" → no bonus

// makePrunedDayEvaluator + a route-directness reward folded into the day score.
function makeLinearDayEvaluator(
  pool: Activity[],
  dayIndices: number[],
  startHours: number[],
  endHours: number[],
  selections: Selection[],
  filters: Filter[]
) {
  const base = makePrunedDayEvaluator(pool, dayIndices, startHours, endHours, selections, filters);
  const memo = new Map<number, DayEval>();
  return (slot: number, mask: number): DayEval => {
    // Numeric memo key (slot < 8 -> 3 bits) — far cheaper than a string at the
    // millions of lookups the 3^pool submask sweep performs.
    const key = (mask << 3) | slot;
    const cached = memo.get(key);
    if (cached) return cached;

    const e = base(slot, mask);
    let boosted = e;
    if (e.feasible && popcount(mask) >= LINEARITY_MIN_STOPS) {
      // e.plan.linearity is the directness (0–10) of the day's CHOSEN itinerary —
      // the straightest feasible ordering scheduleCombo already settled on.
      boosted = { ...e, score: e.score + LINEARITY_WEIGHT * e.plan.linearity };
    }
    memo.set(key, boosted);
    return boosted;
  };
}

function planLinear(
  pool: Activity[],
  dayIndices: number[],
  startHours: number[],
  endHours: number[],
  selections: Selection[],
  filters: Filter[]
): Trip {
  const evalDay = makeLinearDayEvaluator(pool, dayIndices, startHours, endHours, selections, filters);
  const useAll = tripUseAllFilter(filters);
  const { top, evaluated } = subsetDPTop(pool, dayIndices, evalDay, useAll);
  return assembleTopK(pool, dayIndices, top, evaluated, true, evalDay, useAll);
}

// Heuristic fallback for large pools: greedily add the single (activity, day)
// placement that most raises the average, then stop when nothing helps. Reports
// exact:false. (Not used at the current catalogue size.)
export function planHeuristic(
  pool: Activity[],
  dayIndices: number[],
  startHours: number[],
  endHours: number[],
  selections: Selection[],
  filters: Filter[]
): Trip {
  const evalDay = makeDayEvaluator(pool, dayIndices, startHours, endHours, selections, filters);
  const useAll = tripUseAllFilter(filters);
  const D = dayIndices.length;
  const masks = new Array<number>(D).fill(0);
  let evaluated = 0;
  let placeableMask = 0;
  for (let i = 0; i < pool.length; i++)
    if (openDayCount(pool[i], dayIndices) > 0) placeableMask |= 1 << i;

  // The same combined objective the exhaustive search maximizes: the average of
  // the day scores plus the weighted "use every activity" term.
  const objectiveOf = (m: number[]) => {
    let scoreSum = 0;
    let union = 0;
    for (let s = 0; s < D; s++) {
      scoreSum += evalDay(s, m[s]).score;
      union |= m[s];
    }
    const avg = D === 0 ? 0 : scoreSum / D;
    const leftoverCount = popcount(placeableMask & ~union);
    return (
      avg +
      (useAll ? usageBreakdown(useAll.filter, leftoverCount, 0).contribution : 0)
    );
  };

  let improved = true;
  while (improved) {
    improved = false;
    let bestGain = EPS;
    let move: { slot: number; bit: number } | null = null;
    const baseObjective = objectiveOf(masks);
    const placedUnion = masks.reduce((a, b) => a | b, 0);

    for (let i = 0; i < pool.length; i++) {
      const bit = 1 << i;
      if (placedUnion & bit) continue; // already placed
      for (let slot = 0; slot < D; slot++) {
        if (isClosedDay(dayHours(pool[i], dayIndices[slot]))) continue;
        const trial = [...masks];
        trial[slot] |= bit;
        if (!evalDay(slot, trial[slot]).feasible) continue;
        evaluated++;
        const gain = objectiveOf(trial) - baseObjective;
        if (gain > bestGain) {
          bestGain = gain;
          move = { slot, bit };
        }
      }
    }
    if (move) {
      masks[move.slot] |= move.bit;
      improved = true;
    }
  }

  const loads = masks.map((m, s) => evalDay(s, m).load);
  const best: Candidate = {
    masks,
    objective: objectiveOf(masks),
    placed: masks.reduce((s, m) => s + popcount(m), 0),
    spread: Math.max(...loads) - Math.min(...loads),
  };
  return assembleTrip(
    pool, dayIndices, best, null, evaluated, false, evalDay,
    useAll?.filter ?? null
  );
}

// -----------------------------------------------------------------------------
// LARGE-POOL planner (planLargeHeuristic) — mask-free, bounded, fast
// -----------------------------------------------------------------------------
// The exact planners above pack the placed-set into a 32-bit integer (`1 << i`),
// so they only work for ≤31 activities AND only stay within budget for ~14. For
// big trips (the brief: up to 50 activities over 1–7 days) we need a planner that
//   • never overflows (no bitmask — day-sets are plain sorted index arrays),
//   • never calls the factorial scheduleCombo on a huge day (a hard per-day cap,
//     on top of the admissible duration prune), and
//   • still gets a HIGH score: a MULTI-START local search. One deterministic
//     greedy-best-improvement seed plus several randomized-fill seeds are each
//     refined to a local optimum by a rich move set (add, pair-add, remove,
//     replace, move, swap); the best result wins. PAIR-ADD is the key move — it
//     crosses the 3-stop route-bonus threshold that single (each downhill) steps
//     can never reach. It optimizes the SAME objective the exact planLinear does
//     (day average + the weighted "use every activity" term + the route-directness
//     bonus on 3+ stop days), so its reported score is directly comparable.
//
// Cost is polynomial — O(starts · passes · n² · D) day evaluations, each
// scheduleCombo bounded by the per-day cap, and the evalDay memo is shared across
// restarts — so 50 activities × 7 days solves in well under a second. The restart
// RNG is seeded from the instance shape, so it is fully DETERMINISTIC for
// identical inputs. It reports exact:false (a local optimum, not a proven global
// one) and yields a single solution (no ranked alternatives).

// Hard ceiling on how many activities one day may hold, so scheduleCombo's
// permutation search (O(k!) in the day size k) can never blow up regardless of
// how short the activities are. With realistic ~2h activities a 12h day already
// caps near 4 via the duration prune, so this only bites on pathologically short
// activities; capping at 6 keeps the worst-case schedule at 6! = 720 orderings,
// which stays fast even when the search explores many full days.
export const MAX_DAY_ACTIVITIES = 6;

export function planLargeHeuristic(
  pool: Activity[],
  dayIndices: number[],
  startHours: number[],
  endHours: number[],
  selections: Selection[],
  filters: Filter[]
): Trip {
  const n = pool.length;
  const D = dayIndices.length;
  const useAll = tripUseAllFilter(filters);
  let evaluated = 0;

  // Precompute, per activity, which chosen day slots it is open on (and whether
  // it can be placed at all). Drives candidate generation and leftover reasons.
  const openOn = pool.map((a) => dayIndices.map((d) => !isClosedDay(dayHours(a, d))));
  const placeable = pool.map((_, i) => openOn[i].some(Boolean));

  // Day evaluator, memoized by slot + the SORTED index list (mask-free, so it is
  // safe for any pool size). Mirrors makeLinearDayEvaluator: the admissible
  // duration prune skips hopeless sets, and a 3+ stop feasible day earns the same
  // route-directness bonus, so the score matches the exact planLinear's.
  const memo = new Map<string, DayEval>();
  const evalDay = (slot: number, idxs: number[]): DayEval => {
    if (idxs.length === 0) {
      return { feasible: true, plan: emptyPlan(startHours[slot]), load: 0, score: 0 };
    }
    const key = `${slot}:${idxs.join(",")}`;
    const cached = memo.get(key);
    if (cached) return cached;
    evaluated++;

    const set = idxs.map((i) => pool[i]);
    const budget = endHours[slot] - startHours[slot];
    const sumHours = set.reduce((s, a) => s + a.hours, 0);
    const forcedLunch = set.length >= 2 && !set.some((a) => a.is_lunch) ? LUNCH_HOURS : 0;
    let res: DayEval;
    if (sumHours + forcedLunch > budget + EPS) {
      res = { feasible: false, plan: emptyPlan(startHours[slot]), load: 0, score: 0 };
    } else {
      const plan = scheduleCombo(set, dayIndices[slot], startHours[slot], endHours[slot]);
      let score = comboScore(set, selections[slot], filters);
      if (plan.feasible && set.length >= LINEARITY_MIN_STOPS) {
        score += LINEARITY_WEIGHT * plan.linearity;
      }
      res = { feasible: plan.feasible, plan, load: loadOf(plan), score };
    }
    memo.set(key, res);
    return res;
  };

  // Per-day candidate shortlist: the activities open on that day, ranked by their
  // SOLO day score (a cheap, good proxy for how well an activity fits a day), then
  // capped to CANDIDATES_PER_DAY. The search only ever places or considers an
  // activity on a day where it is a candidate, which bounds the add / pair-add /
  // replace fan-out to a CONSTANT per day instead of the whole pool — the single
  // biggest speed lever for large pools — while keeping each day's genuinely good
  // picks in play. (Computing the shortlist costs n·D size-1 schedules, cheap.)
  const CANDIDATES_PER_DAY = 14;
  const dayCandidates: number[][] = dayIndices.map((_, s) => {
    const open: number[] = [];
    for (let i = 0; i < n; i++) if (openOn[i][s]) open.push(i);
    open.sort((a, b) => evalDay(s, [b]).score - evalDay(s, [a]).score || a - b);
    return open.slice(0, CANDIDATES_PER_DAY);
  });
  const candSet: Set<number>[] = dayCandidates.map((c) => new Set(c));
  const isCand = (s: number, i: number) => candSet[s].has(i);

  const useAllContribution = (leftover: number) =>
    useAll ? usageBreakdown(useAll.filter, leftover, 0).contribution : 0;
  // The maximized objective from a total day-score sum + a placeable-leftover
  // count, so a move can be scored before it is applied without mutating anything.
  const objectiveOf = (score: number, leftover: number) =>
    (D === 0 ? 0 : score / D) + useAllContribution(leftover);

  const withMinus = (arr: number[], i: number) => arr.filter((x) => x !== i);
  const withPlus = (arr: number[], i: number) => [...arr, i].sort((a, b) => a - b);

  // One full solution: each day's sorted member list + score, every activity's
  // current day (or -1), and the running totals the objective is read off of.
  type State = {
    members: number[][];
    dayScores: number[];
    slotOf: number[];
    totalScore: number; // Σ dayScores
    leftoverPlaceable: number; // placeable activities not currently placed
  };
  const placeableTotal = placeable.reduce((c, p) => c + (p ? 1 : 0), 0);
  const freshState = (): State => ({
    members: dayIndices.map(() => []),
    dayScores: new Array<number>(D).fill(0),
    slotOf: new Array<number>(n).fill(-1),
    totalScore: 0,
    leftoverPlaceable: placeableTotal,
  });
  const objOf = (st: State) => objectiveOf(st.totalScore, st.leftoverPlaceable);
  const placedOf = (st: State) => st.slotOf.reduce((c, s) => c + (s >= 0 ? 1 : 0), 0);
  const setDay = (st: State, slot: number, idxs: number[], score: number) => {
    st.totalScore += score - st.dayScores[slot];
    st.dayScores[slot] = score;
    st.members[slot] = idxs;
  };

  // Local search: apply the single best transformation among six move types each
  // pass until none improves (capped). The move set is rich enough to climb out
  // of the easy traps — notably PAIR-ADD, which crosses the 3-stop route-bonus
  // threshold that single steps (each downhill) can never reach.
  const MAX_PASSES = 40;
  const localSearch = (st: State) => {
    for (let pass = 0; pass < MAX_PASSES; pass++) {
      const cur = objOf(st);
      let bestGain = EPS;
      let best: (() => void) | null = null;
      const { members, dayScores, slotOf, totalScore, leftoverPlaceable } = st;

      // ADD: place one unplaced candidate onto a day (candidate-shortlisted).
      for (let s = 0; s < D; s++) {
        if (members[s].length >= MAX_DAY_ACTIVITIES) continue;
        for (const i of dayCandidates[s]) {
          if (slotOf[i] >= 0) continue;
          const idxs = withPlus(members[s], i);
          const e = evalDay(s, idxs);
          if (!e.feasible) continue;
          const gain = objectiveOf(totalScore - dayScores[s] + e.score, leftoverPlaceable - 1) - cur;
          if (gain > bestGain) {
            bestGain = gain;
            best = () => { setDay(st, s, idxs, e.score); slotOf[i] = s; st.leftoverPlaceable--; };
          }
        }
      }

      // PAIR-ADD: place TWO unplaced candidates onto the same day at once. A single
      // add can be downhill (1->2 stops lowers a day's average and earns no route
      // bonus, which only starts at LINEARITY_MIN_STOPS), so single-step climbing
      // can never build a day up to the 3-stop reward; a pair makes the jump.
      for (let s = 0; s < D; s++) {
        if (members[s].length + 2 > MAX_DAY_ACTIVITIES) continue;
        const cs = dayCandidates[s];
        for (let a = 0; a < cs.length; a++) {
          const i = cs[a];
          if (slotOf[i] >= 0) continue;
          for (let b = a + 1; b < cs.length; b++) {
            const j = cs[b];
            if (slotOf[j] >= 0) continue;
            const idxs = withPlus(withPlus(members[s], i), j);
            const e = evalDay(s, idxs);
            if (!e.feasible) continue;
            const gain = objectiveOf(totalScore - dayScores[s] + e.score, leftoverPlaceable - 2) - cur;
            if (gain > bestGain) {
              bestGain = gain;
              best = () => { setDay(st, s, idxs, e.score); slotOf[i] = s; slotOf[j] = s; st.leftoverPlaceable -= 2; };
            }
          }
        }
      }

      // REMOVE: drop a placed activity that was dragging its day's average down by
      // more than the use-all term it was worth.
      for (let i = 0; i < n; i++) {
        const s = slotOf[i];
        if (s < 0) continue;
        const idxs = withMinus(members[s], i);
        const e = evalDay(s, idxs);
        if (!e.feasible) continue;
        const gain = objectiveOf(totalScore - dayScores[s] + e.score, leftoverPlaceable + (placeable[i] ? 1 : 0)) - cur;
        if (gain > bestGain) {
          bestGain = gain;
          best = () => { setDay(st, s, idxs, e.score); slotOf[i] = -1; if (placeable[i]) st.leftoverPlaceable++; };
        }
      }

      // REPLACE: trade a placed activity for an unplaced one on the SAME day —
      // refines composition (straighter route / higher vibe) without changing how
      // many activities are placed.
      for (let i = 0; i < n; i++) {
        const s = slotOf[i];
        if (s < 0) continue;
        const baseIdxs = withMinus(members[s], i);
        for (const j of dayCandidates[s]) {
          if (slotOf[j] >= 0) continue;
          const idxs = withPlus(baseIdxs, j);
          const e = evalDay(s, idxs);
          if (!e.feasible) continue;
          // i leaves (placeable) and j enters (placeable) -> leftover unchanged.
          const gain = objectiveOf(totalScore - dayScores[s] + e.score, leftoverPlaceable) - cur;
          if (gain > bestGain) {
            bestGain = gain;
            best = () => { setDay(st, s, idxs, e.score); slotOf[i] = -1; slotOf[j] = s; };
          }
        }
      }

      // MOVE: relocate a placed activity to a different day.
      for (let i = 0; i < n; i++) {
        const s1 = slotOf[i];
        if (s1 < 0) continue;
        const fromIdxs = withMinus(members[s1], i);
        const eFrom = evalDay(s1, fromIdxs);
        if (!eFrom.feasible) continue;
        for (let s2 = 0; s2 < D; s2++) {
          if (s2 === s1 || !isCand(s2, i) || members[s2].length >= MAX_DAY_ACTIVITIES) continue;
          const toIdxs = withPlus(members[s2], i);
          const eTo = evalDay(s2, toIdxs);
          if (!eTo.feasible) continue;
          const gain = objectiveOf(totalScore - dayScores[s1] - dayScores[s2] + eFrom.score + eTo.score, leftoverPlaceable) - cur;
          if (gain > bestGain) {
            bestGain = gain;
            best = () => { setDay(st, s1, fromIdxs, eFrom.score); setDay(st, s2, toIdxs, eTo.score); slotOf[i] = s2; };
          }
        }
      }

      // SWAP: exchange two placed activities sitting on different days.
      const placed: number[] = [];
      for (let i = 0; i < n; i++) if (slotOf[i] >= 0) placed.push(i);
      for (let a = 0; a < placed.length; a++) {
        const i = placed[a];
        const s1 = slotOf[i];
        for (let b = a + 1; b < placed.length; b++) {
          const j = placed[b];
          const s2 = slotOf[j];
          if (s1 === s2 || !isCand(s2, i) || !isCand(s1, j)) continue;
          const new1 = withPlus(withMinus(members[s1], i), j);
          const new2 = withPlus(withMinus(members[s2], j), i);
          const e1 = evalDay(s1, new1);
          if (!e1.feasible) continue;
          const e2 = evalDay(s2, new2);
          if (!e2.feasible) continue;
          const gain = objectiveOf(totalScore - dayScores[s1] - dayScores[s2] + e1.score + e2.score, leftoverPlaceable) - cur;
          if (gain > bestGain) {
            bestGain = gain;
            best = () => { setDay(st, s1, new1, e1.score); setDay(st, s2, new2, e2.score); slotOf[i] = s2; slotOf[j] = s1; };
          }
        }
      }

      if (!best) break;
      best();
    }
  };

  // Greedy best-improvement construction: repeatedly make the single add that most
  // raises the objective. A strong, deterministic anchor seed.
  const greedyConstruct = (st: State) => {
    for (;;) {
      let bestGain = EPS;
      let pick: { i: number; s: number; idxs: number[]; score: number } | null = null;
      const cur = objOf(st);
      for (let s = 0; s < D; s++) {
        if (st.members[s].length >= MAX_DAY_ACTIVITIES) continue;
        for (const i of dayCandidates[s]) {
          if (st.slotOf[i] >= 0) continue;
          const idxs = withPlus(st.members[s], i);
          const e = evalDay(s, idxs);
          if (!e.feasible) continue;
          const gain = objectiveOf(st.totalScore - st.dayScores[s] + e.score, st.leftoverPlaceable - 1) - cur;
          if (gain > bestGain) { bestGain = gain; pick = { i, s, idxs, score: e.score }; }
        }
      }
      if (!pick) break;
      setDay(st, pick.s, pick.idxs, pick.score);
      st.slotOf[pick.i] = pick.s;
      st.leftoverPlaceable--;
    }
  };

  // Randomized fill construction (diversifies the restarts): visit the placeable
  // activities in a shuffled order and put each on the open, non-full day where it
  // scores best, ALWAYS placing it if any day has room — even when that step is
  // locally downhill. This seeds varied multi-activity days (so different
  // partitions are explored); the local search afterwards prunes the bad picks.
  const randomFill = (st: State, rng: () => number) => {
    const order: number[] = [];
    for (let i = 0; i < n; i++) if (placeable[i]) order.push(i);
    for (let k = order.length - 1; k > 0; k--) {
      const r = Math.floor(rng() * (k + 1));
      [order[k], order[r]] = [order[r], order[k]];
    }
    for (const i of order) {
      let bestScore = -Infinity;
      let pick: { s: number; idxs: number[]; score: number } | null = null;
      for (let s = 0; s < D; s++) {
        if (!isCand(s, i) || st.members[s].length >= MAX_DAY_ACTIVITIES) continue;
        const idxs = withPlus(st.members[s], i);
        const e = evalDay(s, idxs);
        if (!e.feasible) continue;
        // Prefer the day whose resulting score is highest (ties: first day).
        if (e.score > bestScore + EPS) { bestScore = e.score; pick = { s, idxs, score: e.score }; }
      }
      if (!pick) continue;
      setDay(st, pick.s, pick.idxs, pick.score);
      st.slotOf[i] = pick.s;
      st.leftoverPlaceable--;
    }
  };

  // Multi-start: a deterministic greedy seed plus several randomized-fill seeds,
  // each refined to a local optimum; keep the best (ties broken toward placing
  // more activities). The evalDay memo is shared across restarts, so repeated
  // day-sets are free.
  //
  // The restart count SCALES DOWN with pool size: small pools are cheap, so they
  // get many restarts (enough to reliably reach the true global optimum — see the
  // "matches the exact optimum" test); large pools get few, keeping the solve well
  // under a second. Each restart's marginal value also falls as the pool grows
  // (the shared memo + candidate shortlists already cover the good moves).
  const NUM_RANDOM_STARTS = n <= 12 ? 12 : n <= 25 ? 6 : 4;
  let lcg = (0x9e3779b9 ^ (n * 2654435761) ^ (D << 16)) >>> 0;
  const rng = () => { lcg = (lcg * 1664525 + 1013904223) >>> 0; return lcg / 0x100000000; };

  let best: State = freshState();
  greedyConstruct(best);
  localSearch(best);
  for (let r = 0; r < NUM_RANDOM_STARTS; r++) {
    const st = freshState();
    randomFill(st, rng);
    localSearch(st);
    const better =
      objOf(st) > objOf(best) + EPS ||
      (Math.abs(objOf(st) - objOf(best)) <= EPS && placedOf(st) > placedOf(best));
    if (better) best = st;
  }

  const members = best.members;
  const slotOf = best.slotOf;

  // ---- Assemble the Trip (mask-free) ----
  const days: TripDay[] = dayIndices.map((d, slot) => {
    const idxs = members[slot];
    const e = evalDay(slot, idxs);
    return { day: d, activities: idxs.map((i) => pool[i]), plan: e.plan, load: e.load, score: e.score };
  });

  const leftover: Leftover[] = [];
  for (let i = 0; i < n; i++) {
    if (slotOf[i] >= 0) continue;
    let reason: LeftoverReason;
    if (!placeable[i]) {
      reason = "closed";
    } else {
      const fitsSomewhere = dayIndices.some((_, slot) => evalDay(slot, [i]).feasible);
      reason = fitsSomewhere ? "score" : "no-room";
    }
    leftover.push({ activity: pool[i], reason });
  }

  const dayAverage = days.reduce((s, d) => s + d.score, 0) / (days.length || 1);
  const placedCount = days.reduce((s, d) => s + d.activities.length, 0);
  const leftoverCount = leftover.filter((l) => l.reason !== "closed").length;
  const useAllBreak = useAll ? usageBreakdown(useAll.filter, leftoverCount, placedCount) : null;
  const score = dayAverage + (useAllBreak?.contribution ?? 0);

  return {
    days,
    leftover,
    score,
    dayAverage,
    useAll: useAllBreak,
    secondBest: null,
    alternatives: [],
    evaluated,
    exact: false,
    elapsedMs: 0, // filled in by planTrip
  };
}

// === Pick the exact (within-budget) planner HERE =============================
// All three are interchangeable and return an identical best Trip; swap this one
// reference to switch algorithms (nothing else needs to change):
//   planExhaustive — original (days+1)^pool backtracking (baseline, unchanged)
//   planPruned     — same search + admissible duration prune (skips hopeless days)
//   planSubsetDP   — O(days·3^pool) subset-partition DP (scales best with days)
//   planLinear     — the subset DP, but rewards straight 3+ stop routes (forces
//                    activities to be grouped onto direct, low-backtrack days)
type TripPlanner = (
  pool: Activity[],
  dayIndices: number[],
  startHours: number[],
  endHours: number[],
  selections: Selection[],
  filters: Filter[]
) => Trip;

// Exported so the test suite can verify the planners agree (the three base
// planners must return an IDENTICAL best objective; planLinear differs only by
// its route-directness bonus) and benchmark each one directly.
export const PLANNERS = { planExhaustive, planPruned, planSubsetDP, planLinear } as const;
export type PlannerName = keyof typeof PLANNERS;

// Each planner's state-space cost as a function of (days, pool size). Backtracking
// explores (days+1)^pool assignments; the subset-DP sweeps days · 3^pool submasks.
// planTrip gates the ACTIVE planner on its own cost vs the matching budget, so a
// cheap planner isn't demoted to the heuristic on pools it can still solve exactly.
export const PLANNER_COST: Record<PlannerName, (days: number, pool: number) => number> = {
  planExhaustive: (d, n) => Math.pow(d + 1, n),
  planPruned: (d, n) => Math.pow(d + 1, n),
  planSubsetDP: (d, n) => d * Math.pow(3, n),
  planLinear: (d, n) => d * Math.pow(3, n),
};

// Each planner's matching ceiling (backtracking vs subset-DP). See the budgets above.
const PLANNER_BUDGET: Record<PlannerName, number> = {
  planExhaustive: BACKTRACK_BUDGET,
  planPruned: BACKTRACK_BUDGET,
  planSubsetDP: DP_BUDGET,
  planLinear: DP_BUDGET,
};

// ↓↓↓ change this name to switch algorithm (cost/budget follow automatically) ↓↓↓
const EXACT_PLANNER_NAME: PlannerName = "planLinear";
const EXACT_PLANNER: TripPlanner = PLANNERS[EXACT_PLANNER_NAME];

// Whether the active exact planner can solve this (days, pool) within its budget.
// Exposed so tests/UI can predict whether a run will be exact or the heuristic.
export function isExactWithinBudget(days: number, pool: number): boolean {
  return PLANNER_COST[EXACT_PLANNER_NAME](days, pool) <= PLANNER_BUDGET[EXACT_PLANNER_NAME];
}

export function planTrip(
  pool: Activity[],
  dayIndices: number[],
  startHours: number[], // per day slot
  endHours: number[], // per day slot (start + that day's time budget)
  selections: Selection[], // per day slot (each day's filter choices)
  filters: Filter[]
): Trip {
  const args = [pool, dayIndices, startHours, endHours, selections, filters] as const;
  // Exact only while the ACTIVE planner's own state-space estimate stays within
  // its budget; otherwise the greedy heuristic. Empty day set (no days) → cost 0
  // for the DP (days·3^pool), so it stays exact and trivially returns no days.
  const exact = isExactWithinBudget(dayIndices.length, pool.length);
  const t0 = performance.now();
  // Beyond the exact budget, use the mask-free large-pool planner: it never
  // overflows the 31-bit set masks the exact planners rely on (so it is correct
  // up to the brief's 50 activities), bounds every day's scheduleCombo cost, and
  // still climbs to a high-scoring local optimum.
  const trip = exact ? EXACT_PLANNER(...args) : planLargeHeuristic(...args);
  trip.elapsedMs = performance.now() - t0;
  return trip;
}
