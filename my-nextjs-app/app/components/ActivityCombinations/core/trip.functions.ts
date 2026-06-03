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

// The exhaustive search explores (days + 1)^pool assignments. Once that estimate
// passes this budget it's too expensive, so we fall back to a heuristic and
// report exact:false. (Tuned so the classic 3-day trip stays exact for the same
// pool sizes as before: 4^9 ≈ 262k is well under, 4^10 ≈ 1.05M is just over.)
const STATE_BUDGET = 1_000_000;
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
  const memo = new Map<string, DayEval>();
  return (slot: number, mask: number): DayEval => {
    const key = `${slot}:${mask}`;
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

    const avg = scoreSum / D;
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
  const memo = new Map<string, DayEval>();
  return (slot: number, mask: number): DayEval => {
    const key = `${slot}:${mask}`;
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
  const avg = scoreSum / D;
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
type DPEntry = { score: number; masks: number[] };

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

  // layer: placed-set bitmask -> the TOP_K running day-assignments reaching it.
  let layer = new Map<number, DPEntry[]>();
  layer.set(0, [{ score: 0, masks: [] }]);

  for (let s = 0; s < D; s++) {
    const next = new Map<number, DPEntry[]>();
    for (const [U, entries] of layer) {
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
          for (const ent of entries) {
            insertDPEntry(arr, { score: ent.score + e.score, masks: [...ent.masks, T] });
          }
        }
        if (T === 0) break;
      }
    }
    layer = next;
  }

  // Every full assignment now sits in the final layer; rank them exactly as the
  // other planners (offerInto dedupes by objective and keeps the TOP_K best).
  // `evaluated` here counts the complete feasible assignments the DP carried to
  // the end (the metric's exact meaning differs per algorithm).
  const top: Candidate[] = [];
  let evaluated = 0;
  for (const entries of layer.values()) {
    for (const ent of entries) {
      const cand = evalMasks(ent.masks, evalDay, D, placeableMask, useAll);
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
  const memo = new Map<string, DayEval>();
  return (slot: number, mask: number): DayEval => {
    const key = `${slot}:${mask}`;
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
function planHeuristic(
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
    const avg = scoreSum / D;
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

const PLANNERS = { planExhaustive, planPruned, planSubsetDP, planLinear } as const;

// ↓↓↓ change the right-hand name to switch algorithm ↓↓↓
const EXACT_PLANNER: TripPlanner = PLANNERS.planLinear;

export function planTrip(
  pool: Activity[],
  dayIndices: number[],
  startHours: number[], // per day slot
  endHours: number[], // per day slot (start + that day's time budget)
  selections: Selection[], // per day slot (each day's filter choices)
  filters: Filter[]
): Trip {
  const args = [pool, dayIndices, startHours, endHours, selections, filters] as const;
  // Exhaustive only while the (days + 1)^pool state space stays within budget;
  // otherwise the greedy heuristic. Empty day set (no days) → heuristic trivially.
  const states = Math.pow(dayIndices.length + 1, pool.length);
  const t0 = performance.now();
  const trip = states <= STATE_BUDGET ? EXACT_PLANNER(...args) : planHeuristic(...args);
  trip.elapsedMs = performance.now() - t0;
  return trip;
}
